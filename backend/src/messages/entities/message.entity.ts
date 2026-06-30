// message.entity.ts

import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    messageId!:string;
    
    @ManyToOne(() => User, user => user.sentMessages, {nullable:false})
    sender!: User;

    @ManyToOne(() => User, user => user.receivedMessages, {nullable:false})
    receiver!: User;
    
    @Column()
    content!:string

    @Column({default:false})
    isRead!:boolean
    
    @Column({default:false})
    isDelivered!:boolean
    
    @CreateDateColumn()
    createdAt!:Date

}
