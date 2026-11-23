# PrepRoom API

Base URL: `http://localhost:3001` in development (read it from `REACT_APP_API_URL`).

## Conventions

- **JSON only.** Send writes with `Content-Type: application/json`. A non-JSON body on POST/PUT/PATCH/DELETE gets `415`. This is part of the CSRF protection.
- **Auth is a cookie.** `POST /auth/login` and `POST /auth/signup` set an httpOnly `preproom_session` cookie (30 days, sliding). JavaScript cannot read it. Call the API with `axios.create({ baseURL, withCredentials: true })`. `Authorization: Bearer <token>` is also accepted for non-browser clients.
- **Logged in or not:** `GET /auth/me` returns `200 { user }` or `401`. Don't look for a cookie in JS.
- **IDs** are UUIDs. Courses can also be addressed by `slug` (`cs201`) wherever a route says `:course`. Field names use the frontends' style: `courseID`, `questionID`, `topicID`.
- **Errors** are always `{ "error": { "code", "message", "details"? } }`. `message` is written to show to people. Common codes: `validation_error` (400), `unauthorized` (401), `invalid_credentials` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `token_invalid` (410), `no_questions` (422), `rate_limited` (429).
- **Lists** return `{ items }`. Paged lists also return `total`, `limit` and `offset`.
- **Times** are ISO 8601 strings in UTC. `at` fields in `/me/progress` are epoch milliseconds, matching `frontend/src/store/progress.ts`.
- **Casing:** roles, statuses, flag statuses and test modes are lowercase (`moderator`, `invited`, `open`, `practice`). **Difficulty is title case** (`'Easy' | 'Medium' | 'Hard'`, plus `'Mixed'` for tests), both in responses and in filters and create bodies. Flag `issue` values are sentence case, exactly as listed below.
- **Question HTML:** `question`, `options` and `explanation` can contain HTML from the admin rich-text editor. Render them with `Interweave` as the UI does today.

Roles: `student`, `moderator` (only the courses assigned to them), `supervisor` (all courses, can change the catalog), `admin` (everything, including people).

---

## Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{ firstName, lastName?, email, password (≥8), gender?, program?, school?, level? }` | `201 { user }` + cookie. Already signed in, so there's no need to send people to the login page. |
| POST | `/auth/login` | `{ email, password }` | `{ user }` + cookie. `401 invalid_credentials` on any mismatch. |
| POST | `/auth/logout` | – | `204`, cookie cleared |
| GET | `/auth/me` | – | `{ user }` or `401` |
| POST | `/auth/forgot` | `{ email }` | always `202`. Emails a link to `APP_URL/auth/reset?token=…` |
| GET | `/auth/token?token=` | – | `{ purpose: 'reset' \| 'invite', email, firstName }`, or `410` if expired or used |
| POST | `/auth/reset` | `{ token, password, firstName?, lastName? }` | `{ user }` + cookie. Also used to accept staff invites (link has `&invite=1`). Signs out other devices. |

Login, signup, forgot and reset are rate-limited to 20 requests per 15 minutes per IP.

There's no email provider yet. In development the full email, including the link, is printed in the API log.

```ts
type User = {
  id, email, firstName, lastName, name, initials, gender, color,
  role: 'student' | 'moderator' | 'supervisor' | 'admin',
  status: 'active' | 'invited' | 'disabled',
  program, school, level,             // free text, e.g. 'BSc Computer Science', 'KNUST', 'Level 200'
  timezone,                           // IANA, default 'Africa/Accra'; streak days use it
  prefs: { dailyReminder, replies, weeklyReport },
  courses: string[] | null,           // moderators: assigned course ids; null = all courses (supervisor/admin) or a learner
  createdAt,
}
```

`courses` comes back from `/auth/login`, `/auth/signup`, `/auth/reset`, `/auth/me` and `GET /me`. Use it to filter course pickers for moderators. The server still enforces access either way.

