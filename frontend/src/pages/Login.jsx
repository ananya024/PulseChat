// Login.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

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
            localStorage.setItem("token", response.data.access_token);
            navigate("/chat");
            console.log("Logged in user:",response);
        } 
        catch (error) {
            console.error(error);
        }
    }
    
  return (
    <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
        />
        <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
        />
        <button type="submit">Login</button>
        <p>Dont have an account?<Link to="/register">Register</Link></p>
    </form>
  );
}

export default Login;