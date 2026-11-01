import axios from 'axios'
import { BASE_URL } from '../variables/variables'

// Sample content used when the API is unreachable or returns nothing,
// so every screen renders a realistic state during development.

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Course {
    id : string
    code : string
    name : string
    color : string
    questions : number
    progress : number
}

export interface Question {
    id : string
    courseID : string
    topic : string
    difficulty : Difficulty
    year : number
    question : string
    options : string[]
    answer : number
    explanation : string
    discussions : number
    saves : number
}

export const courses : Course[] = [
    { id : 'cs201', code : 'CS 201', name : 'Data Structures', color : '#6647f0', questions : 184, progress : 62 },
    { id : 'phy104', code : 'PHY 104', name : 'Mechanics', color : '#0091ff', questions : 142, progress : 38 },
    { id : 'math152', code : 'MATH 152', name : 'Calculus II', color : '#fd9a46', questions : 210, progress : 21 },
    { id : 'chem110', code : 'CHEM 110', name : 'Organic Chemistry', color : '#16c0a4', questions : 96, progress : 54 },
    { id : 'econ101', code : 'ECON 101', name : 'Microeconomics', color : '#f0457a', questions : 128, progress : 9 },
]

export const questions : Question[] = [
    {
        id : 'q1', courseID : 'cs201', topic : 'Searching', difficulty : 'Easy', year : 2023,
        question : 'What is the worst-case time complexity of binary search on a sorted array of n elements?',
        options : ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        answer : 1,
        explanation : 'Each comparison halves the remaining search space, so at most ⌈log₂ n⌉ + 1 comparisons are needed.',
        discussions : 24, saves : 112,
    },
    {
        id : 'q2', courseID : 'cs201', topic : 'Trees', difficulty : 'Easy', year : 2022,
        question : 'Which traversal visits the root before its left and right subtrees?',
        options : ['In-order', 'Pre-order', 'Post-order', 'Level-order'],
        answer : 1,
        explanation : 'Pre-order is root → left → right. In-order places the root between the subtrees; post-order visits it last.',
        discussions : 8, saves : 64,
    },
    {
        id : 'q3', courseID : 'cs201', topic : 'Graphs', difficulty : 'Medium', year : 2024,
        question : 'Which data structure does a breadth-first search use to decide which vertex to visit next?',
        options : ['Stack', 'Queue', 'Priority queue', 'Hash set'],
        answer : 1,
        explanation : 'BFS explores vertices in the order they were discovered, which is first-in first-out — a queue.',
        discussions : 15, saves : 71,
    },
    {
        id : 'q4', courseID : 'cs201', topic : 'Trees', difficulty : 'Hard', year : 2023,
        question : 'After inserting into an AVL tree, a node has balance factor +2 and its left child has balance factor −1. Which rotation restores balance?',
        options : ['Single right rotation', 'Single left rotation', 'Left-right double rotation', 'Right-left double rotation'],
        answer : 2,
        explanation : 'A left-heavy node whose left child is right-heavy is the LR case: rotate the child left, then the node right.',
        discussions : 41, saves : 189,
    },
    {
        id : 'q5', courseID : 'cs201', topic : 'Hashing', difficulty : 'Medium', year : 2022,
        question : 'In open addressing with linear probing, what is the main cause of degraded performance as the load factor grows?',
        options : ['Primary clustering', 'Pointer overhead', 'Rehash collisions', 'Stack overflow'],
        answer : 0,
        explanation : 'Linear probing creates long runs of occupied slots (primary clusters), so probes get longer as the table fills.',
        discussions : 6, saves : 38,
    },
    {
        id : 'q6', courseID : 'cs201', topic : 'Heaps', difficulty : 'Hard', year : 2024,
        question : 'What is the time complexity of building a binary heap from an unordered array of n elements using bottom-up heapify?',
        options : ['O(n log n)', 'O(log n)', 'O(n)', 'O(n²)'],
        answer : 2,
        explanation : 'Most nodes sit near the leaves and sift down only a few levels; summing the work gives a linear bound.',
        discussions : 19, saves : 97,
    },
    {
        id : 'q7', courseID : 'cs201', topic : 'Searching', difficulty : 'Medium', year : 2021,
        question : 'Which condition must hold for binary search to return a correct result?',
        options : ['The array is sorted', 'The array has no duplicates', 'The array length is a power of two', 'The array is stored in a linked list'],
        answer : 0,
        explanation : 'Binary search relies on ordering to discard half the range after each comparison.',
        discussions : 3, saves : 22,
    },
    {
        id : 'q8', courseID : 'cs201', topic : 'Graphs', difficulty : 'Hard', year : 2021,
        question : "Dijkstra's algorithm can produce incorrect shortest paths when the graph contains…",
        options : ['Cycles', 'Negative edge weights', 'Disconnected components', 'Self-loops'],
        answer : 1,
        explanation : 'Dijkstra finalises a vertex once it is popped; a later negative edge could have produced a shorter path to it.',
        discussions : 27, saves : 140,
    },
]

