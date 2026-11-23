import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { questionAttempts, questions } from '../db/schema'

export interface AnswerStats {
    attempts : number        // students counted (first answer each)
    correctRate : number     // 0–1
    options : number[]       // pick share per option index, 0–1
}

// Each student's first answer only (practice or submitted test), so retries can't skew it.
export const answerStats = async (questionIds : string[]) => {
    const result = new Map<string, AnswerStats>()
    if (questionIds.length === 0) return result
    const ids = sql.join(questionIds.map((id) => sql`${id}::uuid`), sql`, `)
    const { rows } = await db.execute<{ question_id : string, option_count : number, attempts : number, correct : number, picks : number[] | null }>(sql`
        with firsts as (
            select distinct on (a.user_id, a.question_id) a.question_id, a.choice, a.correct
            from ${questionAttempts} a
            where a.question_id in (${ids})
            order by a.user_id, a.question_id, a.created_at
        )
        select q.id as question_id,
               coalesce(array_length(q.options, 1), 0)::int as option_count,
               count(f.question_id)::int as attempts,
               count(*) filter (where f.correct)::int as correct,
               array_remove(array_agg(f.choice), null) as picks
        from ${questions} q
        left join firsts f on f.question_id = q.id
        where q.id in (${ids})
        group by q.id`)
    for (const row of rows) {
        const counts = new Array<number>(row.option_count).fill(0)
        for (const pick of row.picks ?? []) if (pick < counts.length) counts[pick] += 1
        const share = (value : number) => row.attempts ? Math.round(value / row.attempts * 1000) / 1000 : 0
        result.set(row.question_id, { attempts : row.attempts, correctRate : share(row.correct), options : counts.map(share) })
    }
    return result
}

// Which of these questions the user has already answered at least once
export const answeredBy = async (userId : string, questionIds : string[]) => {
    if (questionIds.length === 0) return new Set<string>()
    const rows = await db.selectDistinct({ id : questionAttempts.questionId }).from(questionAttempts)
        .where(and(eq(questionAttempts.userId, userId), inArray(questionAttempts.questionId, questionIds)))
    return new Set(rows.map((row) => row.id))
}
