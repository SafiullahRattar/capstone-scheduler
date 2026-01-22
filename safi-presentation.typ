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
    #text(size: 20pt, fill: rgb("#666666"))[PDF Text Extraction for Student Course Data]
    #v(1.5em)
    #text(size: 16pt)[Safiullah Rattar]
    #v(0.5em)
    #text(size: 14pt, fill: rgb("#888888"))[SYSC 4907 - Carleton Smart Course Scheduler]
  ]
]

// 1. Problem Statement
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Problem]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[Input: PDF Audit from Carleton Central]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          - Contains complete academic history
          - Audit only available as PDF download
        ]
        #v(0.3em)
        #rect(fill: white, stroke: 1pt + rgb("#ccc"), inset: 8pt, width: 100%)[
          #text(font: "DejaVu Sans Mono", size: 10pt)[
            Student: 101234567
            Program: Software Engineering
            
            21FA  SYSC 2006  0.50  A-
            21WN  SYSC 2004  0.50  B+
            25WN  SYSC 4907  0.50  CUR
          ]
        ]
      ]
    ],
    [
      #text(weight: "semibold")[Output: Structured Data]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 10pt)[
          ```typescript
          interface StudentAuditData {
            studentId: string
            name: string
            program: string
            completedCourses: Array<{
              courseId: string   // "SYSC2006"
              grade: string      // "A-"
            }>
            currentCourses: Array<{
              courseId: string   // "SYSC4907"
              term: string       // "25WN"
            }>
            requirements: RequirementInfo[]
          }
          ```
        ]
      ]
    ]
  )
]

// 2. Why Not OCR?
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Why Not OCR?]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "semibold")[OCR (Tesseract, Vision APIs)]
      #rect(fill: rgb("#fff5f5"), stroke: 1pt + rgb("#cc0000"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 12pt)[
          *Mechanism:* Render PDF to image, then character recognition
          
          *Problem:* Probabilistic errors
          - `B` (grade) vs `8` (number)
          - `I` (Incomplete) vs `1` (digit)
          - `0` (zero) vs `O` (letter)
          
          *Impact:* A misread grade could mark a failed course as passed
        ]
      ]
    ],
    [
      #text(weight: "semibold")[PDF Text Stream Extraction]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 12pt)[
          *Mechanism:* Extract text encoding directly from PDF binary
          
          *Advantages:*
          - Deterministic: exact characters
          - Fast: no image processing
          *Tool:* `pdftotext` 
        ]
      ]
    ]
  )
  
  #v(0.5em)
  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 8pt)[
      #text(size: 12pt)[*Challenge:* PDF text streams lack structure - requires layout reconstruction]
    ]
  ]
]

// 3. The Layout Problem
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[The Layout Problem]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(size: 13pt, weight: "bold")[Default `pdftotext` (Column-Major)]
      #rect(fill: rgb("#fff5f5"), stroke: 1pt + rgb("#cc0000"), radius: 4pt, inset: 8pt, width: 100%)[
        #text(font: "DejaVu Sans Mono", size: 10pt)[
          ```
          Term
          22FA
          22FA
          21SU

          Course
          COMP 2804
          ELEC 2501
          MATH 1005
          ```
        ]
      ]
      #text(size: 11pt)[
        PDF renders Column 1 first, then Column 2.
        "22FA" on line 2, "COMP 2804" on line 7.
        *No association between term and course.*
      ]
    ],
    [
      #text(size: 13pt, weight: "bold")[`pdftotext -layout` (Row-Major)]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt, width: 100%)[
        #text(font: "DejaVu Sans Mono", size: 10pt)[
          ```
          Term   Course       Credits  Grade
          22FA   COMP 2804    0.50     A+
          22FA   ELEC 2501    0.50     A-
          21SU   MATH 1005    0.50     TR
          ```
        ]
      ]
      #text(size: 11pt)[
        The `-layout` flag uses character coordinates in the PDF to reconstruct visual positioning.
      ]
    ]
  )
]

#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Course Extraction Pattern]
  #v(0.5em)

  #rect(fill: rgb("#2d2d2d"), radius: 6pt, inset: 12pt, width: 100%)[
    #text(font: "DejaVu Sans Mono", fill: rgb("#f0f0f0"), size: 10pt)[
      ```
      /^\s*(\d{2}(?:FA|WN|SU))\s+([A-Z]{3,4})\s+(\d{4})\s+([\d.]+)\s+([A-Z+\-]+)(?:\s+(?:RP|CUR|SAT|TR|UNS|IP|DEF))?/gm
      ```
    ]
  ]

  #v(0.5em)
  #table(
    columns: (1.5fr, 2fr, 1fr),
    stroke: 0.5pt + rgb("#ddd"),
    inset: 6pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold", size: 11pt)[Pattern], 
    text(fill: white, weight: "bold", size: 11pt)[Purpose], 
    text(fill: white, weight: "bold", size: 11pt)[Example],
    [`(\d{2}(?:FA|WN|SU))`], [Term: 2-digit year + semester], ["22FA"],
    [`([A-Z]{3,4})`], [Department code], ["SYSC"],
    [`(\d{4})`], [Course number], ["3303"],
    [`([\d.]+)`], [Credits], ["0.50"],
    [`([A-Z+\-]+)`], [Grade with modifiers], ["A-"],
    [`(?:RP|CUR|SAT|...)?`], [Optional status flags], ["CUR", "DEF"],
  )
]

