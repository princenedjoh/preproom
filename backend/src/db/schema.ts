import { sql } from 'drizzle-orm'
import {
    pgTable, pgEnum, uuid, text, integer, boolean, timestamp, date, jsonb,
    primaryKey, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core'

/* Enums */

export const roleEnum = pgEnum('role', ['student', 'moderator', 'supervisor', 'admin'])
export const userStatusEnum = pgEnum('user_status', ['active', 'invited', 'disabled'])
export const difficultyEnum = pgEnum('difficulty', ['Easy', 'Medium', 'Hard'])
export const testModeEnum = pgEnum('test_mode', ['practice', 'paper', 'challenge'])
export const tokenPurposeEnum = pgEnum('token_purpose', ['reset', 'invite'])
export const flagIssueEnum = pgEnum('flag_issue', ['Wrong answer', 'Typo', 'Unclear question', 'Duplicate', 'Missing explanation'])
export const flagStatusEnum = pgEnum('flag_status', ['open', 'resolved', 'dismissed'])
export const notificationKindEnum = pgEnum('notification_kind', [
    // learner
    'reply', 'challenge', 'streak', 'result', 'system',
    // staff
    'flag', 'question', 'people',
])

export type Role = typeof roleEnum.enumValues[number]
export type Difficulty = typeof difficultyEnum.enumValues[number]
export type TestMode = typeof testModeEnum.enumValues[number]
export type FlagIssue = typeof flagIssueEnum.enumValues[number]
export type FlagStatus = typeof flagStatusEnum.enumValues[number]
export type NotificationKind = typeof notificationKindEnum.enumValues[number]

export interface Prefs {
    dailyReminder : boolean
    replies : boolean
    weeklyReport : boolean
}

export const defaultPrefs : Prefs = { dailyReminder : true, replies : true, weeklyReport : false }

const createdAt = () => timestamp('created_at', { withTimezone : true }).notNull().defaultNow()

/* People */

export const users = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    email : text('email').notNull(),
    passwordHash : text('password_hash'),
    firstName : text('first_name').notNull(),
    lastName : text('last_name').notNull().default(''),
    gender : text('gender'),
    role : roleEnum('role').notNull().default('student'),
    status : userStatusEnum('status').notNull().default('active'),
    program : text('program'),
    school : text('school'),
    level : text('level'),
    timezone : text('timezone').notNull().default('Africa/Accra'),
    prefs : jsonb('prefs').$type<Prefs>().notNull().default(defaultPrefs),
    color : text('color').notNull().default('#202020'),
    invitedById : uuid('invited_by_id'),
    createdAt : createdAt(),
    lastActiveAt : timestamp('last_active_at', { withTimezone : true }),
}, (table) => [
    uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
])

export const sessions = pgTable('sessions', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    tokenHash : text('token_hash').notNull().unique(),
    userAgent : text('user_agent'),
    createdAt : createdAt(),
    expiresAt : timestamp('expires_at', { withTimezone : true }).notNull(),
    lastUsedAt : timestamp('last_used_at', { withTimezone : true }).notNull().defaultNow(),
}, (table) => [index('sessions_user_idx').on(table.userId)])

export const userTokens = pgTable('user_tokens', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    tokenHash : text('token_hash').notNull().unique(),
    purpose : tokenPurposeEnum('purpose').notNull(),
    createdAt : createdAt(),
    expiresAt : timestamp('expires_at', { withTimezone : true }).notNull(),
    usedAt : timestamp('used_at', { withTimezone : true }),
})

/* Catalog: faculty ("school" in the admin UI) → program → course → topic */

export const institutions = pgTable('institutions', {
    id : uuid('id').primaryKey().defaultRandom(),
    shortName : text('short_name').notNull().unique(),
    name : text('name').notNull(),
})

export const faculties = pgTable('faculties', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : text('name').notNull().unique(),
    createdAt : createdAt(),
})

export const programs = pgTable('programs', {
    id : uuid('id').primaryKey().defaultRandom(),
    facultyId : uuid('faculty_id').notNull().references(() => faculties.id, { onDelete : 'restrict' }),
    name : text('name').notNull(),
    createdAt : createdAt(),
}, (table) => [uniqueIndex('programs_faculty_name_unique').on(table.facultyId, table.name)])

export const courses = pgTable('courses', {
    id : uuid('id').primaryKey().defaultRandom(),
    slug : text('slug').notNull().unique(),
    code : text('code').notNull(),
    name : text('name').notNull(),
    programId : uuid('program_id').references(() => programs.id, { onDelete : 'set null' }),
    color : text('color').notNull().default('#838383'),
    createdAt : createdAt(),
})

export const topics = pgTable('topics', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').notNull().references(() => courses.id, { onDelete : 'cascade' }),
    name : text('name').notNull(),
    createdAt : createdAt(),
}, (table) => [uniqueIndex('topics_course_name_unique').on(table.courseId, table.name)])

export const staffCourses = pgTable('staff_courses', {
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    courseId : uuid('course_id').notNull().references(() => courses.id, { onDelete : 'cascade' }),
}, (table) => [primaryKey({ columns : [table.userId, table.courseId] })])

/* Questions */

