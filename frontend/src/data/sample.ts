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


const q = (id : string, courseID : string, topic : string, difficulty : Difficulty, year : number, question : string, options : string[], answer : number, explanation : string, discussions = 0, saves = 0) : Question =>
    ({ id, courseID, topic, difficulty, year, question, options, answer, explanation, discussions, saves })

questions.push(
    q('p1', 'phy104', 'Kinematics', 'Easy', 2023, 'A ball is thrown straight up. At the top of its flight, what is its acceleration?',
        ['Zero', '9.8 m/s² downward', '9.8 m/s² upward', 'It depends on the mass'], 1,
        'Gravity acts the whole time. The velocity is momentarily zero at the top, but the acceleration is still g downward.', 31, 154),
    q('p2', 'phy104', 'Kinematics', 'Easy', 2022, 'A car starts from rest and accelerates uniformly at 2 m/s² for 5 s. How far does it travel?',
        ['10 m', '25 m', '50 m', '12.5 m'], 1, 'From s = ut + ½at² with u = 0: s = ½ × 2 × 5² = 25 m.', 12, 66),
    q('p3', 'phy104', "Newton's laws", 'Medium', 2024, "A book rests on a table. Which force is the Newton's third-law pair of the book's weight?",
        ['The normal force of the table on the book', 'The gravitational pull of the book on the Earth', 'Friction between book and table', 'The normal force of the book on the table'], 1,
        "Third-law pairs act on different bodies and are the same type of force. Earth pulls the book down; the book pulls Earth up.", 44, 201),
    q('p4', 'phy104', "Newton's laws", 'Easy', 2021, 'A 10 N force pushes a 2 kg block across a frictionless floor. What is its acceleration?',
        ['0.2 m/s²', '5 m/s²', '12 m/s²', '20 m/s²'], 1, 'a = F / m = 10 / 2 = 5 m/s².', 4, 29),
    q('p5', 'phy104', 'Energy', 'Medium', 2023, 'A 1 kg ball is dropped from 5 m. Ignoring air resistance and taking g = 10 m/s², how fast is it moving when it lands?',
        ['5 m/s', '10 m/s', '50 m/s', '100 m/s'], 1, 'mgh = ½mv², so v = √(2gh) = √100 = 10 m/s. The mass cancels.', 9, 58),
    q('p6', 'phy104', 'Projectiles', 'Medium', 2022, 'On level ground with no air resistance, which launch angle gives a projectile its greatest range?',
        ['30°', '45°', '60°', '90°'], 1, 'Range = v² sin 2θ / g, which is largest when sin 2θ = 1, i.e. θ = 45°.', 17, 83),
    q('p7', 'phy104', 'Circular motion', 'Hard', 2024, 'How much work does gravity do on a satellite over one complete circular orbit?',
        ['Positive work', 'Negative work', 'Zero', 'It depends on the orbital speed'], 2,
        'In a circular orbit the gravitational force is always perpendicular to the velocity, so no work is done.', 26, 117),

    q('m1', 'math152', 'Integration by parts', 'Medium', 2023, 'Evaluate ∫ x eˣ dx.',
        ['x eˣ + C', '(x − 1) eˣ + C', '(x + 1) eˣ + C', '½ x² eˣ + C'], 1,
        'Take u = x and dv = eˣ dx: x eˣ − ∫ eˣ dx = (x − 1) eˣ + C.', 22, 140),
    q('m2', 'math152', 'Definite integrals', 'Easy', 2022, 'Evaluate ∫₀¹ x² dx.',
        ['1/2', '1/3', '1', '2/3'], 1, 'The antiderivative is x³/3, and 1³/3 − 0 = 1/3.', 3, 41),
    q('m3', 'math152', 'Series', 'Medium', 2024, 'Does the series Σ 1/n² (n = 1 to ∞) converge?',
        ['Yes, it converges', 'No, it diverges', 'It oscillates', 'It cannot be determined'], 0,
        'It is a p-series with p = 2 > 1, so it converges (its sum is π²/6).', 14, 77),
    q('m4', 'math152', 'Series', 'Easy', 2021, 'What happens to the harmonic series Σ 1/n?',
        ['It converges to 1', 'It converges to ln 2', 'It diverges', 'It converges to e'], 2,
        'It is a p-series with p = 1, which diverges even though its terms tend to zero.', 8, 52),
    q('m5', 'math152', 'Taylor series', 'Easy', 2023, 'What are the first three terms of the Maclaurin series for eˣ?',
        ['1 + x + x²', '1 + x + x²/2', 'x + x²/2 + x³/6', '1 − x + x²/2'], 1, 'eˣ = Σ xⁿ / n!, so 1 + x + x²/2! + …', 6, 63),
    q('m6', 'math152', 'Integration techniques', 'Medium', 2022, 'Evaluate ∫ 1 / (1 + x²) dx.',
        ['ln(1 + x²) + C', 'arctan x + C', 'arcsin x + C', '1 / (2x) + C'], 1, 'The derivative of arctan x is 1 / (1 + x²).', 5, 47),
    q('m7', 'math152', 'Series', 'Hard', 2024, 'What is the radius of convergence of Σ xⁿ / n!?',
        ['0', '1', 'e', '∞'], 3, 'By the ratio test |x| / (n + 1) → 0 for every x, so the series converges everywhere.', 19, 98),

    q('c1', 'chem110', 'Functional groups', 'Easy', 2023, 'Which functional group does ethanol contain?',
        ['Carbonyl', 'Hydroxyl', 'Carboxyl', 'Amino'], 1, 'Ethanol is CH₃CH₂OH; the –OH group is a hydroxyl, which makes it an alcohol.', 2, 35),
    q('c2', 'chem110', 'Nomenclature', 'Easy', 2022, 'What is the IUPAC name of CH₃CH₂CH₂CH₃?',
        ['Propane', 'Butane', 'But-1-ene', '2-methylpropane'], 1, 'Four carbons in a straight chain with only single bonds: butane.', 1, 22),
    q('c3', 'chem110', 'Bonding', 'Medium', 2024, 'What is the hybridisation of each carbon atom in ethyne (C₂H₂)?',
        ['sp', 'sp²', 'sp³', 'sp³d'], 0, 'Each carbon forms a triple bond and one C–H bond: two electron domains, so sp.', 11, 70),
    q('c4', 'chem110', 'Reaction mechanisms', 'Hard', 2023, 'Which alkyl halide reacts fastest by an SN2 mechanism?',
        ['Tertiary', 'Secondary', 'Primary', 'Methyl'], 3, 'SN2 needs backside attack, so the least hindered substrate, a methyl halide, reacts fastest.', 28, 133),
    q('c5', 'chem110', 'Reaction mechanisms', 'Medium', 2021, 'What is the major product when HBr adds to propene?',
        ['1-bromopropane', '2-bromopropane', '1,2-dibromopropane', 'Propan-2-ol'], 1,
        'Markovnikov addition: H goes to the carbon with more hydrogens, giving the more stable secondary carbocation.', 16, 91),
    q('c6', 'chem110', 'Isomerism', 'Medium', 2022, 'Which compound shows cis–trans (geometric) isomerism?',
        ['But-1-ene', 'But-2-ene', 'Propene', '2-methylpropene'], 1,
        'Each carbon of the C=C in but-2-ene carries two different groups, so cis and trans forms exist.', 7, 49),

    q('e1', 'econ101', 'Demand', 'Easy', 2023, 'Other things equal, when the price of a normal good rises, its quantity demanded…',
        ['Rises', 'Falls', 'Stays the same', 'Shifts the demand curve right'], 1, 'This is the law of demand: a movement along the demand curve, not a shift of it.', 3, 30),
    q('e2', 'econ101', 'Elasticity', 'Medium', 2022, 'A good has a price elasticity of demand of −0.4. Demand for it is…',
        ['Perfectly inelastic', 'Inelastic', 'Unit elastic', 'Elastic'], 1, '|−0.4| is between 0 and 1, so demand is inelastic.', 10, 64),
    q('e3', 'econ101', 'Market interventions', 'Medium', 2024, 'A price ceiling set below the equilibrium price causes…',
        ['A surplus', 'A shortage', 'No effect', 'An increase in supply'], 1, 'At the lower price, quantity demanded exceeds quantity supplied.', 13, 72),
    q('e4', 'econ101', 'Market structures', 'Hard', 2023, 'In long-run equilibrium, a firm in perfect competition earns…',
        ['Positive economic profit', 'Zero economic profit', 'Negative accounting profit', 'Monopoly profit'], 1,
        'Free entry and exit push price down to minimum average total cost, so P = MC = min ATC.', 21, 108),
    q('e5', 'econ101', 'Basics', 'Easy', 2021, 'Opportunity cost is…',
        ['The money spent on a choice', 'The value of the next best alternative given up', 'The total cost of production', 'A cost that cannot be recovered'], 1,
        'It is what you give up by choosing one option over the best alternative.', 2, 26),
    q('e6', 'econ101', 'Demand', 'Medium', 2022, 'Coffee and sugar are complements. If the price of coffee rises, the demand for sugar…',
        ['Rises', 'Falls', 'Is unchanged', 'Becomes perfectly elastic'], 1, 'Less coffee is bought, so less sugar is needed to go with it.', 5, 39),
)

const courseBase = [
    { id : 'cs201', code : 'CS 201', name : 'Data Structures', color : '#6647f0' },
    { id : 'phy104', code : 'PHY 104', name : 'Mechanics', color : '#0091ff' },
    { id : 'math152', code : 'MATH 152', name : 'Calculus II', color : '#fd9a46' },
    { id : 'chem110', code : 'CHEM 110', name : 'Organic Chemistry', color : '#16c0a4' },
    { id : 'econ101', code : 'ECON 101', name : 'Microeconomics', color : '#f0457a' },
]

export const courses : Course[] = courseBase.map((course) => ({
    ...course,
    questions : questions.filter((question) => question.courseID === course.id).length,
}))

export const getQuestion = (id : string) => questions.find((question) => question.id === id)

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
        return questions.filter((question) => question.courseID === courseID)
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
