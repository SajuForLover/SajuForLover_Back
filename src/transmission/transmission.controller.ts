import { Controller, Post, Body } from '@nestjs/common';
import { TransmissionService } from './transmission.service';
import { CreateTransmissionDto } from './dto/create-transmission.dto';
import { ApiOperation, ApiBody } from '@nestjs/swagger';

@Controller('transmission')
export class TransmissionController {
  constructor(private readonly transmissionService: TransmissionService) {}

  @Post()
  @ApiOperation({ summary: '사용자 분석 결과 이메일 전송' })
  @ApiBody({ type: CreateTransmissionDto })
  async sendEmail(@Body() createTransmissionDto: CreateTransmissionDto) {
    return this.transmissionService.create(createTransmissionDto);
  }
}
