import { useState, useEffect } from 'react'
import { Interweave } from 'interweave'
import * as mcqsStyle from './mcqs.style'
import * as kit from '../../styles/kit'
import { Question } from '../../data/sample'
import { FiMessageCircle, FiBookmark, FiFlag, FiChevronDown, FiChevronUp } from "react-icons/fi";

export const alphabets = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]

const difficultyStatus = { Easy : 'done', Medium : 'progress', Hard : 'review' } as const

interface mcqsProps {
  questions : Question[]
  revealAll : boolean
  onAnswer? : (id : string, correct : boolean) => void
}

const QuestionCard = ({ question, number, revealAll, onAnswer } : { question : Question, number : number, revealAll : boolean, onAnswer? : mcqsProps['onAnswer'] }) => {

  const [chosen, setChosen] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(revealAll)
  const [saved, setSaved] = useState(false)

  useEffect(()=>{
    setShowAnswer(revealAll)
  },[revealAll])

  const answered = chosen !== null
  const revealed = answered || showAnswer

  const optionState = (index : number) : mcqsStyle.OptionState => {
    if(!revealed) return 'idle'
    if(index === question.answer) return 'correct'
    if(index === chosen) return 'wrong'
    return 'muted'
  }

  const choose = (index : number) => {
    if(revealed) return
    setChosen(index)
    onAnswer?.(question.id, index === question.answer)
  }

  return (
    <mcqsStyle.Card>
      <mcqsStyle.Meta>
        <mcqsStyle.Number>Q{number}</mcqsStyle.Number>
        <kit.StatusPill status={difficultyStatus[question.difficulty]}>{question.difficulty}</kit.StatusPill>
        <span>{question.topic}</span>
        <span>·</span>
        <span>{question.year}</span>
      </mcqsStyle.Meta>
      <mcqsStyle.Prompt>
        <Interweave content={question.question}/>
      </mcqsStyle.Prompt>
      <mcqsStyle.Options>
        {
          question.options.map((option, index : number)=>(
            <mcqsStyle.Option
              key={index}
              type='button'
              state={optionState(index)}
              onClick={()=>choose(index)}
              aria-pressed={chosen === index}
            >
              <mcqsStyle.OptionKey state={optionState(index)}>
                {alphabets[index].toUpperCase()}
              </mcqsStyle.OptionKey>
              <Interweave content={option}/>
            </mcqsStyle.Option>
          ))
        }
      </mcqsStyle.Options>
      {
        revealed &&
        <mcqsStyle.Explanation>
          <span>
            <b>
              {
                !answered ? 'Answer: ' 
                  : chosen === question.answer ? 'Correct. ' : 'Not quite. '
              }
            </b>
            The answer is {alphabets[question.answer].toUpperCase()}, {question.options[question.answer]}.
          </span>
          {question.explanation && <Interweave content={question.explanation}/>}
        </mcqsStyle.Explanation>
      }
      <mcqsStyle.Footer>
        <div className='flex items-center gap-1 -ml-3'>
          <mcqsStyle.Action type='button'>
            <FiMessageCircle size={14}/> {question.discussions} Discussion
          </mcqsStyle.Action>
          <mcqsStyle.Action type='button' active={saved} onClick={()=>setSaved(!saved)}>
            <FiBookmark size={14} fill={saved ? 'currentColor' : 'none'}/> {question.saves + (saved ? 1 : 0)} Saved
          </mcqsStyle.Action>
          <mcqsStyle.Action type='button' className='hidden sm:inline-flex'>
            <FiFlag size={14}/> Report
          </mcqsStyle.Action>
        </div>
        {
          !answered &&
          <mcqsStyle.Action type='button' onClick={()=>setShowAnswer(!showAnswer)}>
            {showAnswer ? 'Hide answer' : 'Show answer'}
            {showAnswer ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
          </mcqsStyle.Action>
        }
      </mcqsStyle.Footer>
    </mcqsStyle.Card>
  )
}

const Mcqs = ({ questions, revealAll, onAnswer } : mcqsProps) => {
  return (
    <div className='flex flex-col gap-3'>
      {
        questions.map((question, index : number)=>(
          <QuestionCard
            key={question.id}
            question={question}
            number={index + 1}
            revealAll={revealAll}
            onAnswer={onAnswer}
          />
        ))
      }
    </div>
  )
}

export default Mcqs