// 4. PDF Processing Pipeline
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Processing Pipeline]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 12pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      // 1. Write uploaded PDF to temp file
      const tmpPdfPath = path.join(os.tmpdir(), `audit-${Date.now()}.pdf`)
      fs.writeFileSync(tmpPdfPath, req.file.buffer)

      // 2. Extract text with layout preservation
      await execAsync(`pdftotext -layout "${tmpPdfPath}" "${tmpTxtPath}"`)

      // 3. Read extracted text and parse
      const pdfText = fs.readFileSync(tmpTxtPath, 'utf-8')
      auditData = parseAuditPDF(pdfText)

      // 4. Clean up temp files
      fs.unlinkSync(tmpPdfPath)
      fs.unlinkSync(tmpTxtPath)
      ```
    ]
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 0.8em,
    [
      #align(center)[
        #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
          #text(size: 12pt, weight: "bold")[1. Upload]
          #text(size: 11pt)[PDF file received]
        ]
      ]
    ],
    [
      #align(center)[
        #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
          #text(size: 12pt, weight: "bold")[2. Extract]
          #text(size: 11pt)[pdftotext -layout]
        ]
      ]
    ],
    [
      #align(center)[
        #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
          #text(size: 12pt, weight: "bold")[3. Parse]
          #text(size: 11pt)[Regex on plain text]
        ]
      ]
    ]
  )
]

// 5. Course Line Pattern

// 6. Processing Matches
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Processing Matches]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      const matches = Array.from(pdfText.matchAll(courseLinePattern))

      for (const match of matches) {
        const term = match[1]           // "22FA"
        const courseCode = match[2]     // "SYSC"
        const courseNum = match[3]      // "3303"
        const courseId = courseCode + courseNum  // "SYSC3303" (normalized)
        const grade = match[5]          // "A-"
        const fullMatch = match[0]      // Full line for flag detection
      }
      ```
    ]
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 12pt)[Why `matchAll` with `/gm`?]
      #text(size: 11pt)[
        - Global flag: finds all matches
        - Multiline flag: `^` matches each line start
        - Returns iterator with captured groups
        - Processes entire audit in single pass
      ]
    ],
    [
      #text(weight: "bold", size: 12pt)[Course ID Normalization]
      #text(size: 11pt)[
        PDF has `"SYSC 3303"` (with space)
        We store `"SYSC3303"` (no space)
        
        Matches our database format for lookups.
      ]
    ]
  )
]