## Me (requires login)

| Method | Path | Body / query | Returns |
|---|---|---|---|
| GET | `/me` | – | `{ user, stats }` |
| PATCH | `/me` | any of `{ name, firstName, lastName, gender, program, school, level, timezone }` (`name` splits into first and last) | `{ user }` |
| PATCH | `/me/prefs` | any of `{ dailyReminder, replies, weeklyReport }` | `{ prefs }` |
| POST | `/me/password` | `{ currentPassword, newPassword }` | `204`, other devices signed out |
| DELETE | `/me` | `{ password }` | `204`, account deleted |
| GET | `/me/stats` | – | `Stats` |
| GET | `/me/streak` | – | `Streak` |
| GET | `/me/progress` | – | `Progress`, shaped like the local `progress.ts` store, for hydrating it on login |
| GET | `/me/tests` | `?limit=20&courseID=` | `{ items: TestRecord[] }` |
| GET | `/me/saved` | – | `{ items: Question[] }` |
| GET | `/me/weak-topics` | – | `{ items: [{ courseID, topic, answers, correct, accuracy }] }` (≥3 answers each, worst first) |
| DELETE | `/me/attempts?courseID=` | – | `204`. Forgets **practice** answers for a course; test answers are kept. |

```ts
type Stats = { solved, answers, accuracy /* % */, tests, streak, bestStreak, activeToday }
type Streak = { current, best, activeToday, today: 'YYYY-MM-DD',
                week: { day, active, isToday, future }[] /* Monday → Sunday */ }
type Progress = {
  attempts: Record<questionID, { choice, correct, courseID, topic, at }>,  // latest answer per question
  saved: Record<questionID, at>,
  tests: TestRecord[],
  activeDays: string[],   // 'YYYY-MM-DD' in the user's timezone, oldest first
}
type TestRecord = { id, courseID, courseCode, courseName, courseColor, mode, title,
                    score, total, seconds, minutes, at, submittedAt, missed: questionID[] }
```

A day counts as active when the user answers at least one question, whether in practice or a test. Streaks are counted from those days, and today not being active yet doesn't break the streak.

## Catalog (public; adds per-user `progress` when logged in)

| Method | Path | Returns |
|---|---|---|
| GET | `/courses?programID=` | `{ items: Course[] }` |
| GET | `/courses/:course` | `Course & { topics: Topic[], papers: Paper[] }` |
| GET | `/courses/:course/topics` | `{ items: { id, name, questions }[] }` |
| GET | `/courses/:course/papers` | `{ items: { year, institution, questions }[] }` (newest first, for the "Past paper" picker) |
| GET | `/institutions` | `{ items: { id, shortName, name }[] }` (KNUST, UG, UCC, …) |
| GET | `/faculties`, `/programs` | `{ items }` (for program pickers) |

```ts
type Course = { id, slug, code, name, color, programID, questions /* count */, progress /* % answered */, answered }
```

## Questions

`GET /courses/:course/questions` is public. Query parameters:

| Param | Example | Notes |
|---|---|---|
| `difficulty` | `Hard` or `Easy,Medium` | repeatable / comma list |
| `topic` | `Trees` or a topic id | repeatable |
| `institution` | `KNUST,UG` | the "Schools" filter on the questions page |
| `search` | `dijkstra` | matches question and explanation text |
| `saved` | `true` | only questions the user saved |
| `sort` | `newest` (default), `oldest`, `hardest` | |
| `limit`, `offset` | `50`, `0` | max 200 |

Returns `{ items: Question[], total, limit, offset }`.

