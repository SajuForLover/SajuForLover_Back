import { PartialType } from '@nestjs/swagger';
import { CreateTransmissionDto } from './create-transmission.dto';

export class UpdateTransmissionDto extends PartialType(CreateTransmissionDto) {}
