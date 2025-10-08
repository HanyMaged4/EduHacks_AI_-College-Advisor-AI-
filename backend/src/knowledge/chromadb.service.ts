import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

@Injectable()
export class ChromadbService {
  private client: ChromaClient;

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_DB_URL || 'http://localhost:8000',
    });
  }

  async getOrCreateCollection(name: string) {
    return await this.client.getOrCreateCollection({
      name: name,
      metadata: { description: 'University knowledge base' },
      embeddingFunction: null, // Disable default embedding function since you're providing custom embeddings
    });
  }
 async deleteCollection(name: string = "university_knowledge"): Promise<void> {
    try {
      await this.client.deleteCollection({ name });
    } catch {
      // Ignore errors if the collection does not exist
      throw new Error(`Collection ${name} does not exist or could not be deleted.`);
    }
  }
  // Add documents to collection
  async addDocuments(
    data: {
      ids: string[],
      embeddings: number[][],
      documents: string[],
      metadatas: any
    },
    collectionName: string = "university_knowledge"
  ) {
    const collection = await this.getOrCreateCollection(collectionName);
    await collection.add({
      ids: data.ids,
      embeddings: data.embeddings,
      documents: data.documents,
      metadatas: data.metadatas,
    });
  }

  // Query collection
  async queryCollection(
    queryEmbedding: number[],
    limit: number = 5,
    collectionName: string = "university_knowledge"
  ) {
    const collection = await this.getOrCreateCollection(collectionName);
    return await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
    });
  }
}