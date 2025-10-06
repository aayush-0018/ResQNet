import React, { useState } from "react";
import "./DeptRegister.css";

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","J&K","Ladakh"
];

export default function DeptRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    state: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dept/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Registration failed");
      }

      setSuccess("Registration successful! You can now log in.");
      setError("");
    } catch (err) {
      setError(err.message);
      setSuccess("");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-container">
        <div className="register-header">
          <h1>Community Emergency Network</h1>
          <p>Register as a Contributor or NDRF team for emergency coordination</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="form-group">
            <label>Organization Name</label>
            <input
              name="name"
              placeholder="Enter department name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Official email address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {/* <option value="NGO">NGO</option>
                <option value="POLICE">Police</option>
                <option value="AMBULANCE">Ambulance</option> */}
                <option value="NDRF">NDRF</option>
                <option value="CONTRIBUTOR">Contributor</option>
              </select>
            </div>

            <div className="form-group">
              <label>State</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select State</option>
                {indianStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Register
          </button>

          {/* Already have an account link */}
      <p className="already-login">
        Already have an account?{" "}
        <span onClick={() => window.location.href = "/login"}>Login</span>
      </p>
        </form>
      </div>
    </div>
  );
}
