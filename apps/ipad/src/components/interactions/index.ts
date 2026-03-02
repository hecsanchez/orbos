import { StoryCard } from './StoryCard';
import { MultipleChoice } from './MultipleChoice';
import { DragDrop } from './DragDrop';
import { TapReveal } from './TapReveal';
import { Ordering } from './Ordering';
import { ConfidenceCheck } from './ConfidenceCheck';
import { MatchConnect } from './MatchConnect';

export const INTERACTION_COMPONENTS = {
  story_card: StoryCard,
  multiple_choice: MultipleChoice,
  drag_drop: DragDrop,
  tap_reveal: TapReveal,
  ordering: Ordering,
  confidence_check: ConfidenceCheck,
  match_connect: MatchConnect,
} as const;

export type ComponentName = keyof typeof INTERACTION_COMPONENTS;

export { StoryCard } from './StoryCard';
export { MultipleChoice } from './MultipleChoice';
export { DragDrop } from './DragDrop';
export { TapReveal } from './TapReveal';
export { Ordering } from './Ordering';
export { ConfidenceCheck } from './ConfidenceCheck';
export { MatchConnect } from './MatchConnect';
