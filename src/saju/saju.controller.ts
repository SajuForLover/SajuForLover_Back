import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SajuService } from './saju.service';
import { CreateSajuDto } from './dto/create-saju.dto';
import { UpdateSajuDto } from './dto/update-saju.dto';
import { CalendarTypeDescription } from './enums/calendar-type.enum';
import { GenderDescription } from './enums/gender.enum';
import { BirthTimeDescription } from './enums/birth-time.enum';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('saju')
export class SajuController {
  constructor(private readonly sajuService: SajuService) { }

  @Post()
  @ApiOperation({ summary: '사주 분석' })
  @ApiBody({ type: CreateSajuDto })
  create(@Body() createSajuDto: CreateSajuDto) {
    const birthTime = BirthTimeDescription[createSajuDto.birthTime];
    const gender = GenderDescription[createSajuDto.gender];
    const calendar = CalendarTypeDescription[createSajuDto.calendar];
    const userInput = {
      name: createSajuDto.name,
      gender: gender,
      birthDate: createSajuDto.birthDate,
      location: createSajuDto.location,
      calendar: calendar,
      birthTime: birthTime,
    };
    console.log('user_input:', userInput);
    return this.sajuService.create(userInput);
  }

  @Get(':id') // URL 경로에서 ID를 받도록 수정
  @ApiOperation({ summary: '사주 분석 결과 조회' })
  findOne(@Param('id') id: string) {
    return this.sajuService.findOne(id);
  }
}
