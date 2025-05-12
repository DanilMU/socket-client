import React from "react";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./AppRoutes";
import "../styles/main.css";

const App = () => {
  return (
    <div className="container">
      <Toaster position="top-right" />
      <AppRoutes />
    </div>
  );
};

export default App;