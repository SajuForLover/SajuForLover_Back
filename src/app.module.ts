import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { GenerateModule } from './generate/generate.module';

@Module({
  imports: [AnalysisModule, GenerateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
