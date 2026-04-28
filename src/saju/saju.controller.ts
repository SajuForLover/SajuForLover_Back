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
    const birthTime = createSajuDto.birthTime === 'unknown' ? '알 수 없는 시간' : BirthTimeDescription[createSajuDto.birthTime];
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

    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.sajuService.findOne(+id);
    }
  }
