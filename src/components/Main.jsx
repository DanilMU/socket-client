import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Main.module.css";

const FIELDS = {
  NAME: "name",
  ROOM: "room",
};

const Main = () => {
  const { NAME, ROOM } = FIELDS;
  const [values, setValues] = useState({ [NAME]: "", [ROOM]: "" });
  const [errors, setErrors] = useState({});

  const handleChange = ({ target: { value, name } }) => {
    setValues({ ...values, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!values[NAME].trim()) newErrors[NAME] = "Username is required";
    if (!values[ROOM].trim()) newErrors[ROOM] = "Room name is required";
    return newErrors;
  };

  const handleClick = (e) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      e.preventDefault();
      setErrors(validationErrors);
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
              name="name"
              value={values[NAME]}
              placeholder="Username"
              className={styles.input}
              onChange={handleChange}
              autoComplete="off"
              required
            />
            {errors[NAME] && <span className={styles.error}>{errors[NAME]}</span>}
          </div>

          <div className={styles.group}>
            <input
              type="text"
              name="room"
              value={values[ROOM]}
              placeholder="Room"
              className={styles.input}
              onChange={handleChange}
              autoComplete="off"
              required
            />
            {errors[ROOM] && <span className={styles.error}>{errors[ROOM]}</span>}
          </div>

          <Link
            className={styles.group}
            onClick={handleClick}
            to={`/chat?name=${values[NAME]}&room=${values[ROOM]}`}
          >
            <button type="submit" className={styles.button}>
              Join Chat
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Main;