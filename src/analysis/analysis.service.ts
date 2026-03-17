import { Injectable } from '@nestjs/common';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';

@Injectable()
export class AnalysisService {
  create(createAnalysisDto: CreateAnalysisDto) {
    return 'This action adds a new analysis';
  }
  
}
