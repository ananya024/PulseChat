import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty()
    receivername!:string;
    @ApiProperty()
    content!:string;
}
