#import "@preview/polylux:0.4.0": *

#set page(paper: "presentation-16-9", margin: 1.5em)
#set text(size: 18pt, font: "DejaVu Sans Mono")

// Title Slide
#slide[
  #align(center + horizon)[
    #rect(fill: rgb("#bf112b"), width: 100%, height: 6pt)
    #v(0.8em)
    #text(size: 36pt, weight: "bold")[Academic Audit Parsing]
    #v(0.3em)
    #text(size: 20pt, fill: rgb("#666666"))[Engineering Data Extraction for Student Audits]
    #v(1.5em)
    #text(size: 16pt)[Safiullah Rattar]
    #v(1.5em)
    #text(size: 14pt, fill: rgb("#888888"))[Carleton Smart Course Scheduler]
  ]
]

// 1. Context & Motivation
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[System Context]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Leveraging existing student data for automation]
  #v(0.5em)

  #grid(
    columns: (1.5fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[The Engineering Gap]
      #text(size: 16pt)[
        Building a scheduler requires three key inputs:
        1.  *Course Data* (Prerequisites, availability)
        2.  *Student History* (Completed courses, grades)
        3.  *Optimization Algorithm* (Backtracking)

        Carleton provides the data in the academic audit, but it is locked in unstructured formats (PDF/HTML). There is no public API.
      ]
      #v(0.5em)
      #text(weight: "semibold")[Design Goal]
      #text(size: 16pt)[
        To automate course selection, we must extract structured data from these documents with *100% accuracy*. A single missed grade could recommend a course the student is not eligible for.
      ]
    ],
    [
       #align(center)[
        #rect(fill: rgb("#f5f5f5"), stroke: 1pt + black, radius: 4pt, inset: 10pt)[
           #text(size: 14pt)[
             *Input: PDF/HTML Audit*
             `21FA CHEM 1101 0.50 A+`
             `21WN MATH 1004 0.50 B`
           ]
        ]
        #v(0.5em)
        #text(size: 20pt)[⬇ Parsing Engine ⬇]
        #v(0.5em)
        #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 10pt)[
           #text(size: 14pt)[
             *Structured Data*
             `{ course: "CHEM1101", grade: "A+" }`
             `{ course: "MATH1004", grade: "B" }`
           ]
        ]
       ]
    ]
  )
]

// 2. Technical Challenge: OCR vs Text Extraction
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Data Extraction Strategy]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Evaluating extraction methodologies]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[Option A: OCR (Tesseract/Vision API)]
      #text(size: 15pt)[
        - *Mechanism:* Image analysis to character prediction.
        - *Failure Mode:* Probabilistic errors.
          - `B` (Grade) vs `8` (Number)
          - `I` (Incomplete) vs `1` (Digit)
        - *Verdict:* Unacceptable for grade data where accuracy is critical.
      ]
    ],
    [
      #text(weight: "semibold")[Option B: Text Stream (pdftotext)]
      #text(size: 15pt)[
        - *Mechanism:* Extract text encoding directly from PDF binary.
        - *Pros:* Deterministic, fast, exact character representation.
        - *Cons:* PDF text streams often lack structure (newlines, spaces).
        - *Verdict:* Selected approach, but required layout handling.
      ]
    ]
  )
]

// 3. The Layout Problem
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Layout Problem]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[When "Reading Order" breaks data logic]
  #v(0.5em)

  #text(size: 15pt)[
    The raw PDF text stream is often stored "Column-Major".
    
    `pdftotext` reads all of Column 1 (Terms) first, then jumps back up to read Column 2 (Courses). This separates related data by dozens of lines.
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(size: 12pt, weight: "bold")[pdftotext raw (Column-Major)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt, width: 100%)[
        #text(font: "DejaVu Sans Mono", size: 9pt)[
          Term
          22FA
          22FA
          21SU
          
          Course
          COMP 2804
          ELEC 2501
          MATH 1005
          
          Credits
          0.50
          0.50
        ]
      ]
      #text(size: 12pt)[
        *The Fatal Flaw:* "22FA" is line 2. "COMP 2804" is line 6. There is no line-by-line connection.
      ]
    ],
    [
      #text(size: 12pt, weight: "bold")[pdftotext -layout (Row-Major)]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt, width: 100%)[
        #text(font: "DejaVu Sans Mono", size: 9pt)[
          Term   Course          Credits   Grade
          22FA   COMP 2804          0.50   A+
          22FA   ELEC 2501          0.50   A-
          21SU   MATH 1005          0.50   TR
        ]
      ]
      #text(size: 12pt)[
        *The Fix:* Visual layout is preserved. Regex can match the entire row: `^22FA.*COMP 2804`
      ]
    ]
  )
]

