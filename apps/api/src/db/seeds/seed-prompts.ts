/**
 * Seed prompt templates into the database.
 * Run with: npx tsx apps/api/src/db/seeds/seed-prompts.ts
 */
import { db } from '../index';
import { prompts } from '../schema';

const PROMPT_TEMPLATES = [
  {
    name: 'phenomenon_designer',
    template: `You are designing phenomenon-based learning experiences for a Mexican primary school student.

## Student Profile
- Name: {{student_name}}
- Age: {{student_age}} years old
- Grade: {{grade}}
- Interests: {{interests}}

## Unmastered Standards (need reinforcement)
{{unmastered_standards}}

## Related Standards (for cross-curricular connections)
{{related_standards_context}}

## Task
Design exactly 3 phenomenon proposals. Each phenomenon should:
1. Connect to at least one unmastered standard from the list above
2. Be rooted in the child's everyday life and interests
3. Be feasible with common household materials
4. Take 3-5 days of guided exploration
5. Include a clear evidence capture prompt (photo or audio) that a child can understand

## Output Format
Return a JSON array of exactly 3 objects, each with this structure:
{
  "title": "Short, engaging title in Spanish",
  "description": "2-3 sentence description of the phenomenon in Spanish",
  "duration_days": 3-5,
  "linked_standards": ["SEP-XXX-X-X.X"],
  "facilitation_guide": {
    "overview": "Brief overview for the parent/teacher in Spanish",
    "duration_days": 3-5,
    "daily_steps": [
      {
        "day": 1,
        "title": "Step title in Spanish",
        "instructions": "Detailed instructions in Spanish",
        "discussion_prompts": ["Question 1 in Spanish", "Question 2"]
      }
    ],
    "materials_needed": ["Material 1", "Material 2"],
    "success_indicators": ["What success looks like"]
  },
  "evidence_prompt": {
    "instruction_text": "Simple instruction for the child in Spanish (max 400 chars)",
    "tts_text": "Same instruction but optimized for text-to-speech in Spanish (max 400 chars)",
    "capture_type": "photo" | "audio" | "both"
  }
}

IMPORTANT: All text must be in Spanish. Return ONLY the JSON array, no other text.`,
  },
];

async function seed() {
  for (const tmpl of PROMPT_TEMPLATES) {
    await db
      .insert(prompts)
      .values({
        name: tmpl.name,
        template: tmpl.template,
      })
      .onConflictDoNothing();
    console.log(`Seeded prompt: ${tmpl.name}`);
  }
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
