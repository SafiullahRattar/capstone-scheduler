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

// Our Solution
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[What We Built]
  #v(0.5em)
  #align(center)[#text(size: 24pt, weight: "semibold")[Carleton Smart Course Scheduler]]
  #v(0.5em)
  
  #table(
    columns: (1fr, 2fr),
    stroke: 0.5pt + rgb("#dddddd"),
    inset: 10pt,
    fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
    [*Feature*], [*What it does*],
    [Upload your audit], [We parse it and know what you've taken],
    [Search any course], [Instantly see if you can take it or what's missing],
    [Generate schedules], [Get every possible conflict-free timetable],
    [Copy CRNs], [One click, paste into Central, done],
  )
  
  #v(0.5em)
  #align(center)[
    #rect(fill: rgb("#f0f9f0"), radius: 6pt, inset: 12pt)[
      #text(fill: rgb("#2d7a2d"))[Automates the tedious parts of course registration]
    ]
  ]
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
