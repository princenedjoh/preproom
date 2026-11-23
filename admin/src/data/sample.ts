import axios from 'axios'

export const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3001'

// Session cookie auth (httpOnly), shared with the student app
export const api = axios.create({ baseURL : BASE_URL, withCredentials : true, timeout : 6000 })

// Sample content used when the API is unreachable or returns nothing,
// so every admin screen renders a realistic state during development.

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface School { id : string, name : string }
export interface Program { id : string, name : string, schoolID : string }
export interface Course { id : string, code : string, name : string, programID : string, color : string, total : number }
export interface Topic { id : string, name : string, courseID : string }

export interface Question {
    id : string
    question : string
    options : string[]
    answer : number
    explanation : string
    courseID : string
    topic : string
    difficulty : Difficulty
    year : number
    author : string
    addedAt : string
    flags : number
}

export type FlagStatus = 'open' | 'resolved' | 'dismissed'
export type FlagIssue = 'Wrong answer' | 'Typo' | 'Unclear question' | 'Duplicate' | 'Missing explanation'

export interface Flag {
    id : string
    questionID : string
    reporter : string
    issue : FlagIssue
    comment : string
    suggestedAnswer? : number
    status : FlagStatus
    raisedAt : string
}

export type Role = 'Supervisor' | 'Moderator'

export interface Person {
    id : string
    name : string
    email : string
    role : Role
    courses : string[]
    questionsAdded : number
    flagsResolved : number
    status : 'Active' | 'Invited'
    lastActive : string
    color : string
}

export interface AdminNotification {
    id : string
    kind : 'flag' | 'question' | 'people' | 'system'
    title : string
    body : string
    time : string
    read : boolean
}

export const schools : School[] = [
    { id : 'sci', name : 'School of Sciences' },
    { id : 'eng', name : 'School of Engineering' },
    { id : 'bus', name : 'Business School' },
    { id : 'art', name : 'School of Arts' },
]

export const programs : Program[] = [
    { id : 'cs', name : 'Computer Science', schoolID : 'sci' },
    { id : 'act', name : 'Actuarial Science', schoolID : 'sci' },
    { id : 'phy', name : 'Physics', schoolID : 'sci' },
    { id : 'ce', name : 'Computer Engineering', schoolID : 'eng' },
    { id : 'me', name : 'Mechanical Engineering', schoolID : 'eng' },
    { id : 'eco', name : 'Economics', schoolID : 'bus' },
    { id : 'log', name : 'Logistics', schoolID : 'bus' },
    { id : 'cd', name : 'Communication Design', schoolID : 'art' },
]

export const courses : Course[] = [
    { id : 'cs201', code : 'CS 201', name : 'Data Structures', programID : 'cs', color : '#6647f0', total : 184 },
    { id : 'phy104', code : 'PHY 104', name : 'Mechanics', programID : 'phy', color : '#0091ff', total : 142 },
    { id : 'math152', code : 'MATH 152', name : 'Calculus II', programID : 'act', color : '#fd9a46', total : 210 },
    { id : 'chem110', code : 'CHEM 110', name : 'Organic Chemistry', programID : 'phy', color : '#16c0a4', total : 96 },
    { id : 'econ101', code : 'ECON 101', name : 'Microeconomics', programID : 'eco', color : '#f0457a', total : 128 },
    { id : 'ce210', code : 'CE 210', name : 'Digital Logic', programID : 'ce', color : '#00c07a', total : 37 },
]

export const topics : Topic[] = [
    { id : 't1', name : 'Searching', courseID : 'cs201' },
    { id : 't2', name : 'Trees', courseID : 'cs201' },
    { id : 't3', name : 'Graphs', courseID : 'cs201' },
    { id : 't4', name : 'Hashing', courseID : 'cs201' },
    { id : 't5', name : 'Kinematics', courseID : 'phy104' },
    { id : 't6', name : "Newton's laws", courseID : 'phy104' },
    { id : 't7', name : 'Integration', courseID : 'math152' },
    { id : 't8', name : 'Series', courseID : 'math152' },
    { id : 't9', name : 'Alkenes', courseID : 'chem110' },
    { id : 't10', name : 'Elasticity', courseID : 'econ101' },
    { id : 't11', name : 'Boolean algebra', courseID : 'ce210' },
]

