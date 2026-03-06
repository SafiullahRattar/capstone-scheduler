#import "@preview/polylux:0.4.0": *

#set page(paper: "presentation-16-9", margin: 1.3em)
#set text(size: 18pt)
#set block(spacing: 0.5em)

// Title Slide
#slide[
  #align(center + horizon)[
    #rect(fill: rgb("#bf112b"), width: 100%, height: 6pt)
    #v(0.8em)
    #text(size: 40pt, weight: "bold")[Carleton Smart Course Scheduler]
    #v(0.3em)
    #text(size: 22pt, fill: rgb("#666666"))[SYSC 4907 Capstone Project]
    #v(1.5em)
    #text(size: 16pt)[
      Helping students check prerequisites and build conflict-free schedules
    ]
    #v(1.5em)
    #text(size: 14pt, fill: rgb("#888888"))[January 2026]
  ]
]

// Problem Overview
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Problem]
  #v(0.3em)
  #text(size: 20pt, weight: "semibold")[Course registration at Carleton is a pain]
  #v(0.5em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[Checking Prerequisites]
      #text(size: 16pt)[
        - Open your audit, open the calendar, go back and forth
        - "Wait, do I have SYSC 3303 or not?"
        - Takes a while if you're picking 5-6 courses
      ]
      #v(0.5em)
      #text(weight: "semibold")[Info is Everywhere]
      #text(size: 16pt)[
        - Carleton Central for one thing
        - Course calendar for another
        - Department sites for elective lists
      ]
    ],
    [
      #text(weight: "semibold")[Building a Schedule]
      #text(size: 16pt)[
        - No way to check conflicts automatically
        - Try a section, doesn't work, try another
        - Hope you don't mess up LEC/LAB/TUT
      ]
      #v(0.5em)
      #text(weight: "semibold")[Actually Registering]
      #text(size: 16pt)[
        - Hunt down CRNs one by one
        - Copy them into Central
        - Pray nothing conflicts
      ]
    ]
  )
]

// The Old Way - Checking Prerequisites
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Old Way: Checking Prerequisites]
  #v(0.05em)
  #text(size: 16pt, fill: rgb("#666666"))[Cross-referencing your audit with the course calendar]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 5pt)[
        #text(weight: "semibold", size: 13pt)[1. Your Course Audit]
        #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), inset: 4pt)[
          #text(size: 8pt)[
            *SUMMARY OF CREDITS AND CGPA* \
            _Engineering Program Only_ \
            #table(columns: (auto, auto, auto), stroke: none, inset: 2pt,
              [*EARNED:*], [17.00 Credits], [],
              [], [16.50 CGPA Credits], [8.78 CGPA])
            #rect(fill: rgb("#fff5f5"), inset: 2pt, width: 100%)[
              #text(fill: rgb("#cc0000"), size: 7pt)[*NO*] #text(size: 7pt)[ COMP. STUDIES...]]
          ]
        ]
        #text(size: 9pt, style: "italic")[What have I completed?]
      ]
    ],
    [
      #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 5pt)[
        #text(weight: "semibold", size: 13pt)[2. Course Calendar]
        #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), inset: 4pt)[
          #text(size: 8pt)[
            *SYSC 2004 \[0.5 credit\]* \
            _Object-Oriented Software Development_ \
            #text(size: 7pt)[Prereq: #text(fill: rgb("#0066cc"))[SYSC 1006] or #text(fill: rgb("#0066cc"))[SYSC 2006], and 2nd-year standing.]
            *SYSC 2006 \[0.5 credit\]* \
            _Foundations of Imperative Programming_
          ]
        ]
        #text(size: 9pt, style: "italic")[What do I need?]
      ]
    ]
  )
  #align(center)[
    #rect(fill: rgb("#fff5f5"), radius: 6pt, inset: 5pt)[
      #text(fill: rgb("#bf112b"), size: 11pt)[Students must manually cross-reference these for every course]
    ]
  ]
]

// The Old Way - Building a Schedule
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Old Way: Building a Schedule]
  #v(0.05em)
  #text(size: 16pt, fill: rgb("#666666"))[Conflicts only appear after you try to register]
  #v(0.1em)
  
  #grid(
    columns: (1.3fr, 1fr),
    gutter: 0.6em,
    [
      #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), radius: 4pt, inset: 3pt)[
        #align(center)[
          #rect(fill: rgb("#bf112b"), radius: 4pt, inset: 2pt)[#text(fill: white, size: 7pt, weight: "bold")[Winter 2026]]
          #text(size: 11pt, weight: "bold")[Winter Schedule]
        ]
        #table(
          columns: (0.6fr, 1fr, 1fr, 1fr, 1fr, 1fr),
          stroke: 0.5pt + rgb("#dddddd"),
          inset: 2pt,
          fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
          align: center,
          text(size: 5pt, weight: "bold")[Time], text(size: 5pt, weight: "bold")[Mon], text(size: 5pt, weight: "bold")[Tue], text(size: 5pt, weight: "bold")[Wed], text(size: 5pt, weight: "bold")[Thu], text(size: 5pt, weight: "bold")[Fri],
          text(size: 5pt)[10:00], [], [], [#rect(fill: rgb("#ffffcc"), inset: 1pt)[#text(size: 4pt)[SYSC 4130 #text(fill: rgb("#cc0000"), weight: "bold")[Full]]]], [], [],
          text(size: 5pt)[11:30], [], [#rect(fill: rgb("#ff6666"), inset: 1pt)[#text(size: 4pt, fill: white)[SYSC 2004 E]]], [#rect(fill: rgb("#cce5ff"), inset: 1pt)[#text(size: 4pt)[SYSC 3303 A]]], [#rect(fill: rgb("#ff6666"), inset: 1pt)[#text(size: 4pt, fill: white)[SYSC 2004 E]]], [#rect(fill: rgb("#cce5ff"), inset: 1pt)[#text(size: 4pt)[SYSC 3303 A]]],
          text(size: 5pt)[15:00], [#rect(fill: rgb("#ff6666"), inset: 1pt)[#text(size: 4pt, fill: white)[SYSC 2004 D]]], [#rect(fill: rgb("#e8e8e8"), inset: 1pt)[#text(size: 4pt)[SYSC 2004 L4]]], [#rect(fill: rgb("#ff6666"), inset: 1pt)[#text(size: 4pt, fill: white)[SYSC 2004 D]]], [], [],
        )
        #align(center)[#text(size: 6pt)[#rect(fill: rgb("#ff6666"), inset: 1pt)[#text(fill: white)[Red]] = Conflict/Full]]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[The Problem]
      #v(0.1em)
      #text(size: 10pt)[
        - Pick courses and sections
        - Build what looks good, try to register... *Conflict!*
        - Or worse: section is *full*
      ]
      #v(0.1em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt, fill: rgb("#bf112b"))[*Result:* Start over, hope next combo works]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[No Way to Know Until You Try]
      #text(size: 10pt)[No automatic conflict detection]
    ]
  )
]

// The Old Way - Info is Everywhere
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Old Way: Info is Everywhere]
  #v(0.2em)
  #text(size: 16pt, fill: rgb("#666666"))[10 steps just to register for courses?]
  #v(0.5em)
  
  #align(center)[
    #image("images/10-steps-registration.png", height: 55%)
  ]
  
  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#fff5f5"), radius: 6pt, inset: 10pt)[
      #text(fill: rgb("#bf112b"), size: 14pt, weight: "bold")[Students must navigate multiple disconnected systems just to build a schedule]
    ]
  ]
]

// The Old Way - No Search
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Old Way: No Search]
  #v(0.2em)
  #text(size: 16pt, fill: rgb("#666666"))[You can't just type a course name]
  #v(0.4em)
  
  #grid(
    columns: (1.2fr, 1fr),
    gutter: 1em,
    [
      #align(center)[
        #image("images/Pasted image.png", height: 70%)
      ]
    ],
    [
      #text(weight: "semibold", size: 16pt)[The Problem]
      #v(0.3em)
      #text(size: 14pt)[
        - No search bar at all
        - Must click through dropdown menus
        - "Select a subject" → "Select a course"
        - Or enter CRNs manually if you know them
      ]
      #v(0.5em)
      #text(weight: "semibold", size: 16pt)[What This Means]
      #v(0.3em)
      #text(size: 14pt)[
        - Can't type "SYSC 4001" and find it
        - Have to browse through long lists
        - Slows down the whole process
      ]
      #v(0.5em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt, fill: rgb("#bf112b"))[
          *Even basic search functionality is missing from Carleton's scheduler*
        ]
      ]
    ]
  )
]

// Our Solution - Engineering Overview
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Our Solution: Engineering Overview]
  #text(size: 14pt, fill: rgb("#666666"))[Full-stack system consolidating fragmented data and automating manual processes]
  #v(0.1em)
  #grid(
    columns: (1.1fr, 1fr),
    gutter: 0.5em,
    [
      #text(weight: "semibold", size: 13pt)[System Architecture]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[
          #align(center)[
            #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 3pt, width: 90%)[*Frontend* — React + TypeScript \ #text(size: 8pt)[Audit upload, course search, schedule viewer]]
            #v(0.05em)
            ↓ REST API ↓
            #v(0.05em)
            #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 3pt, width: 90%)[*Backend* — Express + Node.js \ #text(size: 8pt)[Validation engine, schedule generator]]
            #v(0.05em)
            ↓ Prisma ORM ↓
            #v(0.05em)
            #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 3pt, width: 90%)[*Database* — PostgreSQL \ #text(size: 8pt)[Courses, prerequisites, sections, students]]
          ]
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Core Engineering Problems]
      #text(size: 10pt)[
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 3pt, width: 100%)[*1. Academic Audit Parsing* — Extract data from HTML]
        #v(0.08em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 3pt, width: 100%)[*2. Prerequisite Representation* — AND/OR logic as trees]
        #v(0.08em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 3pt, width: 100%)[*3. Schedule Generation* — Constraint satisfaction]
        #v(0.08em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 3pt, width: 100%)[*4. Data Acquisition* — Scraping, electives, terms]
      ]
    ]
  )
  #v(0.1em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 4pt)[
      #text(size: 10pt)[*Next:* Implementation walkthrough — what we built and why]
    ]
  ]
]

// ============================================================================
// SECTION 1: ACADEMIC AUDIT PARSING (~10 minutes)
// ============================================================================

// 1.1 - Overview & Motivation
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 1: Academic Audit Parsing]
  #v(0.1em)
  #text(size: 16pt, fill: rgb("#666666"))[The foundation — everything else depends on knowing what you've completed]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[Why This Comes First]
      #v(0.2em)
      #text(size: 13pt)[
        Before we can do anything useful, we need to know:
        - Which courses has the student completed?
        - What grades did they get?
        - What program are they in?
        - What requirements remain unfulfilled?
      ]
      #v(0.3em)
      #text(size: 13pt)[
        *Every other feature depends on this data:*
        - Prerequisite validation needs completed courses
        - Elective suggestions need program info
        - Schedule generation needs to know what's left
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[The Challenge]
      #v(0.2em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *No API exists.* \
          Carleton Central provides audits as HTML and PDF only. \
          We must extract structured data from unstructured markup.
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 15pt)[What We Extract]
      #text(size: 13pt)[
        - Student ID (9 digits)
        - Student name
        - Program (e.g., "Software Engineering")
        - Completed courses with grades
        - In-progress courses (current term)
        - Requirement status (fulfilled/unfulfilled)
      ]
    ]
  )
]

