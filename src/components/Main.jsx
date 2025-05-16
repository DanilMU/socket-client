import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Main.module.css";

const FIELDS = {
  NAME: "name",
  ROOM: "room",
};

const Main = () => {
  const { NAME, ROOM } = FIELDS;
  const [values, setValues] = useState({ [NAME]: "", [ROOM]: "main_room" });
  const [errors, setErrors] = useState({});

  // Проверяем localStorage при монтировании
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage) {
        const savedUser = localStorage.getItem('chatUser');
        if (savedUser) {
          const { name } = JSON.parse(savedUser);
          if (name) {
            setValues(prev => ({ ...prev, [NAME]: name }));
          }
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }, [NAME]); // Добавляем NAME в зависимости

  const handleChange = ({ target: { value, name } }) => {
    setValues(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!values[NAME].trim()) {
      newErrors[NAME] = "Username is required";
    }
    if (values[ROOM].trim().includes(" ")) {
      newErrors[ROOM] = "Room name cannot contain spaces";
    }
    return newErrors;
  };

  const handleClick = (e) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      e.preventDefault();
      setErrors(validationErrors);
      return;
    }

    try {
      const userId = `user_${Date.now()}`;
      localStorage.setItem('chatUser', JSON.stringify({
        name: values[NAME].trim(),
        userId
      }));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Chat-Message</h1>
        <p className={styles.subtitle}>Join a chat room to start messaging</p>

        <form className={styles.form}>
          <div className={styles.group}>
            <input
              type="text"
              name={NAME}
              value={values[NAME]}
              placeholder="Username"
              className={styles.input}
              onChange={handleChange}
              autoComplete="off"
              required
              aria-label="Enter your username"
              aria-invalid={!!errors[NAME]}
            />
            {errors[NAME] && (
              <span className={styles.error} role="alert">
                {errors[NAME]}
              </span>
            )}
          </div>

          <div className={styles.group}>
            <input
              type="text"
              name={ROOM}
              value={values[ROOM]}
              placeholder="Room"
              className={styles.input}
              onChange={handleChange}
              autoComplete="off"
              aria-label="Enter room name"
              aria-invalid={!!errors[ROOM]}
            />
            {errors[ROOM] && (
              <span className={styles.error} role="alert">
                {errors[ROOM]}
              </span>
            )}
          </div>

          <div className={styles.group}>
            <Link
              to={`/chat?name=${encodeURIComponent(values[NAME])}&room=${encodeURIComponent(values[ROOM])}`}
              onClick={handleClick}
              className={styles.linkButton}
            >
              <button 
                type="button" 
                className={styles.button}
                aria-label="Join chat room"
              >
                Join Chat
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Main;