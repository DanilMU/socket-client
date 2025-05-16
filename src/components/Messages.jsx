import React from "react";
import styles from "../styles/Messages.module.css";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
};

const Messages = ({ messages, currentUserId, onlineStatus }) => {
  const speakMessage = (text) => {
    if (!text) return;
    
    if ('speechSynthesis' in window) {
      // Останавливаем текущее воспроизведение, если есть
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Более естественная скорость
      utterance.pitch = 1;
      utterance.volume = 1;
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error with speech synthesis:", error);
      }
    } else {
      console.warn('Text-to-speech not supported');
    }
  };

  const renderMessageWithTTS = (message) => {
    if (!message) return null;
    
    return (
      <div className={styles.textContainer}>
        <div className={styles.text}>{message}</div>
        <button 
          onClick={() => speakMessage(message)} 
          className={styles.ttsButton}
          aria-label="Read aloud"
          title="Read aloud"
          type="button"
        >
          🔊
        </button>
      </div>
    );
  };

  const renderFilePreview = (file) => {
    if (!file || !file.url) return null;
    
    const fileUrl = `https://socket-server-6k9g.onrender.com${file.url}`;
    
    switch(file.type) {
      case 'image':
        return (
          <div className={styles.filePreview}>
            <img 
              src={fileUrl} 
              alt="Attached content" 
              loading="lazy"
            />
          </div>
        );
      case 'audio':
        return (
          <div className={styles.audioMessage}>
            <audio 
              controls 
              src={fileUrl}
              aria-label="Audio message"
            />
          </div>
        );
      case 'video':
        return (
          <div className={styles.videoMessage}>
            <video 
              controls 
              src={fileUrl}
              aria-label="Video message"
            />
          </div>
        );
      default:
        return (
          <div className={styles.fileMessage}>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Download file"
            >
              Download File
            </a>
          </div>
        );
    }
  };

  if (!messages || !Array.isArray(messages)) {
    return <div className={styles.messages}>No messages available</div>;
  }

  return (
    <div className={styles.messages}>
      {messages.map(({ user, message, timestamp, type, file }, index) => {
        if (!user || !user.id) return null;
        
        const isCurrentUser = user.id === currentUserId;
        const isSystem = type === "system";
        
        if (isSystem) {
          return (
            <div key={`system-${index}`} className={styles.systemMessage}>
              {message || ""}
            </div>
          );
        }

        return (
          <div 
            key={`message-${user.id}-${index}`} 
            className={`${styles.message} ${isCurrentUser ? styles.currentUser : styles.otherUser}`}
          >
            {!isCurrentUser && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user.name || "Unknown user"}
                </span>
                {onlineStatus && onlineStatus[user.id] && (
                  <span className={styles.onlineDot} aria-hidden="true" />
                )}
              </div>
            )}
            <div className={styles.messageContent}>
              {message && renderMessageWithTTS(message)}
              {file && renderFilePreview(file)}
              {timestamp && (
                <div className={styles.time}>
                  {formatTime(timestamp)}
                </div>
              )}
              {isCurrentUser && (
                <div className={styles.status} aria-hidden="true">
                  <span>✓✓</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Messages;