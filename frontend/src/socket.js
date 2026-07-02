// socket.js

import { io } from "socket.io-client";

export function connectSocket(token){
    // const token = sessionStorage.getItem("token");
    // console.log("socket got token: ", token);
    // const socket=io("http://localhost:3000", {auth:{token:token}});
    // const socket=io(import.meta.env.VITE_SOCKET_URL, {auth:{token:token}});
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
    });
    socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
        console.log("🔥 Socket error:", err.message);
    });
    return socket;
}
