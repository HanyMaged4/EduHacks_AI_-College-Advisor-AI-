import { Injectable, Logger } from '@nestjs/common';
import { ChromadbService } from './chromadb.service';
import { EmbeddingService } from './embedding.service';

export interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private chromadb: ChromadbService,
    private embedding: EmbeddingService,
  ) {}

  // Add documents to knowledge base
  async addDocuments(
    collectionName: string,
    documents: DocumentInput[]
  ): Promise<void> {
    const ids = documents.map((_, i) => `${collectionName}-${Date.now()}-${i}`);
    const contents = documents.map(doc => doc.content);
    const embeddings = await this.embedding.generateEmbeddings(contents);
    const metadatas = documents.map(doc => doc.metadata || {});

    await this.chromadb.addDocuments(collectionName, {
      ids,
      embeddings,
      documents: contents,
      metadatas,
    });

    this.logger.log(`Added ${documents.length} documents to '${collectionName}'`);
  }

  // Search knowledge base
  async search(
    collectionName: string,
    query: string,
    limit: number = 5,
  ) {
    const queryEmbedding = await this.embedding.generateEmbedding(query);
    return await this.chromadb.queryCollection(
      collectionName,
      queryEmbedding,
      limit,
    );
  }

  // Index university data
  async indexUniversityData(
    universityName: string,
    universityData: any
  ): Promise<void> {
    const collectionName = `${universityName.toLowerCase()}_knowledge`;
    
    // Break down university data into smaller chunks
    const documents: DocumentInput[] = [
      {
        content: `${universityName} is located in ${universityData.location.city}, ${universityData.location.state_province}, ${universityData.location.country}`,
        metadata: { type: 'location', university: universityName }
      },
      {
        content: `${universityName} acceptance rate is ${universityData.basic_info.acceptance_rate}`,
        metadata: { type: 'admissions', university: universityName }
      },
      {
        content: `${universityName} tuition is ${universityData.costs.tuition_annual_usd} per year`,
        metadata: { type: 'costs', university: universityName }
      },
      {
        content: `${universityName} SAT range: ${universityData.admissions.undergraduate.sat_range}`,
        metadata: { type: 'test_scores', university: universityName }
      },
      {
        content: `${universityName} popular programs include: ${universityData.popular_programs.join(', ')}`,
        metadata: { type: 'programs', university: universityName }
      },
      {
        content: `${universityName} application deadlines - Regular: ${universityData.deadlines.regular_decision}, Early Action: ${universityData.deadlines.early_action}`,
        metadata: { type: 'deadlines', university: universityName }
      }
    ];

    await this.addDocuments(collectionName, documents);
    this.logger.log(`Indexed data for ${universityName}`);
  }

}