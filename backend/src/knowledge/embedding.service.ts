import { Injectable, Logger } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: any;

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Text cannot be null, undefined, or empty');
    }
    try {
      // Lazy initialization: load the pipeline on first use
      if (!this.extractor) {
        this.logger.log('Initializing Hugging Face pipeline...');
        this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        this.logger.log('Hugging Face Embedding Service initialized successfully');
      }
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
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
        await this.delay(100); // Small delay to avoid overloading
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
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}