// 4. Regex Implementation
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Regex Pattern Implementation]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Extracting typed entities from columnar text]
  #v(0.5em)

  #text(size: 15pt)[
    We developed a strict regex pattern to capture the specific layout of the Carleton audit.
  ]

  #v(0.5em)
  #rect(fill: rgb("#2d2d2d"), radius: 6pt, inset: 12pt, width: 100%)[
    #text(font: "DejaVu Sans Mono", fill: rgb("#f0f0f0"), size: 11pt)[
      `/^\s*(\d{2}(?:FA|WN|SU))\s+([A-Z]{3,4})\s+(\d{4})\s+([\d.]+)\s+([A-Z+\-]+)/gm`
    ]
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 12pt)[Capturing Groups]
      #text(size: 12pt)[
        1. *Term:* `21FA` (Digit + Season)
        2. *Dept:* `CHEM` (3-4 Caps)
        3. *Code:* `1101` (4 Digits)
        4. *Credits:* `0.50` (Float)
        5. *Grade:* `A+` (Alpha + modifier)
      ]
    ],
    [
      #text(weight: "bold", size: 12pt)[Implementation Detail]
      #text(size: 12pt)[
        The pattern enforces type constraints (e.g., Course Code must be 4 digits) to implicitly filter header text or malformed lines.
      ]
    ]
  )
]

// 5. Handling Edge Cases (Repeated Courses)
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Edge Case: Repeated Courses]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Handling academic history logic]
  #v(0.5em)

  #text(size: 15pt)[
    *Problem:* A student may take a course multiple times (e.g., Fail, then Pass).
    *Requirement:* We must only track valid completions and ignore failures/withdrawals for prerequisite checks.
  ]

  #v(0.5em)
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(font: "DejaVu Sans Mono", size: 11pt)[
      ```typescript
      // cli/audit-parser.ts logic
      const seenCompleted = new Set<string>()

      for (const match of matches) {
        // Filter out non-passing grades
        if (['F', 'X', 'UNS', 'NR', 'WD'].includes(grade)) {
           continue
        }

        // Only add if not already seen (First pass finds most recent)
        // PDF lists courses chronologically, we might need recent attempt logic
        if (!seenCompleted.has(courseId)) {
           completedCourses.push({ courseId, grade })
           seenCompleted.add(courseId)
        }
      }
      ```
    ]
  ]
  #v(0.5em)
  #text(size: 14pt)[
    *Logic:* We maintain a `Set` of completed IDs. We strictly filter out failure codes (`F`, `UNS`, etc.) to ensure the scheduler does not assume a prerequisite is met when it isn't.
  ]

  #v(0.5em)
  #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt)[
    #text(size: 13pt)[
      *Duplicate Prevention:* The `seenCompleted` Set ensures each course is only stored once. If a student takes a course, fails it, then passes it later, only the passing grade is tracked. O(1) lookup prevents accidental duplicate entries.
    ]
  ]
]

// 6. Handling "Current" Courses (CUR)
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Handling "Current" Courses]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Differentiating In-Progress vs. Completed]
  #v(0.5em)

  #text(size: 15pt)[
    *Problem:* Courses in progress (`CUR`) satisfy "In Progress" prerequisites (like for next term's registration) but do not have grades.
  ]

  #v(0.5em)
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(font: "DejaVu Sans Mono", size: 11pt)[
      ```typescript
      const isCurrent = fullMatch.includes('CUR') || grade === 'CUR'

      if (isCurrent && !seenCurrent.has(courseId)) {
        // Track separately for "In Progress" logic
        currentCourses.push({ courseId, term })
        seenCurrent.add(courseId)
      } else if (isValidGrade(grade)) {
        // Track as fully completed
        completedCourses.push({ courseId, grade })
      }
      ```
    ]
  ]
  #v(0.5em)
  #text(size: 14pt)[
    This separation is crucial. `completedCourses` allows access to courses requiring a grade (e.g., "C- in SYSC 3303"). `currentCourses` allows access to courses just requiring the credit.
  ]

  #v(0.5em)
  #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt)[
    #text(size: 13pt)[
      *Additional Handling:*
      - `SAT` (Satisfied): 0-credit courses like ECOR 1055/1056/1057
      - `TR` (Transfer Credit): INCLUDED for prerequisite checks - transfer credits count toward degree requirements
    ]
  ]
]

