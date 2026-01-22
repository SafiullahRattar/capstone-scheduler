#import "@preview/polylux:0.4.0": *

#set page(paper: "presentation-16-9", margin: 1.5em)
#set text(size: 18pt)

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
  #v(0.3em)
  #text(size: 18pt, fill: rgb("#666666"))[Cross-referencing your audit with the course calendar]
  #v(0.4em)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[1. Your Course Audit]
        #v(0.3em)
        #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), inset: 8pt)[
          #text(size: 11pt)[
            *SUMMARY OF CREDITS AND CGPA* \
            _Engineering Program Only_ \
            #v(0.2em)
            #table(
              columns: (auto, auto, auto),
              stroke: none,
              inset: 3pt,
              [*EARNED:*], [17.00 Credits], [],
              [], [16.50 CGPA Credits], [145.00 Points | 8.78 CGPA],
              [*IP*], [2.00 Credits], [],
              [*NEEDS:*], [2.00 Credits], [5.00 CGPA],
            )
            #v(0.2em)
            #rect(fill: rgb("#fff5f5"), inset: 4pt, width: 100%)[
              #text(fill: rgb("#cc0000"), size: 10pt)[*NO*] #h(0.5em) #text(size: 10pt)[COMPLEMENTARY STUDIES, CCDP 2100...]
            ]
            #text(size: 10pt)[
              *EARNED:* 1.00 Credit \
              *NEEDS:* 0.50 Credits
            ]
          ]
        ]
        #v(0.2em)
        #text(size: 12pt, style: "italic")[What courses have I completed?]
      ]
    ],
    [
      #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[2. Course Calendar]
        #v(0.3em)
        #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), inset: 8pt)[
          #text(size: 11pt)[
            *SYSC 2004 \[0.5 credit\]* \
            _Object-Oriented Software Development_ \
            #v(0.2em)
            #text(size: 10pt)[
              Prerequisite(s): #text(fill: rgb("#0066cc"))[SYSC 1006] or #text(fill: rgb("#0066cc"))[SYSC 2006] or permission of the department, and second-year status in Engineering.
            ]
            #v(0.3em)
            *SYSC 2006 \[0.5 credit\]* \
            _Foundations of Imperative Programming_ \
            #v(0.2em)
            #text(size: 10pt)[
              Prerequisite(s): Second-year status in Engineering.
            ]
          ]
        ]
        #v(0.2em)
        #text(size: 12pt, style: "italic")[What do I need to take this course?]
      ]
    ]
  )
  
  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#fff5f5"), radius: 6pt, inset: 10pt)[
      #text(fill: rgb("#bf112b"), size: 14pt)[Students must manually cross-reference these two sources for every course they want to take]
    ]
  ]
]

