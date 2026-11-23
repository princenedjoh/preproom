import { toneOf, toneVar, toneBgVar } from '../../styles/tone'

// A course's "page icon": two letters of its code on its tag colour, like a Notion page emoji
const CourseIcon = ({ course, size = 20 } : { course : { id : string, code : string, color? : string }, size? : number }) => {
    const tone = toneOf(course.id, course.color)
    return (
        <span
            aria-hidden='true'
            className='inline-flex items-center justify-center font-bold shrink-0 tracking-[-0.02em]'
            style={{
                width : size, height : size, borderRadius : Math.round(size * 0.24),
                fontSize : Math.max(9, Math.round(size * 0.42)),
                color : toneVar(tone), background : toneBgVar(tone),
            }}
        >
            {course.code.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
        </span>
    )
}

export default CourseIcon
