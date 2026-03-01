import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { prompts } from '../db/schema';

@Injectable()
export class PromptTemplateService {
  async getTemplate(name: string): Promise<string> {
    const rows = await db
      .select({ template: prompts.template })
      .from(prompts)
      .where(eq(prompts.name, name))
      .limit(1);

    if (rows.length === 0) {
      throw new Error(`Prompt template "${name}" not found`);
    }

    return rows[0].template;
  }

  render(template: string, variables: Record<string, string>): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key) => variables[key] ?? `{{${key}}}`,
    );
  }
}
