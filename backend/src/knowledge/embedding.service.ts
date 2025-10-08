import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  async onModuleInit() {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'embedding-001' // or 'text-embedding-004' for newer model
    });
    
    this.logger.log('Google Gemini Embedding Service initialized');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
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
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateEmbedding(text);
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`Failed after ${maxRetries} attempts`, error);
          throw error;
        }
        this.logger.warn(`Attempt ${attempt} failed, retrying...`);
        await this.delay(1000 * attempt); //
    }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}