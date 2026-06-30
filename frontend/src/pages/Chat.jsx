// Chat.jsx
import "../styles/Chat.css";
import { useEffect , useRef, useState} from "react";
import { getProfile, getAllUsers } from "../api/users";
import { connectSocket } from "../socket";
import  { getConversation, getUnreadCounts } from "../api/messages"

function Chat() {
  
  const [me, setMe] = useState({username:"", userId:""});
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const socketRef=useRef(null);
  const selectedUserRef = useRef(selectedUser);
  const meRef = useRef(me);
  const messagesEndRef = useRef(null);
  const token= localStorage.getItem("token");
  
  const handlePrivateMessage = (msg) => {

    const selected = selectedUserRef.current;
    const meUser = meRef.current;

    if((msg.sender===meUser?.username && msg.receiver===selected?.username) || (msg.sender===selected?.username && msg.receiver===meUser?.username))
      setMessages(prev => [...prev, msg]);
    else
      setUsers(prev =>prev.map(user => (user.username === msg.sender && msg.sender !== meUser?.username) ? {...user, countUnread: user.countUnread + 1} : user));
    console.log("PRIVATE:", msg);
  };
  
  const handleSystemMessage = (msg) =>{
    console.log("SYSTEM:", msg);
  }

  const handleUserOnline = (msg) => { 
    setUsers(prev=> prev.map(user=>user.username===msg.username ? {...user, online:true}: user));
    console.log("ONLINE:", msg);
  };

  const handleUserOffline = (msg) => {
    setUsers(prev=> prev.map(user=>user.username===msg.username ? {...user, online:false}: user));
    console.log("OFFLINE:", msg);
  };

  const handleOnlineUsers = (onlineUsers) => {
      setUsers(prev =>
          prev.map(user => ({
              ...user,
              online: onlineUsers.includes(user.username)
          }))
      );
  };

  useEffect(()=> {
    async function initChat(){
      try{
        const user= await getProfile();
        setMe({ username:user.data.username, userId:user.data.sub});
        const resp = await getAllUsers();
        const unread = await getUnreadCounts();
        const updatedUsers= resp.data.map(user=> ({...user,online:false, countUnread:unread.data[user.username]??0}));
        setUsers(updatedUsers);
        setError(null);
      } catch (err) {
          console.error(err);
          setError("Failed to initialize chat.");
        }
      }
    initChat();
  }, []);

  useEffect(() => {
    if(!token)
        return;
      const socket = connectSocket(token);
      socketRef.current = socket;
      socket.on("connect", () => {
          console.log("Connected", socket.id);
      });
      
      socket.on("private-message", handlePrivateMessage);
      socket.on("user-online", handleUserOnline);
      socket.on("user-offline", handleUserOffline);
      socket.on("system-message", handleSystemMessage);
      socket.on("online-users", handleOnlineUsers);
      
      return () => {
          socket.off("private-message", handlePrivateMessage);
          socket.off("user-online", handleUserOnline);
          socket.off("user-offline", handleUserOffline);
          socket.off("system-message", handleSystemMessage);
          socket.off("online-users", handleOnlineUsers);
          socket.disconnect();
      };
  }, [token]);

  useEffect(() => {
    selectedUserRef.current=selectedUser;
  },[selectedUser]);

  useEffect(() => {
    meRef.current=me;
  },[me]);

  useEffect(()=> {
    messagesEndRef.current?.scrollIntoView({
      behavior:"smooth"
    });
  }, [messages]);

  // useEffect(() => {

  //   const socket = socketRef.current;
  //   socket.on("connect", () => {
  //     console.log("connected");
  //     // console.log("from chat ",me.username," is connected to socket ",socketRef.current.id);
  //   });
  //   socket.on("online-users", (onlineUsers)=>{
  //     // console.log("ONLINE USERS", onlineUsers);
  //     console.log("FRONTEND SOCKET", socket.id);
  //     setUsers(prev=> prev.map(user => ({...user, online:onlineUsers.includes(user.username)})));
  //   })
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);
  
  // useEffect(() => {

  //   console.log("ATTACHING PRIVATE LISTENER");
  //   const socket=socketRef.current;
  //   socket.on("private-message", handlePrivateMessage);
  //   return () =>{
  //     console.log("REMOVING PRIVATE LISTENER");
  //     socket.off("private-message", handlePrivateMessage);
  //   }
  // }, [selectedUser, me.username]);
  
  // useEffect(() => {

  //   const socket = socketRef.current;
  //   socket.on("system-message",handleSystemMessage);
  //   return () => {
  //     socket.off("system-message", handleSystemMessage);
  //   }
  // }, []);
  
  // useEffect(() => {

  //   const socket = socketRef.current;
  //   socket.on("user-online", handleUserOnline);
  //   return () => {
  //     socket.off("user-online", handleUserOnline);
  //   };
  // }, []);
  
  // useEffect(() => {

  //   const socket = socketRef.current;
  //   socket.on("user-offline", handleUserOffline);
  //   return () => {
  //     socket.off("user-offline", handleUserOffline);
  //   };
  // }, []);
  
  useEffect(()=>{
    if(!selectedUser)
      return;
    
    async function loadConvo(){
      try{
        const convo = await getConversation(selectedUser.username);
        console.log(convo.data);
        setMessages(convo.data);
        setError(null);
      }
      catch(e)
      {
        setError("message waitinggg")
      }
    }
    loadConvo();
  }, [selectedUser]);
  
  function handleMessageChange(e){
    setMessage(e.target.value);
  }

  function handleSend(){
    if(!message.trim() || !selectedUser || !socketRef.current)
      return;
    socketRef.current.emit("private-message", {
      receivername:selectedUser.username,
      content:message
    });
    setMessage("");
    setError(null);
  }

  function formatTime(time){
    return new Date(time).toLocaleTimeString([],{
      hour: "numeric",
      minute: "2-digit"
    });
  }
  
  return (
  <div className="chat-container">
    <div className="sidebar">
      <h2 className="sidebar-title">Chats</h2>
      <div className="user-list">
        { users
          .filter(user => user.userId !== me.userId)
          .map(user => (<div  
                          className={`user-item ${
                          selectedUser?.username===user.username
                          ? "selected"
                          : ""
                          }`}
                          key={user.userId} 
                          onClick={()=>{setSelectedUser(user);
                                        setMessage("");
                                        setMessages([]);
                                        setUsers(prev=> prev.map(thisone=>thisone.username===user.username ? {...thisone, countUnread:0}: thisone));
                                        }}>
                            <div className="user-info">
                              <span className={`status-dot ${user.online ? "online" : "offline" }`}></span>
                              <span className="username">{user.username}</span>
                            </div>
                            {user.countUnread>0 && <div className="badge">{user.countUnread}</div>}
                          </div>
                        ))
        }
      </div>
    </div>
    
    <div className="chat-section">
      <div className="chat-header">

        <h2>

        { selectedUser ? selectedUser.username : "Select a chat" }

        </h2>

        { selectedUser && <p>{ selectedUser.online ? "Online" : "Offline" }</p> }

      </div>

      <div className="chat-messages">
        {messages.map((msg,index)=> {
          // console.log("if u wanna add console");
          return(
            <div key={index} className={msg.sender===me.username ? "message sent" : "message received"}>
              <div className="message-text">
                {msg.content}
              </div>
              <div className="message-time">
                {formatTime(msg.timestamp)}
                {msg.isRead? "✔️✔️" : (msg.isDelivered? "✔✔": "✔")}
              </div>
            </div>
          )})}
        <div ref={messagesEndRef}></div>
      </div>



      <div className="chat-input">
        <input type="text"
              placeholder="send a text"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={(e) => {
                if(e.key==="Enter")
                  if(selectedUser)
                    handleSend();
                }}/>
                
        <button onClick={()=>{
          if(selectedUser)
            handleSend();
          else
            setError("Select a user first");
        }}>
          Send
        </button>
      </div>
  
      {error && <h3>{error}</h3>}
  
    </div>

  </div>
  );
}

export default Chat;