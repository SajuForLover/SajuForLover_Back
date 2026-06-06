import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompatibilityOptionsDto {
  @ApiPropertyOptional({ description: '반환할 상위 결과 개수', example: 1 })
  @IsOptional()
  topK?: number;
}

export class CreateCompatibilityDto {
  @ApiPropertyOptional({ description: '사용자 UUID', example: 'a96dd080-5d4c-11f1-9ef4-c39965e34bd0' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '사용자 성별 (male/female 또는 남성/여성)', example: 'male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: '사주 데이터' })
  @IsOptional()
  @IsObject()
  saju?: any;

  @ApiPropertyOptional({ description: '관상 데이터' })
  @IsOptional()
  @IsObject()
  physiognomy?: any;

  @ApiPropertyOptional({ type: CompatibilityOptionsDto, description: '추가 옵션' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompatibilityOptionsDto)
  options?: CompatibilityOptionsDto;
}