// The Old Way - Building a Schedule
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Old Way: Building a Schedule]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Conflicts only appear after you try to register]
  #v(0.3em)
  
  #grid(
    columns: (1.3fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: white, stroke: 0.5pt + rgb("#cccccc"), radius: 4pt, inset: 6pt)[
        #align(center)[
          #rect(fill: rgb("#bf112b"), radius: 4pt, inset: 4pt)[
            #text(fill: white, size: 10pt, weight: "bold")[Winter 2026]
          ]
          #text(size: 14pt, weight: "bold")[Winter Schedule]
        ]
        #v(0.2em)
        #table(
          columns: (0.6fr, 1fr, 1fr, 1fr, 1fr, 1fr),
          stroke: 0.5pt + rgb("#dddddd"),
          inset: 4pt,
          fill: (col, row) => {
            if row == 0 { rgb("#f5f5f5") }
            else { white }
          },
          align: center,
          text(size: 8pt, weight: "bold")[Time], 
          text(size: 8pt, weight: "bold")[Mon], 
          text(size: 8pt, weight: "bold")[Tue], 
          text(size: 8pt, weight: "bold")[Wed], 
          text(size: 8pt, weight: "bold")[Thu], 
          text(size: 8pt, weight: "bold")[Fri],
          text(size: 7pt)[10:00], [], [], 
          [#rect(fill: rgb("#ffffcc"), inset: 2pt)[#text(size: 6pt)[SYSC 4130\ #text(fill: rgb("#cc0000"), weight: "bold")[Full section]]]],
          [], [],
          text(size: 7pt)[11:30], [], 
          [#rect(fill: rgb("#ff6666"), inset: 2pt)[#text(size: 6pt, fill: white)[SYSC 2004 E\ #text(weight: "bold")[Full section]]]],
          [#rect(fill: rgb("#cce5ff"), inset: 2pt)[#text(size: 6pt)[SYSC 3303 A\ LEC]]],
          [#rect(fill: rgb("#ff6666"), inset: 2pt)[#text(size: 6pt, fill: white)[SYSC 2004 E\ #text(weight: "bold")[Full section]]]],
          [#rect(fill: rgb("#cce5ff"), inset: 2pt)[#text(size: 6pt)[SYSC 3303 A\ LEC]]],
          text(size: 7pt)[15:00], 
          [#rect(fill: rgb("#ff6666"), inset: 2pt)[#text(size: 6pt, fill: white)[SYSC 2004 D\ LEC, 14753]]],
          [#rect(fill: rgb("#e8e8e8"), inset: 2pt)[#text(size: 6pt)[SYSC 2004 L4\ LAB, 14758]]],
          [#rect(fill: rgb("#ff6666"), inset: 2pt)[#text(size: 6pt, fill: white)[SYSC 2004 D\ LEC, 14753]]],
          [],
          [],
          text(size: 7pt)[16:30], [], [],
          [#rect(fill: rgb("#ffffcc"), inset: 2pt)[#text(size: 6pt)[SYSC 4416 L1\ LAB]]],
          [],
          [#rect(fill: rgb("#e8e8e8"), inset: 2pt)[#text(size: 6pt)[SYSC 2004 L3\ LAB, 14757]]],
        )
        #v(0.2em)
        #align(center)[
          #text(size: 9pt)[#rect(fill: rgb("#ff6666"), inset: 2pt)[#text(fill: white)[Red]] = Conflict / Full Section]
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[The Problem]
      #v(0.3em)
      #text(size: 13pt)[
        - You pick your courses and sections
        - Build what looks like a good schedule
        - Try to register...
        - *Conflict!* Two classes overlap
        - Or worse: section is *full*
      ]
      #v(0.4em)
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt, fill: rgb("#bf112b"))[
          *Result:* Start over with different sections, hope they don't conflict either
        ]
      ]
      #v(0.4em)
      #text(weight: "semibold", size: 14pt)[No Way to Know Until You Try]
      #v(0.2em)
      #text(size: 13pt)[
        - No automatic conflict detection
        - Must manually check every time slot
        - LEC + LAB + TUT all need to fit
      ]
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
  #v(0.2em)
  #text(size: 16pt, fill: rgb("#666666"))[A full-stack system that consolidates fragmented data and automates manual processes]
  #v(0.4em)
  
  #grid(
    columns: (1.1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 16pt)[System Architecture]
      #v(0.3em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          #align(center)[
            #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt, width: 90%)[
              *Frontend* — React + TypeScript \
              #text(size: 10pt)[Audit upload, course search, schedule viewer]
            ]
            #v(0.15em)
            ↓ REST API ↓
            #v(0.15em)
            #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt, width: 90%)[
              *Backend* — Express + Node.js \
              #text(size: 10pt)[Validation engine, schedule generator]
            ]
            #v(0.15em)
            ↓ Prisma ORM ↓
            #v(0.15em)
            #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt, width: 90%)[
              *Database* — PostgreSQL \
              #text(size: 10pt)[Courses, prerequisites, sections, students]
            ]
          ]
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 16pt)[Core Engineering Problems]
      #v(0.3em)
      #text(size: 13pt)[
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 6pt, width: 100%)[
          *1. Academic Audit Parsing* \
          #text(size: 11pt)[Extract structured data from unstructured HTML]
        ]
        #v(0.2em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 6pt, width: 100%)[
          *2. Prerequisite Representation* \
          #text(size: 11pt)[Model complex AND/OR logic as evaluable trees]
        ]
        #v(0.2em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 6pt, width: 100%)[
          *3. Schedule Generation* \
          #text(size: 11pt)[Constraint satisfaction with backtracking]
        ]
        #v(0.2em)
        #rect(fill: rgb("#f5f5f5"), radius: 3pt, inset: 6pt, width: 100%)[
          *4. Data Acquisition* \
          #text(size: 11pt)[Scraping, electives, multi-term support]
        ]
      ]
    ]
  )
  
  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
      #text(size: 12pt)[*Next:* Implementation walkthrough — what we built (in order) and why]
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[TypeScript interfaces that model the extracted data]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[StudentAuditData Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 9pt)[
          ```typescript
          interface StudentAuditData {
            studentId: string      // "123456789"
            name: string           // "John Smith"
            program: string        // "Software Engineering"
            
            completedCourses: Array<{
              courseId: string     // "SYSC3303"
              grade: string        // "A-"
            }>
            
            currentCourses: Array<{
              courseId: string     // "SYSC4907"
              term: string         // "25WN"
            }>
            
            requirements: RequirementInfo[]
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[RequirementInfo Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 9pt)[
          ```typescript
          interface RequirementInfo {
            title: string
            status: 'OK' | 'NO' | 'IP' | 'NONE'
            creditsRequired: number
            creditsCompleted: number
            creditsInProgress: number
            courseOptions: string[]
          }
          ```
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Why These Fields?]
      #text(size: 12pt)[
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
  #v(0.3em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt, width: 95%)[
      #grid(
        columns: (1fr, 0.15fr, 1fr, 0.15fr, 1fr, 0.15fr, 1fr, 0.15fr, 1fr),
        gutter: 0.2em,
        align: center + horizon,
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
          #text(size: 10pt, weight: "bold")[1. Upload] \
          #text(size: 9pt)[User uploads\ HTML file]
        ],
        text(size: 16pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
          #text(size: 10pt, weight: "bold")[2. Parse] \
          #text(size: 9pt)[Regex\ extraction]
        ],
        text(size: 16pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
          #text(size: 10pt, weight: "bold")[3. Normalize] \
          #text(size: 9pt)["SYSC 3303"\ → "SYSC3303"]
        ],
        text(size: 16pt)[→],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 8pt)[
          #text(size: 10pt, weight: "bold")[4. Validate] \
          #text(size: 9pt)[Check course\ exists in DB]
        ],
        text(size: 16pt)[→],
        rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt)[
          #text(size: 10pt, weight: "bold")[5. Persist] \
          #text(size: 9pt)[Upsert to\ PostgreSQL]
        ],
      )
    ]
  ]

  #v(0.4em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Key Design Decision: Upsert]
      #text(size: 12pt)[
        - Use `prisma.student.upsert()` to handle re-uploads
        - If student exists → update their data
        - If new student → create record
        - Idempotent: safe to upload same audit multiple times
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Database Operations]
      #text(size: 12pt)[
        1. Upsert Student record
        2. Delete old CourseCompletions (clean slate)
        3. Insert new CourseCompletions
        4. Link to existing Course records in DB
      ]
    ]
  )
]

// 1.4 - Regex Patterns Deep Dive
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Regex Patterns]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Targeted patterns for each data field we need to extract]
  #v(0.3em)

  #text(weight: "semibold", size: 14pt)[Core Extraction Patterns]
  #v(0.2em)
  #table(
    columns: (1.2fr, 2fr, 1.5fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 8pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold", size: 11pt)[Field],
    text(fill: white, weight: "bold", size: 11pt)[Regex Pattern],
    text(fill: white, weight: "bold", size: 11pt)[Example Match],
    text(size: 11pt)[Student ID], text(size: 10pt)[`/(\d{9})/`], text(size: 11pt)["123456789"],
    text(size: 11pt)[Name], text(size: 10pt)[`/([A-Z][a-z]+), ([A-Z][a-z]+)/`], text(size: 11pt)["Smith, John" → "John Smith"],
    text(size: 11pt)[Program], text(size: 10pt)[`/Bachelor of Engineering - ([^<]+)/`], text(size: 11pt)["Software Engineering"],
    text(size: 11pt)[Course Row], text(size: 10pt)[`/<tr[^>]*class="takenCourse"[^>]*>/g`], text(size: 11pt)[Matches each course row],
  )

  #v(0.3em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Course Extraction (Complex)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```
          /<tr[^>]*class="takenCourse"[^>]*>
            [\s\S]*?<td[^>]*class="term"[^>]*>
              ([^<]*)<\/td>
            [\s\S]*?<td[^>]*class="course"[^>]*>
              ([A-Z]{3,4}\s+\d{4})<\/td>
            [\s\S]*?<td[^>]*class="grade"[^>]*>
              ([^<]+)<\/td>/g
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Why This Pattern?]
      #text(size: 12pt)[
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Parsing subrequirements to identify what's still needed]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[HTML Structure We Parse]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```html
          <div class="subrequirement" 
               rqdHours="0.50">
            <span class="status Status_NO">
            <span class="subreqTitle">
              COMPLEMENTARY STUDIES, CCDP 2100
            </span>
            ...
            <span class="hours">0.00</span>
            cr. Complete
          </div>
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        We extract: required credits, completed credits, status, and course options from each subrequirement block.
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Status Detection Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          ```typescript
          // Determine status from CSS class
          let status: 'OK'|'NO'|'IP'|'NONE' = 'NO'
          if (statusClass.includes('OK')) 
            status = 'OK'
          else if (statusClass.includes('IP')) 
            status = 'IP'
          ```
        ]
      ]
      #v(0.2em)
      #text(weight: "semibold", size: 14pt)[Elective Category Detection]
      #text(size: 12pt)[
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Supporting both HTML exports and PDF text extraction]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[PDF Line Format]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```
          21FA   CHEM 1101   0.50   A+
          21WN   MATH 1004   0.50   B
          25WN   SYSC 4907   0.50   CUR
          ```
        ]
      ]
      #v(0.2em)
      #text(weight: "semibold", size: 14pt)[PDF Pattern]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```
          /^\s*(\d{2}(?:FA|WN|SU))\s+
            ([A-Z]{3,4})\s+(\d{4})\s+
            ([\d.]+)\s+([A-Z+\-]+)/gm
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Grade Filtering Logic]
      #text(size: 12pt)[
        Not all rows are valid completions:
      ]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          ```typescript
          // Current course (not completed yet)
          if (grade === 'CUR') {
            currentCourses.push({ courseId, term })
          }
          // Failed or withdrawn - skip
          else if (['F','X','UNS','NR'].includes(grade)) {
            continue
          }
          // Valid completion
          else {
            completedCourses.push({ courseId, grade })
          }
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        *Key:* We use `Set` to deduplicate — same course may appear multiple times if retaken.
      ]
    ]
  )
]

// 1.7 - Database Persistence
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parser: Database Persistence]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Saving parsed data with Prisma ORM]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Student Upsert]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          const student = await prisma.student.upsert({
            where: { studentId: auditData.studentId },
            update: {
              name: auditData.name,
              program: auditData.program
            },
            create: {
              studentId: auditData.studentId,
              name: auditData.name,
              program: auditData.program
            }
          })
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        *Upsert* = Update if exists, Insert if new \
        Handles re-uploads gracefully
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Course Completion Storage]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          // Clean slate for this student
          await prisma.courseCompletion.deleteMany({
            where: { studentId: student.id }
          })

          // Insert all completions
          for (const completion of completedCourses) {
            const course = await prisma.course.findUnique({
              where: { id: completion.courseId }
            })
            if (course) {
              await prisma.courseCompletion.create({
                data: {
                  studentId: student.id,
                  courseId: completion.courseId,
                  grade: completion.grade
                }
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Design decisions and their consequences]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Approach Comparison]
      #table(
        columns: (1fr, 1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Approach*], [*Pros*], [*Cons*],
        [Regex], [Fast, simple, no deps], [Brittle to HTML changes],
        [DOM (cheerio)], [Robust, semantic], [Heavier, slower],
        [Official API], [Reliable], [Doesn't exist],
      )
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Why We Chose Regex]
      #text(size: 12pt)[
        - O(n) single-pass parsing
        - No external dependencies
        - Patterns target stable class names
        - Easy to update if structure changes
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Known Limitations]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          1. *HTML structure dependency* — if Carleton redesigns their audit page, patterns break
          
          2. *No real-time sync* — student must re-upload after completing courses
          
          3. *Course existence check* — courses not in our DB are skipped (logged as warnings)
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Mitigation Strategy]
      #text(size: 12pt)[
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Self-referential tree structure in PostgreSQL via Prisma]
  #v(0.3em)

  #grid(
    columns: (1.2fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[PrerequisiteNode Model]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```prisma
          model PrerequisiteNode {
            id               String   @id @default(cuid())
            courseId         String   // Which course this prereq belongs to
            nodeType         String   // AND | OR | COURSE | YEAR_STANDING | PERMISSION
            
            // For COURSE nodes
            requiredCourseId String?  // FK to Course
            requiredGrade    String?  // e.g., "C-"
            
            // For YEAR_STANDING nodes
            requiredYear     String?  // FIRST_YEAR | SECOND_YEAR | etc.
            
            // Tree structure (self-reference)
            parentId         String?
            parent           PrerequisiteNode?  @relation("NodeHierarchy")
            children         PrerequisiteNode[] @relation("NodeHierarchy")
            
            // Relations
            course           Course   @relation("CoursePrerequisites")
            requiredCourse   Course?  @relation("RequiredByCourses")
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Why Self-Reference?]
      #text(size: 12pt)[
        - Trees need parent-child relationships
        - `parentId` points to another node in same table
        - Root nodes have `parentId = null`
        - Prisma handles the FK automatically
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Node Types]
      #table(
        columns: (0.8fr, 1.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 5pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Type*], [*Meaning*],
        [AND], [All children must pass],
        [OR], [Any child must pass],
        [COURSE], [Specific course required],
        [YEAR_STANDING], [Minimum year level],
        [PERMISSION], [Manual override needed],
      )
    ]
  )
]

