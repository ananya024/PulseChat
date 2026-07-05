// auth.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ){}

    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary:"sign in"})
    @ApiBody({ type: CreateUserDto })
    @Post('login')
    signIn(@Body() createUserDto:CreateUserDto){
        return this.authService.signIn(createUserDto.username, createUserDto.password);
    }

    @ApiBearerAuth('jwt-auth')
    @UseGuards(AuthGuard)
    @Get('profile')
    getProfile(@Request() req){
        // console.log("profile req.user =", req.user);
        return req.user;
    }

}
