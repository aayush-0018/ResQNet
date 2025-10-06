import React, { useState } from "react";
import "./Auth.css";
import Notification from "../components/Notification";
import { useNavigate } from "react-router-dom"; // ✅ correct import

export default function DeptLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dept/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      setNotificationMessage("Login Successful")
      console.log(data);
      setTimeout(() =>{
        if(data?.user?.role == "CONTRIBUTOR"){
          navigate("/contributor");
        }
        else{
          navigate("/dashboard"); 
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <Notification
        message={notificationMessage}
        type="success"
        onClose={() => setNotificationMessage("")}
      />
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2>Department Login (NDRF/Contributor)</h2>
        {error && <div className="auth-error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
    </>
  );
}