// 2.3 - Expression Parser
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Parser: Expression → Tree]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Converting human-readable expressions to node trees]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Input Format (from course calendar)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          `"SYSC3303 && (SYSC3310 || SYSC3320)"` \
          `"FOURTH_YEAR || PERMISSION"` \
          `"COMP1006[C-] && MATH1004"`
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Parser Strategy]
      #text(size: 12pt)[
        1. Split on `&&` first (lower precedence)
        2. Split on `||` within groups
        3. Handle parentheses for nesting
        4. Parse individual terms (courses, years, etc.)
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Parsing Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function parsePrerequisiteExpression(expr: string): ParsedNode {
            // Handle simple AND (no OR present)
            if (expr.includes(' && ') && !expr.includes(' || ')) {
              const parts = expr.split(' && ')
              return {
                type: 'AND',
                children: parts.map(parseSimpleTerm)
              }
            }
            
            // Handle simple OR (no AND present)
            if (expr.includes(' || ') && !expr.includes(' && ')) {
              const parts = expr.split(' || ')
              return {
                type: 'OR',
                children: parts.map(parseSimpleTerm)
              }
            }
            
            // Handle parentheses - recursive
            if (expr.includes('(')) {
              return parseComplexExpression(expr)
            }
            
            return parseSimpleTerm(expr)
          }
          ```
        ]
      ]
    ]
  )
]

// 2.4 - Term Parsing Details
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Parser: Term Recognition]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Identifying different types of requirements]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[parseSimpleTerm Function]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function parseSimpleTerm(term: string): ParsedNode {
            term = term.trim().replace(/[()]/g, '')
            
            // Year standing
            if (['FIRST_YEAR', 'SECOND_YEAR', 
                 'THIRD_YEAR', 'FOURTH_YEAR'].includes(term)) {
              return { type: 'YEAR_STANDING', value: term }
            }
            
            // Permission
            if (term === 'PERMISSION') {
              return { type: 'PERMISSION' }
            }
            
            // Course with grade requirement
            const gradeMatch = term.match(
              /^([A-Z]{3,4}\d{4})\[([A-Z\-+]*)\]$/
            )
            if (gradeMatch) {
              return { 
                type: 'COURSE', 
                value: gradeMatch[1],  // COMP1006
                grade: gradeMatch[2]   // C-
              }
            }
            
            // Standard course
            if (term.match(/^[A-Z]{3,4}\d{4}$/)) {
              return { type: 'COURSE', value: term }
            }
            
            // Unknown - treat as permission
            return { type: 'PERMISSION' }
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Example Transformations]
      #v(0.2em)
      #table(
        columns: (1.2fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Input*], [*Output Node*],
        [`"SYSC3303"`], [`{type: 'COURSE', value: 'SYSC3303'}`],
        [`"COMP1006[C-]"`], [`{type: 'COURSE', value: 'COMP1006', grade: 'C-'}`],
        [`"FOURTH_YEAR"`], [`{type: 'YEAR_STANDING', value: 'FOURTH_YEAR'}`],
        [`"PERMISSION"`], [`{type: 'PERMISSION'}`],
      )
      #v(0.3em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Fallback behavior:* Unknown terms become PERMISSION nodes to avoid foreign key errors (logged as warnings).
        ]
      ]
    ]
  )
]

// 2.5 - Tree Creation in Database
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Storage: Building the Tree]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Recursively creating nodes in PostgreSQL]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Recursive Tree Creation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          async function createPrerequisiteTree(
            courseId: string, 
            parsedNode: ParsedNode, 
            parentId?: string
          ): Promise<string> {
            
            // Create this node
            const node = await prisma.prerequisiteNode.create({
              data: {
                courseId,
                nodeType: parsedNode.type,
                requiredCourseId: parsedNode.type === 'COURSE' 
                  ? parsedNode.value : null,
                requiredYear: parsedNode.type === 'YEAR_STANDING'
                  ? parsedNode.value : null,
                requiredGrade: parsedNode.grade || null,
                parentId: parentId || null
              }
            })
            
            // Recursively create children
            if (parsedNode.children) {
              for (const child of parsedNode.children) {
                await createPrerequisiteTree(
                  courseId, child, node.id
                )
              }
            }
            
            return node.id
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Visual Example]
      #v(0.2em)
      #text(size: 12pt)[Expression: `"SYSC3303 && (SYSC3310 || SYSC3320)"`]
      #v(0.2em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt)[
        #align(center)[
          #text(size: 11pt)[
            ```
                    [AND] ← root (parentId = null)
                   /     \
            [COURSE]     [OR]
            SYSC3303    /    \
                  [COURSE]  [COURSE]
                  SYSC3310  SYSC3320
            ```
          ]
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        Each box = one row in `prerequisite_nodes` table \
        Links via `parentId` foreign key
      ]
    ]
  )
]

// 2.6 - Evaluation Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: Evaluation Algorithm]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Recursive tree traversal with boolean logic]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Core Evaluation Function]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          async function evaluatePrerequisiteNode(
            node: PrerequisiteNodeData,
            transcript: StudentTranscript,
            allNodes: PrerequisiteNodeData[]
          ): Promise<EvaluationResult> {
            
            switch (node.nodeType) {
              case 'AND': {
                const children = allNodes.filter(
                  n => n.parentId === node.id
                )
                const results = await Promise.all(
                  children.map(c => 
                    evaluatePrerequisiteNode(c, transcript, allNodes)
                  )
                )
                const failed = results.filter(r => !r.isValid)
                return {
                  isValid: failed.length === 0,
                  missingItems: failed.flatMap(r => r.missingItems)
                }
              }
              
              case 'OR': {
                // Similar but returns true if ANY child passes
              }
              
              case 'COURSE': {
                // Check if course in transcript
              }
            }
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Node Type Handlers]
      #v(0.2em)
      #table(
        columns: (0.6fr, 1.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Type*], [*Logic*],
        [AND], [All children must return `isValid: true`],
        [OR], [At least one child must return `isValid: true`],
        [COURSE], [Check `transcript.completedCourses.includes(courseId)`],
        [YEAR], [Compare `transcript.currentYear >= requiredYear`],
        [PERM], [Check `transcript.hasSpecialPermission`],
      )
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Complexity Analysis]
      #text(size: 12pt)[
        - *Time:* O(n) where n = number of nodes
        - *Space:* O(h) where h = tree height (recursion stack)
        - Typical prerequisite tree: 5-15 nodes
      ]
    ]
  )
]

// 2.7 - Grade Checking
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: Grade Requirements]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Some courses require a minimum grade, not just completion]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Grade Scale Implementation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function meetsGradeRequirement(
            actualGrade: string | undefined, 
            requiredGrade: string
          ): boolean {
            if (!actualGrade) return false
            
            const gradeValues: Record<string, number> = {
              'A+': 12, 'A': 11, 'A-': 10,
              'B+': 9,  'B': 8,  'B-': 7,
              'C+': 6,  'C': 5,  'C-': 4,
              'D+': 3,  'D': 2,  'D-': 1,
              'F': 0
            }
            
            const actualValue = gradeValues[actualGrade]
            const requiredValue = gradeValues[requiredGrade]
            
            // Unknown grades: be permissive
            if (actualValue === undefined || 
                requiredValue === undefined) {
              return true
            }
            
            return actualValue >= requiredValue
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Usage in COURSE Node Evaluation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          ```typescript
          case 'COURSE': {
            const hasCourse = transcript.completedCourses
              .includes(node.requiredCourseId)
            
            if (!hasCourse) {
              return {
                isValid: false,
                reason: `Missing ${node.requiredCourseId}`,
                missingItems: [node.requiredCourseId]
              }
            }
            
            // Check grade if required
            if (node.requiredGrade) {
              const actual = transcript.courseGrades?.[
                node.requiredCourseId
              ]
              if (!meetsGradeRequirement(actual, node.requiredGrade)) {
                return {
                  isValid: false,
                  gradeIssues: [`${node.requiredCourseId}: need ${node.requiredGrade}, have ${actual}`]
                }
              }
            }
            
            return { isValid: true }
          }
          ```
        ]
      ]
    ]
  )
]

// 2.8 - Validation Result & Feedback
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Prerequisite Validation: User Feedback]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Providing actionable information, not just pass/fail]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[ValidationResult Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
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
      #v(0.2em)
      #text(size: 12pt)[
        We return *all* missing items, not just the first one found. This helps students plan which courses to take.
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Example Output]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Course:* SYSC 4001 \
          *Status:* #text(fill: rgb("#cc0000"))[FAIL] \
          *Required:* `SYSC3303 && (SYSC3310 || SYSC3320)` \
          *Missing courses:* SYSC3303 \
          *Details:* You need SYSC3303 AND at least one of SYSC3310/SYSC3320
        ]
      ]
      #v(0.2em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt)[
        #text(size: 11pt)[
          *Course:* SYSC 4907 \
          *Status:* #text(fill: rgb("#2d7a2d"))[PASS] \
          *Required:* `FOURTH_YEAR` \
          *Details:* You meet all prerequisites
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[TypeScript interfaces for sections, schedules, and time slots]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Section Interface]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          interface Section {
            id: string
            courseId: string      // "SYSC3303"
            crn: string | null    // "12345"
            sectionCode: string   // "A"
            sectionType: string   // "LEC" | "LAB" | "TUT"
            instructor: string | null
            days: string | null   // "MWF" or "TR"
            startTime: string | null  // "0835"
            endTime: string | null    // "0925"
            location: string | null
            capacity: number | null
            enrolled: number | null
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Schedule & TimeSlot]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          interface TimeSlot {
            day: string       // "Monday"
            startTime: string // "0835"
            endTime: string   // "0925"
          }

          interface ScheduleSelection {
            courseId: string
            section: Section
          }

          interface GeneratedSchedule {
            id: number
            selections: ScheduleSelection[]
            hasConflicts: boolean
            prerequisiteInfo?: {
              [courseId: string]: {
                isValid: boolean
                missingCourses?: string[]
              }
            }
          }
          ```
        ]
      ]
    ]
  )
]

