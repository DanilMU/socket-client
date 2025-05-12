import React from "react";
import styles from "../styles/Messages.module.css";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Messages = ({ messages, currentUserId, onlineStatus }) => {
  return (
    <div className={styles.messages}>
      {messages.map(({ user, message, timestamp, type }, index) => {
        const isCurrentUser = user.id === currentUserId;
        const isSystem = type === "system";
        
        if (isSystem) {
          return (
            <div key={index} className={styles.systemMessage}>
              {message}
            </div>
          );
        }

        return (
          <div 
            key={index} 
            className={`${styles.message} ${isCurrentUser ? styles.currentUser : styles.otherUser}`}
          >
            {!isCurrentUser && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                {onlineStatus[user.id] && <span className={styles.onlineDot} />}
              </div>
            )}
            <div className={styles.messageContent}>
              <div className={styles.text}>{message}</div>
              <div className={styles.time}>{formatTime(timestamp)}</div>
              {isCurrentUser && (
                <div className={styles.status}>
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