// 1.2 - Data Structures & Interface
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Data Structures]
  #v(0.03em)
  #text(size: 15pt, fill: rgb("#666666"))[TypeScript interfaces that model the extracted data]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[StudentAuditData Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          interface StudentAuditData {
            studentId: string; name: string; program: string
            completedCourses: Array<{ courseId: string; grade: string }>
            currentCourses: Array<{ courseId: string; term: string }>
            requirements: RequirementInfo[]
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[RequirementInfo Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          interface RequirementInfo {
            title: string; status: 'OK' | 'NO' | 'IP' | 'NONE'
            creditsRequired: number; creditsCompleted: number
            creditsInProgress: number; courseOptions: string[]
          }
          ```
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Why These Fields?]
      #text(size: 10pt)[
        - *status*: track completion state
        - *creditsRequired vs Completed*: calculate progress
        - *courseOptions*: which courses satisfy requirement
      ]
    ]
  )
]

// 1.3 - Parsing Pipeline Architecture
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Pipeline Architecture]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[From raw HTML upload to structured database records]
  #v(0.2em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 10pt, width: 95%)[
      #grid(
        columns: (1fr, 0.12fr, 1fr, 0.12fr, 1fr, 0.12fr, 1fr, 0.12fr, 1fr),
        gutter: 0.15em,
        align: center + horizon,
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[#text(size: 9pt, weight: "bold")[1. Upload] \ #text(size: 8pt)[User uploads HTML]],
        text(size: 14pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[#text(size: 9pt, weight: "bold")[2. Parse] \ #text(size: 8pt)[Regex extract]],
        text(size: 14pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[#text(size: 9pt, weight: "bold")[3. Normalize] \ #text(size: 8pt)["SYSC 3303"→"SYSC3303"]],
        text(size: 14pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[#text(size: 9pt, weight: "bold")[4. Validate] \ #text(size: 8pt)[Check DB]],
        text(size: 14pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[#text(size: 9pt, weight: "bold")[5. Persist] \ #text(size: 8pt)[Upsert to DB]],
      )
    ]
  ]

  #v(0.25em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Key Design: Upsert]
      #text(size: 11pt)[
        - Use `prisma.student.upsert()` for re-uploads
        - Existing → update; New → create
        - Idempotent: safe to upload multiple times
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Database Operations]
      #text(size: 11pt)[
        1. Upsert Student record
        2. Delete old CourseCompletions
        3. Insert new CourseCompletions
        4. Link to existing Course records
      ]
    ]
  )
]

// 1.4 - Regex Patterns Deep Dive
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Regex Patterns]
  #text(size: 15pt, fill: rgb("#666666"))[Targeted patterns for each data field we need to extract]
  #v(0.15em)
  #text(weight: "semibold", size: 13pt)[Core Extraction Patterns]
  #v(0.1em)
  #table(
    columns: (1.2fr, 2fr, 1.5fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 6pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold", size: 10pt)[Field],
    text(fill: white, weight: "bold", size: 10pt)[Regex Pattern],
    text(fill: white, weight: "bold", size: 10pt)[Example Match],
    text(size: 10pt)[Student ID], text(size: 9pt)[`/(\d{9})/`], text(size: 10pt)["123456789"],
    text(size: 10pt)[Name], text(size: 9pt)[`/([A-Z][a-z]+), ([A-Z][a-z]+)/`], text(size: 10pt)["Smith, John" → "John Smith"],
    text(size: 10pt)[Program], text(size: 9pt)[`/Bachelor of Engineering - ([^<]+)/`], text(size: 10pt)["Software Engineering"],
    text(size: 10pt)[Course Row], text(size: 9pt)[`/<tr[^>]*class="takenCourse"[^>]*>/g`], text(size: 10pt)[Matches each course row],
  )
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Course Extraction (Complex)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```
/<tr[^>]*class="takenCourse"[^>]*>
  [\s\S]*?<td[^>]*class="term"[^>]*>
    ([^<]*)<\/td>
  [\s\S]*?<td[^>]*class="course"[^>]*>
    ([A-Z]{3,4}\s+\d{4})<\/td>
  [\s\S]*?<td[^>]*class="grade"[^>]*>
    ([^<]+)<\/td>/g
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Why This Pattern?]
      #text(size: 11pt)[
        - `[\s\S]*?` — non-greedy match across newlines
        - Captures: term, course code, grade
        - Class selectors target stable HTML structure
        - Global flag `/g` finds all course rows
      ]
    ]
  )
]

// 1.5 - Requirement Extraction
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Requirement Extraction]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Parsing subrequirements to identify what's still needed]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[HTML Structure We Parse]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```html
          <div class="subrequirement" rqdHours="0.50">
            <span class="status Status_NO">
            <span class="subreqTitle">
              COMPLEMENTARY STUDIES, CCDP 2100
            </span>
            ...
            <span class="hours">0.00</span> cr. Complete
          </div>
          ```
        ]
      ]
      #text(size: 11pt)[Extract: required credits, completed credits, status, and course options from each block.]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Status Detection Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```typescript
          let status: 'OK'|'NO'|'IP'|'NONE' = 'NO'
          if (statusClass.includes('OK')) status = 'OK'
          else if (statusClass.includes('IP')) status = 'IP'
          ```
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[Elective Category Detection]
      #text(size: 11pt)[
        - "complementary studies" → `COMPLEMENTARY_STUDIES`
        - "computer science elective" → `CS_ELECTIVE`
        - "basic science" → `SCIENCE_ELECTIVE`
        - These map to lists of valid courses later
      ]
    ]
  )
]

// 1.6 - PDF vs HTML Parsing
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: PDF Support]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Supporting both HTML exports and PDF text extraction]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[PDF Line Format]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```
          21FA   CHEM 1101   0.50   A+
          21WN   MATH 1004   0.50   B
          25WN   SYSC 4907   0.50   CUR
          ```
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[PDF Pattern]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```
          /^\s*(\d{2}(?:FA|WN|SU))\s+
            ([A-Z]{3,4})\s+(\d{4})\s+
            ([\d.]+)\s+([A-Z+\-]+)/gm
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Grade Filtering Logic]
      #text(size: 11pt)[Not all rows are valid completions:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```typescript
          if (grade === 'CUR') {
            currentCourses.push({ courseId, term })
          } else if (['F','X','UNS','NR'].includes(grade)) {
            continue  // Failed or withdrawn
          } else {
            completedCourses.push({ courseId, grade })
          }
          ```
        ]
      ]
      #v(0.1em)
      #text(size: 11pt)[*Key:* We use `Set` to dedupe — same course may appear multiple times if retaken.]
    ]
  )
]

// 1.7 - Database Persistence
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Database Persistence]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Saving parsed data with Prisma ORM]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Student Upsert]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          const student = await prisma.student.upsert({
            where: { studentId: auditData.studentId },
            update: { name: auditData.name, program: auditData.program },
            create: { studentId: auditData.studentId,
                      name: auditData.name, program: auditData.program }
          })
          ```
        ]
      ]
      #text(size: 10pt)[*Upsert* = Update if exists, Insert if new. Handles re-uploads gracefully.]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Course Completion Storage]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          await prisma.courseCompletion.deleteMany({ where: { studentId: student.id } })
          for (const completion of completedCourses) {
            const course = await prisma.course.findUnique({ where: { id: completion.courseId } })
            if (course) {
              await prisma.courseCompletion.create({
                data: { studentId: student.id, courseId: completion.courseId, grade: completion.grade }
              })
            }
          }
          ```
        ]
      ]
    ]
  )
]

// 1.8 - Trade-offs & Limitations
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Trade-offs & Limitations]
  #text(size: 15pt, fill: rgb("#666666"))[Design decisions and their consequences]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Approach Comparison]
      #table(
        columns: (1fr, 1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 4pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Approach*], [*Pros*], [*Cons*],
        [Regex], [Fast, simple, no deps], [Brittle to HTML changes],
        [DOM (cheerio)], [Robust, semantic], [Heavier, slower],
        [Official API], [Reliable], [Doesn't exist],
      )
      #v(0.15em)
      #text(weight: "semibold", size: 13pt)[Why We Chose Regex]
      #text(size: 11pt)[
        - O(n) single-pass parsing
        - No external dependencies
        - Patterns target stable class names
        - Easy to update if structure changes
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Known Limitations]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 11pt)[
          1. *HTML structure dependency* — if Carleton redesigns their audit page, patterns break
          2. *No real-time sync* — student must re-upload after completing courses
          3. *Course existence check* — courses not in our DB are skipped (logged as warnings)
        ]
      ]
      #v(0.15em)
      #text(weight: "semibold", size: 13pt)[Mitigation Strategy]
      #text(size: 11pt)[
        - Fallback patterns for common variations
        - Comprehensive logging for debugging
        - Could migrate to DOM parser if needed
      ]
    ]
  )
]

// ============================================================================
// SECTION 2: PREREQUISITE REPRESENTATION (~10 minutes)
// ============================================================================

// 2.1 - Overview & Problem Statement
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 2: Prerequisite Representation]
  #v(0.1em)
  #text(size: 16pt, fill: rgb("#666666"))[Modeling complex AND/OR logic for automated validation]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[The Core Problem]
      #v(0.2em)
      #text(size: 13pt)[
        Prerequisites aren't simple lists. They have *logic*:
      ]
      #v(0.2em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *SYSC 4001:* \
          "SYSC 3303 *and* (SYSC 3310 *or* SYSC 3320)" \
          \
          *SYSC 4805:* \
          "Fourth-year standing *or* permission"
        ]
      ]
      #v(0.3em)
      #text(size: 13pt)[
        We need to:
        - Store this logic in a database
        - Evaluate it against a student's transcript
        - Show clear feedback (pass/fail + what's missing)
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[Requirements]
      #v(0.2em)
      #text(size: 13pt)[
        1. *Persist in relational DB* — can't just store strings
        2. *Evaluate programmatically* — no human interpretation
        3. *Support multiple node types:*
           - Course requirements (SYSC3303)
           - Year standing (Fourth-year)
           - Special permission
           - Grade requirements (C- minimum)
        4. *Handle nested logic* — AND inside OR inside AND
        5. *Provide actionable feedback* — list missing courses
      ]
    ]
  )
]

// 2.2 - Database Schema Design
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Schema: Database Design]
  #text(size: 15pt, fill: rgb("#666666"))[Self-referential tree structure in PostgreSQL via Prisma]
  #v(0.1em)
  #grid(
    columns: (1.2fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[PrerequisiteNode Model]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```prisma