// 3.3 - Time Parsing & Day Expansion
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Time Handling]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Converting database formats to comparable time slots]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Day Abbreviation Expansion]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function parseDays(daysStr: string | null): string[] {
            if (!daysStr) return []
            
            const dayMap: Record<string, string> = {
              'M': 'Monday',
              'T': 'Tuesday',
              'W': 'Wednesday',
              'R': 'Thursday',  // R for thuRsday
              'F': 'Friday'
            }
            
            return daysStr.split('')
              .map(d => dayMap[d] || d)
              .filter(d => d)
          }
          
          // "MWF" → ["Monday", "Wednesday", "Friday"]
          // "TR"  → ["Tuesday", "Thursday"]
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Section → TimeSlots]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function getTimeSlots(section: Section): TimeSlot[] {
            if (!section.days || !section.startTime || 
                !section.endTime) {
              return []  // Online/async sections
            }
            
            const days = parseDays(section.days)
            return days.map(day => ({
              day,
              startTime: section.startTime!,
              endTime: section.endTime!
            }))
          }
          
          // Section with days="MWF", start="0835", end="0925"
          // Returns:
          // [
          //   { day: "Monday",    startTime: "0835", endTime: "0925" },
          //   { day: "Wednesday", startTime: "0835", endTime: "0925" },
          //   { day: "Friday",    startTime: "0835", endTime: "0925" }
          // ]
          ```
        ]
      ]
    ]
  )
]

// 3.4 - Conflict Detection Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Conflict Detection]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[The O(1) interval overlap check at the heart of the algorithm]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Time Conflict Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function hasTimeConflict(
            slot1: TimeSlot, 
            slot2: TimeSlot
          ): boolean {
            // Different days = no conflict
            if (slot1.day !== slot2.day) return false
            
            // Parse "0835" → 515 minutes since midnight
            const parseTime = (time: string): number => {
              const hours = parseInt(time.substring(0, 2))
              const minutes = parseInt(time.substring(2, 4))
              return hours * 60 + minutes
            }
            
            const start1 = parseTime(slot1.startTime)
            const end1 = parseTime(slot1.endTime)
            const start2 = parseTime(slot2.startTime)
            const end2 = parseTime(slot2.endTime)
            
            // Interval overlap formula
            return start1 < end2 && start2 < end1
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Why This Formula Works]
      #v(0.2em)
      #align(center)[
        #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt)[
          #text(size: 11pt)[
            ```
            Overlap if: start1 < end2 AND start2 < end1
            
            Case 1: [===1===]
                          [===2===]  ✓ Overlap
            
            Case 2: [===1===]
                              [===2===]  ✗ No overlap
            
            Case 3:       [===1===]
                    [===2===]  ✓ Overlap
            ```
          ]
        ]
      ]
      #v(0.3em)
      #text(size: 12pt)[
        *Time Complexity:* O(1) per comparison \
        *Called:* Many times during backtracking search
      ]
    ]
  )
]

// 3.5 - Section Grouping
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Section Grouping]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Handling courses with multiple component types (LEC + LAB + TUT)]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Group by Section Type]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function groupSectionsByType(
            sections: Section[]
          ): Record<string, Section[]> {
            const grouped: Record<string, Section[]> = {}
            
            for (const section of sections) {
              if (!grouped[section.sectionType]) {
                grouped[section.sectionType] = []
              }
              grouped[section.sectionType].push(section)
            }
            
            return grouped
          }
          
          // Input: [LEC-A, LEC-B, LAB-L1, LAB-L2, TUT-T1]
          // Output: {
          //   "LEC": [LEC-A, LEC-B],
          //   "LAB": [LAB-L1, LAB-L2],
          //   "TUT": [TUT-T1]
          // }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Generate All Combinations]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function generateSectionCombinations(
            courseId: string,
            sectionsByType: Record<string, Section[]>
          ): Section[][] {
            const types = Object.keys(sectionsByType)
            if (types.length === 1) {
              return sectionsByType[types[0]].map(s => [s])
            }
            
            const combinations: Section[][] = []
            
            function build(typeIdx: number, current: Section[]) {
              if (typeIdx === types.length) {
                combinations.push([...current])
                return
              }
              for (const section of sectionsByType[types[typeIdx]]) {
                current.push(section)
                build(typeIdx + 1, current)
                current.pop()
              }
            }
            
            build(0, [])
            return combinations
          }
          ```
        ]
      ]
      #text(size: 11pt)[
        2 LECs × 2 LABs × 1 TUT = 4 combinations per course
      ]
    ]
  )
]

