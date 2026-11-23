// Starter content for development and demos. Mirrors the sample data the
// frontend and admin were designed against, plus enough extra questions for
// every course to run a daily challenge.

export const institutions = [
    { shortName : 'KNUST', name : 'Kwame Nkrumah University of Science and Technology' },
    { shortName : 'UG', name : 'University of Ghana' },
    { shortName : 'UCC', name : 'University of Cape Coast' },
    { shortName : 'UEW', name : 'University of Education, Winneba' },
    { shortName : 'UDS', name : 'University for Development Studies' },
    { shortName : 'ATU', name : 'Accra Technical University' },
]

export const faculties = ['School of Sciences', 'School of Engineering', 'Business School', 'School of Arts']

export const programs : { name : string, faculty : string }[] = [
    { name : 'Computer Science', faculty : 'School of Sciences' },
    { name : 'Actuarial Science', faculty : 'School of Sciences' },
    { name : 'Physics', faculty : 'School of Sciences' },
    { name : 'Computer Engineering', faculty : 'School of Engineering' },
    { name : 'Mechanical Engineering', faculty : 'School of Engineering' },
    { name : 'Economics', faculty : 'Business School' },
    { name : 'Logistics', faculty : 'Business School' },
    { name : 'Communication Design', faculty : 'School of Arts' },
]

export const courses = [
    { slug : 'cs201', code : 'CS 201', name : 'Data Structures', program : 'Computer Science', color : '#6647f0' },
    { slug : 'phy104', code : 'PHY 104', name : 'Mechanics', program : 'Physics', color : '#0091ff' },
    { slug : 'math152', code : 'MATH 152', name : 'Calculus II', program : 'Actuarial Science', color : '#fd9a46' },
    { slug : 'chem110', code : 'CHEM 110', name : 'Organic Chemistry', program : 'Physics', color : '#16c0a4' },
    { slug : 'econ101', code : 'ECON 101', name : 'Microeconomics', program : 'Economics', color : '#f0457a' },
    { slug : 'ce210', code : 'CE 210', name : 'Digital Logic', program : 'Computer Engineering', color : '#00c07a' },
]

type D = 'Easy' | 'Medium' | 'Hard'
export interface SeedQuestion {
    course : string
    topic : string
    difficulty : D
    year : number
    institution : string
    question : string
    options : string[]
    answer : number
    explanation : string
    author : string
}

