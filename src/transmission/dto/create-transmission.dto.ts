import { IsEmail, IsString, IsUUID } from 'class-validator';

export class CreateTransmissionDto {
  @IsUUID()
  userId: string;

  @IsEmail()
  email: string;
}