// 3.6 - Main Backtracking Algorithm
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Schedule Generation: Backtracking Algorithm]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[The recursive search with early pruning]
  #v(0.25em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
    #text(size: 9pt)[
      ```typescript
      function generateSchedulesRecursive(
        courseSections: { courseId: string; sections: Section[] }[],
        currentIndex: number,
        currentSelections: ScheduleSelection[],
        maxSchedules: number,
        result: GeneratedSchedule[]
      ): void {
        // Base case: all courses scheduled → found valid schedule
        if (currentIndex === courseSections.length) {
          result.push({ id: result.length + 1, selections: [...currentSelections], hasConflicts: false })
          return
        }
        
        // Early termination: enough schedules found
        if (result.length >= maxSchedules) return
        
        const { courseId, sections } = courseSections[currentIndex]
        const sectionsByType = groupSectionsByType(sections)
        const combinations = generateSectionCombinations(courseId, sectionsByType)
        
        for (const sectionCombination of combinations) {
          // Skip if LEC conflicts with its own LAB
          if (hasInternalConflicts(sectionCombination)) continue
          
          // Check against already-selected sections
          let hasConflict = false
          for (const section of sectionCombination) {
            if (hasConflictWithSelections(section, currentSelections)) {
              hasConflict = true
              break  // PRUNE: don't explore this branch further
            }
          }
          
          if (!hasConflict) {
            // Add sections and recurse
            for (const section of sectionCombination) {
              currentSelections.push({ courseId, section })
            }
            generateSchedulesRecursive(courseSections, currentIndex + 1, currentSelections, maxSchedules, result)
            // Backtrack
            for (let i = 0; i < sectionCombination.length; i++) currentSelections.pop()
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
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[REST endpoint with prerequisite validation]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[POST /schedules/generate]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          router.post('/generate', async (req, res) => {
            const { 
              courseIds,           // ["SYSC3303", "SYSC4001"]
              term,                // "Winter 2026"
              maxSchedules = 50,   // Cap results
              completedCourses = [] // For prereq check
            } = req.body
            
            // Validation
            if (courseIds.length > 8) {
              return res.status(400).json({
                error: 'Maximum 8 courses allowed'
              })
            }
            
            // Fetch sections from DB
            const courseSections = await Promise.all(
              courseIds.map(async (id) => ({
                courseId: id,
                sections: await prisma.section.findMany({
                  where: { courseId: id, term }
                })
              }))
            )
            
            // Run backtracking
            const schedules: GeneratedSchedule[] = []
            generateSchedulesRecursive(
              courseSections, 0, [], maxSchedules, schedules
            )
            
            // Add prerequisite info to each schedule
            for (const schedule of schedules) {
              schedule.prerequisiteInfo = await checkPrereqs(...)
            }
            
            res.json({ schedules, count: schedules.length })
          })
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Response Format]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```json
          {
            "schedules": [
              {
                "id": 1,
                "selections": [
                  {
                    "courseId": "SYSC3303",
                    "section": {
                      "crn": "12345",
                      "sectionCode": "A",
                      "days": "MWF",
                      "startTime": "0835",
                      "endTime": "0925"
                    }
                  }
                ],
                "hasConflicts": false,
                "prerequisiteInfo": {
                  "SYSC3303": { "isValid": true }
                }
              }
            ],
            "count": 15,
            "maxSchedules": 50
          }
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        Frontend displays these as timetable grids with CRNs for easy registration.
      ]
    ]
  )
]

