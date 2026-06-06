import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CharacterService } from './character.service';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCompatibilityDto } from './dto/create-compatibility.dto';

@Controller('api/character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() createCompatibilityDto: CreateCompatibilityDto) {
    const result = await this.characterService.create(createCompatibilityDto);
    return {
      characterName: result?.characterName || null,
      overallScore: result?.overallScore ?? null,
      badgeScores: result?.badgeScores ?? null,
      sections: result?.sections || null,
    };
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
