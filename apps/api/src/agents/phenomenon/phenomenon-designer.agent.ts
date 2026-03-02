import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, lt, and } from 'drizzle-orm';
import { db } from '../../db';
import {
  students,
  standards,
  masteryState,
  phenomenonProposals,
} from '../../db/schema';
import { LLMClient } from '../../llm/llm-client';
import { PromptTemplateService } from '../../llm/prompt-template.service';
import { EmbeddingsService } from '../../rag/embeddings.service';
import { SafetyAgent } from '../safety/safety.agent';
import {
  validatePhenomenonProposal,
  type PhenomenonProposal,
} from '../../phenomena/schemas/phenomenon-proposal.schema';

const MAX_SAFETY_ATTEMPTS = 3;

@Injectable()
export class PhenomenonDesignerAgent {
  private readonly logger = new Logger(PhenomenonDesignerAgent.name);

  constructor(
    private readonly llm: LLMClient,
    private readonly promptService: PromptTemplateService,
    private readonly embeddings: EmbeddingsService,
    private readonly safetyAgent: SafetyAgent,
  ) {}

  async propose(studentId: string): Promise<
    {
      id: string;
      student_id: string;
      linked_standards: string[];
      title: string;
      facilitation_guide: string;
      evidence_prompt: string;
      materials_needed: string[];
      status: 'pending';
      approved_by: null;
      approved_at: null;
    }[]
  > {
    // 1. Load student
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      throw new NotFoundException(`Student "${studentId}" not found`);
    }

    // 2. Query unmastered standards (mastery_level < 0.8)
    const unmasteredRows = await db
      .select({
        standardId: masteryState.standardId,
        masteryLevel: masteryState.masteryLevel,
        description: standards.description,
        subject: standards.subject,
        grade: standards.grade,
      })
      .from(masteryState)
      .innerJoin(standards, eq(masteryState.standardId, standards.id))
      .where(
        and(
          eq(masteryState.studentId, studentId),
          lt(masteryState.masteryLevel, 0.8),
        ),
      )
      .limit(10);

    const unmasteredText =
      unmasteredRows.length > 0
        ? unmasteredRows
            .map(
              (r) =>
                `${r.standardId} (${r.subject}, Grado ${r.grade}, mastery: ${r.masteryLevel.toFixed(2)}): ${r.description}`,
            )
            .join('\n')
        : 'No mastery data available yet — design phenomena for grade-level exploration.';

    // 3. Use RAG to find related standards for context
    const interests = (student.interests as string[]) ?? [];
    const searchQuery = `${interests.join(', ')} Grado ${student.gradeTarget}`;
    const relatedStandards = await this.embeddings.search(searchQuery, 5);
    const relatedContext =
      relatedStandards.length > 0
        ? relatedStandards
            .map((s) => `${s.id} (${s.subject}): ${s.description}`)
            .join('\n')
        : 'No additional context available.';

    // 4. Build prompt from DB template
    const template = await this.promptService.getTemplate(
      'phenomenon_designer',
    );
    const prompt = this.promptService.render(template, {
      student_name: student.name,
      student_age: String(student.age),
      grade: String(student.gradeTarget),
      interests: interests.length > 0 ? interests.join(', ') : 'general',
      unmastered_standards: unmasteredText,
      related_standards_context: relatedContext,
    });

    // 5. Generate proposals with safety validation
    const proposals = await this.generateWithSafety(prompt);

    // 6. Insert into DB
    const results = [];
    for (const proposal of proposals) {
      const [saved] = await db
        .insert(phenomenonProposals)
        .values({
          studentId,
          linkedStandards: proposal.linked_standards,
          title: proposal.title,
          facilitationGuide: JSON.stringify(proposal.facilitation_guide),
          evidencePrompt: JSON.stringify(proposal.evidence_prompt),
          materialsNeeded: proposal.facilitation_guide.materials_needed,
          status: 'pending',
        })
        .returning({
          id: phenomenonProposals.id,
        });

      results.push({
        id: saved.id,
        student_id: studentId,
        linked_standards: proposal.linked_standards,
        title: proposal.title,
        facilitation_guide: JSON.stringify(proposal.facilitation_guide),
        evidence_prompt: JSON.stringify(proposal.evidence_prompt),
        materials_needed: proposal.facilitation_guide.materials_needed,
        status: 'pending' as const,
        approved_by: null,
        approved_at: null,
      });
    }

    this.logger.log(
      `Generated ${results.length} phenomenon proposals for student ${studentId}`,
    );

    return results;
  }

  private async generateWithSafety(
    prompt: string,
  ): Promise<PhenomenonProposal[]> {
    for (let attempt = 1; attempt <= MAX_SAFETY_ATTEMPTS; attempt++) {
      // Generate raw proposals
      const raw = await this.generateProposals(prompt);

      // Validate schema
      const validated: PhenomenonProposal[] = [];
      let allValid = true;
      for (const proposal of raw) {
        const result = validatePhenomenonProposal(proposal);
        if (!result.valid) {
          this.logger.warn(
            `Validation failed (attempt ${attempt}): ${result.errors.join(', ')}`,
          );
          allValid = false;
          break;
        }
        validated.push(result.data!);
      }

      if (!allValid) {
        if (attempt === MAX_SAFETY_ATTEMPTS) {
          throw new Error(
            'Phenomenon proposal validation failed after 3 attempts',
          );
        }
        continue;
      }

      // Safety check each proposal
      let allSafe = true;
      for (const proposal of validated) {
        const safetyResult = await this.safetyAgent.checkPhenomenon(
          {
            title: proposal.title,
            facilitation_guide: proposal.facilitation_guide,
          },
          attempt,
        );
        if (!safetyResult.passed) {
          this.logger.warn(
            `Safety check failed for "${proposal.title}" (attempt ${attempt}): ${safetyResult.flags.join(', ')}`,
          );
          allSafe = false;
          break;
        }
      }

      if (allSafe) {
        return validated;
      }

      if (attempt === MAX_SAFETY_ATTEMPTS) {
        throw new Error(
          'Phenomenon proposals failed safety check after 3 attempts',
        );
      }
    }

    // Unreachable, but TypeScript wants it
    throw new Error('Phenomenon generation failed');
  }

  private async generateProposals(prompt: string): Promise<unknown[]> {
    const response = await this.llm.generate(
      [
        {
          role: 'system',
          content:
            'You are an expert phenomenon-based learning designer for Mexican primary school children. ' +
            'Design real-world explorations that connect SEP standards to everyday experiences. ' +
            'Return ONLY a valid JSON array of exactly 3 phenomenon proposals. No explanation, no markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 4096 },
    );

    try {
      return this.parseProposals(response);
    } catch {
      this.logger.warn('First parse failed, retrying generation...');
      const retryResponse = await this.llm.generate(
        [
          {
            role: 'system',
            content:
              'You are an expert phenomenon-based learning designer for Mexican primary school children. ' +
              'Return ONLY a valid JSON array of exactly 3 phenomenon proposals. No explanation, no markdown fences.',
          },
          { role: 'user', content: prompt },
          { role: 'assistant', content: response },
          {
            role: 'user',
            content:
              'That was not valid JSON. Please return ONLY a JSON array of 3 phenomenon proposal objects, nothing else.',
          },
        ],
        { temperature: 0.3, maxTokens: 4096 },
      );
      return this.parseProposals(retryResponse);
    }
  }

  private parseProposals(response: string): unknown[] {
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('LLM response is not a JSON array');
    }
    if (parsed.length !== 3) {
      throw new Error(`Expected 3 proposals, got ${parsed.length}`);
    }
    return parsed;
  }
}
