import { useState, useEffect, KeyboardEvent } from 'react'
import { Interweave } from 'interweave'
import * as mcqsStyle from './mcqs.style'
import * as kit from '../../styles/kit'
import { Question } from '../../data/sample'
import { progress, useProgress } from '../../store/progress'
import { notify } from '../../utils/notify'
import { FiBookmark, FiFlag, FiChevronDown, FiChevronUp, FiRotateCcw } from "react-icons/fi";

export const alphabets = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]

const difficultyStatus = { Easy : 'done', Medium : 'progress', Hard : 'review' } as const

// 1–4 or A–D pick an option
export const optionFromKey = (key : string, count : number) => {
  const digit = Number(key)
  if(Number.isInteger(digit) && digit >= 1 && digit <= count) return digit - 1
  const letter = alphabets.indexOf(key.toLowerCase())
  if(key.length === 1 && letter >= 0 && letter < count) return letter
  return null
}

interface CardProps {
  question : Question
  number : number
  revealAll : boolean
}

const QuestionCard = ({ question, number, revealAll } : CardProps) => {

  const state = useProgress()
  const attempt = state.attempts[question.id]
  const saved = !!state.saved[question.id]

  const [showAnswer, setShowAnswer] = useState(revealAll)
  const [reported, setReported] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(()=>{
    setShowAnswer(revealAll)
  },[revealAll])

  const chosen = attempt?.choice ?? null
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
    progress.answer(question.id, {
      choice : index,
      correct : index === question.answer,
      courseID : question.courseID,
      topic : question.topic,
    })
  }

  const retry = () => {
    progress.clearAttempt(question.id)
    setShowAnswer(false)
  }

  const toggleSave = () => {
    progress.toggleSave(question.id)
    notify(saved ? 'Removed from saved' : 'Saved for later')
  }

  const report = () => {
    if(reported) return
    setReported(true)
    notify("Thanks. We'll review this question.")
  }

  const onKeyDown = (event : KeyboardEvent<HTMLElement>) => {
    if(event.target !== event.currentTarget || event.metaKey || event.ctrlKey || event.altKey) return
    const index = optionFromKey(event.key, question.options.length)
    if(index !== null){
      event.preventDefault()
      choose(index)
    }
    else if(event.key.toLowerCase() === 's'){
      event.preventDefault()
      toggleSave()
    }
    else if(event.key.toLowerCase() === 'r' && answered){
      event.preventDefault()
      retry()
    }
  }

  return (
    <mcqsStyle.Card
      tabIndex={0}
      data-question={question.id}
      data-focused={focused}
      onFocus={(event)=>event.target === event.currentTarget && setFocused(true)}
      onBlur={()=>setFocused(false)}
      onKeyDown={onKeyDown}
      aria-label={`Question ${number}`}
    >
      <mcqsStyle.Meta>
        <mcqsStyle.Number>Q{number}</mcqsStyle.Number>
        <kit.StatusPill status={difficultyStatus[question.difficulty]}>{question.difficulty}</kit.StatusPill>
        <span>{question.topic}</span>
        <span>·</span>
        <span>{question.year}</span>
        {
          answered &&
          <span className={`ml-auto font-semibold ${attempt.correct ? 'text-brand-emerald' : 'text-[#f0457a]'}`}>
            {attempt.correct ? 'Correct' : 'Missed'}
          </span>
        }
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
              tabIndex={revealed ? -1 : 0}
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
        <mcqsStyle.Explanation aria-live='polite'>
          <span>
            <b>
              {
                !answered ? 'Answer: '
                  : chosen === question.answer ? 'Correct. ' : 'Not quite. '
              }
            </b>
            The answer is {alphabets[question.answer].toUpperCase()}, <Interweave content={question.options[question.answer]}/>.
          </span>
          {question.explanation && <Interweave content={question.explanation}/>}
        </mcqsStyle.Explanation>
      }
      <mcqsStyle.Footer>
        <div className='flex items-center gap-1 -ml-3'>
          <mcqsStyle.Action type='button' active={saved} onClick={toggleSave} aria-pressed={saved}>
            <FiBookmark size={14} fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Saved' : 'Save'}
          </mcqsStyle.Action>
          <mcqsStyle.Action type='button' active={reported} disabled={reported} onClick={report}>
            <FiFlag size={14} fill={reported ? 'currentColor' : 'none'}/> {reported ? 'Reported' : 'Report'}
          </mcqsStyle.Action>
          {
            focused &&
            <span className='hidden lg:inline-flex items-center gap-1 ml-2 text-[12px] text-ash'>
              <kit.Kbd>1</kit.Kbd>–<kit.Kbd>{question.options.length}</kit.Kbd> answer · <kit.Kbd>S</kit.Kbd> save
              {answered && <> · <kit.Kbd>R</kit.Kbd> retry</>}
            </span>
          }
        </div>
        {
          answered ?
          <mcqsStyle.Action type='button' onClick={retry}>
            <FiRotateCcw size={13}/> Try again
          </mcqsStyle.Action>
          :
          <mcqsStyle.Action type='button' onClick={()=>setShowAnswer(!showAnswer)} aria-expanded={showAnswer}>
            {showAnswer ? 'Hide answer' : 'Show answer'}
            {showAnswer ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
          </mcqsStyle.Action>
        }
      </mcqsStyle.Footer>
    </mcqsStyle.Card>
  )
}

interface mcqsProps {
  questions : Question[]
  revealAll : boolean
}

const Mcqs = ({ questions, revealAll } : mcqsProps) => {

  // J / K move between questions, like a feed
  const onKeyDown = (event : KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase()
    if((key !== 'j' && key !== 'k') || event.metaKey || event.ctrlKey) return
    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-question]'))
    const current = cards.findIndex((card) => card.contains(document.activeElement))
    const next = cards[Math.max(0, Math.min(cards.length - 1, current + (key === 'j' ? 1 : -1)))]
    if(!next) return
    event.preventDefault()
    next.focus({ preventScroll : true })
    next.scrollIntoView({ block : 'nearest', behavior : window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className='flex flex-col gap-3' onKeyDown={onKeyDown}>
      {
        questions.map((question, index : number)=>(
          <QuestionCard
            key={question.id}
            question={question}
            number={index + 1}
            revealAll={revealAll}
          />
        ))
      }
    </div>
  )
}

export default Mcqs
