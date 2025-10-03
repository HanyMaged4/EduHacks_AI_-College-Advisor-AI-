import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { EmbeddingService } from './embedding.service';
import { ChromadbService } from './chromadb.service';

@Module({
  providers: [KnowledgeService, EmbeddingService, ChromadbService]
})
export class KnowledgeModule {}
