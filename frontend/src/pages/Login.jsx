// Login.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import "../styles/Auth.css";

function Login() {
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
            const response = await loginUser(formData);
            sessionStorage.setItem("token", response.data.access_token);
            navigate("/chat");
            console.log("Logged in user:",response);
        } 
        catch (error) {
            console.error(error);
        }
    }
    
  return (
    <div className="auth-page">
        <div className="auth-card">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1 className="auth-title">PulseChat</h1>
                <p className="auth-subtitle">Welcome back</p>
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
                <button className="auth-button" type="submit">Login</button>
                <p className="auth-footer">
                    Don't have an account?
                    <Link to="/register"> Register</Link>
                </p>
            </form>
        </div>
    </div>

  );
}

export default Login;