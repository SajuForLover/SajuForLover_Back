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
    console.log('CharacterController.create, dto:', JSON.stringify(createCompatibilityDto));
    const result = await this.characterService.create(createCompatibilityDto);
    return {
      characterId: result?.characterId || null,
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

  @Get(':userId')
  async findOne(@Param('userId') userId: string) {
    console.log('CharacterController.findOne userId:', userId);
    const result = await this.characterService.findCompatibilityByUserId(userId);
    if (!result) return null;
    return {
      characterId: result.characterId,
      characterName: result.characterName,
      overallScore: result.overallScore,
      badgeScores: result.badgeScores,
      sections: result.sections,
    };
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
