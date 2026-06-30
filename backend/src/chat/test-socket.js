const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMGExZGYwMS00MmI0LTRhNmYtOWE5Mi01Njg2YzFlM2ZjNzQiLCJ1c2VybmFtZSI6InVzZXIyIiwiaWF0IjoxNzgyMjg0OTQxLCJleHAiOjE3ODIzNzEzNDF9.CCt7Nn6KXidziNJAyR-WaBH2qzpUkxLnvxKOZKuqMDU"
  }});

socket.on("connect", () => { 
  console.log("Connected", socket.id);
  setTimeout(() => { console.log("Disconnecting..."); socket.disconnect(); }, 5000);
});

socket.on("disconnect", () => { 
  console.log("Disconnected");
});