import { Injectable } from '@nestjs/common';
import { CreatePhysiognomyDto } from './dto/create-physiognomy.dto';
import { UpdatePhysiognomyDto } from './dto/update-physiognomy.dto';

@Injectable()
export class PhysiognomyService {
  create(createPhysiognomyDto: CreatePhysiognomyDto) {
    return 'This action adds a new physiognomy';
  }

  findAll() {
    return `This action returns all physiognomy`;
  }

  findOne(id: number) {
    return `This action returns a #${id} physiognomy`;
  }

  update(id: number, updatePhysiognomyDto: UpdatePhysiognomyDto) {
    return `This action updates a #${id} physiognomy`;
  }

  remove(id: number) {
    return `This action removes a #${id} physiognomy`;
  }
}
