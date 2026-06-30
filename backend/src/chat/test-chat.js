const { io } = require("socket.io-client");
const readline = require("readline");

async function main() {
  

  const username = process.argv[2];
  const password = process.argv[3];

  const response = await fetch("http://localhost:3000/auth/login",
                                                                { method: "POST", 
                                                                  headers: { "Content-Type": "application/json",},
                                                                  body: JSON.stringify({ username, password }),
                                                                }
                                                              );

  const data = await response.json();
  console.log(data);
  const token = data.access_token;

  const socket = io("http://localhost:3000", { auth: { token: token }});

  socket.on("connect", () => { 
    console.log(username ," connected: ", socket.id);
  });


  const rl = readline.createInterface({ input: process.stdin,
                                        output: process.stdout });

  rl.on("line", (text) => {
    const textt= text.split(' ')
    const rec= textt[0];
    const msg= textt.slice(1).join(" ");
    socket.emit("private-message", { receivername: rec,
                                    content: msg
                                    });                                    
                                  });
                                  
                                  
socket.on("private-message", (msg) => {
  console.log(username, " received:", msg);
});

socket.on("system-message", (msg) => {
  console.log("[SYSTEM]", msg.content);
});

socket.on("user-online", (data) => {
  console.log("ONLINE:", data);
});

socket.on("user-offline", (data) => {
  console.log("OFFLINE:", data);
});

}

main();