export const questions : SeedQuestion[] = [
    // CS 201
    { course : 'cs201', topic : 'Searching', difficulty : 'Easy', year : 2023, institution : 'KNUST', author : 'ama.owusu',
      question : 'What is the worst-case time complexity of binary search on a sorted array of n elements?',
      options : ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], answer : 1,
      explanation : 'Each comparison halves the remaining search space, so at most ⌈log₂ n⌉ + 1 comparisons are needed.' },
    { course : 'cs201', topic : 'Trees', difficulty : 'Easy', year : 2022, institution : 'KNUST', author : 'kofi.mensah',
      question : 'Which traversal visits the root before its left and right subtrees?',
      options : ['In-order', 'Pre-order', 'Post-order', 'Level-order'], answer : 1,
      explanation : 'Pre-order is root → left → right. In-order places the root between the subtrees; post-order visits it last.' },
    { course : 'cs201', topic : 'Graphs', difficulty : 'Medium', year : 2024, institution : 'UG', author : 'ama.owusu',
      question : 'Which data structure does a breadth-first search use to decide which vertex to visit next?',
      options : ['Stack', 'Queue', 'Priority queue', 'Hash set'], answer : 1,
      explanation : 'BFS explores vertices in the order they were discovered, which is first-in first-out — a queue.' },
    { course : 'cs201', topic : 'Trees', difficulty : 'Hard', year : 2023, institution : 'KNUST', author : 'yaw.boateng',
      question : 'After inserting into an AVL tree, a node has balance factor +2 and its left child has balance factor −1. Which rotation restores balance?',
      options : ['Single right rotation', 'Single left rotation', 'Left-right double rotation', 'Right-left double rotation'], answer : 2,
      explanation : 'A left-heavy node whose left child is right-heavy is the LR case: rotate the child left, then the node right.' },
    { course : 'cs201', topic : 'Hashing', difficulty : 'Medium', year : 2022, institution : 'UCC', author : 'kofi.mensah',
      question : 'In open addressing with linear probing, what is the main cause of degraded performance as the load factor grows?',
      options : ['Primary clustering', 'Pointer overhead', 'Rehash collisions', 'Stack overflow'], answer : 0,
      explanation : 'Linear probing creates long runs of occupied slots (primary clusters), so probes get longer as the table fills.' },
    { course : 'cs201', topic : 'Heaps', difficulty : 'Hard', year : 2024, institution : 'UG', author : 'ama.owusu',
      question : 'What is the time complexity of building a binary heap from an unordered array of n elements using bottom-up heapify?',
      options : ['O(n log n)', 'O(log n)', 'O(n)', 'O(n²)'], answer : 2,
      explanation : 'Most nodes sit near the leaves and sift down only a few levels; summing the work gives a linear bound.' },
    { course : 'cs201', topic : 'Searching', difficulty : 'Medium', year : 2021, institution : 'KNUST', author : 'kofi.mensah',
      question : 'Which condition must hold for binary search to return a correct result?',
      options : ['The array is sorted', 'The array has no duplicates', 'The array length is a power of two', 'The array is stored in a linked list'], answer : 0,
      explanation : 'Binary search relies on ordering to discard half the range after each comparison.' },
    { course : 'cs201', topic : 'Graphs', difficulty : 'Hard', year : 2021, institution : 'UEW', author : 'yaw.boateng',
      question : 'Dijkstra\'s algorithm can produce incorrect shortest paths when the graph contains…',
      options : ['Cycles', 'Negative edge weights', 'Disconnected components', 'Self-loops'], answer : 1,
      explanation : 'Dijkstra finalises a vertex once it is popped; a later negative edge could have produced a shorter path to it.' },

    // PHY 104
    { course : 'phy104', topic : 'Kinematics', difficulty : 'Medium', year : 2022, institution : 'KNUST', author : 'efua.asante',
      question : 'A ball is thrown vertically upward at 20 m/s. Taking g = 10 m/s², how long until it returns to the thrower?',
      options : ['2 s', '4 s', '1 s', '8 s'], answer : 1,
      explanation : 'Time to the top is v/g = 2 s, and the descent takes the same, so 4 s in total.' },
    { course : 'phy104', topic : 'Kinematics', difficulty : 'Easy', year : 2023, institution : 'UG', author : 'efua.asante',
      question : 'A car accelerates uniformly from rest to 30 m/s in 6 s. What is its acceleration?',
      options : ['3 m/s²', '5 m/s²', '6 m/s²', '180 m/s²'], answer : 1,
      explanation : 'a = Δv / t = 30 / 6 = 5 m/s².' },
    { course : 'phy104', topic : 'Newton\'s laws', difficulty : 'Easy', year : 2021, institution : 'UCC', author : 'daniel.ofori',
      question : 'A net force of 12 N acts on a 4 kg mass. What is the acceleration of the mass?',
      options : ['48 m/s²', '3 m/s²', '0.33 m/s²', '16 m/s²'], answer : 1,
      explanation : 'Newton\'s second law: a = F / m = 12 / 4 = 3 m/s².' },
    { course : 'phy104', topic : 'Newton\'s laws', difficulty : 'Medium', year : 2024, institution : 'KNUST', author : 'efua.asante',
      question : 'A book rests on a table. According to Newton\'s third law, the reaction to the Earth\'s gravitational pull on the book is…',
      options : ['The normal force of the table on the book', 'The book\'s gravitational pull on the Earth', 'The friction between book and table', 'The weight of the table'], answer : 1,
      explanation : 'Action–reaction pairs act on different bodies and are the same type of force: Earth pulls the book, so the book pulls the Earth.' },
    { course : 'phy104', topic : 'Energy', difficulty : 'Medium', year : 2023, institution : 'UEW', author : 'daniel.ofori',
      question : 'A 2 kg object falls from rest through 5 m. Ignoring air resistance and taking g = 10 m/s², what is its kinetic energy just before impact?',
      options : ['10 J', '50 J', '100 J', '20 J'], answer : 2,
      explanation : 'All the lost potential energy becomes kinetic: mgh = 2 × 10 × 5 = 100 J.' },
    { course : 'phy104', topic : 'Energy', difficulty : 'Hard', year : 2022, institution : 'UG', author : 'efua.asante',
      question : 'A 1500 kg car moving at 20 m/s brakes to rest over 40 m. What is the average braking force?',
      options : ['3 750 N', '7 500 N', '15 000 N', '750 N'], answer : 1,
      explanation : 'Work done by braking equals the kinetic energy lost: F × 40 = ½ × 1500 × 20² = 300 000 J, so F = 7 500 N.' },

    // MATH 152
    { course : 'math152', topic : 'Integration', difficulty : 'Medium', year : 2024, institution : 'KNUST', author : 'kofi.mensah',
      question : 'Evaluate ∫ x·eˣ dx.',
      options : ['eˣ(x − 1) + C', 'x·eˣ + C', 'eˣ(x + 1) + C', '½x²eˣ + C'], answer : 0,
      explanation : 'Integrate by parts with u = x and dv = eˣ dx: x·eˣ − ∫ eˣ dx = eˣ(x − 1) + C.' },
    { course : 'math152', topic : 'Integration', difficulty : 'Easy', year : 2023, institution : 'UG', author : 'kofi.mensah',
      question : 'Evaluate ∫₀¹ 3x² dx.',
      options : ['3', '1', '½', '6'], answer : 1,
      explanation : 'An antiderivative is x³, and 1³ − 0³ = 1.' },
    { course : 'math152', topic : 'Integration', difficulty : 'Hard', year : 2022, institution : 'KNUST', author : 'kofi.mensah',
      question : 'Evaluate ∫ 1 / (x² + 4) dx.',
      options : ['½ arctan(x/2) + C', 'arctan(x/2) + C', '½ ln(x² + 4) + C', '2 arctan(2x) + C'], answer : 0,
      explanation : 'Using ∫ 1/(x² + a²) dx = (1/a) arctan(x/a) + C with a = 2.' },
    { course : 'math152', topic : 'Series', difficulty : 'Medium', year : 2023, institution : 'UCC', author : 'kofi.mensah',
      question : 'What is the sum of the geometric series 1 + ½ + ¼ + ⅛ + … ?',
      options : ['1', '1.5', '2', 'It diverges'], answer : 2,
      explanation : 'For |r| < 1 the sum is a / (1 − r) = 1 / (1 − ½) = 2.' },
    { course : 'math152', topic : 'Series', difficulty : 'Hard', year : 2024, institution : 'UG', author : 'kofi.mensah',
      question : 'Which of these series converges?',
      options : ['Σ 1/n', 'Σ 1/√n', 'Σ 1/n²', 'Σ n/(n + 1)'], answer : 2,
      explanation : 'Σ 1/nᵖ converges only when p > 1, so Σ 1/n² converges. Σ n/(n + 1) fails the divergence test.' },

    // CHEM 110
    { course : 'chem110', topic : 'Alkenes', difficulty : 'Hard', year : 2023, institution : 'KNUST', author : 'yaw.boateng',
      question : 'Markovnikov\'s rule predicts that HBr adds to propene to give mainly:',
      options : ['1-bromopropane', '2-bromopropane', '1,2-dibromopropane', 'Propane'], answer : 1,
      explanation : 'H adds to the carbon with more hydrogens, leaving the more stable secondary carbocation, so Br ends up on C-2.' },
    { course : 'chem110', topic : 'Alkenes', difficulty : 'Easy', year : 2022, institution : 'UG', author : 'yaw.boateng',
      question : 'Which test distinguishes an alkene from an alkane?',
      options : ['Bromine water is decolourised', 'Limewater turns milky', 'Litmus turns red', 'A white precipitate with silver nitrate'], answer : 0,
      explanation : 'Bromine adds across the C=C double bond, so the orange-brown colour disappears. Alkanes do not react in the dark.' },
    { course : 'chem110', topic : 'Functional groups', difficulty : 'Easy', year : 2024, institution : 'UCC', author : 'yaw.boateng',
      question : 'Which functional group is present in ethanol?',
      options : ['Carbonyl', 'Carboxyl', 'Hydroxyl', 'Amino'], answer : 2,
      explanation : 'Ethanol is CH₃CH₂OH; the –OH group is a hydroxyl group.' },
    { course : 'chem110', topic : 'Functional groups', difficulty : 'Medium', year : 2023, institution : 'KNUST', author : 'yaw.boateng',
      question : 'Oxidising a primary alcohol under reflux with excess acidified potassium dichromate gives a…',
      options : ['Ketone', 'Carboxylic acid', 'Ether', 'Alkene'], answer : 1,
      explanation : 'Under reflux the aldehyde formed first is oxidised further to the carboxylic acid.' },
    { course : 'chem110', topic : 'Isomerism', difficulty : 'Medium', year : 2021, institution : 'UEW', author : 'yaw.boateng',
      question : 'How many structural isomers does C₄H₁₀ have?',
      options : ['1', '2', '3', '4'], answer : 1,
      explanation : 'Butane and 2-methylpropane.' },

    // ECON 101
    { course : 'econ101', topic : 'Elasticity', difficulty : 'Easy', year : 2021, institution : 'UG', author : 'efua.asante',
      question : 'If a 10% price rise causes a 20% fall in quantity demanded, the price elasticity of demand is:',
      options : ['−0.5', '−2', '−0.2', '−20'], answer : 1,
      explanation : 'Elasticity = %ΔQ / %ΔP = −20 / 10 = −2.' },
    { course : 'econ101', topic : 'Elasticity', difficulty : 'Medium', year : 2023, institution : 'KNUST', author : 'akosua.f',
      question : 'When demand is price inelastic, a price increase will…',
      options : ['Lower total revenue', 'Raise total revenue', 'Leave total revenue unchanged', 'Make demand perfectly elastic'], answer : 1,
      explanation : 'Quantity falls proportionally less than price rises, so price × quantity goes up.' },
    { course : 'econ101', topic : 'Market equilibrium', difficulty : 'Easy', year : 2022, institution : 'UCC', author : 'efua.asante',
      question : 'A government-set price ceiling below the equilibrium price usually leads to…',
      options : ['A surplus', 'A shortage', 'No change in the market', 'Higher producer revenue'], answer : 1,
      explanation : 'At the lower price, quantity demanded exceeds quantity supplied.' },
    { course : 'econ101', topic : 'Market equilibrium', difficulty : 'Medium', year : 2024, institution : 'UG', author : 'efua.asante',
      question : 'If the price of a substitute good rises, the demand curve for the original good will…',
      options : ['Shift left', 'Shift right', 'Not move', 'Become vertical'], answer : 1,
      explanation : 'Consumers switch away from the now dearer substitute, raising demand for the original good at every price.' },
    { course : 'econ101', topic : 'Costs', difficulty : 'Hard', year : 2023, institution : 'KNUST', author : 'efua.asante',
      question : 'In the short run, the marginal cost curve cuts the average total cost curve at…',
      options : ['The maximum of ATC', 'The minimum of ATC', 'The point where ATC equals AFC', 'Zero output'], answer : 1,
      explanation : 'While MC is below ATC it pulls the average down; once above, it pulls it up, so they meet at ATC\'s minimum.' },

    // CE 210
    { course : 'ce210', topic : 'Boolean algebra', difficulty : 'Easy', year : 2023, institution : 'KNUST', author : 'ama.owusu',
      question : 'Simplify the Boolean expression A + A·B.',
      options : ['A', 'B', 'A·B', 'A + B'], answer : 0,
      explanation : 'Absorption law: A + AB = A(1 + B) = A.' },
    { course : 'ce210', topic : 'Boolean algebra', difficulty : 'Medium', year : 2022, institution : 'ATU', author : 'ama.owusu',
      question : 'By De Morgan\'s theorem, (A·B)′ is equal to…',
      options : ['A′·B′', 'A′ + B′', 'A + B', '(A + B)′'], answer : 1,
      explanation : 'The complement of a product is the sum of the complements.' },
    { course : 'ce210', topic : 'Logic gates', difficulty : 'Easy', year : 2024, institution : 'KNUST', author : 'ama.owusu',
      question : 'Which single gate is called "universal" because any Boolean function can be built from it alone?',
      options : ['XOR', 'NAND', 'AND', 'OR'], answer : 1,
      explanation : 'NAND (and NOR) can implement NOT, AND and OR, so they are functionally complete.' },
    { course : 'ce210', topic : 'Number systems', difficulty : 'Easy', year : 2023, institution : 'UG', author : 'ama.owusu',
      question : 'What is the decimal value of the binary number 101101?',
      options : ['43', '45', '47', '53'], answer : 1,
      explanation : '32 + 8 + 4 + 1 = 45.' },
    { course : 'ce210', topic : 'Logic gates', difficulty : 'Hard', year : 2024, institution : 'KNUST', author : 'ama.owusu',
      question : 'A half adder\'s sum and carry outputs are produced by which pair of gates?',
      options : ['OR and AND', 'XOR and AND', 'XNOR and OR', 'NAND and NOR'], answer : 1,
      explanation : 'Sum = A ⊕ B and Carry = A·B.' },
]