model PrerequisiteNode {
  id               String   @id @default(cuid())
  courseId         String   // Which course this prereq belongs to
  nodeType         String   // AND | OR | COURSE | YEAR_STANDING | PERMISSION
  requiredCourseId String?  // FK to Course (for COURSE nodes)
  requiredGrade    String?  // e.g., "C-"
  requiredYear     String?  // FIRST_YEAR | SECOND_YEAR | etc.
  // Tree structure (self-reference)
  parentId         String?
  parent           PrerequisiteNode?  @relation("NodeHierarchy")
  children         PrerequisiteNode[] @relation("NodeHierarchy")
  course           Course   @relation("CoursePrerequisites")
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Why Self-Reference?]
      #text(size: 10pt)[
        - Trees need parent-child links
        - Root nodes have `parentId = null`
        - Prisma handles FK automatically
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Node Types]
      #table(
        columns: (0.8fr, 1.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Type*], [*Meaning*],
        [AND], [All children must pass],
        [OR], [Any child must pass],
        [COURSE], [Specific course required],
        [YEAR], [Minimum year level],
      )
    ]
  )
]

// 2.3 - Expression Parser
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Parser: Expression → Tree]
  #text(size: 15pt, fill: rgb("#666666"))[Converting human-readable expressions to node trees]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Input Format (from course calendar)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          `"SYSC3303 && (SYSC3310 || SYSC3320)"` \
          `"FOURTH_YEAR || PERMISSION"` \
          `"COMP1006[C-] && MATH1004"`
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Parser Strategy]
      #text(size: 10pt)[
        1. Split on `&&` first (lower precedence)
        2. Split on `||` within groups
        3. Handle parentheses for nesting
        4. Parse individual terms
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Parsing Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```typescript
function parsePrerequisiteExpression(expr: string): ParsedNode {
  // Handle simple AND (no OR present)
  if (expr.includes(' && ') && !expr.includes(' || ')) {
    const parts = expr.split(' && ')
    return { type: 'AND', children: parts.map(parseSimpleTerm) }
  }
  // Handle simple OR (no AND present)
  if (expr.includes(' || ') && !expr.includes(' && ')) {
    const parts = expr.split(' || ')
    return { type: 'OR', children: parts.map(parseSimpleTerm) }
  }
  // Handle parentheses - recursive
  if (expr.includes('(')) return parseComplexExpression(expr)
  return parseSimpleTerm(expr)
}
```]
      ]
    ]
  )
]

// 2.4 - Term Parsing Details
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Parser: Term Recognition]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Identifying different types of requirements]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 13pt)[parseSimpleTerm Function]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          function parseSimpleTerm(term: string): ParsedNode {
            term = term.trim().replace(/[()]/g, '')
            if (['FIRST_YEAR', 'SECOND_YEAR', 
                 'THIRD_YEAR', 'FOURTH_YEAR'].includes(term))
              return { type: 'YEAR_STANDING', value: term }
            if (term === 'PERMISSION') return { type: 'PERMISSION' }
            const gradeMatch = term.match(/^([A-Z]{3,4}\d{4})\[([A-Z\-+]*)\]$/)
            if (gradeMatch)
              return { type: 'COURSE', value: gradeMatch[1], grade: gradeMatch[2] }
            if (term.match(/^[A-Z]{3,4}\d{4}$/))
              return { type: 'COURSE', value: term }
            return { type: 'PERMISSION' }  // Unknown - fallback
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Example Transformations]
      #table(
        columns: (1.2fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 4pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Input*], [*Output Node*],
        [`"SYSC3303"`], [`{type: 'COURSE', value: 'SYSC3303'}`],
        [`"COMP1006[C-]"`], [`{type: 'COURSE', value: 'COMP1006', grade: 'C-'}`],
        [`"FOURTH_YEAR"`], [`{type: 'YEAR_STANDING', value: 'FOURTH_YEAR'}`],
        [`"PERMISSION"`], [`{type: 'PERMISSION'}`],
      )
      #v(0.1em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[*Fallback:* Unknown terms become PERMISSION nodes to avoid FK errors.]
      ]
    ]
  )
]

// 2.5 - Tree Creation in Database
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Storage: Building the Tree]
  #text(size: 15pt, fill: rgb("#666666"))[Recursively creating nodes in PostgreSQL]
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.5em,
    [
      #text(weight: "semibold", size: 11pt)[Recursive Tree Creation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 2pt)[
        #text(size: 6pt)[```typescript
async function createPrerequisiteTree(
  courseId: string, parsedNode: ParsedNode, parentId?: string
): Promise<string> {
  const node = await prisma.prerequisiteNode.create({
    data: {
      courseId, nodeType: parsedNode.type,
      requiredCourseId: parsedNode.type === 'COURSE' ? parsedNode.value : null,
      requiredYear: parsedNode.type === 'YEAR_STANDING' ? parsedNode.value : null,
      requiredGrade: parsedNode.grade || null,
      parentId: parentId || null
    }
  })
  if (parsedNode.children) {
    for (const child of parsedNode.children)
      await createPrerequisiteTree(courseId, child, node.id)
  }
  return node.id
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 11pt)[Visual Example]
      #text(size: 8pt)[Expression: `"SYSC3303 && (SYSC3310 || SYSC3320)"`]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #align(center)[#text(size: 7pt)[```
        [AND] ← root (parentId = null)
       /     \
[COURSE]     [OR]
SYSC3303    /    \
      [COURSE]  [COURSE]
      SYSC3310  SYSC3320
```]]
      ]
      #text(size: 8pt)[Each box = one row in `prerequisite_nodes`. Links via `parentId` FK]
    ]
  )
]

// 2.6 - Evaluation Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: Evaluation Algorithm]
  #text(size: 15pt, fill: rgb("#666666"))[Recursive tree traversal with boolean logic]
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.5em,
    [
      #text(weight: "semibold", size: 12pt)[Core Evaluation Function]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 6.5pt)[```typescript
async function evaluatePrerequisiteNode(
  node: PrerequisiteNodeData, transcript: StudentTranscript,
  allNodes: PrerequisiteNodeData[]
): Promise<EvaluationResult> {
  switch (node.nodeType) {
    case 'AND': {
      const children = allNodes.filter(n => n.parentId === node.id)
      const results = await Promise.all(
        children.map(c => evaluatePrerequisiteNode(c, transcript, allNodes))
      )
      const failed = results.filter(r => !r.isValid)
      return { isValid: failed.length === 0,
               missingItems: failed.flatMap(r => r.missingItems) }
    }
    case 'OR': { /* Returns true if ANY child passes */ }
    case 'COURSE': { /* Check if course in transcript */ }
  }
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Node Type Handlers]
      #table(
        columns: (0.6fr, 1.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Type*], [*Logic*],
        [AND], [All children must return `isValid: true`],
        [OR], [At least one child must return `isValid: true`],
        [COURSE], [Check `transcript.completedCourses.includes(courseId)`],
        [YEAR], [Compare `transcript.currentYear >= requiredYear`],
        [PERM], [Check `transcript.hasSpecialPermission`],
      )
      #text(weight: "semibold", size: 11pt)[Complexity]
      #text(size: 9pt)[*Time:* O(n) where n = nodes; *Space:* O(h) for recursion. Typical tree: 5-15 nodes]
    ]
  )
]

// 2.7 - Grade Checking
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: Grade Requirements]
  #text(size: 15pt, fill: rgb("#666666"))[Some courses require a minimum grade, not just completion]
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Grade Scale Implementation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 6.5pt)[```typescript
function meetsGradeRequirement(
  actualGrade: string | undefined, requiredGrade: string
): boolean {
  if (!actualGrade) return false
  const gradeValues: Record<string, number> = {
    'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7,
    'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0
  }
  const actualVal = gradeValues[actualGrade]
  const requiredVal = gradeValues[requiredGrade]
  if (actualVal === undefined || requiredVal === undefined) return true
  return actualVal >= requiredVal
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Usage in COURSE Node Evaluation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 6.5pt)[```typescript
case 'COURSE': {
  const hasCourse = transcript.completedCourses
    .includes(node.requiredCourseId)
  if (!hasCourse)
    return { isValid: false, missingItems: [node.requiredCourseId] }
  if (node.requiredGrade) {
    const actual = transcript.courseGrades?.[node.requiredCourseId]
    if (!meetsGradeRequirement(actual, node.requiredGrade))
      return { isValid: false, gradeIssues: 
        [`${node.requiredCourseId}: need ${node.requiredGrade}, have ${actual}`] }
  }
  return { isValid: true }
}
```]
      ]
    ]
  )
]

// 2.8 - Validation Result & Feedback
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: User Feedback]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Providing actionable information, not just pass/fail]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[ValidationResult Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          interface PrerequisiteValidationResult {
            isValid: boolean
            reason?: string
            missingCourses?: string[]    // ["SYSC3303", "SYSC3310"]
            yearRequirement?: string     // "FOURTH_YEAR"
            needsPermission?: boolean
            gradeIssues?: string[]       // ["COMP1006: need C-, have D+"]
            expressionEvaluated: string  // Original expression
          }
          ```
        ]
      ]
      #text(size: 11pt)[We return *all* missing items, not just the first — helps students plan.]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Example Output]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Course:* SYSC 4001 \
          *Status:* #text(fill: rgb("#cc0000"))[FAIL] \
          *Required:* `SYSC3303 && (SYSC3310 || SYSC3320)` \
          *Missing:* SYSC3303
        ]
      ]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Course:* SYSC 4907 \
          *Status:* #text(fill: rgb("#2d7a2d"))[PASS] \
          *Required:* `FOURTH_YEAR`
        ]
      ]
    ]
  )
]

// ============================================================================
// SECTION 3: SCHEDULE GENERATION (~10 minutes)
// ============================================================================

// 3.1 - Overview & Problem Statement
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 3: Schedule Generation]
  #v(0.1em)
  #text(size: 16pt, fill: rgb("#666666"))[Finding conflict-free timetables using backtracking]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[The Combinatorial Problem]
      #v(0.2em)
      #text(size: 13pt)[
        A typical term schedule involves:
        - 5 courses
        - ~3-4 sections per course
        - Each section may have LEC + LAB + TUT
      ]
      #v(0.2em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *Worst case:* 4 sections × 5 courses = 4⁵ = *1,024 combinations* \
          With LEC/LAB/TUT: easily *10,000+ combinations*
        ]
      ]
      #v(0.2em)
      #text(size: 13pt)[
        Manual checking is tedious and error-prone. We need an algorithm.
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[Requirements]
      #v(0.2em)
      #text(size: 13pt)[
        1. *Find ALL valid schedules* — not just one
        2. *No time conflicts* — classes can't overlap
        3. *Include all components* — LEC + LAB + TUT
        4. *Fast enough* — user shouldn't wait > 1-2 seconds
        5. *Bounded output* — don't return 10,000 schedules
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 15pt)[Algorithm Choice: Backtracking]
      #text(size: 13pt)[
        - Systematic search of solution space
        - *Prune early* when conflict detected
        - Guaranteed to find all solutions
        - Much faster than brute force in practice
      ]
    ]
  )
]

// 3.2 - Data Structures
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Data Structures]
  #text(size: 15pt, fill: rgb("#666666"))[TypeScript interfaces for sections, schedules, and time slots]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Section Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```typescript