// 7. Parsing Requirements for Electives
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Parsing Logical Requirements]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Future-proofing for elective recommendations]
  #v(0.5em)

  #text(size: 15pt)[
    Beyond simple course lists, we extract degree requirements to support future elective suggestions.
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 12pt)[Requirement Pattern]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(font: "DejaVu Sans Mono", size: 10pt)[
          /\d+\)\s+([\d.]+)\s+credits?\s+in\s+
          ([A-Z]{3,4}[^]+?)/
        ]
      ]
      #v(0.5em)
      #text(size: 12pt)[
        Captures: "2) 0.5 credit in Basic Science Electives"
      ]
    ],
    [
      #text(weight: "bold", size: 12pt)[Mapping Logic]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
        #text(font: "DejaVu Sans Mono", size: 10pt)[
          ```typescript
          if (title.includes('Basic Science')) {
             // Maps abstract requirement to concrete list
             category = 'SCIENCE_ELECTIVE' 
          }
          // Result: ["BIOL1103", "CHEM1001"...]
          ```
        ]
      ]
    ]
  )
  #v(0.5em)
  #text(size: 14pt)[
    *Impact:* This allows the system to recommend specific courses (e.g., `BIOL 1103`) when a user has an unfilled "Science Elective" slot, rather than just showing a generic placeholder.
  ]

  #v(0.5em)
  #rect(fill: rgb("#fffaf0"), stroke: 1pt + rgb("#ff8c00"), radius: 4pt, inset: 8pt)[
    #text(size: 13pt)[
      *Note:* This infrastructure is actively used in our `/parse` endpoint. The `getRemainingCourses()` function expands these categories and returns concrete course codes that can be scheduled. However, the elective lists are currently dummy data and will need official Carleton lists in future iterations.
    ]
  ]
]

// 8. Grade Types Handled
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Grade Types & Handling Strategy]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Comprehensive grade classification for prerequisite validation]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 13pt)[Valid Passing Grades]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          *Standard:* A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-
          *Status Flags:* SAT (Satisfied)
          *Accepted:* These count toward degree progress
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 13pt)[Transfer Credits]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          *TR (Transfer Course)*
          *Important:* INCLUDED for prerequisite checks
          *Reason:* Transfer credits satisfy requirements
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 13pt)[Current In-Progress]
      #rect(fill: rgb("#fffaf0"), stroke: 1pt + rgb("#ff8c00"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          *CUR (Current)*
          *Handled separately:* Not in completedCourses
          *Purpose:* Tracks in-progress enrollment separately
        ]
      ]
    ]
  )

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 13pt)[Filtered Out (Do Not Count)]
      #rect(fill: rgb("#fee2e2"), stroke: 1pt + rgb("#dc2626"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          *F (Fail), X (Forfeited)*
          *UNS (Unsatisfactory), NR (No Record)*
          *Reason:* Failures do not satisfy prerequisites
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 13pt)[Course Flags Detected]
      #rect(fill: rgb("#f5f5f5"), stroke: 1pt + rgb("#666666"), radius: 4pt, inset: 8pt)[
        #text(size: 12pt)[
          *RP (Repeated Course)*
          *Not stored:* Grade tracking focuses on final value
          *Handled:* Set-based deduplication handles repeats
        ]
      ]
    ]
  )

  #v(0.5em)
  #text(size: 13pt, fill: rgb("#bf112b"))[
    *Engineering Decision:* Explicit filtering prevents the scheduler from assuming prerequisites are met when they aren't (e.g., a failed course must be retaken).
  ]
]

