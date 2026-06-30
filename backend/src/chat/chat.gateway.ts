// chat.gateway.ts

import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({cors:{origin:'*'}})
export class ChatGateway {
  constructor(
    private jwtService: JwtService,
    private messageService: MessagesService,
    private usersService: UsersService,
    // @InjectRepository(Message)
    // private messageRepository: Repository<Message>
  ) {
    // console.log('Gateway created');
  }

  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, string>(); // userid,clientid
  private socketToUser = new Map<string,  { userId:string, username:string }>(); // clientid ,{ userid,username}
  private thanku = new Map<string, string>(); 

  async handleConnection(client: Socket) {
    // console.log('connected', client.id)
    const token = client.handshake.auth.token;
    if(!token)
      {
        console.log("no token provided");
        client.disconnect();
        return;
      }
    // /////////////////////////////////////////////////////////////////////////////////////
    // const user1 = await this.usersService.findOneById(this.socketToUser[client.id].userId);
    // if(!user1 )
    //   return;
    // const uid=user1.userId;
    // const msgs= await this.messageRepository.find({where: [{ receiver: { userId: uid } }],
    //                                                 relations: {sender: true, receiver: true},
    //                                                 order:{createdAt:'ASC'}})
    // for(let msg of msgs)
    // {
    //   if(msg.receiver.userId===uid) {
    //     msg.isDelivered=true;
    //   }
    // }
    // await this.messageRepository.save(msgs);
  // //////////////////////////////////////////////////////////////////////////////////////
    const payload = await this.jwtService.verifyAsync(token);
    console.log("CONNECTED", payload.username, client.id);
      // console.log(payload);
    this.onlineUsers.set(payload.sub, client.id);
    this.server.emit('user-online', {username: payload.username,});
    this.socketToUser.set(client.id, { userId: payload.sub, username: payload.username,});
    this.server.emit("online-users", Array.from(this.socketToUser.values()).map(user=>user.username));
    // console.log(this.onlineUsers);
  }

  async handleDisconnect(client: Socket) {
    // console.log('disconnected', client.id)
    const userconn = this.socketToUser.get(client.id);
    if(!userconn)
      return ;
    // const user= await this.usersService.findOneById(userconn!.userId);
    this.server.emit('user-offline', {username: userconn.username});
    if (userconn.userId) {
      console.log("DISCONNECTED", userconn.username, client.id);
      this.onlineUsers.delete(userconn.userId);
      this.socketToUser.delete(client.id);
      this.server.emit("online-users", Array.from(this.socketToUser.values()).map(user=>user.username));
    }

    // console.log(this.onlineUsers);
  }

  @SubscribeMessage('private-message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessageDto) {
    // console.log("MESSAGE EVENT RECEIVED");
    // console.log(payload);
    const senderdetails= this.socketToUser.get(client.id);
    if(!senderdetails)
      return;
    await this.messageService.create(senderdetails.userId, payload);
    // const suser= await this.usersService.findOneById(senderdetails.userId);
    const ruser= await this.usersService.findOneByUname(payload.receivername);
    // if(!user)
    //   return;
    const receiverSocketId = this.onlineUsers.get(ruser!.userId);
    console.log("receiver socket id =", receiverSocketId);
    console.log("sender socket id   =", client.id);
    const message = {
      sender: senderdetails.username,
      receiver: payload.receivername,
      content: payload.content,
      timestamp: new Date(),
    };
    const tymsg = {
      sender: payload.receivername, 
      receiver: senderdetails.username, 
      content:'Thank you for the message', 
      timestamp:new Date()
    }
    const offlinemsg = { 
      // sender: 'server', receiver: senderdetails.username, 
      content:"User offline. Message sent in chat.", 
      timestamp:new Date()
    }

    if(receiverSocketId)
    {
      console.log("sending to receiver...");
      console.log("sending to sender...");
      console.log("Sending to", receiverSocketId, message);
      this.server.to(receiverSocketId).emit('private-message',message);
      this.server.to(client.id).emit('private-message',message);
      
      // this.server.to(receiverSocketId)
      //            .emit('private-message', {sender: senderdetails.username, receiver: payload.receivername, content:payload.content, timestamp:new Date()})

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
    }


    return;// {ok:true};
  }
}import { Repository } from 'typeorm';
import { Message } from 'src/messages/entities/message.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