export const topics = Array.from(new Set(questions.map((question) => question.topic)))

export const getCourse = (id? : string) => courses.find((course) => course.id === id) ?? courses[0]

// Backend questions store the answer as option text; map them onto the UI shape
export const fetchQuestions = async (courseID : string) : Promise<Question[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/questions/getQuestion`, {
            params : { coursesID : [courseID] },
            timeout : 3000,
        })
        const data = response.data as any[]
        if(!Array.isArray(data) || data.length === 0) throw new Error('empty')
        return data.map((item, index) => ({
            id : item._id,
            courseID,
            topic : 'General',
            difficulty : 'Medium',
            year : new Date().getFullYear(),
            question : item.question,
            options : item.possibleAnswers ?? [],
            answer : Math.max(0, (item.possibleAnswers ?? []).indexOf(item.answer)),
            explanation : item.explanation ?? '',
            discussions : 0,
            saves : 0,
        }))
    } catch {
        const forCourse = questions.filter((question) => question.courseID === courseID)
        return forCourse.length > 0 ? forCourse : questions
    }
}

export interface Notification {
    id : string
    kind : 'reply' | 'challenge' | 'streak' | 'system' | 'result'
    title : string
    body : string
    time : string
    group : 'Today' | 'This week' | 'Earlier'
    unread : boolean
}

export const notifications : Notification[] = [
    { id : 'n1', kind : 'reply', title : 'Kofi O. replied to your comment', body : '“Pre = root first. In-order puts the root between the subtrees.”', time : '12m', group : 'Today', unread : true },
    { id : 'n2', kind : 'challenge', title : "Today's challenge is live", body : 'Five Data Structures questions. Keep your 6-day streak going.', time : '2h', group : 'Today', unread : true },
    { id : 'n3', kind : 'result', title : 'Mock test graded', body : 'You scored 17/20 on Data Structures · Trees & Graphs.', time : '5h', group : 'Today', unread : false },
    { id : 'n4', kind : 'streak', title : 'You reached a 5-day streak', body : 'Two more days to unlock the weekly badge.', time : 'Mon', group : 'This week', unread : false },
    { id : 'n5', kind : 'reply', title : 'Esi M. mentioned you', body : '“@you drawing the tree helped me a lot here.”', time : 'Mon', group : 'This week', unread : false },
    { id : 'n6', kind : 'system', title : 'New past papers added', body : 'CS 201 2024 resit paper is now available to practice.', time : 'Oct 24', group : 'Earlier', unread : false },
]

export const leaderboard = [
    { initials : 'AK', name : 'Ama K.', school : 'KNUST', score : 980, color : '#6647f0' },
    { initials : 'KO', name : 'Kofi O.', school : 'UG', score : 945, color : '#0091ff' },
    { initials : 'EM', name : 'Esi M.', school : 'UCC', score : 910, color : '#16c0a4' },
    { initials : 'YA', name : 'Yaw A.', school : 'KNUST', score : 870, color : '#fd9a46' },
    { initials : 'NB', name : 'Nana B.', school : 'UEW', score : 845, color : '#f0457a' },
]

export interface TestRecord {
    id : string
    courseID : string
    title : string
    date : string
    score : number
    total : number
    minutes : number
}

export const testHistory : TestRecord[] = [
    { id : 't1', courseID : 'cs201', title : 'Trees & Graphs', date : 'Oct 30', score : 17, total : 20, minutes : 24 },
    { id : 't2', courseID : 'phy104', title : 'Kinematics', date : 'Oct 27', score : 12, total : 20, minutes : 30 },
    { id : 't3', courseID : 'chem110', title : 'Functional groups', date : 'Oct 21', score : 9, total : 10, minutes : 11 },
    { id : 't4', courseID : 'math152', title : 'Integration techniques', date : 'Oct 14', score : 11, total : 20, minutes : 28 },
]

export const profile = {
    name : 'Kwame Asante',
    initials : 'KA',
    program : 'BSc Computer Science',
    school : 'KNUST',
    year : 'Level 200',
    streak : 6,
    solved : 412,
    accuracy : 78,
    tests : 14,
}