export const questions = pgTable('questions', {
    id : uuid('id').primaryKey().defaultRandom(),
    courseId : uuid('course_id').notNull().references(() => courses.id, { onDelete : 'restrict' }),
    topicId : uuid('topic_id').references(() => topics.id, { onDelete : 'set null' }),
    institutionId : uuid('institution_id').references(() => institutions.id, { onDelete : 'set null' }),
    difficulty : difficultyEnum('difficulty').notNull().default('Medium'),
    year : integer('year').notNull(),
    prompt : text('prompt').notNull(),
    options : text('options').array().notNull(),
    answerIndex : integer('answer_index').notNull(),
    explanation : text('explanation').notNull().default(''),
    authorId : uuid('author_id').references(() => users.id, { onDelete : 'set null' }),
    createdAt : createdAt(),
    updatedAt : timestamp('updated_at', { withTimezone : true }).notNull().defaultNow(),
    // Soft delete so past attempts and test reviews keep working
    deletedAt : timestamp('deleted_at', { withTimezone : true }),
}, (table) => [
    index('questions_course_idx').on(table.courseId),
    index('questions_created_idx').on(table.createdAt),
    check('questions_answer_in_range', sql`${table.answerIndex} >= 0 AND ${table.answerIndex} < cardinality(${table.options})`),
    check('questions_min_options', sql`cardinality(${table.options}) >= 2`),
])

export const questionAttempts = pgTable('question_attempts', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    questionId : uuid('question_id').notNull().references(() => questions.id, { onDelete : 'cascade' }),
    testId : uuid('test_id'),
    choice : integer('choice').notNull(),
    correct : boolean('correct').notNull(),
    createdAt : createdAt(),
}, (table) => [
    index('attempts_user_question_idx').on(table.userId, table.questionId),
    index('attempts_user_created_idx').on(table.userId, table.createdAt),
])

export const savedQuestions = pgTable('saved_questions', {
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    questionId : uuid('question_id').notNull().references(() => questions.id, { onDelete : 'cascade' }),
    createdAt : createdAt(),
}, (table) => [primaryKey({ columns : [table.userId, table.questionId] })])

export const comments = pgTable('comments', {
    id : uuid('id').primaryKey().defaultRandom(),
    questionId : uuid('question_id').notNull().references(() => questions.id, { onDelete : 'cascade' }),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    body : text('body').notNull(),
    createdAt : createdAt(),
}, (table) => [index('comments_question_idx').on(table.questionId, table.createdAt)])

export const flags = pgTable('flags', {
    id : uuid('id').primaryKey().defaultRandom(),
    questionId : uuid('question_id').notNull().references(() => questions.id, { onDelete : 'cascade' }),
    reporterId : uuid('reporter_id').references(() => users.id, { onDelete : 'set null' }),
    issue : flagIssueEnum('issue').notNull(),
    comment : text('comment').notNull().default(''),
    suggestedAnswer : integer('suggested_answer'),
    status : flagStatusEnum('status').notNull().default('open'),
    resolvedById : uuid('resolved_by_id').references(() => users.id, { onDelete : 'set null' }),
    resolvedAt : timestamp('resolved_at', { withTimezone : true }),
    resolutionNote : text('resolution_note'),
    createdAt : createdAt(),
}, (table) => [index('flags_status_idx').on(table.status, table.createdAt)])

/* Tests and challenges */

export const dailyChallenges = pgTable('daily_challenges', {
    id : uuid('id').primaryKey().defaultRandom(),
    day : date('day', { mode : 'string' }).notNull().unique(),
    courseId : uuid('course_id').notNull().references(() => courses.id, { onDelete : 'cascade' }),
    title : text('title').notNull(),
    questionIds : uuid('question_ids').array().notNull(),
    createdAt : createdAt(),
})

export interface TestAnswers { [questionId : string] : number }

export const tests = pgTable('tests', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    courseId : uuid('course_id').notNull().references(() => courses.id, { onDelete : 'cascade' }),
    challengeId : uuid('challenge_id').references(() => dailyChallenges.id, { onDelete : 'set null' }),
    mode : testModeEnum('mode').notNull(),
    title : text('title').notNull(),
    difficulty : text('difficulty').notNull().default('Mixed'),
    paperYear : integer('paper_year'),
    timeLimitSeconds : integer('time_limit_seconds').notNull(),
    instantFeedback : boolean('instant_feedback').notNull().default(false),
    questionIds : uuid('question_ids').array().notNull(),
    answers : jsonb('answers').$type<TestAnswers>(),
    score : integer('score'),
    total : integer('total').notNull(),
    durationSeconds : integer('duration_seconds'),
    startedAt : timestamp('started_at', { withTimezone : true }).notNull().defaultNow(),
    submittedAt : timestamp('submitted_at', { withTimezone : true }),
}, (table) => [
    index('tests_user_idx').on(table.userId, table.startedAt),
    uniqueIndex('tests_user_challenge_unique').on(table.userId, table.challengeId),
])

/* Notifications */

export const notifications = pgTable('notifications', {
    id : uuid('id').primaryKey().defaultRandom(),
    userId : uuid('user_id').notNull().references(() => users.id, { onDelete : 'cascade' }),
    kind : notificationKindEnum('kind').notNull(),
    title : text('title').notNull(),
    body : text('body').notNull().default(''),
    link : text('link'),
    // Dedupes generated notifications, e.g. one "challenge is live" per user per day
    dedupeKey : text('dedupe_key'),
    createdAt : createdAt(),
    readAt : timestamp('read_at', { withTimezone : true }),
}, (table) => [
    index('notifications_user_idx').on(table.userId, table.createdAt),
    uniqueIndex('notifications_dedupe_unique').on(table.userId, table.dedupeKey),
])