```ts
type Question = {
  id, courseID, topic /* 'General' if none */, topicID, difficulty: 'Easy'|'Medium'|'Hard',
  year, institution /* 'KNUST' | null */, question, options: string[],
  answer: number, explanation: string,         // left out inside unfinished tests (see below)
  discussions, saves, saved: boolean,
}
```

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/questions/:id` | – | `Question` |
| POST | `/questions/:id/attempts` | `{ choice }` | `201 { correct, answer, explanation, stats }`. Records a practice answer (login required). |
| GET | `/questions/:id/stats` | – | `AnswerStats`. Login required, and only after the caller has answered the question (staff always). `403` otherwise, since pick shares give the answer away. |
| PUT / DELETE | `/questions/:id/save` | – | `{ saved, saves }` (idempotent) |
| GET | `/questions/:id/comments` | – | `{ items: Comment[] }` oldest first (public) |
| POST | `/questions/:id/comments` | `{ body }` | `201 Comment`. Notifies the others in the thread (`reply`). |
| DELETE | `/questions/:id/comments/:commentId` | – | `204` (author or staff) |
| POST | `/questions/:id/flags` | `{ issue, comment?, suggestedAnswer? }` | `201 { id, status }`. `409` if this user already has an open report on it. |

`issue` is one of `'Wrong answer' | 'Typo' | 'Unclear question' | 'Duplicate' | 'Missing explanation'`.

```ts
type Comment = { id, body, createdAt, mine,
                 author: { id, name /* 'Esi M.' */, initials, color, isStaff } }
```

**AnswerStats** `{ attempts, correctRate, options }`: `attempts` is the number of students counted, `correctRate` is 0–1, and `options[i]` is the share (0–1) who picked option `i`. Only each student's **first** answer counts (practice or a submitted test), so retries don't skew it. `attempts: 0` gives zeros. In `GET /courses/:course/questions`, **every** item (logged in or not) carries the answer-safe `acceptance: { attempts, correctRate: number | null }` (`null` when nobody has answered). The full `stats` (with per-option shares) is added only for questions the logged-in caller has answered.

## Tests (requires login)

The server picks questions, keeps the clock and grades. Answers are hidden while a test is running unless `instantFeedback` is on, and they're always hidden in challenges.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/tests` | `TestConfigState`: `{ courseID, mode: 'mcqs'\|'paper'\|'challenge', count, minutes, difficulty: 'Mixed'\|'Easy'\|'Medium'\|'Hard', instantFeedback, year?, topics?: topicID[] }` | `201 RunningTest` |
| GET | `/tests/:id` | – | `RunningTest`, or `TestResult` once submitted. Use it to resume after a refresh. |
| PUT | `/tests/:id/answers` | `{ answers: Record<questionID, choice> }` | `{ answers }` (autosave) |
| POST | `/tests/:id/submit` | `{ answers: Record<questionID, choice> }` | `TestResult`. Safe to retry; a second submit returns the first result. |
| GET | `/tests` | `?limit&courseID` | same as `/me/tests` |

- **Practice** (`mcqs`) picks unseen questions first, then ones the user got wrong, then the rest.
- **Paper** returns every question from one course and `year` in paper order. Without a `year` it uses the latest paper. `count` is ignored.
- **Challenge** is the same as `POST /challenges/today/start`.
- `422 no_questions` means nothing matches the filters. Show its `message`.

```ts
type RunningTest = {
  id, status: 'in_progress', courseID, course: { id, slug, code, name, color },
  mode: 'practice'|'paper'|'challenge', title, difficulty, year, instantFeedback,
  timeLimitSeconds, startedAt, endsAt, remainingSeconds,   // drive the timer from endsAt
  total, answers /* autosaved */, questions: Question[] /* no answer/explanation unless instantFeedback */,
}
type TestResult = {
  id, status: 'submitted', courseID, course, mode, title, difficulty, year, instantFeedback,
  config: TestConfigState,            // pass to POST /tests for "Retake test"
  startedAt, submittedAt, timeLimitSeconds,
  score, total, correct, incorrect, skipped, percent, seconds,
  answers, byTopic: { topic, correct, total }[] /* weakest first */,
  questions: (Question & { chosen: number | null, status: 'correct'|'incorrect'|'skipped' })[],
  rank: number | null,                // today's rank for challenges
  late?: boolean,                     // submitted after the time limit plus 30 s grace
}
```

