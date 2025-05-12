import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-hot-toast";

import icon from "../images/emoji.svg";
import sendIcon from "../images/send.svg";
import styles from "../styles/Chat.module.css";
import Messages from "./Messages";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
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

  useEffect(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(search));
    setParams(searchParams);
    
    socket.connect();
    socket.emit("join", searchParams);
    socket.emit("setOnline", { userId: socket.id });

    return () => {
      socket.emit("leaveRoom", { params: searchParams });
      socket.disconnect();
    };
  }, [search]);

  useEffect(() => {
    const handleMessage = ({ data }) => {
      setMessages(prev => [...prev, data]);
    };

    const handleHistory = ({ data }) => {
      setMessages(data);
    };

    const handleRoomData = ({ data }) => {
      setUsers(data.users);
    };

    const handleTyping = ({ userId, name, isTyping }) => {
      if (userId !== socket.id) {
        setTypingUsers(prev => {
          if (isTyping) {
            return [...prev.filter(u => u.id !== userId), { id: userId, name }];
          } else {
            return prev.filter(u => u.id !== userId);
          }
        });
      }
    };

    const handleUserStatus = ({ userId, isOnline }) => {
      setOnlineStatus(prev => ({
        ...prev,
        [userId]: isOnline
      }));
    };

    const handleError = ({ message }) => {
      toast.error(message);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = ({ target: { value } }) => {
    setMessage(value);
    
    // Отправляем событие набора текста
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit("typing", { 
      room: params.room, 
      isTyping: true 
    });
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { 
        room: params.room, 
        isTyping: false 
      });
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("sendMessage", { 
      message, 
      params 
    });
    setMessage("");
  };

  const onEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { params });
    navigate("/");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>
          {params.room}
          <span className={styles.usersCount}>{users.length} members</span>
        </div>
        <button className={styles.left} onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <div className={styles.messagesContainer}>
        <div className={styles.messages}>
          <Messages 
            messages={messages} 
            currentUserId={socket.id}
            onlineStatus={onlineStatus}
          />
          {typingUsers.length > 0 && (
            <div className={styles.typingIndicator}>
              {typingUsers.map(user => user.name).join(", ")} 
              {typingUsers.length > 1 ? " are" : " is"} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
          <div className={styles.emoji}>
            <img 
              src={icon} 
              alt="Emoji" 
              onClick={() => setOpen(!isOpen)} 
              className={styles.emojiButton}
            />
            {isOpen && (
              <div className={styles.emojiPicker}>
                <EmojiPicker 
                  onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)} 
                  width={300}
                  height={400}
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
          />
          <button type="submit" className={styles.sendButton}>
            <img src={sendIcon} alt="Send" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;