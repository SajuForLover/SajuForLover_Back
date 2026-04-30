import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { PhysiognomyService } from './physiognomy.service';
import { CreatePhysiognomyDto } from './dto/create-physiognomy.dto';
import { UpdatePhysiognomyDto } from './dto/update-physiognomy.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import 'multer';

@Controller('physiognomy')
export class PhysiognomyController {
  constructor(private readonly physiognomyService: PhysiognomyService) { }

  @Post()
  @ApiOperation({ summary: '관상 분석' })
  @ApiConsumes('multipart/form-data') // 중요: 파일 업로드 형식 명시
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: '사용자 uuid',
          example: 'user-uuid-123',
        },
        image: { // 이 이름이 FileInterceptor('image')의 이름과 일치해야 함
          type: 'string',
          format: 'binary',
        },
      },
      required: ['uuid', 'image'], // uuid와 image 모두 필수
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createPhysiognomyDto: CreatePhysiognomyDto, @UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }

    if (!image.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      throw new BadRequestException('JPG 또는 PNG 이미지만 업로드 가능합니다.');
    }
    return this.physiognomyService.create(createPhysiognomyDto, image);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.physiognomyService.findOne(uuid);
  }
}
