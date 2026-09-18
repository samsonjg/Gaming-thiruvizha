import type { QuestionComponentProps } from './types'
import { SingleChoiceQuestion } from './SingleChoiceQuestion'
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion'
import { RatingQuestion } from './RatingQuestion'
import { EmojiQuestion } from './EmojiQuestion'
import { YesNoQuestion } from './YesNoQuestion'
import { TextQuestion } from './TextQuestion'
import { ImageChoiceQuestion } from './ImageChoiceQuestion'
import { RankingQuestion } from './RankingQuestion'
import type { AnswerValue, QuestionType } from '../../types/schema'

// Central dispatch: adding a new question type means adding one case here
// (plus one entry in QUESTION_TYPE_META and one component).
export function QuestionRenderer(props: QuestionComponentProps) {
  switch (props.question.type) {
    case 'single_choice':
      return <SingleChoiceQuestion {...props} />
    case 'multiple_choice':
      return <MultipleChoiceQuestion {...props} />
    case 'rating':
      return <RatingQuestion {...props} />
    case 'emoji':
      return <EmojiQuestion {...props} />
    case 'yes_no':
      return <YesNoQuestion {...props} />
    case 'text':
      return <TextQuestion {...props} />
    case 'image_choice':
      return <ImageChoiceQuestion {...props} />
    case 'ranking':
      return <RankingQuestion {...props} />
    default:
      return null
  }
}

export function isAnswerValid(type: QuestionType, value: AnswerValue | null): boolean {
  if (!value) return false
  switch (type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'emoji':
    case 'image_choice':
    case 'yes_no':
      return value.kind === 'options' && value.optionIds.length > 0
    case 'rating':
      return value.kind === 'rating' && value.rating > 0
    case 'text':
      return value.kind === 'text' && value.text.trim().length > 0
    case 'ranking':
      return value.kind === 'ranking' && value.order.length > 0
    default:
      return false
  }
}