Submitting also creates a `result` notification and, at streak milestones (3, 5, 7, 14, 30 … days), a `streak` notification.

## Daily challenge

There is one challenge per day for everyone: 5 questions, 10 minutes, rotating through courses. Days change at midnight in Ghana (UTC).

| Method | Path | Returns |
|---|---|---|
| GET | `/challenges/today` | `{ id, day, title, course, questionCount, minutes, players, recentPlayers: { initials, color }[], me: { status: 'not_started'\|'in_progress'\|'done', testID, score, rank } \| null }`. Returns `404 no_challenge` if no course has 5 questions yet. |
| POST | `/challenges/today/start` | `201 RunningTest`. Resumes if already started; `409 already_played` with `details.testID` if already done. |
| GET | `/challenges/recent?limit=4` | `{ items: { testID, day, score, total, rank, courseID, courseName, courseCode, courseColor }[] }` |
| GET | `/challenges/leaderboard?period=week\|today\|all&limit=10` | `{ period, from, to, entries: { userID, rank, name, initials, school, color, score, isMe }[], me: { rank, score } \| null }` |
| GET | `/challenges/streak` | `Streak` |

Leaderboard points for each challenge are 100 per correct answer plus up to 50 for speed. Ties go to the faster time.

## Notifications (requires login)

| Method | Path | Returns |
|---|---|---|
| GET | `/notifications?filter=all\|unread\|mentions&limit=50` | `{ items: { id, kind, title, body, link, createdAt, readAt, unread }[], unread }` |
| GET | `/notifications/unread-count` | `{ unread }` (for the top-bar badge) |
| POST | `/notifications/read` | body `{ ids?: string[] }`; marks all as read when `ids` is left out. Returns `204`. |

Learner kinds are `reply`, `challenge`, `streak`, `result` and `system`. Staff kinds are `flag`, `question` and `people`. `link` is an app path to open on click. The "Today's challenge is live" item is added the first time a learner checks each day, if `prefs.dailyReminder` is on. Group items into Today / This week / Earlier on the client using `createdAt`.

---

## Admin (`/admin/*`, staff only)

Moderators only see and change their assigned courses. Supervisors and admins see all courses. Only admins manage people. Shapes follow `admin/src/data/sample.ts`.

### Overview

`GET /admin/overview` returns:

```ts
{ questions: { total, today, week }, openFlags, staff: { total, invited },
  learners: { total, activeThisWeek },
  weeklyActivity: number[14] /* questions added per day, oldest first */,
  activity: { day, count }[],
  recentQuestions: AdminQuestion[] /* 8 */,
  topContributors: { id, name, color, count }[] /* last 30 days */,
  courses: { id, code, name, color, questions, openFlags, testsThisWeek }[] }
```

### Catalog

Reading is open to all staff. Changes need a supervisor or admin, except topics, which moderators can add to their own courses.

| Resource | List | Create | Update | Delete |
|---|---|---|---|---|
| Schools (faculties) `{ id, name, programs }` | `GET /admin/schools` | `POST { name }` | `PATCH /:id` | `DELETE /:id` |
| Programs `{ id, name, schoolID }` | `GET /admin/programs` | `POST { name, schoolID }` | `PATCH /:id` | `DELETE /:id` |
| Courses `{ id, slug, code, name, programID, color, questions }` | `GET /admin/courses` | `POST { code, name, programID?, color? }` (slug comes from code) | `PATCH /:id` | `DELETE /:id` |
| Topics `{ id, name, courseID, questions }` | `GET /admin/topics?courseID=` | `POST { name, courseID }` | `PATCH /:id { name }` | `DELETE /:id` (its questions become "General") |

Deleting something that is still in use returns `409` with a message saying what to move first.

