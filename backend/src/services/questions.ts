import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { db, type DbOrTx, outer } from '../db/client'
import {
    comments, courses, flags, institutions, questionAttempts, questions, savedQuestions, topics, users, type Difficulty,
} from '../db/schema'
import { notFound } from '../lib/errors'

/* Shapes returned to clients. Field names follow the frontend types (courseID, ...). */

export interface LearnerQuestion {
    id : string
    courseID : string
    topic : string
    topicID : string | null
    difficulty : Difficulty
    year : number
    institution : string | null
    question : string
    options : string[]
    answer? : number
    explanation? : string
    discussions : number
    saves : number
    saved : boolean
}

const discussionsCount = sql<number>`(select count(*)::int from ${comments} where ${comments.questionId} = ${outer(questions.id)})`
const savesCount = sql<number>`(select count(*)::int from ${savedQuestions} where ${savedQuestions.questionId} = ${outer(questions.id)})`
const savedBy = (userId? : string) => userId
    ? sql<boolean>`exists(select 1 from ${savedQuestions} where ${savedQuestions.questionId} = ${outer(questions.id)} and ${savedQuestions.userId} = ${userId})`
    : sql<boolean>`false`

export const learnerColumns = (userId? : string) => ({
    id : questions.id,
    courseID : questions.courseId,
    topic : sql<string>`coalesce(${topics.name}, 'General')`,
    topicID : questions.topicId,
    difficulty : questions.difficulty,
    year : questions.year,
    institution : institutions.shortName,
    question : questions.prompt,
    options : questions.options,
    answer : questions.answerIndex,
    explanation : questions.explanation,
    discussions : discussionsCount,
    saves : savesCount,
    saved : savedBy(userId),
})

const learnerBase = (userId? : string, client : DbOrTx = db) => client
    .select(learnerColumns(userId))
    .from(questions)
    .leftJoin(topics, eq(topics.id, questions.topicId))
    .leftJoin(institutions, eq(institutions.id, questions.institutionId))

export const withoutAnswer = (question : LearnerQuestion) : LearnerQuestion => {
    const { answer, explanation, ...rest } = question
    return rest
}

export const getLearnerQuestion = async (id : string, userId? : string) => {
    const [row] = await learnerBase(userId).where(and(eq(questions.id, id), isNull(questions.deletedAt))).limit(1)
    if (!row) throw notFound('Question')
    return row as LearnerQuestion
}

// Keeps the caller's order; includes soft-deleted questions so old tests still review.
export const getLearnerQuestionsByIds = async (ids : string[], userId? : string) => {
    if (ids.length === 0) return []
    const rows = await learnerBase(userId).where(inArray(questions.id, ids)) as LearnerQuestion[]
    const byId = new Map(rows.map((row) => [row.id, row]))
    return ids.map((id) => byId.get(id)).filter((row) : row is LearnerQuestion => !!row)
}

export interface QuestionFilters {
    courseId : string
    difficulty? : Difficulty[]
    topic? : string[]          // topic ids or names
    institution? : string[]    // institution short names
    search? : string
    savedOnly? : boolean
    sort? : 'newest' | 'oldest' | 'hardest'
    limit : number
    offset : number
}

const difficultyRank = sql`case ${questions.difficulty} when 'Hard' then 2 when 'Medium' then 1 else 0 end`
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const listLearnerQuestions = async (filters : QuestionFilters, userId? : string) => {
    const conditions : (SQL | undefined)[] = [eq(questions.courseId, filters.courseId), isNull(questions.deletedAt)]
    if (filters.difficulty?.length) conditions.push(inArray(questions.difficulty, filters.difficulty))
    if (filters.topic?.length) {
        const ids = filters.topic.filter((value) => UUID.test(value))
        const names = filters.topic.filter((value) => !UUID.test(value))
        conditions.push(or(
            ids.length ? inArray(questions.topicId, ids) : undefined,
            names.length ? inArray(sql`coalesce(${topics.name}, 'General')`, names) : undefined,
        ))
    }
    if (filters.institution?.length) conditions.push(inArray(institutions.shortName, filters.institution))
    if (filters.search?.trim()) {
        const term = `%${filters.search.trim().replace(/[%_\\]/g, (char) => `\\${char}`)}%`
        conditions.push(or(ilike(questions.prompt, term), ilike(questions.explanation, term)))
    }
    if (filters.savedOnly && userId) conditions.push(savedBy(userId))

    const where = and(...conditions)
    const order = filters.sort === 'oldest' ? [asc(questions.year), asc(questions.createdAt)]
        : filters.sort === 'hardest' ? [desc(difficultyRank), desc(questions.year)]
        : [desc(questions.year), desc(questions.createdAt)]

    const [items, [{ total }]] = await Promise.all([
        learnerBase(userId).where(where).orderBy(...order, asc(questions.id)).limit(filters.limit).offset(filters.offset),
        db.select({ total : sql<number>`count(*)::int` }).from(questions)
            .leftJoin(topics, eq(topics.id, questions.topicId))
            .leftJoin(institutions, eq(institutions.id, questions.institutionId))
            .where(where),
    ])
    return { items : items as LearnerQuestion[], total, limit : filters.limit, offset : filters.offset }
}