// 9. Program Scope & Limitations
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Implementation Scope & Limitations]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Understanding system boundaries and constraints]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Current Scope]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 10pt)[
        #text(size: 13pt)[
          *Programs:*
          - Only "Bachelor of Engineering" audits
          - Software Engineering specific
          
          *Format:*
          - Carleton University uAchieve system
          - PDF/HTML export format
          
          *Electives:*
          - Engineering-specific categories
          - SYSC, ELEC, CS, Science, Complementary Studies
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Not Currently Supported]
      #rect(fill: rgb("#fee2e2"), stroke: 1pt + rgb("#dc2626"), radius: 4pt, inset: 10pt)[
        #text(size: 13pt)[
          *Programs:*
          - Non-engineering programs (BSc, BA, BMath)
          - Other universities' formats
          
          *Formats:*
          - Scanned/image-based PDFs (no text encoding)
          - Non-Carleton audit systems
          
          *Data:*
          - Major-specific elective lists (dummy data used)
        ]
      ]
    ]
  )

  #v(0.5em)
  #text(size: 14pt, weight: "bold")[
    Why These Boundaries?
  ]
  #text(size: 13pt)[
    The regex patterns match Carleton's specific format (e.g., "22FA", department codes). Generic parsing would lose accuracy. Adding new formats requires re-engineering the extraction patterns.
  ]
]

// 10. Regex Pattern Analysis
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Regex Pattern Deep Dive]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Type-safe extraction through pattern validation]
  #v(0.5em)

  #rect(fill: rgb("#2d2d2d"), radius: 6pt, inset: 12pt, width: 100%)[
    #text(font: "DejaVu Sans Mono", fill: rgb("#f0f0f0"), size: 10pt)[
      `/^\s*(\d{2}(?:FA|WN|SU))\s+([A-Z]{3,4})\s+(\d{4})\s+([\d.]+)\s+([A-Z+\-]+)/gm`
    ]
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 13pt)[Pattern Breakdown]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 12pt)[
          *Term:* `(\d{2}(?:FA|WN|SU))`
          - Validates: 22FA, 23WN, 21SU
          - Rejects: Invalid season codes
          
          *Department:* `([A-Z]{3,4})`
          - Validates: SYSC, ELEC, COMP
          - Enforces 3-4 uppercase letters
          
          *Course Code:* `(\d{4})`
          - Exactly 4 digits: 2804, 3005
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 13pt)[Continued]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 12pt)[
          *Credits:* `([\d.]+)`
          - Handles: 0.50, 1.0, 0.25
          - Flexible for different credit values
          
          *Grade:* `([A-Z+\-]+)`
          - Supports: A+, A-, B+, SAT, TR
          - Captures modifiers (+, -)
        ]
      ]
    ]
  )

  #v(0.5em)
  #text(size: 14pt, weight: "bold")[
    Type Enforcement Through Regex
  ]
  #text(size: 13pt)[
    The pattern acts as a validation layer. By requiring strict formats (e.g., 4-digit course codes), malformed lines are automatically filtered out. This is more efficient than capturing everything and validating later.
  ]
]

// 11. Future: Elective Category Expansion
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Future Capability: Elective Handling]
  #v(0.2em)
  #text(size: 18pt, fill: rgb("#666666"))[Infrastructure built for future enhancement]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Currently Implemented]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 10pt)[
        #text(size: 13pt)[
          *Infrastructure:*
          - Detects "Basic Science Electives"
          - Detects "Computer Science Elective"
          - Detects "Complementary Studies"
          
          *Expansion Logic:*
          - Hardcoded dummy course lists
          - `getRemainingCourses()` expands categories
          - Returns specific course codes (e.g., BIOL1902)
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Current Limitations]
      #rect(fill: rgb("#fffaf0"), stroke: 1pt + rgb("#ff8c00"), radius: 4pt, inset: 10pt)[
        #text(size: 13pt)[
          *Data Quality:*
          - Elective lists are dummy data
          - Not official Carleton calendars
          
          *Major-Specific:*
          - No logic for Software vs. Systems
          - Generic across all engineering majors
          
          *UI:*
          - Frontend receives expanded courses
          - Doesn't present as elective choice groups
        ]
      ]
    ]
  )

  #v(0.5em)
  #text(size: 14pt, weight: "bold")[
    Future Work
  ]
  #text(size: 13pt)[
    - Scrape official Carleton calendar elective lists per major
    - Add major-specific category mapping logic
    - UI to show "Science Elective: Choose from [list of 20 courses]"
    - Filter electives by availability and prerequisites
  ]
]
