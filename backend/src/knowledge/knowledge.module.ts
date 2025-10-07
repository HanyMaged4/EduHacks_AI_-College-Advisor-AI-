import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { ChromadbService } from './chromadb.service';
import { GeminiService } from './gemini.service';

@Module({
  providers: [KnowledgeService, EmbeddingService, ChromadbService, GeminiService],
  exports: [KnowledgeService], // Export KnowledgeService so it can be used in other modules
})
export class KnowledgeModule {}
