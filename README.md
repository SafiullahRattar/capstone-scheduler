# Smart Scheduler - Carleton Engineering Course Scheduler

A full-stack web application for Carleton University engineering students to validate prerequisites, generate conflict-free timetables, and plan their academic schedule.

## Project Status

✅ **Completed**: Database schema with Prisma ORM  
✅ **Completed**: Prerequisite validation with tree-based algorithm  
✅ **Completed**: REST API backend with Express  
✅ **Completed**: Schedule generation algorithm (backtracking CSP solver)  
✅ **Completed**: Academic audit parser  
✅ **Completed**: React frontend UI (from Figma)  
🔄 **In Progress**: Frontend-backend integration  
✅ **Completed**: Comprehensive technical documentation  

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL database
- pnpm (recommended) or npm

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

1. Create a PostgreSQL database named `smart_scheduler`
2. Create a `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_scheduler?schema=public"
```

### 3. Initialize Database

```bash
pnpm run db:setup
pnpm run db:seed
```

This will populate the database with 348 Carleton courses and their prerequisites.

### 4. Start the CLI

```bash
pnpm run cli
```

## CLI Commands

- `search <term>` - Search for courses (e.g., `search SYSC`, `search 4907`)
- `prereq <course>` - Show prerequisites (e.g., `prereq SYSC4907`)
- `validate <course> <completed>` - Check if prerequisites are met
- `stats` - Show database statistics
- `help` - Show all commands
- `exit` - Exit the CLI

### Example Session:

```bash
smart-scheduler> stats
📊 Database Statistics:
📚 Courses: 348
📋 Prerequisites: 322
🎓 Programs: 0
📅 Sections: 0

smart-scheduler> search SYSC4907
🔍 Found 1 course(s) matching "SYSC4907":
📖 SYSC4907 - SYSC4907
   Prerequisites: SYSC4001 and fourth-year status in Engineering.

smart-scheduler> prereq SYSC3110
📖 SYSC3110 - SYSC3110
📋 Prerequisites: SYSC2100 and SYSC2006.
```

## Database Schema

The system uses PostgreSQL with Prisma ORM:

- **courses** - Course catalog (348 courses)
- **prerequisites** - Prerequisite expressions (322 requirements)
- **sections** - Course sections with schedules (for future timetable integration)
- **programs** - Engineering program requirements (planned)
- **student_records** - Student academic records (for testing)

## Data Sources

- **Prerequisites**: Parsed from official Carleton course calendar
- **Courses**: 348 engineering courses across all departments
- **Timetables**: Pending integration with supervisor's data files

## Development Commands

- `pnpm run db:reset` - Reset database (destructive!)
- `npx prisma studio` - Open database GUI in browser
- `npx prisma db push` - Apply schema changes

## Project Architecture

This project follows the Smart Scheduler proposal (G67) requirements:
- Minimal database schema focused on core functionality
- Real course data from official sources
- CLI interface for testing and validation
- Extensible design for future web interface