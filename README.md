# Carleton Smart Scheduler

Smart Scheduler was built for a Carleton engineering capstone project. A student
uploads their academic audit, picks the courses they still need, and gets a set of
conflict-free timetables for the term. The app checks prerequisites against the
audit, works out which electives still fit around the rest of the plan, and keeps
a separate plan for each term.

It has a React and Vite client, an Express API, a PostgreSQL database managed
through Prisma, and command-line tools for importing and simulating data. It has
not been deployed, and it should be treated as a course project rather than a
production advising service.

Raw academic audits and reports containing student information are excluded from
this portfolio repository. The original course repository remains private.

## Team and contributions

Group G67 consisted of Anas Ayoubi, Hakeem Khan, Pietro Adamvoski, and Safiullah
Rattar.

Pietro worked primarily on the PostgreSQL and Prisma data model, including the
tree representation used for prerequisite rules. He also contributed to the
prerequisite evaluator, project integration, and documentation.

## What it does

The planner reads the HTML or PDF audit that Carleton Central produces. The
import page includes a picture guide for downloading the audit as HTML, which
parses more reliably than PDF. From the audit it builds a degree map of the
requirements that are still open. Courses a student can't take yet are listed
with the reason: a missing prerequisite, a term the course isn't offered in, or a
course already planned for another term.

Each term (Fall, Winter, Summer) has its own plan. Switching terms saves the
current one, and a course planned in Fall can't be added again in Winter. Elective
credit counts carry across terms as well.

When the student picks electives on the schedule page, the API checks every
lecture, lab, and tutorial combination to decide whether each option fits. It
also flags electives that would rule out other options, and asks before adding
one of those.

Before finding schedules, the student can list times to avoid, such as a work
shift or every weekday after 5pm. Sections that meet during those times are left
out of every timetable, fit check, and alternative the planner offers.

Sections of a course that meet at exactly the same times count as one timetable
option, so the options list only shows timetables that actually differ. The
calendar marks those classes with the number of sections available, and the
student picks one from the list beside the option selector. When the student
switches options, the sections that changed are animated on the calendar.

Sections can be in person, online at a set time, online on the student's own
schedule, or hybrid. The schedule page can filter by delivery, and asynchronous
courses sit in their own strip under the weekly calendar.

## Requirements

- Node.js 20 or newer
- PostgreSQL
- `pdftotext` from Poppler for PDF imports

HTML audit imports do not require `pdftotext`.

## Setup

Install the API and client dependencies:

```bash
npm install
npm --prefix Carletonscheduler install
```

Copy `.env.example` to `.env` and fill in the database connection, a JWT secret,
and the browser origin. `.env` is ignored by git. Load it into the shell before
starting the application:

```bash
cp .env.example .env
set -a
. ./.env
set +a
```

The client talks to `http://localhost:3001/api` by default. To use another API,
set `VITE_API_URL` in `Carletonscheduler/.env.local`, following
`Carletonscheduler/.env.example`.

Create the schema and load the course and timetable data:

```bash
npm run db:setup
npm run db:seed
```

For local demonstrations, copy the Fall 2025 and Winter 2026 timetable snapshots
into simulated Fall 2026, Winter 2027, and Summer 2027 terms:

```bash
npm run db:simulate-terms
```

These sample terms reuse the original course offerings, sections, CRNs, and
meeting times. Meeting dates, if present, are shifted forward one year. Summer
2027 reuses the Winter snapshot because only Fall and Winter source terms exist.
They are simulated data, not updated Carleton timetable information. The command
can be rerun without duplicating its samples; run it again after `db:seed`, which
rebuilds the section data.

The timetable export has no delivery mode, and many sections have no meeting
times. To try the online features, give those sections a simulated mix of
delivery modes and generated times:

```bash
npm run db:simulate-delivery
npm run db:simulate-delivery -- --revert   # undo it
```

Older seeds stored admission requirements such as `HIGH_SCHOOL_REQUIREMENT` as
"needs department permission", which locked first-year courses for every student.
The current seed stores them correctly. A database seeded before that fix can be
repaired in place:

```bash
npm run db:repair-prerequisites             # list what would change
npm run db:repair-prerequisites -- --apply
```

Create a user account. Set `USER_ROLE=ADMIN` only for someone who needs access
to the administration routes.

```bash
USER_EMAIL="student@example.com" \
USER_PASSWORD="a-long-unique-password" \
USER_NAME="Student" \
USER_ROLE="STUDENT" \
npm run user:create
```

Start the API and client together:

```bash
npm run dev
```

The client runs at `http://localhost:3002`, and the API runs at
`http://localhost:3001`.

## Checks

`npm run check` runs the unit tests, type-checks the server and the client, and
builds the client. None of it needs a database. GitHub Actions runs the same
command on pushes to `main` and on pull requests.

```bash
npm run check
npm run validate:data          # needs the seeded database
npm run benchmark:schedules    # needs the seeded database
```

The unit tests cover the audit parsers, prerequisite evaluation and the reasons
shown to students, delivery-mode filtering, the elective fit check, and password
hashing. API routes and the browser are not covered by automated tests.

## Testing with simulated audits

Real audits contain student information, so the repository includes a generator
for made-up ones instead. Each simulated student is in the Fall 2021 Software
Engineering program (or a later intake) and has a different history, such as a
first-year with nothing completed, a student who failed a prerequisite and never
retook it, or one who started third-year courses before finishing second year.

```bash
npm run audits:generate                 # write test-audits/*.html
npm run audits:generate -- --check      # also parse each one and try scheduling it
```

`test-audits/` holds audits in the layout of a page saved from Carleton Central,
using the real requirement structure for that program. `test-audits/simple/`
holds the same students in the shorter layout of `test-audit.html`. Upload any of
them through the import page. The unit tests parse every simulated audit and
compare the result with the history it was generated from.

## Current limits

Audit parsing depends on the layout of Carleton's exported HTML and PDF files.
HTML gives more reliable results because PDF extraction can lose layout
information. Requirements that name no course codes, such as "1.0 credit from
SYSC or ELEC courses at the 3000-level or above", are dropped during parsing, so
the planner can't schedule them. The parser processes uploaded audits in memory,
and the application does not retain the raw files. An administrator can store
the resulting student and course-completion records in PostgreSQL.

Prerequisites are checked against completed courses only. A course whose
prerequisite is planned earlier in the same term, such as ECOR 1041 before ECOR
1042, shows as unavailable.

Users are stored in the database with scrypt password hashes. The API uses JWTs
for authenticated requests and checks the administrator role on restricted
routes. Registration, password reset, token revocation, and rate limiting have
not been implemented.

Course prerequisites and timetable sections are snapshots and will become stale.
Database setup uses `prisma db push` instead of versioned migrations.

## Data sources

Course descriptions and prerequisite rules came from Carleton University course
pages. Timetable data must be supplied locally in the format used by `Sched.csv`.
Delivery modes and some meeting times are simulated, as described above. This
project is not affiliated with or endorsed by Carleton University.
