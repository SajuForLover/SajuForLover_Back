import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SajuService } from './saju.service';
import { CreateSajuDto } from './dto/create-saju.dto';
import { UpdateSajuDto } from './dto/update-saju.dto';

@Controller('saju')
export class SajuController {
  constructor(private readonly sajuService: SajuService) {}

  @Post()
  create(@Body() createSajuDto: CreateSajuDto) {
    return this.sajuService.create(createSajuDto);
  }

  @Get()
  findAll() {
    return this.sajuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sajuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSajuDto: UpdateSajuDto) {
    return this.sajuService.update(+id, updateSajuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sajuService.remove(+id);
  }
}