// 7. Grade Classification
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Grade Classification]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      const isCurrent = fullMatch.includes('CUR') || grade === 'CUR'

      if (isCurrent && !seenCurrent.has(courseId)) {
        currentCourses.push({ courseId, term })
        seenCurrent.add(courseId)
      } else if (grade && grade !== 'CUR' && grade !== 'UNS' && 
                 grade !== 'F' && grade !== 'X' && grade !== 'NR' &&
                 !seenCompleted.has(courseId)) {
        completedCourses.push({ courseId, grade })
        seenCompleted.add(courseId)
      }
      ```
    ]
  ]

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "bold", size: 11pt)[Completed]
      #rect(fill: rgb("#e6fffa"), stroke: 1pt + rgb("#00aa88"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          A+ through D-
          TR (Transfer)
          SAT (Satisfied)
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 11pt)[Current/Deferred (CUR, DEF)]
      #rect(fill: rgb("#fffaf0"), stroke: 1pt + rgb("#ff8c00"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          Currently enrolled (CUR)
          Deferred (DEF) - grade pending
          Stored with term
          Counts as "course taken" but no grade yet
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 11pt)[Filtered Out]
      #rect(fill: rgb("#fee2e2"), stroke: 1pt + rgb("#dc2626"), radius: 4pt, inset: 8pt)[
        #text(size: 10pt)[
          F (Failed)
          X (Forfeited)
          UNS, NR
        ]
      ]
    ]
  )
]

// 8. Why Separate Current vs Completed?
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Why Separate Current vs Completed?]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Both Satisfy Prerequisites]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          *Scenario:* Planning courses for next term
          
          - Currently taking SYSC 3303 (CUR)
          - Want to take SYSC 4406 next term
          - SYSC 4406 requires SYSC 3303
          
          *Result:* Prerequisite satisfied
          
          Both completed and current courses count.
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[But Grade Requirements Differ]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          *Some prerequisites require minimum grade:*
          
          "SYSC 3303 with C- or higher"
          
          - *Completed:* Has grade, can verify
          - *Current:* No grade yet, cannot verify
          
          *Result:* Current courses satisfy "course taken" but not grade requirements.
        ]
      ]
    ]
  )
]

// 9. Handling Repeated Courses
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Handling Repeated Courses]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 10pt)[
          ```typescript
          const seenCompleted = new Set<string>()
          const seenCurrent = new Set<string>()

          const existingIndex = completedCourses
            .findIndex(c => c.courseId === courseId)
          if (existingIndex >= 0) {
            completedCourses[existingIndex].grade = grade
          } else {
            completedCourses.push({ courseId, grade })
            seenCompleted.add(courseId)
          }
          ```
        ]
      ]
      #v(0.3em)
      #text(size: 11pt)[
        Two Sets: same course can appear as completed (old attempt) and current (retaking).
        #v(0.2em)
        Since PDF is chronological, we keep the most recent grade.
      ]
    ],
    [
      #text(weight: "bold", size: 12pt)[Example: Retaken Course]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 10pt)[
          *PDF contains:*
          ```
          21FA  SYSC 2004  0.50  F
          22FA  SYSC 2004  0.50  B+
          ```
          
          *Processing:*
          1. F grade → filtered out
          2. B+ grade → added
          
          *Result:*
          ```typescript
          completedCourses: [
            { courseId: "SYSC2004", grade: "B+" }
          ]
          ```
        ]
      ]
    ]
  )
]

// 10. Student Info Extraction
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Student Info Extraction]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      // Student ID: first 9-digit number in document
      const studentIdMatch = pdfText.match(/(\d{9})/)
      const studentId = studentIdMatch ? studentIdMatch[1] : ''

      // Name: "LastName, FirstName" -> "FirstName LastName"
      const nameMatch = pdfText.match(/([A-Z][a-z]+),\s+([A-Z][a-z]+)/)
      const name = nameMatch ? `${nameMatch[2]} ${nameMatch[1]}` : ''

      // Program: text after "Bachelor of Engineering -"
      const programMatch = pdfText.match(/Bachelor of Engineering\s*-\s*([A-Za-z\s]+)/i)
      const program = programMatch ? programMatch[1].trim() : ''
      ```
    ]
  ]

  #v(0.5em)
  #table(
    columns: (1fr, 1.5fr, 1fr),
    stroke: 0.5pt + rgb("#ddd"),
    inset: 6pt,
    fill: (col, row) => if row == 0 { rgb("#f0f0f0") } else { white },
    [*Field*], [*Pattern*], [*Example*],
    [Student ID], [`/(\d{9})/`], ["101234567"],
    [Name], [`/([A-Z][a-z]+),\s+([A-Z][a-z]+)/`], ["Smith, John" → "John Smith"],
    [Program], [`/Bachelor of Engineering\s*-\s*(.+)/i`], ["Software Engineering"],
  )
]

// 11. How Parsed Data Is Used
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[How Parsed Data Is Used]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Prerequisite Validation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          User selects a course to add to schedule.
          
          System checks:
          - Is required course in `completedCourses`?
          - Or in `currentCourses`?
          - Does grade meet minimum requirement?
          
          Returns: eligible or missing prerequisites
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Schedule Generation]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          User uploads audit, selects courses.
          
          System uses parsed data to:
          - Filter courses already completed
          - Validate prerequisites for selections
          - Generate conflict-free schedules
        ]
      ]
    ]
  )
]

// 12. Audit Parsing Summary
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Audit Parsing Summary]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.2em,
    [
      #text(weight: "bold", size: 14pt)[Technical Approach]
      #text(size: 11pt)[
        1. *PDF text extraction* via `pdftotext -layout`
           - Preserves column alignment
           - Deterministic (not OCR)
        
        2. *Regex pattern matching*
           - Course lines: term, code, credits, grade
           - Student info: ID, name, program
        
        3. *Grade classification*
           - Filters failures (F, X, UNS, NR)
           - Separates current from completed
           - Deduplicates retaken courses
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Key Design Decisions]
      #table(
        columns: (1fr, 1.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 5pt,
        fill: (col, row) => if row == 0 { rgb("#f0f0f0") } else { white },
        [*Choice*], [*Rationale*],
        [pdftotext], [Deterministic vs OCR],
        [-layout flag], [Preserves row structure],
        [Regex], [Fast, no dependencies],
        [CUR separate], [Grade req validation],
        [Set dedup], [Handles retakes],
        [Filter F/X], [Only passing counts],
      )
    ]
  )
]

// ============================================================================
// SECTION 2: SEARCH OPTIMIZATION
// ============================================================================

