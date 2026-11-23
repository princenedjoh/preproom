import { useState, useEffect, KeyboardEvent } from 'react'
import { Interweave } from 'interweave'
import * as mcqsStyle from './mcqs.style'
import * as kit from '../../styles/kit'
import { Question } from '../../data/sample'
import { progress, useProgress, relativeDay } from '../../store/progress'
import { api } from '../../api/client'
import { useRemote } from '../../api/useRemote'
import { notify } from '../../utils/notify'
import { FiBookmark, FiFlag, FiChevronDown, FiChevronUp, FiRotateCcw, FiMessageCircle, FiCheck, FiX } from "react-icons/fi";
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../store/session'
import { catalogSource } from '../../data/catalog'
import ReportDialog from '../../components/questionExtras/reportDialog'
import Thread from '../../components/questionExtras/thread'

export const alphabets = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]

// Difficulty as coloured text, not a pill: it is metadata, not a status
export const difficultyClass = { Easy : 'text-easy', Medium : 'text-medium', Hard : 'text-hard' } as const
export const difficultyShort = { Easy : 'Easy', Medium : 'Med.', Hard : 'Hard' } as const

interface Stats { attempts : number, correctRate : number, options : number[] }

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
  const [reporting, setReporting] = useState(false)
  const [discussing, setDiscussing] = useState(false)
  const [discussions, setDiscussions] = useState(question.discussions)
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()
  const signedIn = useSession().status === 'user'
  const online = catalogSource() === 'api'

  useEffect(()=>{
    setShowAnswer(revealAll)
  },[revealAll])

  const chosen = attempt?.choice ?? null
  const answered = chosen !== null
  const revealed = answered || showAnswer

  // How everyone else answered (UWorld-style); hidden until the API provides it
  // The API only reveals them once you've answered (pick shares would give the answer away)
  const embedded = question.stats
  const fetched = useRemote<Stats>(answered && signedIn && online && !embedded ? `qstats:${question.id}:${attempt?.at}` : null,
    () => api.get(`/questions/${question.id}/stats`).then((r) => r.data)).data
  const stats = answered ? (fetched ?? embedded) : undefined
  const shareOf = (index : number) => stats && stats.attempts >= 5 && stats.options?.[index] !== undefined ? Math.round(stats.options[index] * 100) : null

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
    if(!signedIn){
      notify('Log in to report a question')
      navigate('/auth/login', { state : { from : window.location.pathname + window.location.search } })
      return
    }
    setReporting(true)
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
        <span className='text-ink-4'>·</span>
        <span className='text-ink-2'>{question.topic}</span>
        <span className='text-ink-4'>·</span>
        <span className='tabular-nums'>{question.year}</span>
        {question.institution && <><span className='text-ink-4'>·</span><span>{question.institution}</span></>}
        <span className={`ml-auto font-medium ${difficultyClass[question.difficulty]}`}>{question.difficulty}</span>
      </mcqsStyle.Meta>
      <mcqsStyle.Prompt>
        <Interweave content={question.question}/>
      </mcqsStyle.Prompt>
      <mcqsStyle.Options role='group' aria-label='Options'>
        {
          question.options.map((option, index : number)=>{
            const state = optionState(index)
            const share = revealed ? shareOf(index) : null
            return (
              <mcqsStyle.Option
                key={index}
                type='button'
                tabIndex={revealed ? -1 : 0}
                state={state}
                onClick={()=>choose(index)}
                aria-pressed={chosen === index}
                aria-label={`${alphabets[index].toUpperCase()}: ${option.replace(/<[^>]+>/g, '')}${state === 'correct' ? ' (correct answer)' : state === 'wrong' ? ' (your answer, wrong)' : ''}`}
              >
                <mcqsStyle.OptionKey state={state}>
                  {alphabets[index].toUpperCase()}
                </mcqsStyle.OptionKey>
                <span className='flex-1 min-w-0'><Interweave content={option}/></span>
                {share !== null && <span className='text-[12px] text-ink-3 tabular-nums shrink-0'>{share}%</span>}
                {state === 'correct' && <FiCheck className='mark text-tag-green' size={16} strokeWidth={2.5}/>}
                {state === 'wrong' && <FiX className='mark text-tag-red' size={16} strokeWidth={2.5}/>}
              </mcqsStyle.Option>
            )
          })
        }
      </mcqsStyle.Options>
      {
        revealed &&
        <div className='flex flex-col gap-3' aria-live='polite'>
          <mcqsStyle.Verdict correct={answered ? attempt.correct : null}>
            <b>{!answered ? 'Answer shown' : attempt.correct ? 'Correct' : 'Incorrect'}</b>
            <span>Answer <strong>{alphabets[question.answer].toUpperCase()}</strong>{answered && !attempt.correct ? <> · you picked <strong>{alphabets[chosen].toUpperCase()}</strong></> : null}</span>
            {stats && stats.attempts >= 5 && <span><strong className='tabular-nums'>{Math.round(stats.correctRate * 100)}%</strong> of students got this right</span>}
            {answered && attempt.at && <span className='ml-auto'>{relativeDay(attempt.at)}</span>}
          </mcqsStyle.Verdict>
          {
            question.explanation &&
            <mcqsStyle.Explanation>
              <span className='label'>Explanation</span>
              <Interweave content={question.explanation}/>
            </mcqsStyle.Explanation>
          }
        </div>
      }
      <mcqsStyle.Footer>
        <div className='flex items-center gap-[2px] -ml-2'>
          {
            online &&
            <mcqsStyle.Action type='button' active={discussing} onClick={()=>setDiscussing(!discussing)} aria-expanded={discussing}>
              <FiMessageCircle size={14}/> {discussions > 0 ? <span className='tabular-nums'>{discussions}</span> : null} <span className='hidden sm:inline'>{discussions === 1 ? 'Comment' : 'Discuss'}</span>
            </mcqsStyle.Action>
          }
          <mcqsStyle.Action type='button' active={saved} onClick={toggleSave} aria-pressed={saved}>
            <FiBookmark size={14} fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Saved' : 'Save'}
          </mcqsStyle.Action>
          <mcqsStyle.Action type='button' active={reported} disabled={reported || !online} onClick={report} className='hidden sm:inline-flex'>
            <FiFlag size={14} fill={reported ? 'currentColor' : 'none'}/> {reported ? 'Reported' : 'Report'}
          </mcqsStyle.Action>
          {
            focused &&
            <span className='hidden lg:inline-flex items-center gap-1 ml-3 text-[12px] text-ink-3'>
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
      {discussing && <Thread questionID={question.id} onCount={setDiscussions}/>}
      {reporting && <ReportDialog question={question} open={reporting} onClose={()=>setReporting(false)} onReported={()=>setReported(true)}/>}
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
