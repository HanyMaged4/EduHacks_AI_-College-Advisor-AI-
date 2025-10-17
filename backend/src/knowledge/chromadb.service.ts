import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

@Injectable()
export class ChromadbService {
  private client: ChromaClient;

  constructor() {
    const pathUrl =
      process.env.CHROMA_URL ||
      process.env.CHROMA_DB_URL ||
      'http://localhost:8000';

    this.client = new ChromaClient({ path: pathUrl });
  }

  async getOrCreateCollection(name: string) {
    try {
      return await this.client.getOrCreateCollection({
        name: name,
        metadata: { description: 'University knowledge base' },
        embeddingFunction: null,
      });
    } catch (err) {
      // Rethrow a clearer error so callers can handle it
      throw new Error(
        `Failed to connect to ChromaDB at ${this.client['path'] || process.env.CHROMA_URL || 'http://localhost:8000'}: ${err?.message || err}`
      );
    }
  }

  async deleteCollection(name: string = 'university_knowledge'): Promise<void> {
    try {
      await this.client.deleteCollection({ name });
    } catch (e) {
      // ignore if not found
    }
  }

  async addDocuments(
    data: {
      ids: string[];
      embeddings: number[][];
      documents: string[];
      metadatas: any;
    },
    collectionName: string = 'university_knowledge'
  ) {
    try {
      const collection = await this.getOrCreateCollection(collectionName);
      await collection.add({
        ids: data.ids,
        embeddings: data.embeddings,
        documents: data.documents,
        metadatas: data.metadatas,
      });
    } catch (err) {
      throw new Error(`ChromaDB addDocuments failed: ${err?.message || err}`);
    }
  }

// This is the correct way to handle options
async queryCollection(
  queryEmbedding: number[],
  limit: number = 5,
  collectionName: string = 'university_knowledge',
  opts?: { where?: any; whereDocument?: any }
) {
  try {
    const collection = await this.getOrCreateCollection(collectionName);
    const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
    include: ['metadatas', 'documents', 'distances'],
    ...(opts?.where ? { where: opts.where } : {}),
    ...(opts?.whereDocument ? { whereDocument: opts.whereDocument } : {}),
  });
    return results;
  } catch (err) {
    throw new Error(`ChromaDB query failed: ${err?.message || err}`);
  }
}
}