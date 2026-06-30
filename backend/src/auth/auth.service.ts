import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ){}

    async signIn(userName: string, pass: string){
        const user= await this.usersService.authUser(userName, pass);
        if(user===null)
        {
            throw new UnauthorizedException();
        }
        const payload = { sub: user.userId, username: user.username};
        try{
            return {
                statusCode:201,
                message: "User authentication succesful",
                access_token: await this.jwtService.signAsync(payload),
                userId : user.userId,
                username: user.username
            }
        }
        catch(e){
            throw new UnauthorizedException();
        }
    }
}
