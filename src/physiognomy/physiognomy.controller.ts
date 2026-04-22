import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PhysiognomyService } from './physiognomy.service';
import { CreatePhysiognomyDto } from './dto/create-physiognomy.dto';
import { UpdatePhysiognomyDto } from './dto/update-physiognomy.dto';

@Controller('physiognomy')
export class PhysiognomyController {
  constructor(private readonly physiognomyService: PhysiognomyService) {}

  @Post()
  create(@Body() createPhysiognomyDto: CreatePhysiognomyDto) {
    return this.physiognomyService.create(createPhysiognomyDto);
  }

  @Get()
  findAll() {
    return this.physiognomyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.physiognomyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhysiognomyDto: UpdatePhysiognomyDto) {
    return this.physiognomyService.update(+id, updatePhysiognomyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.physiognomyService.remove(+id);
  }
}
