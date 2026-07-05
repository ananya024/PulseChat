// Chat.jsx
import "../styles/Chat.css";
import { useEffect , useRef, useState} from "react";
import { getProfile, getAllUsers } from "../api/users";
import { connectSocket } from "../socket";
import  { getConversation, getUnreadCounts } from "../api/messages"
import { useNavigate } from "react-router-dom";


function Chat() {
  
  const navigate=useNavigate();
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
  const token= sessionStorage.getItem("token");
  
  const handlePrivateMessage = (msg) => {

    const selected = selectedUserRef.current;
    const meUser = meRef.current;
    // console.log("SELECTED:", selectedUserRef.current);
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
  const handleDeliveredMsg =  ({messageId}) => { 
      setMessages(prev =>
        prev.map(msg => msg.messageId === messageId ? { ...msg, isDelivered: true } : msg)
      );
  }

  const handleLogout =() =>{
    sessionStorage.removeItem("token");
    socketRef.current?.disconnect();
    navigate("/login");
  }


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
          // console.error(err);
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
          // console.log("Connected", socket.id);
      });
      
      socket.on("private-message", handlePrivateMessage);
      socket.on("user-online", handleUserOnline);
      socket.on("user-offline", handleUserOffline);
      socket.on("system-message", handleSystemMessage);
      socket.on("online-users", handleOnlineUsers);
      socket.on("message-delivered",handleDeliveredMsg);
      
      return () => {
          socket.off("private-message", handlePrivateMessage);
          socket.off("user-online", handleUserOnline);
          socket.off("user-offline", handleUserOffline);
          socket.off("system-message", handleSystemMessage);
          socket.off("online-users", handleOnlineUsers);
          socket.off("message-delivered",handleDeliveredMsg);
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
  
  useEffect(()=>{
    if(!selectedUser)
      return;
    
    async function loadConvo(){
      try{
        const convo = await getConversation(selectedUser.username);
        // console.log(convo.data);
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

  function formatTime(time) {
    return new Date(time).toLocaleString([], {
      hour: "numeric",
      minute: "2-digit",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
  }
  
  return (
  <div className="chat-container">
    <div className="bg1"></div>
    <div className="bg2"></div>
    <div className="bg3"></div>
    <div className="sidebar">
    <div className="sidebar-header">
    <img src="/galax-o.png" alt="Galax¡O" className="sidebar-logo"/>
    <h2 className="sidebar-title">Galax¡O</h2>
    </div>
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

      <div className="sidebar-footer">
          <p className="logged-in-text"> Logged in as </p>
          <h3 className="logged-in-user"> {me.username} </h3>
          <button className="logout-button" onClick={handleLogout} > Logout </button>
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
          // console.log("if u wanna add console", msg);
          return(
            <div key={index} className={msg.sender===me.username ? "message sent" : "message received"}>
              <div className="message-text">
                {msg.content}
              </div>
              <div className="message-time">
                {formatTime(msg.createdAt)}
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