import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromadbService } from './chromadb.service';
import { EmbeddingService } from './embedding.service';
import path from 'path';
import { stringify } from 'querystring';
import { UniversityDto } from 'src/knowledge/dto/UniversityDto';
import { GeminiService } from './gemini.service';

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
    private readonly geminiService: GeminiService
  ) {}
 async onModuleInit() {
    const shouldRebuild = (process.env.REBUILD_CHROMA || '').toLowerCase() === 'true';
    if (shouldRebuild) {
      this.logger.log('REBUILD_CHROMA is set to true. Deleting existing collection and rebuilding...');
      await this.chromadb.deleteCollection('university_knowledge');
      await this.setUniversitiesData(path.resolve(process.cwd(), 'data'));
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

async search(
  query: string,
  limit: number = 5,
  collectionName: string = 'university_knowledge',
  filters?: object,
  documentFilters?: object 
) {
  const queryEmbedding = await this.embedding.generateEmbedding(query);
  return await this.chromadb.queryCollection(
    queryEmbedding,
    limit,
    collectionName,
    // No need to spread here, just pass the objects
    { where: filters, whereDocument: documentFilters }
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

 extractJsonFromMarkdown(response: string): string | null {
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }
  return null;
}

private transformFiltersForChroma(filters: Record<string, any>): Record<string, any> {
  if (!filters || typeof filters !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    // If value is already an operator object, keep as is
    if (typeof value === 'object' && value !== null && Object.keys(value)[0]?.startsWith('$')) {
      out[key] = value;
    } else {
      out[key] = { "$eq": value };
    }
  }
  return out;
}

  async askAQuestion(
  question: string,
  limit: number = 5,
  collectionName: string = 'university_knowledge'
) {
const templatedQuestion = `
  You are a university query parser. Extract the \`semantic_query\`, \`metadata_filters\`, and \`document_filters\` from the user's question, strictly following the provided JSON schema. For metadata, use nested keys like \`basic_info.acceptance_rate\` and use comparatives like \`$lt\` or \`$gt\`. The value for \`admissions.undergraduate\` should be a boolean. For \`document_filters\`, use the \`$contains\` operator to identify keywords or phrases within the document content.
<DTO_SCHEMA>
{"summary":"string","university_name":"string","location":{"city":"string","state_province":"string","country":"string"},"basic_info":{"established_year":"string","student_population":"string","acceptance_rate":"string","ranking_global":"string","website":"string","type":"string"},"admissions":{"undergraduate":{"gpa_requirement":"string","sat_range":"string","act_range":"string","ielts_requirement":"string","toefl_requirement":"string","essays_required":"string","letters_of_recommendation":"string","application_fee":"string","supplemental_materials":"string"}},"popular_programs":"string[]"}
</DTO_SCHEMA>

User query: "Show me universities in Boston with a strong Computer Science program and a low acceptance rate."

JSON Output:

  `;
  const llmResponse = await this.geminiService.generateResponse(templatedQuestion);
  const jsonString = this.extractJsonFromMarkdown(llmResponse);
  
  if (!jsonString) {
    console.error("LLM did not return a valid JSON object. Falling back.");
    return await this.search(question, limit, collectionName);
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse LLM's JSON response:", e);
    return await this.search(question, limit, collectionName);
  }
  
  const semanticQuery = parsedResponse.semantic_query;
  const metadataFilters = parsedResponse.metadata_filters;
  const documentFilters = parsedResponse.document_filters;

  const chromaMetadataFilters = this.transformFiltersForChroma(metadataFilters);
  const chromaDocumentFilters = this.transformFiltersForChroma(documentFilters);

  return await this.search(semanticQuery, limit, collectionName, chromaMetadataFilters, chromaDocumentFilters);
}

}