import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromadbService } from './chromadb.service';
import { EmbeddingService } from './embedding.service';
import path from 'path';
import { stringify } from 'querystring';

export interface DocumentInput {
  university_name: string;
  content: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private chromadb: ChromadbService,
    private embedding: EmbeddingService,
  ) {}
 async onModuleInit() {

    if (process.env.NODE_ENV === 'development') {

        await this.setUniversitiesData(path.join(__dirname, '../../data'));
    }
  }
  // Add documents to knowledge base
  async addDocuments(
    documents: DocumentInput[], 
    collectionName: string = 'university_knowledge'
  ): Promise<void> {
    const ids = documents.map((_, i) => `${collectionName}-${Date.now()}-${i}`);
    const contents = documents.map(doc => doc.content);
    const embeddings = await this.embedding.generateEmbeddings(contents);
    const metadatas = documents.map(doc => doc.metadata || {});

    await this.chromadb.addDocuments( {
      ids,
      embeddings,
      documents: contents,
      metadatas,
    },collectionName);

    this.logger.log(`Added ${documents.length} documents to '${collectionName}'`);
  }

  // Search knowledge base
  async search(
    query: string,
    limit: number = 5,
    collectionName: string = 'university_knowledge'
  ) {
    const queryEmbedding = await this.embedding.generateEmbedding(query);
    return await this.chromadb.queryCollection(
      queryEmbedding,
      limit,
      collectionName,
    );
  }


async setUniversitiesData(
  folderPath: string,
  collectionName: string = 'university_knowledge'
): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.json')); 
  let data: DocumentInput[] = [];
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const universityData = JSON.parse(fileContent);
    const {university_name, ...content} = universityData;
    data.push({
      university_name,
      content: `University: ${university_name}. ${JSON.stringify(content)}`, // Include name for better embeddings
      metadata: { filePath }
    });
  }

  console.log(`Number of documents to index: ${data.length}`);
  await this.addDocuments(data, collectionName);
  this.logger.log(`Indexed data from folder: ${folderPath}`);
}

}