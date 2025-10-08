import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;

  async onModuleInit() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
    
    this.logger.log('OpenAI Embedding Service initialized');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002', // Use OpenAI's embedding model
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      for (const text of texts) {
        const embedding = await this.generateEmbeddingWithRetry(text);
        embeddings.push(embedding);
        await this.delay(1000); // Add 1-second delay between requests
      }
      return embeddings;
    } catch (error) {
      this.logger.error('Failed to generate embeddings', error);
      throw error;
    }
  }

  async generateEmbeddingWithRetry(
    text: string, 
    maxRetries: number = 3
  ): Promise<number[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateEmbedding(text);
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`Failed after ${maxRetries} attempts`, error);
          throw error;
        }
        this.logger.warn(`Attempt ${attempt} failed, retrying...`);
        await this.delay(1000 * attempt);
      }
    }
    return []; // Fallback, though it should not reach here
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}