import { PartialType } from '@nestjs/swagger';
import { CreatePhysiognomyDto } from './create-physiognomy.dto';

export class UpdatePhysiognomyDto extends PartialType(CreatePhysiognomyDto) {}