/* Staff view */

export const adminColumns = {
    id : questions.id,
    question : questions.prompt,
    options : questions.options,
    answer : questions.answerIndex,
    explanation : questions.explanation,
    courseID : questions.courseId,
    topic : sql<string>`coalesce(${topics.name}, '')`,
    topicID : questions.topicId,
    difficulty : questions.difficulty,
    year : questions.year,
    institution : institutions.shortName,
    author : sql<string>`coalesce(trim(${users.firstName} || ' ' || ${users.lastName}), 'Editor')`,
    authorID : questions.authorId,
    addedAt : questions.createdAt,
    updatedAt : questions.updatedAt,
    flags : sql<number>`(select count(*)::int from ${flags} where ${flags.questionId} = ${outer(questions.id)} and ${flags.status} = 'open')`,
    statsAttempts : sql<number>`(select count(distinct a.user_id)::int from ${questionAttempts} a where a.question_id = ${outer(questions.id)})`,
    statsCorrect : sql<number>`(select count(*)::int from (select distinct on (a.user_id) a.correct from ${questionAttempts} a
        where a.question_id = ${outer(questions.id)} order by a.user_id, a.created_at) f where f.correct)`,
}

// Share of students whose first answer was right; null when nobody has answered
export const acceptance = sql`(${adminColumns.statsCorrect}::float / nullif(${adminColumns.statsAttempts}, 0))`

type AdminRow = { statsAttempts : number, statsCorrect : number }
export const presentAdminQuestion = <T extends AdminRow>({ statsAttempts, statsCorrect, ...rest } : T) => ({
    ...rest,
    stats : { attempts : statsAttempts, correctRate : statsAttempts ? Math.round(statsCorrect / statsAttempts * 1000) / 1000 : null },
})

export const adminBase = (client : DbOrTx = db) => client
    .select(adminColumns)
    .from(questions)
    .leftJoin(topics, eq(topics.id, questions.topicId))
    .leftJoin(institutions, eq(institutions.id, questions.institutionId))
    .leftJoin(users, eq(users.id, questions.authorId))

export const getAdminQuestion = async (id : string, client : DbOrTx = db) => {
    const [row] = await adminBase(client).where(and(eq(questions.id, id), isNull(questions.deletedAt))).limit(1)
    if (!row) throw notFound('Question')
    return presentAdminQuestion(row)
}

/* Courses */

export const findCourse = async (idOrSlug : string) => {
    const [course] = await db.select().from(courses)
        .where(UUID.test(idOrSlug) ? eq(courses.id, idOrSlug) : eq(courses.slug, idOrSlug.toLowerCase()))
        .limit(1)
    if (!course) throw notFound('Course')
    return course
}

// Finds a topic by name inside a course, creating it if needed
export const ensureTopic = async (client : DbOrTx, courseId : string, name : string) => {
    const trimmed = name.trim()
    await client.insert(topics).values({ courseId, name : trimmed }).onConflictDoNothing()
    const [topic] = await client.select().from(topics).where(and(eq(topics.courseId, courseId), eq(topics.name, trimmed))).limit(1)
    return topic
}

export const ensureInstitution = async (client : DbOrTx, shortName : string) => {
    const trimmed = shortName.trim().toUpperCase()
    await client.insert(institutions).values({ shortName : trimmed, name : trimmed }).onConflictDoNothing()
    const [row] = await client.select().from(institutions).where(eq(institutions.shortName, trimmed)).limit(1)
    return row
}
