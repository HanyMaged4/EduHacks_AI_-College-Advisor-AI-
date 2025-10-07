import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { ChromadbService } from './chromadb.service';
import { GeminiService } from './gemini.service';

@Module({
  providers: [KnowledgeService, EmbeddingService, ChromadbService, GeminiService],
})
export class KnowledgeModule {}
