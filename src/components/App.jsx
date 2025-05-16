import React from "react";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./AppRoutes";
import "../styles/main.css";

const App = () => {
  return (
    <div className="container" role="main">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        }} 
      />
      <AppRoutes />
    </div>
  );
};

export default React.memo(App);