export const questions : Question[] = [
    {
        id : 'q1', courseID : 'cs201', topic : 'Searching', difficulty : 'Easy', year : 2023,
        question : 'What is the worst-case time complexity of binary search on a sorted array of n elements?',
        options : ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], answer : 1,
        explanation : 'Each comparison halves the remaining search space, so at most ⌈log₂ n⌉ + 1 comparisons are needed.',
        author : 'Ama Owusu', addedAt : '2h ago', flags : 0,
    },
    {
        id : 'q2', courseID : 'cs201', topic : 'Trees', difficulty : 'Easy', year : 2022,
        question : 'Which traversal visits the root before its left and right subtrees?',
        options : ['In-order', 'Pre-order', 'Post-order', 'Level-order'], answer : 1,
        explanation : 'Pre-order is root → left → right.',
        author : 'Kofi Mensah', addedAt : '5h ago', flags : 1,
    },
    {
        id : 'q3', courseID : 'cs201', topic : 'Graphs', difficulty : 'Medium', year : 2024,
        question : 'Which data structure does a breadth-first search use to decide which vertex to visit next?',
        options : ['Stack', 'Queue', 'Priority queue', 'Hash set'], answer : 1,
        explanation : 'BFS explores vertices in the order they were discovered — a queue.',
        author : 'Ama Owusu', addedAt : 'Yesterday', flags : 0,
    },
    {
        id : 'q4', courseID : 'cs201', topic : 'Trees', difficulty : 'Hard', year : 2023,
        question : 'After inserting into an AVL tree, a node has balance factor +2 and its left child has balance factor −1. Which rotation restores balance?',
        options : ['Single right rotation', 'Single left rotation', 'Left-right double rotation', 'Right-left double rotation'], answer : 2,
        explanation : 'A left-heavy node whose left child is right-heavy is the LR case.',
        author : 'Yaw Boateng', addedAt : 'Yesterday', flags : 2,
    },
    {
        id : 'q5', courseID : 'phy104', topic : 'Kinematics', difficulty : 'Medium', year : 2022,
        question : 'A ball is thrown vertically upward at 20 m/s. Taking g = 10 m/s², how long until it returns to the thrower?',
        options : ['2 s', '4 s', '1 s', '8 s'], answer : 1,
        explanation : 'Time to the top is v/g = 2 s, and the descent takes the same, so 4 s in total.',
        author : 'Efua Asante', addedAt : '2 days ago', flags : 1,
    },
    {
        id : 'q6', courseID : 'math152', topic : 'Integration', difficulty : 'Medium', year : 2024,
        question : 'Evaluate ∫ x·eˣ dx.',
        options : ['eˣ(x − 1) + C', 'x·eˣ + C', 'eˣ(x + 1) + C', '½x²eˣ + C'], answer : 0,
        explanation : 'Integrate by parts with u = x and dv = eˣ dx.',
        author : 'Kofi Mensah', addedAt : '3 days ago', flags : 0,
    },
    {
        id : 'q7', courseID : 'econ101', topic : 'Elasticity', difficulty : 'Easy', year : 2021,
        question : 'If a 10% price rise causes a 20% fall in quantity demanded, the price elasticity of demand is:',
        options : ['−0.5', '−2', '−0.2', '−20'], answer : 1,
        explanation : 'Elasticity = %ΔQ / %ΔP = −20 / 10 = −2.',
        author : 'Efua Asante', addedAt : '4 days ago', flags : 0,
    },
    {
        id : 'q8', courseID : 'chem110', topic : 'Alkenes', difficulty : 'Hard', year : 2023,
        question : "Markovnikov's rule predicts that HBr adds to propene to give mainly:",
        options : ['1-bromopropane', '2-bromopropane', '1,2-dibromopropane', 'Propane'], answer : 1,
        explanation : 'H adds to the carbon with more hydrogens, leaving the more stable secondary carbocation.',
        author : 'Yaw Boateng', addedAt : '1 week ago', flags : 1,
    },
]

export const flags : Flag[] = [
    { id : 'f1', questionID : 'q4', reporter : 'Nana Adjei', issue : 'Wrong answer', status : 'open', raisedAt : '12m ago',
      comment : 'I think a single right rotation is enough here — the lecture notes say so.', suggestedAnswer : 0 },
    { id : 'f2', questionID : 'q5', reporter : 'Selorm K.', issue : 'Unclear question', status : 'open', raisedAt : '1h ago',
      comment : 'Should we ignore air resistance? The question does not say.' },
    { id : 'f3', questionID : 'q2', reporter : 'Abena Darko', issue : 'Typo', status : 'open', raisedAt : '3h ago',
      comment : '"subtrees" is fine but option D should be "Level-order traversal" for consistency.' },
    { id : 'f4', questionID : 'q8', reporter : 'Kwame T.', issue : 'Missing explanation', status : 'open', raisedAt : 'Yesterday',
      comment : 'Would be great to explain why the secondary carbocation is more stable.' },
    { id : 'f5', questionID : 'q4', reporter : 'Esi Mensah', issue : 'Wrong answer', status : 'resolved', raisedAt : '2 days ago',
      comment : 'Same as the other flag on this question.' , suggestedAnswer : 0 },
    { id : 'f6', questionID : 'q1', reporter : 'Kojo B.', issue : 'Duplicate', status : 'dismissed', raisedAt : '4 days ago',
      comment : 'There is a similar binary search question in CS 202.' },
]

