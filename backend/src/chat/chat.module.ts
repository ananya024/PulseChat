import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { UsersModule } from "src/users/users.module";
import { MessagesModule } from "src/messages/messages.module";

@Module({
  imports: [UsersModule,MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}