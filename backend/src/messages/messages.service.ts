// messages.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Message)
        private messageRepository: Repository<Message>
  ){}

  async create(senderId:string, createMessageDto: CreateMessageDto) { 
    const sender=await this.userRepository.findOneBy({userId: senderId});
    const receiver=await this.userRepository.findOneBy({username: createMessageDto.receivername});
    if(!sender || !receiver)
      throw new NotFoundException({
          code: "USER_NOT_FOUND",
          message: "User not found",
      });
    const newMsg = this.messageRepository.create({ sender, receiver, content: createMessageDto.content});
    const saved = await this.messageRepository.save(newMsg);
    this.logger.log(
      `Message stored | ${sender.username} -> ${receiver.username}`
    );
    return {
        messageId: saved.messageId,
        sender: saved.sender.username,
        receiver: saved.receiver.username,
        content: saved.content,
        createdAt: saved.createdAt,
        isRead: saved.isRead,
        isDelivered: saved.isDelivered,
    };
  }

  async allhistory(senderId:string) {
    const user = await this.userRepository.findOne({where:{userId:senderId}})
    const msgs= await this.messageRepository.find({where: [{ sender: { userId: senderId } },
                                                           { receiver: { userId: senderId } }],
                                                   relations: {sender: true, receiver: true},
                                                   order:{createdAt:'ASC'}})
    return msgs.map(msg => ({sender: msg.sender.username, receiver: msg.receiver.username, content: msg.content}));
  }

  async unreadCount(loggedInUserId:string) {
    const msgs= await this.messageRepository.find({ where: [{ receiver:{userId:loggedInUserId}, isRead:false}], 
                                                    relations: {sender: true, receiver: true},
                                                    order:{createdAt:'ASC'}})
    
    const count: Record<string, number> = {};
    for(let msg of msgs)
    {
      if(msg.sender.username in count)
        count[msg.sender.username]++;
      else
        count[msg.sender.username]=1;
    }
    return count; 
  }  

    async markDelivered(loggedInUserId:string) {
    const msgs= await this.messageRepository.find({ where: { receiver:{userId:loggedInUserId}, isDelivered:false}, 
                                                    relations: {sender: true, receiver: true},
                                                    order:{createdAt:'ASC'}
                                                  })
    for(let msg of msgs)
    {
      msg.isDelivered=true;
    }
    await this.messageRepository.save(msgs); 
    this.logger.log(
      `${msgs.length} messages marked delivered`
    );
    return msgs;
  }  

  async userhistory(senderId:string,receivername:string) {
    const user1 = await this.userRepository.findOne({where:{userId:senderId}})
    const user2 = await this.userRepository.findOne({where:{username:receivername}})
    if(!user1 || !user2)
      return;
    const msgs= await this.messageRepository.find({where: [{ sender: {userId: senderId} , receiver:{username:receivername}},
                                                           { sender: {username: receivername} , receiver:{userId:senderId}}], 
                                                   relations: {sender: true, receiver: true},
                                                   order:{createdAt:'ASC'}})

    // mark as read
    for(let msg of msgs)
    {
      if(msg.receiver.userId===senderId && msg.sender.username==receivername) {
        msg.isDelivered=true;
        msg.isRead=true;
      }
      //senderId is of the logged in user, so HIS RECEIVED msgs, and HIS isread shd be true as he opened msgs
    }
    await this.messageRepository.save(msgs);
        this.logger.log(
      `${msgs.length} messages marked read`
    );
    // save is used, but TypeORM sees that these entities already exist in the database
    // so performs UPDATE instead of INSERT.
    return msgs.map(msg => ({messageId:msg.messageId, sender: msg.sender.username, receiver: msg.receiver.username, content: msg.content, createdAt:msg.createdAt, isRead:msg.isRead, isDelivered:msg.isDelivered}));
  }

  // update(id: string, updateMessageDto: UpdateMessageDto) {
  //   return `This action updates a #${id} message`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} message`;
  // }

}
