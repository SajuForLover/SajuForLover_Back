import { PartialType } from '@nestjs/swagger';
import { CreateSajuDto } from './create-saju.dto';

export class UpdateSajuDto extends PartialType(CreateSajuDto) {}
