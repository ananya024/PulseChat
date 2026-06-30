const { io } = require("socket.io-client");

// import { AuthService } from '../auth/auth.service';
// const username = process.argv[2];
// const password = process.argv[3];
// const mytoke= await AuthService.authService.signIn(username, password);


const socket = io("http://localhost:3000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYmM1ZThlMy0zZDVjLTRmZTktYWExMS0zZTE5MzBhNzI5MWMiLCJ1c2VybmFtZSI6InVzZXIxIiwiaWF0IjoxNzgyMjkyODc1LCJleHAiOjE3ODIzNzkyNzV9.J_9n9mV1H6mGV05glTbGc7R5mojizktT5osW64zmtU8"
  }
});

socket.on("connect", () => {
  console.log("User1 connected", socket.id);

//   socket.emit(
//     "private-message",
//     {
//       receivername: "user2",
//       content: "new message"
//     },
//     (response) => {
//       console.log("ACK:", response);
//     }
//   );
});

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (text) => {
  socket.emit("private-message", {
    receivername: "user2",
    content: text
  });
});

// socket.onAny((event, ...args) => {
//   console.log("EVENT:", event, args);
// });

socket.on("private-message", (msg) => {
  console.log("User1 received:", msg);
});

socket.on("user-online", (data) => {
  console.log("ONLINE:", data);
});

socket.on("user-offline", (data) => {
  console.log("OFFLINE:", data);
});