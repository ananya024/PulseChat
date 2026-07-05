// chat.gateway.ts

import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { UsersService } from 'src/users/users.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({cors:{origin:'*'}})
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);
  constructor(
    private jwtService: JwtService,
    private messageService: MessagesService,
    private usersService: UsersService,
  ) {
    this.logger.log('Gateway created');
  }

  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, string>(); // userid,clientid
  private socketToUser = new Map<string,  { userId:string, username:string }>(); // clientid ,{ userid,username}
  private thanku = new Map<string, string>(); 

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if(!token)
      {
        this.logger.warn("no token provided");
        client.disconnect();
        return;
      }
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    }
    catch {
      this.logger.warn("JWT verification failed");
      client.disconnect();
      return;
    }
    const deliveredMsgs = await this.messageService.markDelivered(payload.sub);
    this.logger.log(`Socket connected | user=${payload.username} socket=${client.id}`);
    for (const msg of deliveredMsgs) {

        const senderSocket = this.onlineUsers.get(msg.sender.userId);

        if (senderSocket) {
            this.server.to(senderSocket).emit("message-delivered", { messageId: msg.messageId });
        }
    }
    this.onlineUsers.set(payload.sub, client.id);
    this.server.emit('user-online', {username: payload.username,});
    this.socketToUser.set(client.id, { userId: payload.sub, username: payload.username,});
    this.server.emit("online-users", Array.from(this.socketToUser.values()).map(user=>user.username));
  }

  async handleDisconnect(client: Socket) {
    const userconn = this.socketToUser.get(client.id);
    if(!userconn)
      return ;
    this.server.emit('user-offline', {username: userconn.username});
    if (userconn.userId) {
      this.logger.warn(`Socket disconnected | user=${userconn.username} socket=${client.id}`);
      this.onlineUsers.delete(userconn.userId);
      this.socketToUser.delete(client.id);
      this.server.emit("online-users", Array.from(this.socketToUser.values()).map(user=>user.username));
    }
    this.logger.debug(JSON.stringify([...this.onlineUsers])); 
  }

  @SubscribeMessage('private-message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessageDto) {
    const senderdetails = this.socketToUser.get(client.id);
    if (!senderdetails) 
      return;
    
    this.logger.log(`Message event received from ${senderdetails.username}`);
    const message = await this.messageService.create(senderdetails.userId, payload);
    // this.logger.log(`Message stored | ${senderdetails.username} -> ${payload.receivername}`);
    const ruser= await this.usersService.findOneByUname(payload.receivername);
    const receiverSocketId = this.onlineUsers.get(ruser!.userId);
    const tymsg = {
      sender: payload.receivername, 
      receiver: senderdetails.username, 
      content:'Thank you for the message', 
      createdAt:new Date()
    }
    const offlinemsg = { 
      content:"User offline. Message sent in chat.", 
      createdAt:new Date()
    }
    
    if(receiverSocketId)
      {
      this.logger.log(`Delivering message ${message.messageId} to ${payload.receivername} (socket=${receiverSocketId})`);
      this.server.to(receiverSocketId).emit('private-message',message);
      this.server.to(client.id).emit('private-message',message);
      
      const today = new Date().toISOString().split("T")[0];
      const ty= [senderdetails.username, payload.receivername].sort().join("-")
      const tysent= this.thanku.get(ty);
      if(tysent!==today)
      {
        this.thanku.set(ty, today);
        this.server.to(client.id).emit('private-message', tymsg)
      }
    }
    else
    {
      this.server.to(client.id).emit('private-message',message);
      this.server.to(client.id).emit('system-message', offlinemsg)
      this.logger.warn(`Receiver offline | ${payload.receivername}`);
    }


    return;// {ok:true};
  }
}