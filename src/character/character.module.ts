import { Module } from '@nestjs/common';
import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [CharacterController],
  providers: [CharacterService],
})
export class CharacterModule {}
