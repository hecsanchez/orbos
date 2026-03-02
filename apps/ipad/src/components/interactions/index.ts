import { StoryCard } from './StoryCard';
import { MultipleChoice } from './MultipleChoice';
import { DragDrop } from './DragDrop';

export const INTERACTION_COMPONENTS = {
  story_card: StoryCard,
  multiple_choice: MultipleChoice,
  drag_drop: DragDrop,
} as const;

export type ComponentName = keyof typeof INTERACTION_COMPONENTS;

export { StoryCard } from './StoryCard';
export { MultipleChoice } from './MultipleChoice';
export { DragDrop } from './DragDrop';