// ============================================================================
// SECTION 4: DATA ACQUISITION (~10 minutes)
// ============================================================================

// 4.1 - Overview & Challenges
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 4: Data Acquisition]
  #v(0.1em)
  #text(size: 16pt, fill: rgb("#666666"))[Populating the database from scattered university sources]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "semibold", size: 15pt)[The Data Challenge]
      #v(0.2em)
      #text(size: 13pt)[
        Carleton has *no public API*. Data is scattered across:
      ]
      #v(0.2em)
      #table(
        columns: (1fr, 1.2fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Data*], [*Source*],
        [Course titles], [Calendar HTML pages],
        [Prerequisites], [Calendar text descriptions],
        [Section times], [Timetable system],
        [Elective lists], [Department PDFs],
      )
      #v(0.3em)
      #text(size: 13pt)[
        Each source has different formats, update schedules, and access methods.
      ]
    ],
    [
      #text(weight: "semibold", size: 15pt)[Our Approach]
      #v(0.2em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *Separation of concerns:* \
          - CLI scripts handle data ingestion \
          - Web app only reads from database \
          - Scripts are idempotent (safe to re-run)
        ]
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 15pt)[Scripts Overview]
      #text(size: 13pt)[
        1. `seed.ts` — Course data + prerequisites
        2. `import-timetable.ts` — Section schedules
        3. `fetch-all-course-titles.ts` — Course titles
        4. `merge-course-data.ts` — Combine sources
      ]
    ]
  )
]