export const people : Person[] = [
    { id : 'p1', name : 'Ama Owusu', email : 'ama.owusu@preproom.app', role : 'Supervisor', courses : ['cs201', 'ce210'],
      questionsAdded : 412, flagsResolved : 58, status : 'Active', lastActive : 'Now', color : '#6647f0' },
    { id : 'p2', name : 'Kofi Mensah', email : 'kofi.mensah@preproom.app', role : 'Supervisor', courses : ['math152', 'cs201'],
      questionsAdded : 287, flagsResolved : 31, status : 'Active', lastActive : '20m ago', color : '#0091ff' },
    { id : 'p3', name : 'Efua Asante', email : 'efua.asante@preproom.app', role : 'Moderator', courses : ['phy104', 'econ101'],
      questionsAdded : 164, flagsResolved : 72, status : 'Active', lastActive : '1h ago', color : '#16c0a4' },
    { id : 'p4', name : 'Yaw Boateng', email : 'yaw.boateng@preproom.app', role : 'Moderator', courses : ['chem110', 'cs201'],
      questionsAdded : 98, flagsResolved : 44, status : 'Active', lastActive : 'Yesterday', color : '#fd9a46' },
    { id : 'p5', name : 'Akosua Frimpong', email : 'akosua.f@preproom.app', role : 'Moderator', courses : ['econ101'],
      questionsAdded : 0, flagsResolved : 0, status : 'Invited', lastActive : '—', color : '#f0457a' },
    { id : 'p6', name : 'Daniel Ofori', email : 'daniel.ofori@preproom.app', role : 'Supervisor', courses : ['phy104'],
      questionsAdded : 0, flagsResolved : 0, status : 'Invited', lastActive : '—', color : '#00c07a' },
]

export const notifications : AdminNotification[] = [
    { id : 'n1', kind : 'flag', title : 'New flag on CS 201', body : 'Nana Adjei says the AVL rotation answer is wrong.', time : '12m ago', read : false },
    { id : 'n2', kind : 'flag', title : 'New flag on PHY 104', body : 'Selorm K. finds the projectile question unclear.', time : '1h ago', read : false },
    { id : 'n3', kind : 'question', title : '24 questions added today', body : 'Ama Owusu added 18 questions to Data Structures.', time : '3h ago', read : false },
    { id : 'n4', kind : 'people', title : 'Invitation pending', body : 'Akosua Frimpong has not accepted the moderator invite yet.', time : 'Yesterday', read : true },
    { id : 'n5', kind : 'system', title : 'Weekly digest ready', body : '316 questions added and 42 flags resolved last week.', time : 'Mon', read : true },
]

// Questions added per day over the last two weeks (oldest first)
export const weeklyActivity = [18, 22, 9, 31, 27, 14, 6, 24, 35, 29, 41, 33, 12, 24]

export const getCourse = (id? : string) => courses.find((course) => course.id === id)
export const getQuestion = (id? : string) => questions.find((question) => question.id === id)
export const questionCount = (courseID : string) => questions.filter((question) => question.courseID === courseID).length

// Strips the HTML Quill produces so it can be shown in tables
export const plainText = (html : string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

/* API with sample fallback */

export interface Loaded<T> { items : T[], live : boolean }

const load = async <T,>(path : string, map : (item : any) => T, fallback : T[]) : Promise<Loaded<T>> => {
    try {
        const response = await api.get(path)
        const items = Array.isArray(response.data) ? response.data.map(map) : []
        return items.length ? { items, live : true } : { items : fallback, live : false }
    } catch {
        return { items : fallback, live : false }
    }
}

export const fetchSchools = () => load<School>('/branch/getAllBranches',
    (item) => ({ id : item._id, name : item.branchName }), schools)

export const fetchPrograms = () => load<Program>('/programs/getAllPrograms',
    (item) => ({ id : item._id, name : item.programName, schoolID : item.branchID }), programs)

export const fetchCourses = () => load<Course>('/courses/getAllCourses',
    (item) => ({ id : item._id, code : '', name : item.courseName, programID : item.programID, color : '#838383', total : item.questionCount ?? 0 }), courses)

export const fetchTopics = () => load<Topic>('/topics/getAllTopics',
    (item) => ({ id : item._id, name : item.name, courseID : item.courseID }), topics)

export const fetchQuestions = () => load<Question>('/questions/getAll', (item) => {
    const options : string[] = item.possibleAnswers ?? []
    return {
        id : item._id,
        question : item.question ?? '',
        options,
        answer : Math.max(0, options.indexOf(item.answer)),
        explanation : item.explanation ?? '',
        courseID : item.coursesID?.[0] ?? '',
        topic : '',
        difficulty : 'Medium',
        year : new Date().getFullYear(),
        author : 'Editor',
        addedAt : '',
        flags : 0,
    }
}, questions)