// 13. Search Problem
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Course Search: The Problem]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Naive Implementation]
      #rect(fill: rgb("#fff5f5"), stroke: 1pt + rgb("#cc0000"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          User types "SYSC4001" in search box
          
          *Without optimization:*
          - S → API call → DB query
          - SY → API call → DB query
          - SYS → API call → DB query
          - SYSC → API call → DB query
          - ... (8 keystrokes = 8 queries)
        ]
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Why This Matters]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
        #text(size: 11pt)[
          *Database load:*
          - Each query scans courses table
          - Joins with sections table
          - Multiplied by concurrent users
        ]
      ]
    ]
  )
]

// 14. Three Optimization Strategies
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Three Optimization Strategies]
  #v(0.5em)

  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(weight: "bold", size: 13pt)[1. Minimum Length]
        #v(0.3em)
        #text(size: 10pt)[
          Don't search for queries < 2 characters.
          
          "S" matches too many courses.
          
          ```typescript
          if (query.length < 2) 
            return []
          ```
        ]
      ]
    ],
    [
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(weight: "bold", size: 13pt)[2. Debouncing]
        #v(0.3em)
        #text(size: 10pt)[
          Wait 300ms after typing stops before API call.
          
          ```typescript
          debounceRef.current = 
            setTimeout(() => {
              performSearch(query)
            }, 300)
          ```
        ]
      ]
    ],
    [
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(weight: "bold", size: 13pt)[3. Caching]
        #v(0.3em)
        #text(size: 10pt)[
          Store results in memory for 5 minutes.
          
          ```typescript
          cache.set(query, {
            results, 
            timestamp
          })
          ```
        ]
      ]
    ]
  )
]

// 15. Debouncing Implementation
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Debouncing Implementation]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      const DEBOUNCE_MS = 300
      const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

      const handleSearch = (query: string) => {
        setSearchQuery(query)
        
        // Clear previous timer (user still typing)
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        
        if (query.trim().length < 2) {
          setSearchResults([])
          return
        }
        
        // Only fires if user stops typing for 300ms
        debounceRef.current = setTimeout(() => {
          performSearch(query)
        }, DEBOUNCE_MS)
      }
      ```
    ]
  ]

  #v(0.3em)
  #text(size: 11pt)[
    Each keystroke clears the previous timer and starts a new one. Search only executes after 300ms pause. "SYSC4001" typed quickly: 8 keystrokes → 1 API call.
  ]
]

// 16. Caching Implementation
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Caching Implementation]
  #v(0.5em)

  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 10pt, width: 100%)[
    #text(size: 10pt)[
      ```typescript
      // In-memory cache (lives in browser tab's RAM)
      const searchCache = new Map<string, { results: Course[]; timestamp: number }>()
      const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

      export async function searchCourses(query: string): Promise<Course[]> {
        const normalizedQuery = query.trim().toLowerCase()
        
        // Check cache first
        const cached = searchCache.get(normalizedQuery)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return cached.results  // Cache hit - skip API call
        }
        
        const results = await fetch(...)  // Cache miss - make API call
        
        searchCache.set(normalizedQuery, { results, timestamp: Date.now() })
        return results
      }
      ```
    ]
  ]

  #v(0.3em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "bold", size: 12pt)[Why 5 minutes TTL?]
      #text(size: 11pt)[
        We will implement live section data fetching, and update class capacity every 5 minutes. Currently, section data is static.
      ]
    ]
  )
]

// 18. Search Optimization Results
#slide[
  #text(size: 28pt, weight: "bold", fill: rgb("#bf112b"))[Optimization Results]
  #v(0.5em)

  #table(
    columns: (2fr, 1fr, 1fr),
    stroke: 0.5pt + rgb("#ddd"),
    inset: 8pt,
    fill: (col, row) => if row == 0 { rgb("#bf112b") } else if calc.rem(row, 2) == 0 { rgb("#fafafa") } else { white },
    text(fill: white, weight: "bold")[Scenario], 
    text(fill: white, weight: "bold")[Before], 
    text(fill: white, weight: "bold")[After],
    [User types "SYSC4001" (8 chars)], [8 requests], [1 request],
    [User searches "SYSC" twice], [2 requests], [1 request],
    [User types "S" then deletes], [1 request], [0 requests],
    [User types fast, pauses, continues], [N requests], [2 requests],
  )

  #v(0.5em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #text(weight: "bold", size: 14pt)[Combined Effect]
      #text(size: 11pt)[
        Significant reduction in API calls and server load.
      ]
    ],
    [
      #text(weight: "bold", size: 14pt)[Summary]
      #text(size: 11pt)[
        - Min length: eliminates useless queries
        - Debounce: waits for typing to stop
        - Cache: avoids repeated queries
      ]
    ]
  )
]
