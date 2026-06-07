import { IsEmail, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransmissionDto {
  @ApiProperty({ description: '사용자 UUID', example: 'a96dd080-5d4c-11f1-9ef4-c39965e34bd0' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: '사용자 이메일', example: 'user@example.com' })
  @IsEmail()
  email!: string;
}