### Questions

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/questions` | `?courseID=a,b&topic&difficulty&search&authorID&flagged=true&sort&limit&offset` returns `{ items: AdminQuestion[], total, limit, offset }`. `sort` = `newest` (default) \| `oldest` \| `acceptance` (lowest first, so the hardest questions come first) \| `-acceptance`; unanswered questions sort last for both acceptance orders |
| GET | `/admin/questions/:id` | `AdminQuestion` |
| POST | `/admin/questions` | `{ question, options (2–8), answer (index), explanation?, courseID, topicID? \| topic? (name; created if new), difficulty?, year?, institution? }` returns `201 AdminQuestion` |
| POST | `/admin/questions/bulk` | `{ questions: [...same as above] }` (≤300, all-or-nothing) returns `{ created, ids }` |
| PATCH | `/admin/questions/:id` | any subset of the create fields |
| DELETE | `/admin/questions/:id` | soft delete (past tests still show it) and dismisses its open flags. Moderators can only delete their own questions. |

```ts
type AdminQuestion = { id, question, options, answer, explanation, courseID, topic, topicID,
  difficulty, year, institution, author, authorID, addedAt, updatedAt, flags /* open count */,
  stats: { attempts: number, correctRate: number | null } }
```

`stats` follows the same first-answer rule as `AnswerStats`. `correctRate` (the "acceptance") is 0–1 and `null` when nobody has answered yet. It is also on `recentQuestions` in `/admin/overview`.

### Flags

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/flags` | `?status=open,resolved&courseID&questionID&limit&offset` returns `{ items: Flag[], counts: { open, resolved, dismissed } }`, open first |
| GET | `/admin/flags/:id` | `Flag` |
| PATCH | `/admin/flags/:id` | `{ status: 'open'\|'resolved'\|'dismissed', note?, applyAnswer? }`. `applyAnswer` changes the question's answer in the same step. Closing a flag notifies the reporter, using `note` as the message when given. |

```ts
type Flag = { id, questionID, question, options, answer, courseID, courseCode, reporter, reporterID,
  issue, comment, suggestedAnswer, status, raisedAt, resolvedBy, resolvedAt, resolutionNote }
```

### People (admin only)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/people` | `{ items: Person[] }` (all staff) |
| POST | `/admin/people/invite` | `{ name \| firstName+lastName, email, role: 'moderator'\|'supervisor'\|'admin', courses: courseID[] }`. Emails a 7-day invite link. An existing learner with that email is promoted instead. |
| POST | `/admin/people/:id/resend-invite` | `202` |
| PATCH | `/admin/people/:id` | `{ role?, courses?, status?: 'active'\|'disabled' }` (disabling signs them out) |
| DELETE | `/admin/people/:id` | Removes them from the team. Unaccepted invites are deleted; anyone else becomes a learner. |
| GET | `/admin/students?search&limit&offset` | learners list (supervisor or admin) |

```ts
type Person = { id, name, email, role, status: 'active'|'invited'|'disabled', color,
  courses: courseID[], questionsAdded, flagsResolved, lastActive /* ISO or null */, createdAt }
```

The last active admin can't be demoted, disabled or removed.

---

## Running it

```bash
cd backend
cp .env.example .env          # defaults work with a local Postgres
createdb preproom             # once
npm install
npm run db:migrate && npm run db:seed
npm run dev                   # http://localhost:3001
npm test                      # integration tests against the preproom_test database
```

The demo logins all use the password `preproom123`:

- `admin@preproom.app` (admin)
- `student@preproom.app` (learner with a 4-day streak)
- `ama.owusu@preproom.app` (supervisor)
- `efua.asante@preproom.app` (moderator for PHY 104 and ECON 101)

`npm run db:reset` drops everything, then migrates and reseeds. After changing `src/db/schema.ts`, run `npm run db:generate` to write a new migration into `drizzle/`.
