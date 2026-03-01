import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { sql, isNull } from 'drizzle-orm';
import { db } from '../db';
import { standards } from '../db/schema';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private openai: OpenAI | null = null;

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI();
    }
    return this.openai;
  }

  async embed(text: string): Promise<number[]> {
    const client = this.getOpenAI();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async indexStandards(): Promise<{ indexed: number; skipped: number }> {
    const nullEmbeddings = await db
      .select({
        id: standards.id,
        subject: standards.subject,
        topic: standards.topic,
        description: standards.description,
        grade: standards.grade,
      })
      .from(standards)
      .where(isNull(standards.embedding));

    if (nullEmbeddings.length === 0) {
      this.logger.log('All standards already have embeddings');
      return { indexed: 0, skipped: 0 };
    }

    let indexed = 0;
    const batchSize = 100;

    for (let i = 0; i < nullEmbeddings.length; i += batchSize) {
      const batch = nullEmbeddings.slice(i, i + batchSize);
      const texts = batch.map(
        (s) =>
          `${s.subject} Grado ${s.grade}${s.topic ? ` - ${s.topic}` : ''}: ${s.description}`,
      );

      const client = this.getOpenAI();
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      for (let j = 0; j < batch.length; j++) {
        const vector = response.data[j].embedding;
        await db
          .update(standards)
          .set({ embedding: vector })
          .where(sql`${standards.id} = ${batch[j].id}`);
      }

      indexed += batch.length;
      this.logger.log(
        `Indexed ${indexed}/${nullEmbeddings.length} standards`,
      );
    }

    return { indexed, skipped: 0 };
  }

  async search(
    query: string,
    topK = 5,
  ): Promise<
    {
      id: string;
      grade: number;
      subject: string;
      topic: string | null;
      description: string;
      similarity: number;
    }[]
  > {
    const queryVector = await this.embed(query);
    const vectorStr = `[${queryVector.join(',')}]`;

    const results = await db.execute(sql`
      SELECT
        id,
        grade,
        subject,
        topic,
        description,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM standards
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `);

    return results.rows as {
      id: string;
      grade: number;
      subject: string;
      topic: string | null;
      description: string;
      similarity: number;
    }[];
  }
}
