// Register.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import "../styles/Auth.css";

function Register() {
    const [formData, setFormData] = useState({username:"", password:""});
    const navigate= useNavigate();

    function handleChange(e){
        const {name,value}= e.target;
        // name from the <input> tag
        setFormData((prev) => ({...prev, [name]:value}));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const response = await registerUser(formData);
            navigate("/login");
            console.log("User registered:",response);
        } 
        catch (error) {
            console.error("Username exists, login if already a user, or choose a different username");
        }
    }
    
  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/galax-o-logo.png" alt="Galax¡O" className="logo"/>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1 className="auth-title">Galax¡O</h1>
          <p className="auth-subtitle">Create your account</p>
          <input
              className="auth-input"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
          />
          <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
          />
          <button className="auth-button" type="submit">Register</button>
          <p className="auth-footer">
              Already a user?
              <Link to="/login"> Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;