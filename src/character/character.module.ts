import { Module } from '@nestjs/common';
import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';
import { Saju } from '@/saju/entities/saju.entity';
import { Physiognomy } from '@/physiognomy/entities/physiognomy.entity';
import { Compatibility } from './entities/compatibility.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, Saju, Physiognomy, Compatibility])],
  controllers: [CharacterController],
  providers: [CharacterService],
})
export class CharacterModule {}