export interface SeedPerson {
    key : string
    firstName : string
    lastName : string
    role : 'admin' | 'supervisor' | 'moderator' | 'student'
    status : 'active' | 'invited'
    courses? : string[]
    color : string
    school? : string
    program? : string
    level? : string
}

export const people : SeedPerson[] = [
    { key : 'admin', firstName : 'PrepRoom', lastName : 'Admin', role : 'admin', status : 'active', color : '#202020' },
    { key : 'ama.owusu', firstName : 'Ama', lastName : 'Owusu', role : 'supervisor', status : 'active', courses : ['cs201', 'ce210'], color : '#6647f0' },
    { key : 'kofi.mensah', firstName : 'Kofi', lastName : 'Mensah', role : 'supervisor', status : 'active', courses : ['math152', 'cs201'], color : '#0091ff' },
    { key : 'efua.asante', firstName : 'Efua', lastName : 'Asante', role : 'moderator', status : 'active', courses : ['phy104', 'econ101'], color : '#16c0a4' },
    { key : 'yaw.boateng', firstName : 'Yaw', lastName : 'Boateng', role : 'moderator', status : 'active', courses : ['chem110', 'cs201'], color : '#fd9a46' },
    { key : 'akosua.f', firstName : 'Akosua', lastName : 'Frimpong', role : 'moderator', status : 'invited', courses : ['econ101'], color : '#f0457a' },
    { key : 'daniel.ofori', firstName : 'Daniel', lastName : 'Ofori', role : 'supervisor', status : 'invited', courses : ['phy104'], color : '#00c07a' },

    // Learners
    { key : 'student', firstName : 'Kwame', lastName : 'Asante', role : 'student', status : 'active', color : '#202020', school : 'KNUST', program : 'BSc Computer Science', level : 'Level 200' },
    { key : 'ama.k', firstName : 'Ama', lastName : 'Kyei', role : 'student', status : 'active', color : '#6647f0', school : 'KNUST', program : 'BSc Computer Science', level : 'Level 200' },
    { key : 'kofi.o', firstName : 'Kofi', lastName : 'Osei', role : 'student', status : 'active', color : '#0091ff', school : 'UG', program : 'BSc Physics', level : 'Level 100' },
    { key : 'esi.m', firstName : 'Esi', lastName : 'Mensah', role : 'student', status : 'active', color : '#16c0a4', school : 'UCC', program : 'BSc Economics', level : 'Level 300' },
    { key : 'yaw.a', firstName : 'Yaw', lastName : 'Appiah', role : 'student', status : 'active', color : '#fd9a46', school : 'KNUST', program : 'BSc Computer Engineering', level : 'Level 200' },
    { key : 'nana.b', firstName : 'Nana', lastName : 'Badu', role : 'student', status : 'active', color : '#f0457a', school : 'UEW', program : 'BSc Actuarial Science', level : 'Level 100' },
]

export const emailFor = (key : string) => `${key}@preproom.app`
