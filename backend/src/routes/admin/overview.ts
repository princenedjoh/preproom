import { Router } from 'express'
import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm'
import { db, outer } from '../../db/client'
import { courses, flags, questionAttempts, questions, tests, users } from '../../db/schema'
import { currentUser, manageableCourseIds, STAFF } from '../../middleware/auth'
import { adminBase, presentAdminQuestion } from '../../services/questions'

export const adminOverviewRouter = Router()

adminOverviewRouter.get('/', async (req, res) => {
    const allowed = await manageableCourseIds(currentUser(req))
    const inScope = allowed ? (allowed.length ? inArray(questions.courseId, allowed) : sql`false`) : undefined
    const live = and(isNull(questions.deletedAt), inScope)

    const [
        [questionTotals], [openFlags], [people], [learners], activity, recent, contributors, [activeLearners],
    ] = await Promise.all([
        db.select({
            total : sql<number>`count(*)::int`,
            today : sql<number>`count(*) filter (where ${questions.createdAt} >= date_trunc('day', now()))::int`,
            week : sql<number>`count(*) filter (where ${questions.createdAt} >= now() - interval '7 days')::int`,
        }).from(questions).where(live),
        db.select({ count : sql<number>`count(*)::int` }).from(flags)
            .innerJoin(questions, eq(questions.id, flags.questionId))
            .where(and(eq(flags.status, 'open'), inScope)),
        db.select({
            total : sql<number>`count(*)::int`,
            invited : sql<number>`count(*) filter (where ${users.status} = 'invited')::int`,
        }).from(users).where(inArray(users.role, STAFF)),
        db.select({ count : sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'student')),
        // Questions added per day for the last 14 days, oldest first
        db.execute<{ day : string, count : number }>(sql`
            select to_char(d, 'YYYY-MM-DD') as day, count(q.id)::int as count
            from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') d
            left join ${questions} q on date_trunc('day', q.created_at) = d and q.deleted_at is null
                ${allowed ? (allowed.length ? sql`and q.course_id in (${sql.join(allowed.map((id) => sql`${id}::uuid`), sql`, `)})` : sql`and false`) : sql``}
            group by d order by d
        `),
        adminBase().where(live).orderBy(desc(questions.createdAt)).limit(8),
        db.select({
            id : users.id,
            name : sql<string>`trim(${users.firstName} || ' ' || ${users.lastName})`,
            color : users.color,
            count : sql<number>`count(*)::int`,
        }).from(questions).innerJoin(users, eq(users.id, questions.authorId))
            .where(and(live, gt(questions.createdAt, sql`now() - interval '30 days'`)))
            .groupBy(users.id).orderBy(desc(sql`count(*)`)).limit(5),
        db.select({ count : sql<number>`count(distinct ${questionAttempts.userId})::int` }).from(questionAttempts)
            .where(gt(questionAttempts.createdAt, sql`now() - interval '7 days'`)),
    ])

    const courseRows = await db.select({
        id : courses.id, code : courses.code, name : courses.name, color : courses.color,
        questions : sql<number>`(select count(*)::int from ${questions} q where q.course_id = ${outer(courses.id)} and q.deleted_at is null)`,
        openFlags : sql<number>`(select count(*)::int from ${flags} f join ${questions} q on q.id = f.question_id where q.course_id = ${outer(courses.id)} and f.status = 'open')`,
        testsThisWeek : sql<number>`(select count(*)::int from ${tests} t where t.course_id = ${outer(courses.id)} and t.submitted_at > now() - interval '7 days')`,
    }).from(courses).where(allowed ? (allowed.length ? inArray(courses.id, allowed) : sql`false`) : undefined)

    res.json({
        questions : questionTotals,
        openFlags : openFlags.count,
        staff : people,
        learners : { total : learners.count, activeThisWeek : activeLearners.count },
        weeklyActivity : activity.rows.map((row) => row.count),
        activity : activity.rows,
        recentQuestions : recent.map(presentAdminQuestion),
        topContributors : contributors,
        courses : courseRows,
    })
})
