import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentSchema {
  component: string;
  version: number;
  props: Record<
    string,
    {
      type: string;
      maxLength?: number;
      minItems?: number;
      maxItems?: number;
    }
  >;
  required: string[];
}

interface Interaction {
  component: string;
  props: Record<string, unknown>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const APPROVED_COMPONENTS = [
  'story_card',
  'tap_reveal',
  'drag_drop',
  'multiple_choice',
  'ordering',
  'build_object',
  'slider',
  'match_connect',
  'audio_explain',
  'confidence_check',
] as const;

@Injectable()
export class InteractionValidatorService {
  private schemas: Map<string, ComponentSchema>;

  constructor() {
    this.schemas = this.loadSchemas();
  }

  private loadSchemas(): Map<string, ComponentSchema> {
    const schemasDir = path.join(__dirname, 'schemas');
    const map = new Map<string, ComponentSchema>();

    for (const name of APPROVED_COMPONENTS) {
      const filePath = path.join(schemasDir, `${name}.schema.json`);
      const content = fs.readFileSync(filePath, 'utf-8');
      map.set(name, JSON.parse(content));
    }

    return map;
  }

  validate(interaction: Interaction): ValidationResult {
    const errors: string[] = [];
    const { component, props } = interaction;

    if (!APPROVED_COMPONENTS.includes(component as (typeof APPROVED_COMPONENTS)[number])) {
      errors.push(`Unknown component: "${component}"`);
      return { valid: false, errors };
    }

    const schema = this.schemas.get(component)!;

    for (const requiredProp of schema.required) {
      if (props[requiredProp] === undefined || props[requiredProp] === null) {
        errors.push(
          `Missing required prop "${requiredProp}" for component "${component}"`,
        );
      }
    }

    for (const [propName, propValue] of Object.entries(props)) {
      const propSchema = schema.props[propName];
      if (!propSchema) continue;

      if (propSchema.type === 'string' && typeof propValue === 'string') {
        if (
          propSchema.maxLength &&
          propValue.length > propSchema.maxLength
        ) {
          errors.push(
            `Prop "${propName}" exceeds maxLength ${propSchema.maxLength} (got ${propValue.length})`,
          );
        }
      }

      if (propSchema.type === 'array' && Array.isArray(propValue)) {
        if (
          propSchema.minItems &&
          propValue.length < propSchema.minItems
        ) {
          errors.push(
            `Prop "${propName}" has fewer than minItems ${propSchema.minItems} (got ${propValue.length})`,
          );
        }
        if (
          propSchema.maxItems &&
          propValue.length > propSchema.maxItems
        ) {
          errors.push(
            `Prop "${propName}" exceeds maxItems ${propSchema.maxItems} (got ${propValue.length})`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateScript(script: unknown[]): ValidationResult {
    const allErrors: string[] = [];

    if (!Array.isArray(script)) {
      return { valid: false, errors: ['Script must be an array'] };
    }

    for (let i = 0; i < script.length; i++) {
      const interaction = script[i] as Interaction;
      if (!interaction.component || !interaction.props) {
        allErrors.push(
          `Interaction at index ${i} missing component or props`,
        );
        continue;
      }
      const result = this.validate(interaction);
      if (!result.valid) {
        allErrors.push(
          ...result.errors.map((e) => `[${i}] ${e}`),
        );
      }
    }

    return { valid: allErrors.length === 0, errors: allErrors };
  }
}
