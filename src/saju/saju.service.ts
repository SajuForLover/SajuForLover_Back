import { Injectable } from '@nestjs/common';
import { CreateSajuDto } from './dto/create-saju.dto';
import { UpdateSajuDto } from './dto/update-saju.dto';

@Injectable()
export class SajuService {
  create(createSajuDto: CreateSajuDto) {
    return 'This action adds a new saju';
  }

  findAll() {
    return `This action returns all saju`;
  }

  findOne(id: number) {
    return `This action returns a #${id} saju`;
  }

  update(id: number, updateSajuDto: UpdateSajuDto) {
    return `This action updates a #${id} saju`;
  }

  remove(id: number) {
    return `This action removes a #${id} saju`;
  }
}
