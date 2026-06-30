const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMGExZGYwMS00MmI0LTRhNmYtOWE5Mi01Njg2YzFlM2ZjNzQiLCJ1c2VybmFtZSI6InVzZXIyIiwiaWF0IjoxNzgyMjkyODYwLCJleHAiOjE3ODIzNzkyNjB9.jIA1f1FfYtDBk8YluX7SfbBtfo6BtdwldxglPSOO-h4"
  }
});

socket.on("connect", () => {
  console.log("User2 connected", socket.id);
});

socket.on("private-message", (msg) => {
  console.log("User2 received:", msg);
});

socket.on("user-online", (data) => {
  console.log("ONLINE:", data);
});

socket.on("user-offline", (data) => {
  console.log("OFFLINE:", data);
});

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (text) => {
  socket.emit("private-message", {
    receivername: "user1",
    content: text
  });
});