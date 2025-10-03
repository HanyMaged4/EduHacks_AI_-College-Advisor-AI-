import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';

@Injectable()
export class ChromadbService {
  private client: ChromaClient;

  constructor() {
    this.client = new ChromaClient();
  }

  async getOrCreateCollection(name: string) {
    return await this.client.getOrCreateCollection({
      name: name,
      metadata: { description: 'University knowledge base' }
    });
  }

  // Add documents to collection
  async addDocuments(collectionName: string, data: {
    ids: string[],
    embeddings: number[][],
    documents: string[],
    metadatas: any
  }) {
    const collection = await this.getOrCreateCollection(collectionName);
    
    await collection.add({
      ids: data.ids,
      embeddings: data.embeddings,
      documents: data.documents,
      metadatas: data.metadatas
    });
  }

  // Query/search the collection
  async queryCollection(collectionName: string, queryEmbedding: number[], nResults: number = 5) {
    const collection = await this.getOrCreateCollection(collectionName);
    
    return await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults
    });
  }

  // Delete a collection
  async deleteCollection(name: string) {
    await this.client.deleteCollection({ name });
  }

  // List all collections
  async listCollections() {
    return await this.client.listCollections();
  }
}