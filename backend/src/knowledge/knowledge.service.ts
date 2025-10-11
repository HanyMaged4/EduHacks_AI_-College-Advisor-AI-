import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromadbService } from './chromadb.service';
import { EmbeddingService } from './embedding.service';
import path from 'path';
import { stringify } from 'querystring';
import { UniversityDto } from 'src/knowledge/dto/UniversityDto';

export interface DocumentInput {
  content: string;
  metadata: Record<string, any>;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private chromadb: ChromadbService,
    private embedding: EmbeddingService,
  ) {}
 async onModuleInit() {
    const shouldRebuild = (process.env.REBUILD_CHROMA || '').toLowerCase() === 'true';
    if (shouldRebuild) {
      this.logger.log('REBUILD_CHROMA is set to true. Deleting existing collection and rebuilding...');
      await this.chromadb.deleteCollection('university_knowledge');
    }else{
      this.logger.log('REBUILD_CHROMA is not set to true. Skipping rebuilding of the collection.');
    }
    if (process.env.NODE_ENV === 'development') {
    await this.setUniversitiesData(path.resolve(process.cwd(), 'data'));
    }
  }

  // Ensure metadata fields are scalars as required by Chroma
  private sanitizeMetadata(meta: Record<string, any> = {}): Record<string, string | number | boolean | null> {
    const out: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(meta)) {
      if (v === null || v === undefined) {
        out[k] = null;
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[k] = v;
      } else if (Array.isArray(v)) {
        // join arrays into a single string
        out[k] = v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(', ');
      } else {
        // stringify nested objects
        out[k] = JSON.stringify(v);
      }
    }
    return out;
  }

  // Add documents to knowledge base
  async addDocuments(
    documents: DocumentInput[],
    collectionName: string = 'university_knowledge'
  ): Promise<void> {
    // prepare ids, contents, embeddings
    const now = Date.now();
    const ids = documents.map((_, i) => `${collectionName}-${now}-${i}`);
    const contents = documents.map((d) => d.content);
    const embeddings = await this.embedding.generateEmbeddings(contents);

    // sanitize metadatas for Chroma
    const metadatas = documents.map((doc) =>
      this.sanitizeMetadata(doc.metadata)
    );

    await this.chromadb.addDocuments(
      { ids, embeddings, documents: contents, metadatas },
      collectionName
    );

    this.logger.log(`Added ${documents.length} documents to '${collectionName}'`);
  }

  // Search knowledge base
  async search(
    query: string,
    limit: number = 5,
    collectionName: string = 'university_knowledge'
  ) {
    const queryEmbedding = await this.embedding.generateEmbedding(query);

    // Simple heuristic: if query contains an acronym (e.g., MIT), bias results
    const acronymMatch = query.match(/\b[A-Z]{2,6}\b/);
    const whereDocument = acronymMatch ? { $contains: acronymMatch[0] } : undefined;

    return await this.chromadb.queryCollection(
      queryEmbedding,
      limit,
      collectionName,
      { whereDocument }
    );
  }


async setUniversitiesData(
  folderPath: string,
  collectionName: string = 'university_knowledge'
): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  const files = fs.readdirSync(folderPath).filter((file: string) => file.endsWith('.json'));
  const data: DocumentInput[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const universityData = JSON.parse(fileContent) as UniversityDto;
      const { summary, ...metaData } = universityData;
      if (!summary || summary.trim().length === 0) {
        this.logger.warn(`Skipping file with empty summary: ${filePath}`);
        continue;
      }
      const acronym = (metaData.university_name?.match(/\b[A-ZaZ]/g)?.join('') || '').toUpperCase();
      data.push({
        content: `${summary.trim()}`,
        metadata: {
          ...metaData,
          acronym,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to process file ${filePath}: ${err.message}`);
    }
  }

  this.logger.log(`Number of documents to index: ${data.length}`);
  await this.addDocuments(data, collectionName);
  this.logger.log(`Indexed data from folder: ${folderPath}`);
}

}