interface Section {
  id: string
  courseId: string      // "SYSC3303"
  crn: string | null    // "12345"
  sectionCode: string   // "A"
  sectionType: string   // "LEC" | "LAB" | "TUT"
  days: string | null   // "MWF" or "TR"
  startTime: string | null  // "0835"
  endTime: string | null    // "0925"
  capacity: number | null
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Schedule & TimeSlot]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```typescript
interface TimeSlot {
  day: string; startTime: string; endTime: string
}
interface ScheduleSelection {
  courseId: string; section: Section
}
interface GeneratedSchedule {
  id: number
  selections: ScheduleSelection[]
  hasConflicts: boolean
  prerequisiteInfo?: {
    [courseId: string]: { isValid: boolean; missingCourses?: string[] }
  }
}
```]
      ]
    ]
  )
]

// 3.3 - Time Parsing & Day Expansion
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Time Handling]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Converting database formats to comparable time slots]
  #v(0.2em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 14pt)[Day Abbreviation Expansion]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          function parseDays(daysStr: string | null): string[] {
            if (!daysStr) return []
            const dayMap: Record<string, string> = {
              'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday',
              'R': 'Thursday', 'F': 'Friday'  // R for thuRsday
            }
            return daysStr.split('').map(d => dayMap[d] || d).filter(d => d)
          }
          // "MWF" → ["Monday", "Wednesday", "Friday"]
          // "TR"  → ["Tuesday", "Thursday"]
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Section → TimeSlots]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          function getTimeSlots(section: Section): TimeSlot[] {
            if (!section.days || !section.startTime || !section.endTime) {
              return []  // Online/async sections
            }
            const days = parseDays(section.days)
            return days.map(day => ({
              day, startTime: section.startTime!, endTime: section.endTime!
            }))
          }
          // Section with days="MWF", start="0835", end="0925"
          // → [{ day: "Monday", startTime: "0835", endTime: "0925" },
          //    { day: "Wednesday", ... }, { day: "Friday", ... }]
          ```
        ]
      ]
    ]
  )
]

// 3.4 - Conflict Detection Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Conflict Detection]
  #text(size: 15pt, fill: rgb("#666666"))[The O(1) interval overlap check at the heart of the algorithm]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 13pt)[Time Conflict Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```typescript
function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  if (slot1.day !== slot2.day) return false  // Different days
  // Parse "0835" → 515 minutes since midnight
  const parseTime = (time: string): number => {
    const hours = parseInt(time.substring(0, 2))
    const minutes = parseInt(time.substring(2, 4))
    return hours * 60 + minutes
  }
  const start1 = parseTime(slot1.startTime), end1 = parseTime(slot1.endTime)
  const start2 = parseTime(slot2.startTime), end2 = parseTime(slot2.endTime)
  return start1 < end2 && start2 < end1  // Interval overlap
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Why This Formula Works]
      #align(center)[
        #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
          #text(size: 9pt)[```
Overlap if: start1 < end2 AND start2 < end1

Case 1: [===1===]
              [===2===]  ✓ Overlap
Case 2: [===1===]
                  [===2===]  ✗ No overlap
```]
        ]
      ]
      #v(0.1em)
      #text(size: 10pt)[*Time:* O(1) per comparison \ *Called:* Many times during backtracking]
    ]
  )
]

// 3.5 - Section Grouping
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Section Grouping]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[Handling courses with multiple component types (LEC + LAB + TUT)]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Group by Section Type]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          function groupSectionsByType(sections: Section[]): Record<string, Section[]> {
            const grouped: Record<string, Section[]> = {}
            for (const section of sections) {
              if (!grouped[section.sectionType]) grouped[section.sectionType] = []
              grouped[section.sectionType].push(section)
            }
            return grouped
          }
          // Input: [LEC-A, LEC-B, LAB-L1, LAB-L2, TUT-T1]
          // Output: { "LEC": [LEC-A, LEC-B], "LAB": [LAB-L1, LAB-L2], "TUT": [TUT-T1] }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Generate All Combinations]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[
          ```typescript
          function generateSectionCombinations(courseId: string,
            sectionsByType: Record<string, Section[]>): Section[][] {
            const types = Object.keys(sectionsByType)
            if (types.length === 1) return sectionsByType[types[0]].map(s => [s])
            const combinations: Section[][] = []
            function build(typeIdx: number, current: Section[]) {
              if (typeIdx === types.length) { combinations.push([...current]); return }
              for (const section of sectionsByType[types[typeIdx]]) {
                current.push(section); build(typeIdx + 1, current); current.pop()
              }
            }
            build(0, [])
            return combinations
          }
          ```
        ]
      ]
      #text(size: 9pt)[2 LECs × 2 LABs × 1 TUT = 4 combinations per course]
    ]
  )
]

// 3.6 - Main Backtracking Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Backtracking Algorithm]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[The recursive search with early pruning]
  #v(0.1em)
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
    #text(size: 7.5pt)[
      ```typescript
      function generateSchedulesRecursive(courseSections: { courseId: string; sections: Section[] }[],
        currentIndex: number, currentSelections: ScheduleSelection[], maxSchedules: number, result: GeneratedSchedule[]
      ): void {
        if (currentIndex === courseSections.length) {  // Base case: all courses scheduled
          result.push({ id: result.length + 1, selections: [...currentSelections], hasConflicts: false }); return
        }
        if (result.length >= maxSchedules) return  // Early termination
        const { courseId, sections } = courseSections[currentIndex]
        const combinations = generateSectionCombinations(courseId, groupSectionsByType(sections))
        for (const sectionCombination of combinations) {
          if (hasInternalConflicts(sectionCombination)) continue
          let hasConflict = false
          for (const section of sectionCombination) {
            if (hasConflictWithSelections(section, currentSelections)) { hasConflict = true; break } // PRUNE
          }
          if (!hasConflict) {
            for (const section of sectionCombination) currentSelections.push({ courseId, section })
            generateSchedulesRecursive(courseSections, currentIndex + 1, currentSelections, maxSchedules, result)
            for (let i = 0; i < sectionCombination.length; i++) currentSelections.pop() // Backtrack
          }
        }
      }
      ```
    ]
  ]
]

// 3.7 - Algorithm Visualization
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Algorithm Visualization]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[How backtracking explores and prunes the search tree]
  #v(0.3em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt, width: 90%)[
      #text(size: 10pt)[
        ```
        Course 1 (SYSC3303)        Course 2 (SYSC4001)        Course 3 (COMP3005)
              │                          │                          │
        ┌─────┼─────┐              ┌─────┼─────┐              ┌─────┼─────┐
        │     │     │              │     │     │              │     │     │
       A-LEC B-LEC C-LEC         A-LEC B-LEC C-LEC         A-LEC B-LEC C-LEC
        │                          │                          │
        ├──→ Try B-LEC ──→ CONFLICT with A ──→ PRUNE (don't check C)
        │
        ├──→ Try C-LEC ──→ OK ──→ Try Course 2 sections...
        │                              │
        │                              └──→ A-LEC conflicts ──→ PRUNE
        │                              └──→ B-LEC OK ──→ Try Course 3...
        │                                                    │
        │                                                    └──→ Found valid schedule!
        │
        └──→ Backtrack, try next combination...
        ```
      ]
    ]
  ]

  #v(0.3em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Why Pruning Helps]
      #text(size: 12pt)[
        - Conflict at Course 1 → skip all Course 2/3 combinations
        - Exponential reduction in practice
        - Most branches get pruned early
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Complexity]
      #text(size: 12pt)[
        - *Worst case:* O(b^d) where b=sections, d=courses
        - *Average case:* Much better due to pruning
        - *Real performance:* < 1 second for 5 courses
      ]
    ]
  )
]

// 3.8 - API Endpoint & Integration
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: API Integration]
  #v(0.05em)
  #text(size: 15pt, fill: rgb("#666666"))[REST endpoint with prerequisite validation]
  #v(0.08em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.5em,
    [
      #text(weight: "semibold", size: 12pt)[POST /schedules/generate]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 6.5pt)[
          ```typescript
          router.post('/generate', async (req, res) => {
            const { courseIds, term, maxSchedules = 50 } = req.body
            if (courseIds.length > 8) return res.status(400).json({error:'Max 8 courses'})
            const courseSections = await Promise.all(
              courseIds.map(async (id) => ({
                courseId: id,
                sections: await prisma.section.findMany({ where: { courseId: id, term } })
              }))
            )
            const schedules: GeneratedSchedule[] = []
            generateSchedulesRecursive(courseSections, 0, [], maxSchedules, schedules)
            res.json({ schedules, count: schedules.length })
          })
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Response Format]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 6.5pt)[
          ```json
          { "schedules": [{
              "id": 1,
              "selections": [{ "courseId": "SYSC3303",
                "section": {"crn":"12345","sectionCode":"A","days":"MWF","startTime":"0835"} }],
              "hasConflicts": false
            }],
            "count": 15 }
          ```
        ]
      ]
      #text(size: 9pt)[Frontend displays these as timetable grids with CRNs for registration.]
    ]
  )
]

// ============================================================================
// SECTION 4: DATA ACQUISITION (~10 minutes)
// ============================================================================

// 4.1 - The Starting Question
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 4: Data Acquisition]
  #text(size: 16pt, fill: rgb("#666666"))[The first question: What courses even exist?]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[Where I Started]
      #v(0.2em)
      #text(size: 13pt)[
        Before I could build anything, I needed to answer a basic question:
      ]
      #v(0.2em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 10pt)[
        #text(size: 14pt, style: "italic")[
          "What courses exist at Carleton, and when are they offered?"
        ]
      ]
      #v(0.3em)
      #text(size: 13pt)[
        I wasn't thinking about prerequisites yet. I just needed raw course data:
        - What courses exist?
        - What sections does each course have?
        - What times do they meet?
        - Which semester is each course in?
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[The Problem]
      #v(0.2em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *Carleton has no public API.* \
          \
          There's no endpoint I can call to get "all courses". The data exists, but it's locked inside their internal systems.
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 15pt)[My Thought Process]
      #text(size: 13pt)[
        Where does this data already exist in a usable form? \
        \
        → *The Schedule Builder* on Carleton Central \
        → It somehow loads all sections for a term \
        → There must be a backend call I can intercept
      ]
    ]
  )
]

// 4.2 - Discovering the Timetable Endpoint
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Timetable Source]
  #text(size: 15pt, fill: rgb("#666666"))[Engineering decision: Where to get section/scheduling data]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Problem]
      #text(size: 10pt)[Need all course sections with times, days, CRNs for schedule generation. No public API exists.]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Options Considered]
      #table(
        columns: (1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Option*], [*Trade-off*],
        [Scrape Central pages], [Slow, 1000s of requests],
        [PDF timetable parsing], [Fragile, format changes],
        [Intercept existing tool], [Fast, single request],
      )
    ],
    [
      #text(weight: "semibold", size: 12pt)[Chosen Approach]
      #text(size: 10pt)[Reverse-engineer Schedule Builder via DevTools:]
      #rect(fill: rgb("#1e1e1e"), radius: 4pt, inset: 4pt)[
        #table(
          columns: (2fr, 1fr),
          stroke: none,
          inset: 3pt,
          text(fill: rgb("#888"), size: 8pt)[Name], text(fill: rgb("#888"), size: 8pt)[Status],
          text(fill: rgb("#fff"), size: 8pt)[☐ scheduler\_server.php], text(fill: rgb("#4f4"), size: 8pt)[200],
        )
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Why It Works]
      #text(size: 10pt)[Single endpoint returns *all* sections for a term. Same data source Carleton uses.]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Limitations]
      #text(size: 10pt)[Undocumented — could change. Mitigation: modular parser.]
    ]
  )
]