// 4.2 - Database Schema
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Database Schema]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Prisma models for courses, sections, and relationships]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Course Model]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```prisma
          model Course {
            id          String   @id  // "SYSC3303"
            title       String?       // "Real-Time..."
            description String?
            credits     Float?
            
            // Relations
            sections    Section[]
            prerequisiteNodes PrerequisiteNode[]
            prerequisiteExpression Prerequisite?
            courseCompletions CourseCompletion[]
            
            @@map("courses")
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Section Model]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```prisma
          model Section {
            id          String   @id @default(cuid())
            crn         String?
            courseId    String
            sectionCode String   // "A", "B", "L1"
            sectionType String   // "LEC", "LAB", "TUT"
            
            // Schedule
            days        String?  // "MWF"
            startTime   String?  // "0835"
            endTime     String?  // "0925"
            term        String?  // "Winter 2026"
            
            // Capacity
            capacity    Int?
            enrolled    Int?
            status      String?  // "Open", "Closed"
            
            course      Course   @relation(fields: [courseId])
            
            @@index([courseId])
            @@index([term])
            @@map("sections")
          }
          ```
        ]
      ]
    ]
  )
]

// 4.3 - Seed Script
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Course Seeding]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Two-pass approach for foreign key constraints]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Pass 1: Create All Courses]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          // Read prerequisites JSON
          const data = JSON.parse(
            await fs.readFile('course_prerequisites_simple.json')
          )
          
          // Collect all course codes (including prereq refs)
          const allCourses = new Set<string>()
          for (const [courseId, entry] of Object.entries(data)) {
            allCourses.add(courseId)
            
            // Extract courses from prerequisite expression
            const prereqCourses = entry.required?.match(
              /\b[A-Z]{3,4}\d{4}\b/g
            ) || []
            prereqCourses.forEach(c => allCourses.add(c))
          }
          
          // Create all course records first
          for (const courseId of allCourses) {
            await prisma.course.upsert({
              where: { id: courseId },
              update: {},
              create: { 
                id: courseId, 
                title: data[courseId]?.title || courseId 
              }
            })
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Pass 2: Create Prerequisites]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          for (const [courseId, entry] of Object.entries(data)) {
            if (entry.required) {
              // Store human-readable expression
              await prisma.prerequisite.upsert({
                where: { courseId },
                update: { expression: entry.required },
                create: { 
                  courseId, 
                  expression: entry.required 
                }
              })
              
              // Clear old nodes
              await prisma.prerequisiteNode.deleteMany({
                where: { courseId }
              })
              
              // Parse and create tree
              const parsed = parsePrerequisiteExpression(
                entry.required
              )
              await createPrerequisiteTree(courseId, parsed)
            }
          }
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        *Why two passes?* PrerequisiteNode has FK to Course. All courses must exist before we can reference them.
      ]
    ]
  )
]

// 4.4 - Timetable Import
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Timetable Import]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Parsing tab-separated timetable data]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Input Format (TSV)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```
          term  sectionId  dept  num  code  type  days  start  end  ...
          25WN  12345      SYSC  3303 A     LEC   MWF   0835   0925 ...
          25WN  12346      SYSC  3303 L1    LAB   T     1435   1725 ...
          ```
        ]
      ]
      #v(0.2em)
      #text(weight: "semibold", size: 14pt)[Parsing Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          function parseTimetableLine(line: string) {
            const parts = line.split('\t')
            if (parts.length < 14) return null
            
            const [term, sectionId, dept, num, 
                   code, type, days, start, end,
                   startDate, endDate, cap, enrolled, status] = parts
            
            return {
              term,
              courseId: `${dept}${num}`,  // "SYSC3303"
              sectionCode: code,
              sectionType: type,
              days: days || '',
              startTime: start || '',
              endTime: end || '',
              capacity: parseInt(cap) || 0,
              enrolled: parseInt(enrolled) || 0,
              status
            }
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Import Process]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          async function main() {
            const content = await fs.readFile(
              'scheduling-timings.txt', 'utf-8'
            )
            const lines = content.split('\n').filter(l => l.trim())
            
            for (const line of lines) {
              const record = parseTimetableLine(line)
              if (!record) continue
              
              // Ensure course exists
              await prisma.course.upsert({
                where: { id: record.courseId },
                update: {},
                create: { id: record.courseId, title: record.courseId }
              })
              
              // Create section
              await prisma.section.create({
                data: {
                  courseId: record.courseId,
                  sectionCode: record.sectionCode,
                  sectionType: record.sectionType,
                  days: record.days,
                  startTime: record.startTime,
                  endTime: record.endTime,
                  term: record.term,
                  capacity: record.capacity,
                  enrolled: record.enrolled
                }
              })
            }
          }
          ```
        ]
      ]
    ]
  )
]

