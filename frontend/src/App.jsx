// App.jsx

import { useEffect } from "react";
import api from "./api/axios";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Users from "./pages/Users";


function App() {
  // useEffect(() => {
  //   api.get("/users") 
  //     .then((response) => { console.log(response.data); })
  //     .catch((error) => { console.error(error); });
  // }, []);

  return(
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </>
  )
}

export default App;