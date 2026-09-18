import type { QuestionTypeMeta, QuestionType } from '../types/schema'

// Single source of truth driving the admin type dropdown + validation +
// which QuestionRenderer branch to use. Adding a new question type means
// adding one entry here + one component + one switch case.
export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  single_choice: {
    type: 'single_choice',
    label: 'Single Choice',
    description: 'Select one answer from a list of options.',
    icon: '🔘',
    hasOptions: true,
    supportsMultiple: false,
  },
  multiple_choice: {
    type: 'multiple_choice',
    label: 'Multiple Choice',
    description: 'Select multiple answers from a list of options.',
    icon: '☑️',
    hasOptions: true,
    supportsMultiple: true,
  },
  rating: {
    type: 'rating',
    label: 'Rating',
    description: '1–5 or 1–10 scale rating.',
    icon: '⭐',
    hasOptions: false,
    supportsMultiple: false,
  },
  emoji: {
    type: 'emoji',
    label: 'Emoji Reaction',
    description: 'React with a single emoji.',
    icon: '😍',
    hasOptions: true,
    supportsMultiple: false,
  },
  yes_no: {
    type: 'yes_no',
    label: 'Yes / No',
    description: 'A simple binary question.',
    icon: '✅',
    hasOptions: false,
    supportsMultiple: false,
  },
  text: {
    type: 'text',
    label: 'Text Response',
    description: 'Short free-text feedback.',
    icon: '✍️',
    hasOptions: false,
    supportsMultiple: false,
  },
  image_choice: {
    type: 'image_choice',
    label: 'Image Choice',
    description: 'Select from image cards.',
    icon: '🖼️',
    hasOptions: true,
    supportsMultiple: false,
  },
  ranking: {
    type: 'ranking',
    label: 'Ranking',
    description: 'Drag to reorder options by preference.',
    icon: '↕️',
    hasOptions: true,
    supportsMultiple: false,
  },
}

export const QUESTION_TYPE_LIST: QuestionTypeMeta[] = Object.values(QUESTION_TYPE_META)
