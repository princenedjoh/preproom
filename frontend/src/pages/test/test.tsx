import { Fragment, useState } from 'react'
import * as testStyle from './test.style'

const Test = () => {

  const [data, setData] = useState([
    {
      question : "Who developed Python Programming language?",
      answers : [
        "Wick Van Rossum",
        "Rasmus lerdof",
        "Guido van Rossum",
        "Niene Storm"
      ],
      answer : "Guido van Rossum",
      explanation : "Python language is designed by a Dutch programmer Guido van Rossum in the Netherlands.",
      showAnswer : false
    },
    {
      question : "Who developed Python Programming language?",
      answers : [
        "Wick Van Rossum",
        "Rasmus lerdof",
        "Guido van Rossum",
        "Niene Storm"
      ],
      answer : "Guido van Rossum",
      explanation : "",
      showAnswer : false
    },
    {
      question : "Who developed Python Programming language?",
      answers : [
        "Wick Van Rossum",
        "Rasmus lerdof",
        "Guido van Rossum",
        "Niene Storm"
      ],
      answer : "Guido van Rossum",
      explanation : "Python language is designed by a Dutch programmer Guido van Rossum in the Netherlands.",
      showAnswer : false
    }
  ])

  return (
    <>
      <testStyle.Main>
              {
                data.map((dataMap, index : number)=>{
                  let varIndex = index
                  return(
                    <testStyle.QuestionContainer key={index}>
                      <Fragment>
                        <testStyle.QuestionNumber>
                          Question { index + 1}
                        </testStyle.QuestionNumber>
                        <testStyle.Question
                          showAnswer = {dataMap.showAnswer}
                        >
                          <testStyle.Left>
                            <testStyle.MainQuestion>
                              { dataMap.question }
                            </testStyle.MainQuestion>
                            <testStyle.PossibleAnswers>
                              {
                                dataMap.answers.map((answer, index : number)=>{
                                  return(
                                    <testStyle.PossibleAnswer key={index}>
                                      <testStyle.Radio
                                        type='radio'
                                        name={`radioGroup${varIndex}`}
                                      ></testStyle.Radio>
                                      {answer}
                                    </testStyle.PossibleAnswer>
                                  )
                                })
                              }
                            </testStyle.PossibleAnswers>
                          </testStyle.Left>
                          <testStyle.Right>
                            <testStyle.Mark>
                              ?
                            </testStyle.Mark>
                            <testStyle.ClearChoice>
                              Clear Choice
                            </testStyle.ClearChoice>
                          </testStyle.Right>
                        </testStyle.Question>
                      </Fragment>
                    </testStyle.QuestionContainer>
                  )
                })
              }
      </testStyle.Main>
    </>
  )
}

export default Test