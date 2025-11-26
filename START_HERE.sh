#!/bin/bash
# Carleton Smart Scheduler - Quick Start Guide
# Run this script to verify everything is set up correctly

echo "======================================"
echo "Carleton Smart Scheduler - Setup Check"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project directory found"
echo ""

# Check database
echo "📊 Checking database..."
COURSE_COUNT=$(npx tsx -e "import {PrismaClient} from '@prisma/client'; const p = new PrismaClient(); p.course.count().then(c => console.log(c)).finally(() => p.\$disconnect())" 2>/dev/null)
SECTION_COUNT=$(npx tsx -e "import {PrismaClient} from '@prisma/client'; const p = new PrismaClient(); p.section.count().then(c => console.log(c)).finally(() => p.\$disconnect())" 2>/dev/null)

if [ "$COURSE_COUNT" -gt "0" ]; then
    echo "✅ Database has $COURSE_COUNT courses"
else
    echo "⚠️  WARNING: No courses in database. Run: pnpm run db:seed"
fi

if [ "$SECTION_COUNT" -gt "0" ]; then
    echo "✅ Database has $SECTION_COUNT sections"
else
    echo "⚠️  WARNING: No sections in database. Run: pnpm run db:import-timetable"
fi

echo ""
echo "======================================"
echo "🚀 Ready to Run!"
echo "======================================"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd $(pwd)"
echo "  pnpm run server"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd $(pwd)/Carletonscheduler"
echo "  npm run dev"
echo ""
echo "======================================"
echo "📝 Quick Reference:"
echo "======================================"
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend UI: http://localhost:3000 (or shown in terminal 2)"
echo ""
echo "Test Backend:"
echo '  curl "http://localhost:3001/api/courses/search?q=SYSC"'
echo ""
echo "Documentation:"
echo "  - INTEGRATION_COMPLETE.md - Full integration details"
echo "  - ARCHITECTURE.md - Technical documentation"
echo "  - INTEGRATION_GUIDE.md - Step-by-step guide"
echo ""
echo "======================================"
