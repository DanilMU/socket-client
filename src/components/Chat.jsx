import React, { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-hot-toast";
import debounce from "lodash.debounce";

import icon from "../images/emoji.svg";
import sendIcon from "../images/send.svg";
import styles from "../styles/Chat.module.css";
import Messages from "./Messages";
import { FaMicrophone, FaVideo, FaImage, FaFileUpload } from "react-icons/fa";
import AudioRecorder from "./AudioRecorder";
import VideoRecorder from "./VideoRecorder";

const socket = io("https://socket-server-6k9g.onrender.com", {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

const Chat = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useState({ room: "", name: "" });
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Обработка изменения параметров комнаты
  useEffect(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(search));
    if (!searchParams.name || !searchParams.room) {
      toast.error("Invalid room parameters");
      navigate("/");
      return;
    }
    setParams(searchParams);
  }, [search, navigate]);

  // Подключение к сокету
  useEffect(() => {
    if (!params.room || !params.name) return;

    socket.connect();
    socket.emit("join", params);
    socket.emit("setOnline", { userId: socket.id });

    return () => {
      if (socket.connected) {
        socket.emit("leaveRoom", { params });
        socket.disconnect();
      }
    };
  }, [params]);

  // Обработчики событий сокета
  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ data }) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleHistory = ({ data }) => {
      setMessages(Array.isArray(data) ? data : []);
    };

    const handleRoomData = ({ data }) => {
      setUsers(data?.users || []);
    };

    const handleTyping = ({ userId, name, isTyping }) => {
      if (userId !== socket.id) {
        setTypingUsers((prev) =>
          isTyping
            ? [...prev.filter((u) => u.id !== userId), { id: userId, name }]
            : prev.filter((u) => u.id !== userId)
        );
      }
    };

    const handleUserStatus = ({ userId, isOnline }) => {
      setOnlineStatus((prev) => ({ ...prev, [userId]: isOnline }));
    };

    const handleError = ({ message }) => {
      toast.error(message || "An error occurred");
      navigate("/");
    };

    socket.on("message", handleMessage);
    socket.on("history", handleHistory);
    socket.on("roomData", handleRoomData);
    socket.on("typing", handleTyping);
    socket.on("userStatusChanged", handleUserStatus);
    socket.on("error", handleError);

    return () => {
      socket.off("message", handleMessage);
      socket.off("history", handleHistory);
      socket.off("roomData", handleRoomData);
      socket.off("typing", handleTyping);
      socket.off("userStatusChanged", handleUserStatus);
      socket.off("error", handleError);
    };
  }, [navigate]);

  // Прокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Обработка набора текста с debounce
  const handleTypingEvent = useCallback(
    debounce(() => {
      socket.emit("typing", {
        room: params.room,
        isTyping: false,
      });
    }, 2000),
    [params.room, socket]
  );

  const handleChange = useCallback(
    ({ target: { value } }) => {
      setMessage(value);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.emit("typing", {
        room: params.room,
        isTyping: true,
      });

      handleTypingEvent();
    },
    [params.room, handleTypingEvent, socket]
  );

  const handleFileUpload = useCallback(async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    try {
      const response = await fetch(
        "https://socket-server-6k9g.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setFile({
        url: data.url,
        type: data.type,
      });

      if (data.type === "image") {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      }
    } catch (error) {
      toast.error(error.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Проверяем, есть ли что отправить
      if (!message.trim() && !file) {
        toast.error("Message cannot be empty");
        return;
      }

      // Проверяем подключение сокета
      if (!socket.connected) {
        toast.error("Connection lost. Reconnecting...");
        try {
          await new Promise((resolve) => {
            socket.connect();
            socket.once("connect", resolve);
          });
        } catch (err) {
          toast.error("Failed to reconnect");
          return;
        }
      }

      try {
        // Отправляем сообщение
        socket.emit(
          "sendMessage",
          {
            message: message.trim(),
            params,
            file,
          },
          (ack) => {
            if (ack?.error) {
              toast.error(ack.error);
            } else {
              // Очищаем поля только после успешной отправки
              setMessage("");
              setFile(null);
              setFilePreview(null);
            }
          }
        );
      } catch (error) {
        toast.error("Failed to send message");
        console.error("Send message error:", error);
      }
    },
    [message, file, params, socket]
  );

  const onEmojiClick = useCallback((emoji) => {
    setMessage((prev) => prev + emoji.emoji);
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit("leaveRoom", { params });
    navigate("/");
  }, [navigate, params, socket]);

  const handleSaveAudio = useCallback((audioBlob) => {
    // Реализация сохранения аудио
    console.log("Audio blob:", audioBlob);
  }, []);

  const handleSaveVideo = useCallback((videoBlob) => {
    // Реализация сохранения видео
    console.log("Video blob:", videoBlob);
  }, []);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.title}>
          {params.room}
          <span className={styles.usersCount}>{users.length} members</span>
        </div>
        <button
          className={styles.left}
          onClick={leaveRoom}
          aria-label="Leave room"
        >
          Leave
        </button>
      </header>

      <div className={styles.messagesContainer}>
        <div className={styles.messages} role="log" aria-live="polite">
          <Messages
            messages={messages}
            currentUserId={socket.id}
            onlineStatus={onlineStatus}
          />
          {typingUsers.length > 0 && (
            <div className={styles.typingIndicator} aria-live="polite">
              {typingUsers.map((user) => user.name).join(", ")}
              {typingUsers.length > 1 ? " are" : " is"} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.mediaButtons}>
          <label className={styles.mediaButton} aria-label="Upload image">
            <FaImage />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>

          <label className={styles.mediaButton} aria-label="Upload file">
            <FaFileUpload />
            <input
              type="file"
              accept="*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>

          <button
            type="button"
            className={styles.mediaButton}
            onClick={() => setIsRecordingAudio(true)}
            aria-label="Record audio"
          >
            <FaMicrophone />
          </button>

          <button
            type="button"
            className={styles.mediaButton}
            onClick={() => setIsRecordingVideo(true)}
            aria-label="Record video"
          >
            <FaVideo />
          </button>
        </div>

        {filePreview && (
          <div className={styles.filePreview}>
            <img src={filePreview} alt="Preview" />
            <button
              onClick={() => {
                setFilePreview(null);
                setFile(null);
              }}
              aria-label="Remove preview"
            >
              ×
            </button>
          </div>
        )}

        {file && !filePreview && (
          <div className={styles.fileInfo}>
            {file.type} file attached
            <button onClick={() => setFile(null)} aria-label="Remove file">
              ×
            </button>
          </div>
        )}

        {isUploading && (
          <div className={styles.uploadIndicator} aria-live="polite">
            Uploading file...
          </div>
        )}

        <div className={styles.inputContainer}>
          <div className={styles.emoji}>
            <img
              src={icon}
              alt="Emoji"
              onClick={() => setOpen(!isOpen)}
              className={styles.emojiButton}
              role="button"
              aria-label="Toggle emoji picker"
              aria-expanded={isOpen}
            />
            {isOpen && (
              <div className={styles.emojiPicker}>
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={400}
                  searchDisabled={false}
                />
              </div>
            )}
          </div>
          <input
            type="text"
            name="message"
            placeholder="Write a message..."
            value={message}
            onChange={handleChange}
            autoComplete="off"
            className={styles.input}
            aria-label="Message input"
          />
          <button
            type="submit"
            className={styles.sendButton}
            aria-label="Send message"
            disabled={!message.trim() && !file}
          >
            <img src={sendIcon} alt="Send" />
          </button>
        </div>
      </form>

      {isRecordingAudio && (
        <AudioRecorder
          onClose={() => setIsRecordingAudio(false)}
          onSave={handleSaveAudio}
        />
      )}

      {isRecordingVideo && (
        <VideoRecorder
          onClose={() => setIsRecordingVideo(false)}
          onSave={handleSaveVideo}
        />
      )}
    </div>
  );
};

export default React.memo(Chat);