// 4.3 - The First Fetch
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The First Fetch]
  #text(size: 15pt, fill: rgb("#666666"))[One curl command, ~3,800 sections]
  #v(0.2em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[The Command]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```bash
          curl "https://central.carleton.ca/prod/
                scheduler_server.php?term=202610" > sectiondata.txt
          ```
        ]
      ]
      #v(0.2em)
      #text(weight: "semibold", size: 13pt)[What This Gave Me]
      #text(size: 11pt)[
        A single file with *~3,800 rows*: every dept, course, section type (LEC/LAB/TUT), times, days, CRNs, capacity.
      ]
      #v(0.1em)
      #text(size: 11pt)[*One request = entire term's schedule data*]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Why This Was Perfect]
      #v(0.15em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[
        #text(size: 11pt)[
          *Structured* — Tab-separated, not HTML \
          *Complete* — All sections in one file \
          *Easy to parse* — Just split on tabs
        ]
      ]
      #v(0.15em)
      #text(weight: "semibold", size: 13pt)[What I Didn't Get (Yet)]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 11pt)[
          - Prerequisites, course titles
          - Elective categories \
          *Separate fetches needed*
        ]
      ]
    ]
  )
]

// 4.4 - Parsing the Section Data
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Parsing Section Data]
  #text(size: 15pt, fill: rgb("#666666"))[Turning raw TSV into structured database records]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Raw Data Format]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```
term  CRN    dept  num   sec  type  day  start  end
25WN  12345  SYSC  3303  A    LEC   MWF  0835   0925
25WN  12346  SYSC  3303  L1   LAB   T    1435   1725
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[What Each Row Tells Me]
      #text(size: 10pt)[
        - *SYSC3303* section *A* meets *MWF at 8:35am*
        - Lab options: *L1* (Tuesday), *L2* (Thursday)
        - CRN *12345* is what students need to register
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[The Parser I Built]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
function parseTimetableLine(line: string) {
  const parts = line.split('\t')
  return {
    crn: parts[1],
    courseId: `${parts[2]}${parts[3]}`,
    sectionCode: parts[4],
    sectionType: parts[5],
    days: parts[6],
    startTime: parts[7],
    endTime: parts[8]
  }
}
```]
      ]
      #text(size: 10pt)[Simple split on tabs, map to fields, insert into DB.]
    ]
  )
]

// 4.5 - What I Learned From This Data
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: What the Data Revealed]
  #text(size: 15pt, fill: rgb("#666666"))[Understanding Carleton's course structure from the raw data]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Course Structure Patterns]
      #text(size: 11pt)[By looking at the data, I discovered how Carleton structures courses:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          *SYSC 3303* has: \
          → Sections A, B, C (lectures) \
          → Each lecture has labs: L1, L2, L3... \
          *COMP 2401* has: \
          → Section A (lecture) \
          → Labs L1, L2, L3, L4; Tutorials T1, T2 \
          *Some courses* (like seminars): \
          → Just one section, no lab/tut
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Why This Matters for Scheduling]
      #text(size: 11pt)[To register for SYSC 3303, a student needs to pick one lecture section (A, B, or C) and one lab that fits.]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[*Insight:* The schedule generator needs to try combinations of LEC + LAB + TUT and check if they fit without time conflicts.]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[Data Quality]
      #text(size: 11pt)[
        - Some rows had missing times (online/async)
        - Some had "TBA" for room/instructor
        - Handled these as "no time conflict" cases
      ]
    ]
  )
]

// 4.6 - Summary of First Fetch
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: First Fetch Summary]
  #text(size: 15pt, fill: rgb("#666666"))[What the timetable fetch accomplished]
  #v(0.15em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 8pt, width: 90%)[
      #grid(
        columns: (1fr, 0.1fr, 1fr, 0.1fr, 1fr),
        gutter: 0.15em,
        align: center + horizon,
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 5pt)[#text(size: 9pt, weight: "bold")[1. Discover] \ #text(size: 8pt)[Find endpoint]],
        text(size: 12pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[#text(size: 9pt, weight: "bold")[2. Fetch] \ #text(size: 8pt)[curl term data]],
        text(size: 12pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[#text(size: 9pt, weight: "bold")[3. Parse] \ #text(size: 8pt)[Split & insert]],
      )
    ]
  ]

  #v(2.2em)
  #align(center)[
  #grid(
    columns: (2fr, 2fr),
    gutter: 2.6em,
    [
      #text(weight: "semibold", size: 12pt)[What I Had]
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[✓ Every course this term \ ✓ All sections, times, CRNs \ ✓ Section types & capacity]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Still Needed]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[✗ Course titles \ ✗ Prerequisites \ ✗ Elective mappings]
      ]
    ]
  )
  ]

  #v(0.15em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
      #text(size: 10pt)[*Next:* Get prerequisites from course calendar]
    ]
  ]
]

// 4.7 - The Next Problem: Prerequisites
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Next Problem]
  #text(size: 16pt, fill: rgb("#666666"))[I have courses, but can students actually take them?]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[The New Question]
      #v(0.2em)
      #text(size: 13pt)[
        The timetable data told me *what* courses exist and *when* they meet. But it didn't tell me:
      ]
      #v(0.2em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 10pt)[
        #text(size: 14pt, style: "italic")[
          "What do I need to have completed before I can take this course?"
        ]
      ]
      #v(0.3em)
      #text(size: 13pt)[
        For a scheduler to be useful, it needs to warn students: \
        "You can't take SYSC 4001 — you're missing SYSC 3303."
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[Where Prerequisites Live]
      #v(0.2em)
      #text(size: 13pt)[
        Carleton publishes all course information at:
      ]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          `https://calendar.carleton.ca/undergrad/courses/`
        ]
      ]
      #v(0.2em)
      #text(size: 13pt)[
        Each department has a page with:
        - Course title and description
        - Credit value
        - *Prerequisite(s)* — what we need
        - Preclusions (courses that conflict)
      ]
      #v(0.2em)
      #text(size: 13pt, style: "italic")[
        Sounds simple enough... right?
      ]
    ]
  )
]

// 4.8 - The Prerequisite Problem: Identifying Courses
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Identifying Courses]
  #text(size: 15pt, fill: rgb("#666666"))[Finding courses in the HTML is the easy part]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[The HTML Structure]
      #text(size: 10pt)[Each course page has a predictable URL pattern:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```
/undergrad/courses/{DEPT}/{COURSE}/
Example: /undergrad/courses/SYSC/SYSC3303/
```]
      ]
      #v(0.1em)
      #text(size: 10pt)[Prerequisite text is in a consistent div:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```html
<div class="coursedescadditional">
  Prerequisite(s): COMP 1005 or COMP 1405.
</div>
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[The Fetch Process]
      #text(size: 10pt)[For each course, I ran:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```bash
curl "https://calendar.carleton.ca/undergrad/
      courses/COMP/COMP1501/" > comp1501.html
```]
      ]
      #v(0.1em)
      #text(size: 10pt)[Saved 348 course pages locally:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[`courses/sysc/sysc1006.html, sysc3303.html...`]
      ]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[*This part was straightforward.* The hard part was next.]
      ]
    ]
  )
]

// 4.9 - The Courseblock HTML Structure
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Courseblock HTML]
  #text(size: 15pt, fill: rgb("#666666"))[Each course on the calendar has a consistent HTML structure]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[What the HTML Looks Like]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```html
          <div class="courseblock">
            <strong>
              <span class="courseblocktitle">
                <span class="courseblockcode">
                  COMP&nbsp;1405
                </span> 
                [0.5 credit]<br>
                Introduction to CS I
              </span>
            </strong><br>
            Introduction to computer science...
          </div>
          ```
        ]
      ]
      #text(size: 10pt, style: "italic")[Consistent across all ~500 courses.]
    ],
    [
      #text(weight: "semibold", size: 13pt)[What We Extract From It]
      #table(
        columns: (0.8fr, 1.2fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 4pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*HTML Element*], [*Data We Get*],
        [`courseblockcode`], [Course code (COMP1405)],
        [`[0.5 credit]`], [Credit value (0.5)],
        [After `<br>`], [Course title],
        [After `</strong>`], [Course description],
      )
      #v(0.15em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[*Key insight:* The structure is predictable, so regex can reliably extract each field.]
      ]
    ]
  )
]

// 4.10 - Key Parsing Functions
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Parsing Functions]
  #text(size: 15pt, fill: rgb("#666666"))[The regex patterns that extract course data from HTML]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Step 1: Find All Course Blocks]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          // Match each <div class="courseblock">
          const courseBlockRegex = 
            /<div class="courseblock">([\s\S]*?)<\/div>/g
          let match: RegExpExecArray | null
          while ((match = courseBlockRegex.exec(html))) {
            const blockContent = match[1]
            // Parse this block...
          }
          ```
        ]
      ]
      #v(0.1em)
      #text(size: 10pt)[*Pattern:* `[\s\S]*?` matches any char (incl. newlines) non-greedily.]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Step 2: Extract Course Details]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          const headerRegex = 
            /<span class="courseblockcode">
              ([A-Z]{2,5})&#160;(\d{4})
            <\/span>\s+
            \[([0-9.]+)\s+credit[s]?\]<br\/>\s*
            ([^<]+)<\/span>/
          const [, dept, num, credits, title] = 
            headerRegex.exec(blockContent)
          ```
        ]
      ]
      #v(0.1em)
      #text(size: 10pt)[*Note:* `&#160;` is HTML entity for non-breaking space.]
    ]
  )
]

// 4.11 - Description Extraction
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Extracting Descriptions]
  #text(size: 15pt, fill: rgb("#666666"))[Getting the course description requires a separate pattern]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[The Description Pattern]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```typescript
          const descriptionRegex = 
            /<\/span><\/strong><br\/>\s*([^<]+)/
          const descMatch = 
            descriptionRegex.exec(blockContent)
          let description = descMatch 
            ? descMatch[1].trim() 
            : title.trim()
          ```
        ]
      ]
      #v(0.1em)
      #text(size: 10pt)[The `[^<]+` pattern captures text until the next HTML tag.]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Putting It Together]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```typescript
          courses[courseId] = {
            title: title.trim(),
            credits: parseFloat(creditsStr),
            description: description
          }
          ```
        ]
      ]
      #v(0.1em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[*Processing:* 30 depts × ~15 courses = ~500 parsed in batches with delays]
      ]
    ]
  )
]

// 4.12 - The JSON Output
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The JSON Output]
  #text(size: 15pt, fill: rgb("#666666"))[All course data merged into a single JSON file]
  #v(0.1em)
  #grid(
    columns: (1.2fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[course\_prerequisites\_simple.json]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```json
{
  "SYSC1006": {
    "required": "ECOR1031[C-] || ...",
    "restricted": ["COMP2401"],
    "title": "Foundations of Imperative...",
    "credits": 0.5
  },
  "SYSC3303": {
    "required": "SYSC2004 && SYSC2100",
    "restricted": [],
    "title": "Real-Time Concurrent Systems",
    "credits": 0.5
  }
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[What Each Entry Contains]
      #table(
        columns: (0.7fr, 1.3fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Field*], [*Source*],
        [`required`], [Manual conversion from prose],
        [`restricted`], [Preclusions from calendar],
        [`title`], [Parsed from courseblock],
        [`credits`], [Parsed from courseblock],
      )
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
        #text(size: 10pt)[*Single source of truth* — seed script reads this to populate the DB.]
      ]
      #text(size: 10pt)[Total: *348 courses* with complete data]
    ]
  )
]

