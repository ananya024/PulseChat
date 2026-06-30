// messages.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('message')
@ApiBearerAuth('jwt-auth')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'send message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request.',
  })
  @ApiBody({ type: CreateMessageDto })
  @UseGuards(AuthGuard)
  @Post('send')
  create(@Request() req , @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.sub, createMessageDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.messagesService.allhistory(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('unread-counts')
  findUnread(@Request() req){
    return this.messagesService.unreadCount(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':receiver')
  findOne(@Request() req, @Param('receiver') username: string) {
    return this.messagesService.userhistory(req.user.sub, username);
  }

  // @Patch(':id')
  // update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMessageDto: UpdateMessageDto) {
  //   return this.messagesService.update(id, updateMessageDto);
  // }

  // @Delete(':id')
  // remove(@Param('id',ParseUUIDPipe) id: string) {
  //   return this.messagesService.remove(id);
  // }


}
