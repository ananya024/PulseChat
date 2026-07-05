// auth.service.ts

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ){}

    async signIn(userName: string, pass: string){
        const user= await this.usersService.authUser(userName, pass);
        if(user===null)
        {
            this.logger.log(`User doesn't exist`);
            throw new UnauthorizedException();
        }
        const payload = { sub: user.userId, username: user.username};
        try{
            this.logger.log(`User logged in | username=${user.username}`);
            return {
                statusCode:201,
                message: "User authentication succesful",
                access_token: await this.jwtService.signAsync(payload),
                userId : user.userId,
                username: user.username
            }
        }
        catch(e){
            this.logger.warn(`Login failed | username=${user.username}`);
            throw new UnauthorizedException();
        }
    }
}