// 4.13 - Data Flow: JSON to Database
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: JSON to Database]
  #text(size: 15pt, fill: rgb("#666666"))[The seed script parses JSON and populates PostgreSQL]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[seed.ts — Creating Course Records]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[
          ```typescript
          const data = JSON.parse(
            await fs.readFile('course_prerequisites.json')
          )
          for (const courseId of allCourses) {
            const entry = data[courseId]
            await prisma.course.upsert({
              where: { id: courseId },
              update: { title: entry?.title, ... },
              create: { id: courseId, ... }
            })
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[What Gets Created]
      #v(0.1em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          1. *Course record* — id, title, credits \
          2. *Prerequisite expression* — symbolic string \
          3. *Prerequisite tree nodes* — AND/OR/COURSE
        ]
      ]
      #v(0.15em)
      #text(weight: "semibold", size: 13pt)[Why Upsert?]
      #text(size: 11pt)[
        - Update if exists, create if new
        - Safe to run multiple times (idempotent)
        - Re-import without duplicates
      ]
    ]
  )
]

// 4.14 - The Complete Data Pipeline
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Complete Pipeline]
  #text(size: 15pt, fill: rgb("#666666"))[From Carleton's website to the user's screen]
  #v(0.1em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 5pt, width: 98%)[
      #grid(
        columns: (1fr, 0.08fr, 1fr, 0.08fr, 1fr, 0.08fr, 1fr, 0.08fr, 1fr),
        gutter: 0.05em,
        align: center + horizon,
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 3pt)[#text(size: 9pt, weight: "bold")[1. Fetch] \ #text(size: 7pt)[curl pages]],
        text(size: 10pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 3pt)[#text(size: 9pt, weight: "bold")[2. Parse] \ #text(size: 7pt)[Regex extract]],
        text(size: 10pt)[→],
        rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 3pt)[#text(size: 9pt, weight: "bold")[3. Convert] \ #text(size: 7pt)[To symbolic]],
        text(size: 10pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 3pt)[#text(size: 9pt, weight: "bold")[4. Merge] \ #text(size: 7pt)[Into JSON]],
        text(size: 10pt)[→],
        rect(fill: rgb("#e8e8ff"), radius: 4pt, inset: 3pt)[#text(size: 9pt, weight: "bold")[5. Seed] \ #text(size: 7pt)[PostgreSQL]],
      )
    ]
  ]

  #v(0.1em)
  #align(center)[#text(size: 9pt)[↓ Database populated ↓]]
  #v(0.05em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 5pt, width: 80%)[
      #grid(
        columns: (1fr, 0.12fr, 1fr, 0.12fr, 1fr),
        gutter: 0.08em,
        align: center + horizon,
        rect(fill: rgb("#e8e8ff"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[PostgreSQL] \ #text(size: 8pt)[Courses, sections]],
        text(size: 11pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[Express API] \ #text(size: 8pt)[/api/courses]],
        text(size: 11pt)[→],
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[React] \ #text(size: 8pt)[Search UI]],
      )
    ]
  ]

  #v(0.1em)
  #align(center)[
    #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
      #text(size: 10pt)[*Result:* User types "SYSC" → API queries DB → Returns courses with titles, credits, section types]
    ]
  ]
]

// 4.15 - The Course Search API
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Search API]
  #text(size: 15pt, fill: rgb("#666666"))[How the frontend gets course data from the database]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[GET /api/courses/search?q=sysc]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```typescript
const courses = await prisma.course.findMany({
  where: {
    OR: [{ id: { contains: q.toUpperCase() } },
         { title: { contains: q } }],
    sections: { some: {} }
  },
  take: 20
})
return { code: course.id, name: course.title,
         credits: course.credits, 
         sectionTypes: ["LAB", "LEC"] }
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[API Response]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```json
{ "results": [
    { "code": "SYSC1006",
      "name": "Foundations of...",
      "credits": 0.5, 
      "sectionTypes": ["LAB", "LEC"] },
    { "code": "SYSC2004", ... }
  ],
  "count": 15, "query": "sysc"
}
```]
      ]
      #text(size: 9pt)[*Key:* `sectionTypes` tells UI if course has labs, lectures, tutorials.]
    ]
  )
]

// 4.16 - The Course Search UI
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Where It All Comes Together]
  #text(size: 15pt, fill: rgb("#666666"))[The course search bar shows data from all our sources]
  #v(0.1em)
  #grid(
    columns: (1.1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[The User's View]
      #rect(fill: rgb("#ffffff"), stroke: 0.5pt + rgb("#cccccc"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt, weight: "semibold")[Search Courses]
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 3pt, width: 100%)[#text(size: 9pt)[🔍 sysc]]
        #v(0.1em)
        #rect(fill: rgb("#fafafa"), radius: 3pt, inset: 3pt, width: 100%)[
          #text(size: 9pt, weight: "bold")[SYSC1006] #text(size: 9pt)[Foundations of Imperative Prog.] \
          #text(size: 8pt, fill: rgb("#666666"))[0.5 credits | LAB, LEC]]
        #v(0.08em)
        #rect(fill: rgb("#fafafa"), radius: 3pt, inset: 3pt, width: 100%)[
          #text(size: 9pt, weight: "bold")[SYSC2004] #text(size: 9pt)[OO Software Development] \
          #text(size: 8pt, fill: rgb("#666666"))[0.5 credits | LAB, LEC]]
        #v(0.08em)
        #rect(fill: rgb("#fafafa"), radius: 3pt, inset: 3pt, width: 100%)[
          #text(size: 9pt, weight: "bold")[SYSC2100] #text(size: 9pt)[Algorithms & Data Structures] \
          #text(size: 8pt, fill: rgb("#666666"))[0.5 credits | LAB, LEC, PAN]]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Where Each Field Comes From]
      #table(
        columns: (0.8fr, 1.2fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*UI Field*], [*Data Source*],
        [SYSC1006], [Timetable fetch],
        [Course title], [Courseblock parsing],
        [0.5 credits], [Courseblock parsing],
        [LAB, LEC], [Timetable section types],
      )
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[*The payoff:* All that data acquisition enables a simple, fast search showing everything students need.]
      ]
      #text(size: 9pt)[*Plus:* Clicking a course shows prerequisite info.]
    ]
  )
]

// 4.17 - The Real Challenge: Understanding Prerequisites
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Real Challenge]
  #text(size: 15pt, fill: rgb("#666666"))[Prerequisites are written in natural language — for humans, not computers]
  #v(0.2em)

  #text(weight: "semibold", size: 14pt)[Here's What I Was Dealing With]
  #v(0.15em)

  #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 12pt)[Easy Example — COMP 1501:]
    #v(0.1em)
    #text(size: 11pt)[
      `Prerequisite(s): COMP 1005 or COMP 1405.`
    ]
    #v(0.1em)
    #text(size: 11pt, fill: rgb("#2d7a2d"))[
      → Clear: need one of two courses. I can parse this.
    ]
  ]

  #v(0.15em)

  #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 12pt)[Medium Example — SYSC 1006:]
    #v(0.1em)
    #text(size: 11pt)[
      `Prerequisite(s): ECOR 1031 or (ECOR 1041 and ECOR 1042), all with minimum grade C-.`
    ]
    #v(0.1em)
    #text(size: 11pt, fill: rgb("#996600"))[
      → Tricky: OR and AND mixed, plus grade requirement. Needs careful conversion.
    ]
  ]

  #v(0.15em)

  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 12pt)[Hard Example — COMP 1405:]
    #v(0.1em)
    #text(size: 10pt)[
      `Prerequisite(s): restricted to students registered in the B.C.S. program, B.Cyber. program...`
    ]
    #v(0.1em)
    #text(size: 11pt, fill: rgb("#cc0000"))[
      → *No course requirements at all.* It's a program restriction.
    ]
  ]
]

// 4.18 - The Conversion Problem
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Conversion Problem]
  #text(size: 15pt, fill: rgb("#666666"))[I needed to turn prose into something a computer can evaluate]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[What the Parser Needs]
      #text(size: 11pt)[My prerequisite validator only understands symbolic logic:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          ```
          SYSC3303              → single course
          SYSC3303 && SYSC3310  → AND logic
          SYSC3303 || SYSC3310  → OR logic
          SYSC3303[C-]          → with grade requirement
          FOURTH_YEAR           → year standing
          ```
        ]
      ]
      #v(0.1em)
      #text(size: 11pt)[Combine with parentheses: `(A || B) && C`]
    ],
    [
      #text(weight: "semibold", size: 13pt)[What I Had to Do]
      #text(size: 11pt)[*Manually* convert each prerequisite from prose to symbolic format.]
      #v(0.1em)
      #table(
        columns: (1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 4pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Prose*], [*Symbol*],
        ["and"], [`&&`],
        ["or"], [`||`],
        ["minimum grade of C-"], [`[C-]`],
        ["fourth-year standing"], [`FOURTH_YEAR`],
        ["permission of dept"], [`PERMISSION`],
      )
      #v(0.1em)
      #text(size: 10pt, style: "italic")[348 courses. Each one read, understood, and converted by hand.]
    ]
  )
]

// 4.19 - Conversion Examples
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Conversion Examples]
  #text(size: 15pt, fill: rgb("#666666"))[From raw HTML to symbolic logic]
  #v(0.2em)

  #text(weight: "semibold", size: 14pt)[Example 1: SYSC 1006 (Medium Difficulty)]
  #v(0.15em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[Raw HTML:]
    #v(0.1em)
    #text(size: 10pt)[
      `Prerequisite(s): ECOR 1031 or (ECOR 1041 and ECOR 1042), all with minimum grade C-.`
    ]
  ]
  #v(0.1em)
  #align(center)[#text(size: 14pt)[↓ Manual Conversion ↓]]
  #v(0.1em)
  #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[Symbolic Format:]
    #v(0.1em)
    #text(size: 10pt)[
      `"ECOR1031[C-] || (ECOR1041[C-] && ECOR1042[C-])"`
    ]
  ]

  #v(0.2em)

  #text(weight: "semibold", size: 14pt)[Example 2: COMP 1405 (Program Restriction)]
  #v(0.15em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[Raw HTML:]
    #v(0.1em)
    #text(size: 10pt)[
      `Prerequisite(s): restricted to students registered in the B.C.S. program...`
    ]
  ]
  #v(0.1em)
  #align(center)[#text(size: 14pt)[↓ Manual Conversion ↓]]
  #v(0.1em)
  #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[Symbolic Format:]
    #v(0.1em)
    #text(size: 10pt)[
      `"OTHER_REQUIREMENT"` — *We can't validate program restrictions programmatically (yet)*
    ]
  ]
]

// 4.20 - The OTHER_REQUIREMENT Problem
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: What We Can't Parse]
  #text(size: 15pt, fill: rgb("#666666"))[Some prerequisites don't fit into course logic]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Types We Can Handle]
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[
        #text(size: 11pt)[
          ✓ *Course requirements* \
          #h(1em) "SYSC 3303 and SYSC 3310" \
          ✓ *Grade requirements* \
          #h(1em) "with a minimum grade of C-" \
          ✓ *Year standing* \
          #h(1em) "fourth-year standing" \
          ✓ *Permission clauses* \
          #h(1em) "or permission of the department"
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Types We Can't (Yet)]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 11pt)[
          ✗ *Program restrictions* \
          #h(1em) "restricted to B.C.S. students" \
          ✗ *Credit thresholds* \
          #h(1em) "15.0 credits completed" \
          ✗ *Vague equivalencies* \
          #h(1em) "or equivalent experience" \
          ✗ *Instructor discretion* \
          #h(1em) "at the discretion of..."
        ]
      ]
    ]
  )
  #v(0.15em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt, width: 85%)[
      #text(size: 11pt)[*Solution:* These become `OTHER_REQUIREMENT` or `PERMISSION` — the app flags them as "check manually".]
    ]
  ]
]

// 4.21 - Parsing Symbolic Expressions to Tree Nodes
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: From JSON to Database]
  #text(size: 15pt, fill: rgb("#666666"))[The seed script parses symbolic expressions into tree nodes]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Input: Symbolic Expression]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[`"ECOR1031[C-] || (ECOR1041 && ECOR1042)"`]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Parser Logic (seed.ts)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```typescript
