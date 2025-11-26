# Smart Scheduler - Technical Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Core Algorithms](#core-algorithms)
4. [Database Design](#database-design)
5. [API Documentation](#api-documentation)
6. [Design Principles](#design-principles)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)

---

## System Overview

The Smart Scheduler is a full-stack web application designed to help Carleton University engineering students plan their academic schedules. The system validates prerequisites, generates conflict-free timetables, and provides intelligent course recommendations.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **UI Framework**: Radix UI + TailwindCSS

### Key Features
1. **Prerequisite Validation**: Recursive tree-based validation with grade requirements
2. **Schedule Generation**: Backtracking algorithm for conflict-free timetable generation
3. **Academic Audit Parsing**: Automated extraction of completed courses from HTML files
4. **Intelligent Recommendations**: Course suggestion based on completion history

---

## Architecture Patterns

### 1. Model-View-Controller (MVC)

The backend follows MVC pattern:
- **Model**: Prisma schema defines data models (`Course`, `Section`, `Student`, etc.)
- **View**: JSON API responses (no HTML views, this is an API server)
- **Controller**: Route handlers in `server/routes/*` orchestrate business logic

**Defense Point**: MVC provides separation of concerns, making the codebase maintainable and testable. Each layer can be modified independently without affecting others.

### 2. Repository Pattern

Database access is abstracted through Prisma Client:
- Routes don't contain raw SQL
- Prisma provides type-safe database queries
- Easy to mock for testing

**File**: `server/routes/courses.ts:46-68`

```typescript
const courses = await prisma.course.findMany({
  where: {
    OR: [
      { id: { contains: q.toUpperCase(), mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } }
    ]
  },
  include: { prerequisiteExpression: true }
})
```

### 3. Service Layer Pattern

Complex business logic is separated into service modules:
- `cli/prerequisite-validator.ts`: Prerequisite validation logic
- `cli/audit-parser.ts`: Academic audit parsing logic
- `server/routes/schedules.ts`: Schedule generation algorithm

**Defense Point**: Separating business logic from HTTP concerns makes the code more reusable and testable. The same prerequisite validator is used by both CLI and API.

### 4. Strategy Pattern

Multiple strategies for different operations:
- **File Upload**: Multer uses different storage strategies (memory, disk)
- **Prerequisite Evaluation**: Different strategies for AND, OR, COURSE, YEAR_STANDING nodes

---

## Core Algorithms

### 1. Prerequisite Validation Algorithm

**Problem**: Given a student's transcript and a course, determine if the student meets all prerequisites.

**Data Structure**: Tree with typed nodes (AND, OR, COURSE, YEAR_STANDING, PERMISSION)

**Algorithm**: Recursive tree traversal with boolean logic evaluation

```
function evaluatePrerequisiteNode(node, transcript):
    case node.type:
        when AND:
            return all(evaluatePrerequisiteNode(child) for child in node.children)
        when OR:
            return any(evaluatePrerequisiteNode(child) for child in node.children)
        when COURSE:
            return node.courseId in transcript.completedCourses 
                   AND transcript.grades[node.courseId] >= node.requiredGrade
        when YEAR_STANDING:
            return transcript.currentYear >= node.requiredYear
        when PERMISSION:
            return transcript.hasSpecialPermission
```

**Complexity Analysis**:
- Time: O(n) where n = number of nodes in prerequisite tree
- Space: O(h) where h = height of tree (recursion stack)

**File**: `cli/prerequisite-validator.ts:66-194`

**Defense Points**:
- Why recursive? Tree structure naturally maps to recursion, making code readable
- Why not iterative? Would require explicit stack management, less intuitive
- Optimization: Could cache results for repeated subtrees (memoization)

### 2. Schedule Generation Algorithm

**Problem**: Given n courses, each with m sections, find all valid timetable combinations with no time conflicts.

**Type**: Constraint Satisfaction Problem (CSP)

**Algorithm**: Backtracking with forward checking

```
function generateSchedules(courses, index, currentSelections):
    if index == len(courses):
        return [currentSelections]  // Base case: complete schedule
    
    validSchedules = []
    for section in courses[index].sections:
        if not hasConflict(section, currentSelections):
            currentSelections.push(section)
            validSchedules += generateSchedules(courses, index + 1, currentSelections)
            currentSelections.pop()  // Backtrack
    
    return validSchedules
```

**Complexity Analysis**:
- Worst Case Time: O(b^d) where b = avg sections per course, d = number of courses
- Average Case: Much better due to conflict pruning
- Space: O(d) for recursion stack

**File**: `server/routes/schedules.ts:155-189`

**Optimizations**:
1. **Early Termination**: Stop when `maxSchedules` reached
2. **Forward Checking**: Detect conflicts before recursing (fail fast)
3. **Heuristic Ordering**: Could prioritize courses with fewer sections (not implemented)

**Defense Points**:
- **Why Backtracking?** Explores search space systematically, guaranteed to find all solutions
- **Alternative Algorithms**:
  - Branch and Bound: Useful if we want optimal schedule (single best)
  - Dynamic Programming: Not applicable (no overlapping subproblems)
  - Genetic Algorithm: Overkill for this problem size, non-deterministic

- **Time Conflict Detection**: Interval overlap problem
  - Two time slots [start1, end1] and [start2, end2] conflict if:
    `start1 < end2 AND start2 < end1`
  - O(1) time complexity

**File**: `server/routes/schedules.ts:87-106`

### 3. Academic Audit Parsing Algorithm

**Problem**: Extract student information and completed courses from HTML file.

**Algorithm**: Regular expression pattern matching

```
1. Extract student ID: /(\d{9})/
2. Extract student name: /([A-Z][a-z]+), ([A-Z][a-z]+)/
3. Extract program: /Bachelor of Engineering - ([^<]+)/
4. Extract courses: /<tr.*class="takenCourse".*>[\s\S]*?<td.*class="course".*>([A-Z]{3,4}\s+\d{4})[\s\S]*?<td.*class="grade".*>([^<]+)/g
```

**File**: `cli/audit-parser.ts:16-52`

**Complexity**: O(n) where n = size of HTML file

**Defense Points**:
- **Why Regex?** Fast, readable for structured HTML
- **Limitations**: Brittle if HTML structure changes
- **Alternative**: HTML parser library (jsdom, cheerio) - more robust but heavier

---

## Database Design

### Entity-Relationship Model

```
Student (1) ────< (N) CourseCompletion >──── (1) Course
                                                  │
Course (1) ─────< (1) Prerequisite                │
   │                     │                        │
   │                     │                        │
   └────< (N) PrerequisiteNode                    │
   │                                              │
   └────< (N) Section ──────────────────────────┘
```

### Key Tables

#### 1. `courses`
- Primary Key: `id` (e.g., "SYSC4907")
- Stores course metadata: title, credits, description
- **Design Decision**: Course ID as primary key (not auto-increment) because course codes are natural identifiers

#### 2. `prerequisites`
- One-to-one relationship with `courses`
- Stores original prerequisite expression as string
- **Why?** Preserve human-readable format for display

#### 3. `prerequisite_nodes`
- Stores parsed prerequisite tree
- Self-referential foreign key: `parentId` → `id`
- Node types: AND, OR, COURSE, YEAR_STANDING, PERMISSION
- **Design Pattern**: Composite pattern (tree structure in database)

#### 4. `sections`
- Many-to-one relationship with `courses`
- Stores schedule data: days, times, instructor, capacity
- **Optimization**: Could use PostgreSQL `tstzrange` for time ranges, but kept simple for clarity

#### 5. `students` and `course_completions`
- Many-to-many relationship between students and courses
- `course_completions` stores grade information
- **Unique Constraint**: `(studentId, courseId)` prevents duplicate completions

### Normalization

The schema is in **Third Normal Form (3NF)**:
- No repeating groups
- All non-key attributes depend on primary key
- No transitive dependencies

**Defense Point**: 3NF eliminates data redundancy and update anomalies. Could denormalize for performance (e.g., cache eligibility results), but clarity prioritized for capstone.

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Courses

**GET /courses/search?q={query}&limit={limit}**
- Search courses by code or title
- Returns: Array of matching courses
- Example: `/courses/search?q=SYSC&limit=20`

**GET /courses/:courseId**
- Get detailed course information
- Returns: Course with prerequisites and section count
- Example: `/courses/SYSC4907`

**GET /courses/:courseId/sections?term={term}**
- Get all sections for a course
- Returns: Array of sections with schedule data
- Example: `/courses/SYSC4907/sections?term=Fall 2024`

#### Students

**GET /students/:studentId**
- Get student profile and completed courses
- Returns: Student info with course completions
- Example: `/students/101245709`

**POST /students/:studentId/validate**
- Validate if student meets prerequisites for a course
- Body: `{ "courseId": "SYSC4907", "currentYear": "FOURTH_YEAR" }`
- Returns: Validation result with detailed explanation

**GET /students/:studentId/eligible?limit={limit}**
- Get all courses student is eligible to take
- Returns: Array of eligible courses
- Example: `/students/101245709/eligible?limit=50`

#### Schedules

**POST /schedules/generate**
- Generate all valid schedules for selected courses
- Body: `{ "courseIds": ["SYSC4907", "ELEC4705"], "term": "Fall 2024", "maxSchedules": 50 }`
- Returns: Array of conflict-free schedules

#### Audit

**POST /audit/upload**
- Upload and parse academic audit file
- Multipart form data: `file` (HTML or PDF)
- Returns: Parsing report with imported courses

**POST /audit/parse**
- Parse audit file without saving (preview mode)
- Multipart form data: `file`
- Returns: Parsed data for review

---

## Design Principles

### SOLID Principles

#### 1. Single Responsibility Principle (SRP)
Each module has one reason to change:
- `courses.ts`: Course-related endpoints only
- `prerequisite-validator.ts`: Validation logic only
- `audit-parser.ts`: Parsing logic only

#### 2. Open/Closed Principle (OCP)
System is open for extension, closed for modification:
- New prerequisite node types can be added without changing evaluation algorithm
- New file upload formats (e.g., PDF parsing) can be added via strategy pattern

#### 3. Liskov Substitution Principle (LSP)
Not heavily applicable (no inheritance hierarchy), but:
- All route handlers conform to Express `RequestHandler` type
- All prerequisite nodes implement same evaluation interface

#### 4. Interface Segregation Principle (ISP)
Clients don't depend on interfaces they don't use:
- Frontend receives minimal data (transformed responses, not raw DB models)
- API endpoints are granular (separate endpoints for different operations)

#### 5. Dependency Inversion Principle (DIP)
High-level modules don't depend on low-level modules:
- Routes depend on Prisma Client abstraction, not raw SQL
- Business logic (validators, generators) is separate from HTTP layer

### DRY (Don't Repeat Yourself)
- Prerequisite validator used by both CLI and API
- Time conflict detection function reused across schedule generation
- Prisma models generate TypeScript types automatically

### YAGNI (You Aren't Gonna Need It)
- No premature optimization (e.g., caching, complex indexes)
- No unused features (authentication placeholder, but not implemented)
- Focused on core requirements for capstone demo

---

## Testing Strategy

### Unit Tests (Recommended)
```typescript
describe('hasTimeConflict', () => {
  it('detects overlapping time slots on same day', () => {
    const slot1 = { day: 'Monday', startTime: '0835', endTime: '0955' }
    const slot2 = { day: 'Monday', startTime: '0905', endTime: '1025' }
    expect(hasTimeConflict(slot1, slot2)).toBe(true)
  })
  
  it('allows non-overlapping time slots', () => {
    const slot1 = { day: 'Monday', startTime: '0835', endTime: '0955' }
    const slot2 = { day: 'Monday', startTime: '1005', endTime: '1125' }
    expect(hasTimeConflict(slot1, slot2)).toBe(false)
  })
})
```

### Integration Tests (Recommended)
```typescript
describe('POST /api/schedules/generate', () => {
  it('generates valid schedules with no conflicts', async () => {
    const response = await request(app)
      .post('/api/schedules/generate')
      .send({ courseIds: ['SYSC4907', 'ELEC4705'], maxSchedules: 10 })
    
    expect(response.status).toBe(200)
    expect(response.body.schedules).toBeInstanceOf(Array)
    response.body.schedules.forEach(schedule => {
      expect(schedule.hasConflicts).toBe(false)
    })
  })
})
```

### End-to-End Tests (Recommended)
- Cypress or Playwright for frontend testing
- Test complete user flow: Login → Upload Audit → Select Courses → Generate Schedules

---

## Performance Considerations

### Current Performance

| Operation | Complexity | Estimated Time |
|-----------|-----------|----------------|
| Course Search | O(n) | < 100ms (with DB index) |
| Prerequisite Validation | O(n) | < 50ms |
| Schedule Generation (5 courses) | O(b^5) | < 1s |
| Schedule Generation (8 courses) | O(b^8) | < 10s |

### Optimizations

#### 1. Database Indexes
```sql
CREATE INDEX idx_course_id ON courses(id);
CREATE INDEX idx_course_title ON courses USING gin(to_tsvector('english', title));
CREATE INDEX idx_section_course_term ON sections(courseId, term);
```

#### 2. Query Optimization
- Use `include` for eager loading (avoid N+1 queries)
- Limit result sets with `take`
- Select only needed fields with `select`

#### 3. Caching Strategy (Future)
- Cache prerequisite validation results (Redis)
- Cache generated schedules for popular course combinations
- Invalidate cache when timetable data changes

#### 4. Pagination
- API endpoints support `limit` parameter
- Could add cursor-based pagination for large result sets

### Scalability Considerations

**Current Scale**: Supports ~500 courses, ~5000 sections, ~1000 students

**To Scale to 10,000+ students**:
1. Add read replicas for PostgreSQL
2. Implement caching layer (Redis)
3. Add API rate limiting
4. Consider microservices architecture (separate schedule generation service)

---

## Security Considerations

### Implemented
1. **Input Validation**: All API inputs are validated
2. **CORS**: Configured to allow only frontend origin
3. **File Upload Limits**: Max 10MB file size
4. **SQL Injection Protection**: Prisma ORM parameterizes queries

### Not Implemented (Out of Scope for Capstone)
1. **Authentication**: Currently no user authentication (would use JWT + bcrypt)
2. **Authorization**: No role-based access control
3. **Rate Limiting**: No request throttling
4. **HTTPS**: Would use in production

**Defense Point**: For capstone demo, focusing on core algorithms and architecture. In production, would add authentication using industry standards (OAuth 2.0, JWT).

---

## Future Enhancements

### 1. Intelligent Schedule Ranking
Currently generates all valid schedules. Could add scoring based on:
- Preference for morning/afternoon classes
- Minimize gaps between classes
- Avoid back-to-back classes
- Prefer specific instructors

**Algorithm**: Weighted scoring function with user-defined preferences

### 2. Multi-Term Planning
Extend to plan multiple semesters ahead:
- Consider course offering patterns (some courses only offered Fall/Winter)
- Optimize graduation timeline

**Challenge**: Exponential search space, would need heuristic algorithms

### 3. Conflict Resolution Suggestions
When schedules can't be generated (all combinations have conflicts):
- Suggest which course to drop
- Suggest alternative courses

**Algorithm**: Constraint relaxation with minimal changes

### 4. Machine Learning Recommendations
Predict which electives student might like based on:
- Historical data from similar students
- Course difficulty vs. grades achieved

**Approach**: Collaborative filtering or decision trees

---

## Conclusion

This Smart Scheduler demonstrates:
- **Solid Software Engineering**: SOLID principles, design patterns, clean architecture
- **Algorithm Design**: Tree traversal, backtracking, constraint satisfaction
- **Database Design**: Normalized schema, efficient queries, proper relationships
- **Full-Stack Development**: React frontend, Express backend, PostgreSQL database
- **Production Readiness**: Error handling, validation, documentation

**Key Defense Points**:
1. Every design decision has a rationale (can explain trade-offs)
2. Algorithms are analyzed for time/space complexity
3. Code is well-documented and follows best practices
4. System is extensible and maintainable

---

## References

1. Cormen et al., "Introduction to Algorithms" (Backtracking, Tree Traversal)
2. Martin, "Clean Architecture" (Design Principles)
3. Fowler, "Patterns of Enterprise Application Architecture" (Repository, Service Layer)
4. PostgreSQL Documentation (Database Design)
5. Express.js Documentation (REST API Design)
