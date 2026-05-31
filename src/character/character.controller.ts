import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CharacterService } from './character.service';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';

@Controller('api/character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() createCompatibilityDto: CreateCompatibilityDto, @Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 1;
    if (Number.isNaN(n) || n < 1) {
      throw new BadRequestException('limit은 1 이상의 숫자여야 합니다.');
    }

    const results = await this.characterService.create(createCompatibilityDto, n);
    // 기본 동작: limit=1이면 단일 객체로, 그렇지 않으면 배열로 반환
    if (n === 1) {
      const top = Array.isArray(results) ? results[0] : results;
      return {
        characterName: top?.characterName || null,
        overallScore: top?.overallScore ?? null,
        badgeScores: top?.badgeScores ?? null,
        sections: top?.sections || null,
      };
    }
    return results.map((r) => ({
      characterName: r.characterName,
      overallScore: r.overallScore ?? null,
      badgeScores: r.badgeScores ?? null,
      sections: r.sections,
    }));
  }

  @Get()
  findAll() {
    return this.characterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.characterService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCharacterDto: UpdateCharacterDto) {
    return this.characterService.update(+id, updateCharacterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.characterService.remove(+id);
  }
}