// 4.5 - Elective Mappings
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Elective Categories]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Mapping elective requirements to valid course lists]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Category Definitions]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          export const SYSC_ELEC_ELECTIVES = [
            // SYSC 3000-level
            'SYSC3006', 'SYSC3010', 'SYSC3200', ...
            // SYSC 4000-level
            'SYSC4005', 'SYSC4111', 'SYSC4130', ...
            // ELEC options
            'ELEC3105', 'ELEC4505', ...
          ]
          
          export const CS_ELECTIVES = [
            'COMP2401', 'COMP3000', 'COMP3004', 
            'COMP4107', 'COMP4601', ...
          ]
          
          export const COMPLEMENTARY_STUDIES = [
            'PHIL1200', 'SOCI1001', 'PSYC1001',
            'ECON1000', 'BUSI1001', 'CCDP2100', ...
          ]
          
          export const ELECTIVE_CATEGORIES = {
            'SYSC_ELEC_ELECTIVE': SYSC_ELEC_ELECTIVES,
            'CS_ELECTIVE': CS_ELECTIVES,
            'COMPLEMENTARY_STUDIES': COMPLEMENTARY_STUDIES,
            'SCIENCE_ELECTIVE': SCIENCE_ELECTIVES
          }
          ```
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Expansion Function]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          export function expandElectiveCategories(
            courseOptions: string[]
          ): string[] {
            const expanded: string[] = []
            
            for (const option of courseOptions) {
              if (ELECTIVE_CATEGORIES[option]) {
                // Category token → expand to course list
                expanded.push(...ELECTIVE_CATEGORIES[option])
              } else {
                // Regular course code → keep as-is
                expanded.push(option)
              }
            }
            
            return [...new Set(expanded)]  // Deduplicate
          }
          
          // Example:
          // Input:  ["CS_ELECTIVE", "SYSC4907"]
          // Output: ["COMP2401", "COMP3000", ..., "SYSC4907"]
          ```
        ]
      ]
      #v(0.2em)
      #text(size: 12pt)[
        Used by audit parser to show which courses can fulfill elective requirements.
      ]
    ]
  )
]

// 4.6 - Idempotent Design
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Idempotent Design]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Scripts that are safe to run multiple times]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[What is Idempotent?]
      #text(size: 12pt)[
        Running the script once = running it N times \
        Same final state, no duplicates, no errors
      ]
      #v(0.3em)
      #text(weight: "semibold", size: 14pt)[Techniques Used]
      #v(0.2em)
      #table(
        columns: (1fr, 1.2fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 6pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Operation*], [*How*],
        [Create/Update], [`prisma.upsert()`],
        [Clear old data], [`deleteMany()` before insert],
        [Unique keys], [Primary keys prevent duplicates],
        [Check existence], [`findUnique()` before create],
      )
    ],
    [
      #text(weight: "semibold", size: 14pt)[Upsert Pattern]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 9pt)[
          ```typescript
          // Safe to run repeatedly
          await prisma.course.upsert({
            where: { id: courseId },
            update: {
              title: newTitle,
              description: newDescription,
              updatedAt: new Date()
            },
            create: {
              id: courseId,
              title: newTitle,
              description: newDescription
            }
          })
          ```
        ]
      ]
      #v(0.2em)
      #text(weight: "semibold", size: 14pt)[Why This Matters]
      #text(size: 12pt)[
        - Data updates each term
        - Want to refresh without manual cleanup
        - Mistakes don't corrupt database
        - Easy to test and debug
      ]
    ]
  )
]

// 4.7 - Data Pipeline Architecture
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Pipeline Architecture]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[How all the pieces fit together]
  #v(0.3em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 6pt, inset: 12pt, width: 95%)[
      #grid(
        columns: (1fr, 0.1fr, 1fr, 0.1fr, 1fr),
        rows: (auto, auto, auto),
        gutter: 0.5em,
        align: center + horizon,
        
        // Row 1: Sources
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[Calendar HTML] \
          #text(size: 9pt)[Course descriptions]
        ],
        [],
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[Timetable TSV] \
          #text(size: 9pt)[Section schedules]
        ],
        [],
        rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[Prerequisites JSON] \
          #text(size: 9pt)[Requirement logic]
        ],
        
        // Row 2: Arrows
        text(size: 14pt)[↓],
        [],
        text(size: 14pt)[↓],
        [],
        text(size: 14pt)[↓],
        
        // Row 3: Scripts
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[fetch-titles.ts]
        ],
        [],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[import-timetable.ts]
        ],
        [],
        rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[
          #text(size: 10pt, weight: "bold")[seed.ts]
        ],
      )
      #v(0.5em)
      #text(size: 14pt)[↓ ↓ ↓]
      #v(0.3em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 10pt, width: 60%)[
        #text(size: 12pt, weight: "bold")[PostgreSQL Database] \
        #text(size: 10pt)[courses, sections, prerequisite_nodes, students, ...]
      ]
      #v(0.3em)
      #text(size: 14pt)[↓]
      #v(0.3em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt, width: 60%)[
        #text(size: 12pt, weight: "bold")[Express API Server] \
        #text(size: 10pt)[Read-only access via Prisma ORM]
      ]
    ]
  ]
]

// 4.8 - Future Work & Evolution
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Future Work]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Planned improvements for data freshness and coverage]
  #v(0.3em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[Current Limitations]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          1. *Manual elective lists* — currently hardcoded arrays, should come from official sources
          
          2. *Single term at a time* — no Fall+Winter planning
          
          3. *No enrollment status updates* — sections may fill up
          
          4. *Manual refresh* — no automated data updates
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Planned Improvements]
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          1. *Automated elective ingestion* — parse department PDFs or scrape official lists
          
          2. *Multi-term support* — Fall/Winter/Summer selection in UI
          
          3. *Periodic refresh job* — scheduled script to update section data
          
          4. *Admin interface* — web UI for manual data corrections
        ]
      ]
    ]
  )
  
  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt, width: 85%)[
      #text(size: 12pt)[
        *Key insight:* Separating data acquisition from the app means we can improve the pipeline without changing the frontend or API.
      ]
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
  #v(0.3em)
  #text(size: 20pt, weight: "semibold")[From upload to registration]
  #v(0.8em)
  
  #align(center)[
    #grid(
      columns: (1fr, 0.2fr, 1fr, 0.2fr, 1fr),
      gutter: 0.3em,
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[1. Upload]
        #text(size: 12pt)[\
          Drop in your audit HTML]
      ],
      align(horizon)[→],
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[2. Parse]
        #text(size: 12pt)[\
          We extract your courses]
      ],
      align(horizon)[→],
      rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[3. Search]
        #text(size: 12pt)[\
          Find courses, check prereqs]
      ],
    )
    
    #v(0.8em)
    
    #grid(
      columns: (1fr, 0.2fr, 1fr, 0.2fr, 1fr),
      gutter: 0.3em,
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[4. Generate]
        #text(size: 12pt)[\
          Click the button]
      ],
      align(horizon)[→],
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[5. Pick One]
        #text(size: 12pt)[\
          Browse the timetables]
      ],
      align(horizon)[→],
      rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 10pt)[
        #text(weight: "semibold", size: 16pt)[6. Register]
        #text(size: 12pt)[\
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
