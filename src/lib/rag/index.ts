import { OpenAI } from "openai";
import { ProfileInput } from "../types";
import { generateId } from "../utils";

interface Document {
  id: string;
  name: string;
  content: string;
  embedding: number[];
  timestamp: string;
}

interface RAGConfig {
  embeddingEndpoint?: string;
  embeddingModel?: string;
  apiKey?: string;
  topK?: number;
}

type CosineSimilarityFn = (a: number[], b: number[]) => number;

export class RAGService {
  private documents: Document[] = [];
  private openai: OpenAI | null = null;
  private config: Required<RAGConfig>;
  private cosineSimilarity: CosineSimilarityFn;

  constructor(config: RAGConfig = {}) {
    this.config = {
      embeddingEndpoint:
        config.embeddingEndpoint || "https://api.openai.com/v1",
      embeddingModel: config.embeddingModel || "text-embedding-3-small",
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || "",
      topK: config.topK || 5,
    };

    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.embeddingEndpoint,
      });
    }

    this.cosineSimilarity = this.buildCosineSimilarity();
  }

  private buildCosineSimilarity(): CosineSimilarityFn {
    return (a: number[], b: number[]): number => {
      if (a.length !== b.length) return 0;
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom === 0 ? 0 : dotProduct / denom;
    };
  }

  private generateDeterministicEmbedding(text: string): number[] {
    const DIM = 128;
    const embedding: number[] = new Array(DIM).fill(0);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const seen = new Set<string>();

    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      if (seen.has(word)) continue;
      seen.add(word);

      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash = hash & hash;
      }

      const dim = Math.abs(hash) % DIM;
      embedding[dim] += 1.0 / words.length;
    }

    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < DIM; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  async embedText(text: string): Promise<number[]> {
    if (this.openai) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.embeddingModel,
          input: text,
        });
        return response.data[0].embedding;
      } catch {
        return this.generateDeterministicEmbedding(text);
      }
    }

    return this.generateDeterministicEmbedding(text);
  }

  async storeDocument(name: string, content: string): Promise<string> {
    const id = generateId();
    const embedding = await this.embedText(content);

    const doc: Document = {
      id,
      name,
      content,
      embedding,
      timestamp: new Date().toISOString(),
    };

    this.documents.push(doc);
    return id;
  }

  async retrieve(
    query: string,
    topK: number = this.config.topK,
  ): Promise<string[]> {
    if (this.documents.length === 0) return [];

    const queryEmbedding = await this.embedText(query);

    const scored = this.documents.map((doc) => ({
      content: doc.content,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map((s) => s.content);
  }

  async buildContext(input: ProfileInput): Promise<string> {
    const parts: string[] = [];

    if (input.linkedinUrl) {
      parts.push(`LinkedIn: ${input.linkedinUrl}`);
    }
    if (input.githubUrl) {
      parts.push(`GitHub: ${input.githubUrl}`);
    }
    if (input.twitterUrl) {
      parts.push(`X/Twitter: ${input.twitterUrl}`);
    }
    if (input.websiteUrl) {
      parts.push(`Website: ${input.websiteUrl}`);
    }
    if (input.resumeText) {
      parts.push(`Resume:\n${input.resumeText}`);
    }
    if (input.rawProfileText) {
      parts.push(`Profile Data:\n${input.rawProfileText}`);
    }

    const retrievedContexts = await this.retrieve(
      parts.join("\n"),
      this.config.topK,
    );

    if (retrievedContexts.length > 0) {
      parts.push("---\nRetrieved Context:");
      parts.push(...retrievedContexts);
    }

    return parts.join("\n\n");
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.find((d) => d.id === id);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    return true;
  }

  async clear(): Promise<void> {
    this.documents = [];
  }

  getDocumentCount(): number {
    return this.documents.length;
  }
}