function parseSimpleTerm(term: string) {
  if (['FIRST_YEAR','FOURTH_YEAR']
       .includes(term))
    return { type: 'YEAR_STANDING' }
  const gradeMatch = term.match(
    /^([A-Z]{3,4}\d{4})\[([A-Z\-+]*)\]$/)
  if (gradeMatch) 
    return {type:'COURSE', grade: gradeMatch[2]}
  return { type: 'PERMISSION' }
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Output: Tree Structure in DB]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #align(center)[#text(size: 9pt)[```
        [OR] ← root
       /    \
[COURSE]    [AND]
ECOR1031     /   \
         [COURSE] [COURSE]
```]]
      ]
      #v(0.1em)
      #text(size: 9pt)[Each box → row in `prerequisite_nodes`:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 8pt)[```
id | nodeType | requiredCourseId | parentId
1  | OR       | null             | null
2  | COURSE   | ECOR1031         | 1
```]
      ]
    ]
  )
]

// 4.22 - Prerequisites Summary
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Prerequisites Summary]
  #text(size: 15pt, fill: rgb("#666666"))[The complete pipeline from course calendar to database]
  #v(0.15em)
  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 5pt, width: 95%)[
      #grid(
        columns: (1fr, 0.1fr, 1fr, 0.1fr, 1fr, 0.1fr, 1fr),
        gutter: 0.1em,
        align: center + horizon,
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[1. Fetch] \ #text(size: 8pt)[curl pages]],
        text(size: 12pt)[→],
        rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[2. Read] \ #text(size: 8pt)[Understand]],
        text(size: 12pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[3. Convert] \ #text(size: 8pt)[Symbolic fmt]],
        text(size: 12pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[#text(size: 9pt, weight: "bold")[4. Seed] \ #text(size: 8pt)[Store in DB]],
      )
    ]
  ]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.5em,
    [
      #text(weight: "semibold", size: 11pt)[Why Manual Conversion?]
      #text(size: 9pt)[
        - Natural language is *ambiguous*
        - "all with a minimum grade" — which courses?
        - *Accuracy matters more than automation*
      ]
    ],
    [
      #text(weight: "semibold", size: 11pt)[The Result]
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[
          ✓ 348 courses with symbolic prereqs \
          ✓ Grade & year requirements captured \
          ✓ AND/OR logic preserved
        ]
      ]
    ]
  )
  #v(0.1em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 4pt)[
      #text(size: 10pt)[*The hard part is done.* Now the validator can check any student's transcript.]
    ]
  ]
]

// Implementation 1/4: Academic Audit Parsing (trade-offs + reliability)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parsing: Reliability & Trade-offs]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Fast parsing with fallbacks for edge cases]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Approaches Considered]
      #table(
        columns: (1fr, 1.2fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Option*], [*Trade-off*],
        [DOM parser (cheerio/jsdom)], [More robust, heavier dependency],
        [Regex + fallbacks], [Fast + simple, brittle if HTML changes],
      )
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[What We Implemented]
      #text(size: 12pt)[
        - targeted patterns for stable fields
        - fallback handling for missing grades/rows
        - O(n) scan over the HTML
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Example Patterns (Simplified)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```
          /(\d{9})/                         → student ID
          /Bachelor of Engineering - ([^<]+)/ → program
          /<tr.*class="takenCourse".*>/g     → course rows
          ```
        ]
      ]
      #v(0.3em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Known limitation:* if Carleton changes page structure, we’ll need to adjust patterns (or switch to a DOM parser).
        ]
      ]
    ]
  )
]

// Implementation 2/4: Prerequisite Representation (what we built)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Implementation 2/4: Prerequisite Representation]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Store AND/OR logic once, evaluate many times]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[The Core Problem]
      #text(size: 12pt)[
        Prerequisites are logical expressions, not simple lists:
      ]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          SYSC 4001 needs: \
          (SYSC 3303 AND SYSC 3310) OR permission \
          Fourth-year standing OR (AERO 2001 AND MATH 2004)
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Implementation Goal]
      #text(size: 12pt)[
        Avoid re-parsing strings on every request.
        Store the structure in the DB so it’s reusable and queryable.
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Chosen Model: Tree Nodes]
      #v(0.2em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```
                  [OR]
                 /    \
             [AND]    [PERM]
             /   \
          3303  3310

          Node types: AND | OR | COURSE | YEAR | PERMISSION
          ```
        ]
      ]
      #v(0.3em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[*Result:* prerequisite checking becomes a fast tree walk]
      ]
    ]
  )
]

// Implementation 2/4: Prerequisite Evaluation (how it runs)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Evaluation: How It Runs]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Recursive evaluation against the student’s completions]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Algorithm]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```
          eval(node):
            AND  → all children pass
            OR   → any child passes
            COURSE → course in transcript (and grade if required)
            YEAR → student standing >= required
            PERM → requires manual override
          ```
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Complexity]
      #text(size: 12pt)[
        - Time: O(n) for n nodes
        - Space: O(h) recursion depth
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Where It’s Used]
      #text(size: 12pt)[
        - course search / course detail: show “eligible vs missing prereqs”
        - schedule building: filter out courses you can’t take
      ]
      #v(0.3em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Trade-off:* a tree schema is more complex than a string, but it prevents repeated parsing and keeps the logic consistent everywhere.
        ]
      ]
    ]
  )
]

// Implementation 3/4: Schedule Generation (what we built)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Implementation 3/4: Schedule Generation]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Generate conflict-free combinations automatically]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Why This Needs an Algorithm]
      #text(size: 12pt)[
        A typical term quickly becomes combinatorial:
        - ~5 courses
        - multiple sections per course
        - LEC/LAB/TUT constraints
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Goal (Implemented)]
      #text(size: 12pt)[
        Find many valid schedules (not just one) and stop early when a partial choice already conflicts.
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Chosen Approach: Backtracking]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```
          pick course 1 section
            → try course 2 sections
              → if conflict: prune branch
              → else continue
          ```
        ]
      ]
      #v(0.3em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[*Optimization:* cap results (e.g., 50) to bound runtime]
      ]
    ]
  )
]

// Implementation 3/4: Conflict Detection (the constraint)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Conflicts: The Constraint]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Detect time overlaps quickly while building schedules]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Conflict Rule]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          Two meetings conflict iff: \
          same_day AND start1 < end2 AND start2 < end1
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Why It Works]
      #text(size: 12pt)[
        - O(1) overlap check
        - called repeatedly during the backtracking search
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[What a “Section” Means]
      #text(size: 12pt)[
        We treat a selected option as a bundle of required components:
        - LEC must fit
        - and LAB/TUT (if required) must fit
      ]
      #v(0.3em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Trade-off:* backtracking guarantees correctness, but worst-case runtime grows fast — pruning + caps keep it practical.
        ]
      ]
    ]
  )
]

// Implementation 4/4: Data Acquisition (what we built)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Implementation 4/4: Data Acquisition]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Populate the DB from scattered Carleton sources]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Reality Check]
      #text(size: 12pt)[
        There’s no single public API:
        - course calendar: many static HTML pages
        - timetable: separate system
        - electives: program-specific PDFs
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Design Choice]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[Separate data ingestion from the web app (CLI/scripts populate DB; app only reads)]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Pipeline (Implemented)]
      #table(
        columns: (1fr, 0.25fr, 1fr),
        stroke: 0.5pt + rgb("#dddddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Data*], [], [*How We Get It*],
        [Course titles + descriptions], [←], [parse calendar HTML pages],
        [Prerequisite text], [←], [extract + convert to node tree],
        [Section meeting times], [←], [import timetable export],
      )
      #v(0.3em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[Idempotent imports: rerun scripts without duplicating data]
      ]
    ]
  )
]

// Implementation 4/4: Data Evolution (what’s next)
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Evolution: What’s Next]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Keep data fresh each term and expand electives]
  #v(0.35em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[In Place Today]
      #text(size: 12pt)[
        - course + prerequisite ingestion into PostgreSQL
        - term-aware section storage (Fall/Winter)
        - clear split: scripts write, app reads
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Constraints]
      #text(size: 12pt)[
        - data changes every term
        - must avoid hammering university systems
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Remaining Work]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          - automate elective list ingestion \
          - improve multi-term (Fall/Winter/Summer) support \
          - admin tools for refresh + validation
        ]
      ]
      #v(0.3em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[This keeps the app accurate without manual re-entry each year.]
      ]
    ]
  )
]

// Design Principle 1: User-Centered Design
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Design Principle: User-Centered Design]
  #v(0.1em)
  #text(size: 18pt, fill: rgb("#666666"))[Making It Simple — Before vs After]
  #v(0.4em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#fff5f5"), radius: 6pt, inset: 10pt, width: 100%)[
        #text(weight: "semibold", fill: rgb("#bf112b"))[The Old Way]
        #v(0.3em)
        #text(size: 14pt)[
          "Can I take SYSC 4001?" \
          → Open audit in one tab \
          → Open calendar in another \
          → Find the prerequisites \
          → Check each one against your audit \
          → Figure out the AND/OR logic \
          \
          *Repeat for every course*
        ]
      ]
    ],
    [
      #rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 10pt, width: 100%)[
        #text(weight: "semibold", fill: rgb("#2d7a2d"))[With Our App]
        #v(0.3em)
        #text(size: 14pt)[
          "Can I take SYSC 4001?" \
          → Type "SYSC 4001" \
          → See "You're good" or "Need SYSC 3303" \
          \
          \
          \
          \
          *Instant feedback*
        ]
      ]
    ]
  )
  
  #v(0.5em)
  #align(center)[
    #text(size: 16pt, style: "italic")[Upload once, and the app remembers what you've completed]
  ]
]

// Design Principle 2: Constraint Satisfaction
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Design Principle: Constraint Satisfaction]
  #v(0.1em)
  #text(size: 18pt, fill: rgb("#666666"))[Too many combinations to check by hand]
  #v(0.4em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[The Problem]
      #v(0.3em)
      #text(size: 16pt)[
        - Pick 5 courses
        - Each course may have multiple sections
        - Each section may have LEC, LAB, TUT components
        - All combinations need to be checked for time conflicts
      ]
      #v(0.3em)
      #text(size: 16pt)[
        Doing this manually is tedious and error-prone.
      ]
    ],
    [
      #text(weight: "semibold")[How We Do It: Backtracking]
      #v(0.3em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          ```
          generateSchedules(courses, current):
            if all courses scheduled:
              save it, return
            for section in nextCourse:
              if no conflict:
                add section, recurse, remove
              else: skip this branch
          ```
        ]
      ]
      #v(0.3em)
      #text(size: 14pt)[
        If something conflicts, stop early and try the next option. This saves time early.
      ]
    ]
  )
]

// Design Principle 3: Separation of Concerns
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Design Principle: Separation of Concerns]
  #v(0.1em)
  #text(size: 18pt, fill: rgb("#666666"))[Three layers, each does one job]
  #v(0.6em)
  
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 12pt, width: 75%)[
      #text(weight: "semibold")[Frontend — React + TypeScript]
      #text(size: 14pt)[\
        What you see and interact with]
    ]
    #v(0.2em)
    #text(size: 20pt)[↓ talks to ↓]
    #v(0.2em)
    #rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 12pt, width: 75%)[
      #text(weight: "semibold")[Backend — Express + Node.js]
      #text(size: 14pt)[\
        Handles requests, runs the logic, talks to the database]
    ]
    #v(0.2em)
    #text(size: 20pt)[↓ queries ↓]
    #v(0.2em)
    #rect(fill: rgb("#fff8e8"), radius: 6pt, inset: 12pt, width: 75%)[
      #text(weight: "semibold")[Database — PostgreSQL]
      #text(size: 14pt)[\
        Stores courses, sections, and prerequisite rules]
    ]
  ]
]

// Design Principle 4: Complex Data Modeling
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Design Principle: Data Modeling]
  #v(0.1em)
  #text(size: 18pt, fill: rgb("#666666"))[Prerequisites aren't just a list — they're logic]
  #v(0.4em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold")[The Problem]
      #v(0.3em)
      #text(size: 15pt)[Prerequisites have AND/OR conditions:]
      #v(0.2em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 13pt)[
          SYSC 4001 needs: \
          #h(0.5em)\(SYSC 3303 AND SYSC 3310\) \
          #h(0.5em)OR \(SYSC 3303 AND SYSC 3320\) \
          #h(0.5em)OR \(Permission of instructor\)
        ]
      ]
      #v(0.3em)
    ],
    [
      #text(weight: "semibold")[Our Solution: A Tree]
      #v(0.3em)
      #align(center)[
        #text(size: 14pt)[
          ```
                  [OR]
                 / | \
            [AND][AND][PERM]
             / \   / \
          3303 3310 3303 3320
          ```
        ]
      ]
      #v(0.3em)
      #text(size: 14pt)[
        Walk the tree, check each node. If any OR branch passes, you're good.
      ]
    ]
  )
]

// Design Principle 5: Performance Optimization
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Design Principle: Performance Optimization]
  #v(0.1em)
  #text(size: 18pt, fill: rgb("#666666"))[Don't hammer the database]
  #v(0.4em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#fff5f5"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", fill: rgb("#bf112b"), size: 16pt)[Without Optimization]
        #v(0.3em)
        #text(size: 14pt)[
          User types "SYSC4001" \
          → 8 keystrokes = 8 API calls \
          → 8 database queries \
          Multiply by many concurrent users...
        ]
      ]
    ],
    [
      #rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", fill: rgb("#2d7a2d"), size: 16pt)[What We Do Instead]
        #v(0.3em)
        #text(size: 14pt)[
          *Debounce* — wait 300ms after typing stops \
          *Cache* — remember results for 5 min \
          *Min length* — don't search for "a" \
          *Cancel* — abort stale requests
        ]
      ]
    ]
  )
  
  #v(0.5em)
  #table(
    columns: (2fr, 1fr, 1fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 8pt,
    fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
    [*Scenario*], [*Before*], [*After*],
    [Typing "SYSC4907"], [8 requests], [1 request],
    [Same search twice], [2 requests], [0 \(cached\)],
  )
]

// Current State: Electives
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Work in Progress: Electives]
  #v(0.5em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[The Annoying Part]
      #v(0.3em)
      #text(size: 15pt)[
        Right now if you want to know what Science Electives you can take as a Software Eng student, you have to go to a separate website and dig through PDFs.
        
        Same deal for Complementary Studies, tech electives, etc.
      ]
      #v(0.3em)
      #text(weight: "semibold")[Where We're At]
      #v(0.2em)
      #text(size: 15pt)[
        - We detect elective types from your audit
        - Currently using placeholder data
      ]
    ],
    [
      #text(weight: "semibold")[What We're Adding]
      #v(0.3em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(size: 14pt)[
          *1. Add elective tables to the DB* \
          #h(0.5em)Which electives count for which programs \
          \
          *2. Get the real data* \
          #h(0.5em)From Carleton's official lists \
          \
          *3. Suggest electives automatically* \
          #h(0.5em)Based on your program and year \
          \
          *4. Include them in schedule generation* \
          #h(0.5em)Pick a Science Elective → see all options
        ]
      ]
    ]
  )
]

// Technical Stack
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Tech Stack]
  #v(0.5em)
  
  #table(
    columns: (0.8fr, 1.2fr, 2fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 10pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold")[Layer], 
    text(fill: white, weight: "bold")[Tech], 
    text(fill: white, weight: "bold")[Why],
    [Frontend], [React + TypeScript], [Components, type safety],
    [Styling], [TailwindCSS], [Fast to write, looks consistent],
    [Backend], [Express + Node.js], [Simple, fast, JS everywhere],
    [Database], [PostgreSQL], [Solid, handles complex queries],
    [ORM], [Prisma], [Type-safe DB queries, easy migrations],
  )
  
]

// User Flow
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[How It Works]
  #v(0.2em)
  #text(size: 20pt, weight: "semibold")[From upload to registration]
  #v(0.5em)
  #align(center)[
    #grid(
      columns: (1fr, 0.2fr, 1fr, 0.2fr, 1fr),
      gutter: 0.2em,
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[1. Upload]
        #text(size: 11pt)[\
          Drop in your audit HTML]
      ],
      align(horizon)[→],
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[2. Parse]
        #text(size: 11pt)[\
          We extract your courses]
      ],
      align(horizon)[→],
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[3. Search]
        #text(size: 11pt)[\
          Find courses, check prereqs]
      ],
    )
    #v(0.5em)
    #grid(
      columns: (1fr, 0.2fr, 1fr, 0.2fr, 1fr),
      gutter: 0.2em,
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[4. Generate]
        #text(size: 11pt)[\
          Click the button]
      ],
      align(horizon)[→],
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[5. Pick One]
        #text(size: 11pt)[\
          Browse the timetables]
      ],
      align(horizon)[→],
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 8pt)[
        #text(weight: "semibold", size: 15pt)[6. Register]
        #text(size: 11pt)[\
          Copy CRNs, paste in Central]
      ],
    )
  ]
]

// Challenges & Solutions
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Problems We Ran Into]
  #v(0.5em)
  
  #table(
    columns: (1fr, 1.5fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 10pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold")[Problem], 
    text(fill: white, weight: "bold")[How We Solved It],
    [Prerequisites have complex AND/OR logic], [Store them as trees, walk recursively],
    [Many schedule combinations to check], [Backtracking with early exit on conflicts],
    [Search hitting DB too much], [Debounce, cache, cancel old requests],
    [Audits aren't all formatted the same], [Pattern matching with fallbacks],
    [Page refresh loses your state], [URL routing + sessionStorage],
    [Checking time conflicts], [Interval overlap check, filter by day first],
  )
]

// Remaining Work
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[What's Left \(~2 Months\)]
  #v(0.5em)
  
  #grid(
    columns: (1fr, 1fr),
    rows: (auto, auto),
    gutter: 1em,
    rect(fill: rgb("#fff8e8"), radius: 6pt, inset: 12pt)[
      #text(weight: "semibold")[Electives \(Main Focus\)]
      #text(size: 14pt)[\
        - Get official elective lists into the DB \
        - Link them to programs \
        - Auto-suggest based on your audit \
        - Include in schedule generation]
    ],
    rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt)[
      #text(weight: "semibold")[UI Polish]
      #text(size: 14pt)[\
        - Better way to compare schedules \
        - Improve visual feedback]
    ],
    rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt)[
      #text(weight: "semibold")[Term Selection]
      #text(size: 14pt)[\
        - Add ability to pick Fall vs Winter \
        - Fetch section data for both terms]
    ],
    rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt)[
      #text(weight: "semibold")[Testing & Edge Cases]
      #text(size: 14pt)[\
        - End-to-end tests \
        - Handle weird audit formats \
        - Make sure it doesn't break]
    ],
  )
]

// Summary
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Summary]
  #v(0.3em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(size: 18pt, weight: "semibold")[What It Does]
      #v(0.3em)
      #text(size: 15pt)[
        ✓ Upload your audit once, we remember it
        
        ✓ Search any course, see if you qualify
        
        ✓ Generate conflict-free schedules
        
        ✓ Copy CRNs in one click
      ]
    ],
    [
      #text(size: 18pt, weight: "semibold")[How We Built It]
      #v(0.3em)
      #text(size: 15pt)[
        - Focused on making it simple to use
        
        - Backtracking to handle the combinatorics
        
        - Clean separation: frontend / backend / DB
        
        - Trees for prerequisite logic
        
        - Debouncing + caching so search is fast
      ]
    ]
  )
]

// Thank You
#slide[
  #align(center + horizon)[
    #text(size: 40pt, weight: "bold")[Thanks!]
    #v(0.8em)
    #text(size: 22pt, fill: rgb("#666666"))[Questions?]
    #v(1.5em)
    
    #rect(fill: rgb("#f5f5f5"), radius: 10pt, inset: 20pt)[
      #text(size: 16pt)[
        *Project:* SYSC 4907 Capstone \
        *Supervisor:* Professor Jerome Talim \
        *Stack:* React, Express, PostgreSQL, Prisma, TypeScript
      ]
    ]
    
    #v(1.5em)
    #rect(fill: rgb("#bf112b"), width: 100%, height: 6pt)
  ]
]
