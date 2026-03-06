#import "@preview/polylux:0.4.0": *

#set page(paper: "presentation-16-9", margin: 1.3em)
#set text(size: 18pt)
#set block(spacing: 0.5em)

// Title Slide
#slide[
  #align(center + horizon)[
    #rect(fill: rgb("#bf112b"), width: 100%, height: 6pt)
    #v(0.8em)
    #text(size: 40pt, weight: "bold")[Data Acquisition]
    #v(0.3em)
    #text(size: 22pt, fill: rgb("#666666"))[Carleton Smart Course Scheduler]
    #v(1.5em)
    #text(size: 16pt)[
      Populating the database from scattered Carleton sources
    ]
    #v(1.5em)
    #text(size: 14pt, fill: rgb("#888888"))[SYSC 4907 Capstone Project]
  ]
]

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
  #v(0.1em)
    
      #text(weight: "semibold", size: 11pt)[Problem]
      #text(size: 9pt)[Need all course sections with times, days, CRNs for schedule generation. No public API exists.]
      #v(0.08em)
      #text(weight: "semibold", size: 11pt)[Options Considered]
      #table(
        columns: (1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 2pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*Option*], [*Trade-off*],
        text(size: 9pt)[Scrape Central pages], text(size: 9pt)[Slow, 1000s of requests],
        text(size: 9pt)[PDF timetable parsing], text(size: 9pt)[Fragile, format changes],
        text(size: 9pt)[Intercept existing tool], text(size: 9pt)[Fast, single request],
      )
      #v(0.08em)
      #text(weight: "semibold", size: 11pt)[Chosen Approach]
      #text(size: 9pt)[Reverse-engineer Schedule Builder via DevTools. Single endpoint returns *all* sections for a term.]
        #grid(
    columns: (1.3fr, 1fr),
    gutter: 0.6em,
    [
      #image("images/Pasted image (2).png", width: 100%)
    ])
      #v(0.08em)
      #text(weight: "semibold", size: 11pt)[Limitations]
      #text(size: 9pt)[Undocumented - could change. Mitigation: parser is isolated, easy to update.]
    
  
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
          *Structured* - Tab-separated, not HTML \
          *Complete* - All sections in one file \
          *Easy to parse* - Just split on tabs
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
      #text(weight: "semibold", size: 12pt)[Raw Data Format (14 columns)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 7pt)[```
term  CRN    dept  num   sec  type  days  start  end   startDt endDt cap  enrl status
25WN  10234  SYSC  3303  A    LEC   MWF   0835   0925  Jan06   Apr09 120  98   Open
25WN  10235  SYSC  3303  L1   LAB   T     1435   1725  Jan06   Apr09 30   28   Open
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[What Each Row Tells Me]
      #text(size: 10pt)[
        - *SYSC3303* section *A* meets *MWF at 8:35am*
        - Lab *L1* meets *Tuesday 2:35-5:25pm*
        - CRN *10234* is what students use to register
        - Capacity 120, enrolled 98, status Open
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[The Parser (simplified)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
function parseTimetableLine(line: string) {
  const parts = line.split('\t')
  // parts[0]=term, [1]=crn, [2]=dept, ...
  return {
    term: parts[0],
    crn: parts[1],
    courseId: `${parts[2]}${parts[3]}`,
    sectionCode: parts[4],
    sectionType: parts[5],
    days: parts[6],
    startTime: parts[7],
    endTime: parts[8],
    capacity: parseInt(parts[11]),
    status: parts[13]
  }
}
```]
      ]
      #text(size: 9pt, style: "italic")[Extracts all 14 columns, maps to object fields]
    ]
  )
]

// 4.4b - How the Parser Inserts into the Database
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: File → Database]
  #text(size: 15pt, fill: rgb("#666666"))[How each line in sectiondata.txt becomes a row in PostgreSQL]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Step 1: Read the file]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
// Read entire file into memory
const content = await fs.readFile('sectiondata.txt')
const lines = content.split('\n')
// lines = ["25WN\t10234\tSYSC\t3303...", 
//          "25WN\t10235\tSYSC\t3303...", ...]
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Step 2: Loop through each line]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
for (const line of lines) {
  const record = parseTimetableLine(line)
  // record = {crn: "10234", courseId: "SYSC3303", 
  //           sectionCode: "A", days: "MWF", ...}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Step 3: Insert into database]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
  // Prisma takes the object and creates a row
  await prisma.section.create({
    data: {
      crn: record.crn,
      courseId: record.courseId,
      sectionCode: record.sectionCode,
      sectionType: record.sectionType,
      days: record.days,
      startTime: record.startTime,
      endTime: record.endTime,
      term: record.term,
      capacity: record.capacity,
      status: record.status
    }
  })
}
```]
      ]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What Prisma does:* Takes my JavaScript object and translates it into SQL: \
          `INSERT INTO sections (crn, courseId, ...) VALUES ('10234', 'SYSC3303', ...)`
        ]
      ]
    ]
  )
]

// 4.4c - The Section Table
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Section Table]
  #text(size: 15pt, fill: rgb("#666666"))[What the database table looks like after parsing]
  #v(0.2em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Schema Definition (prisma/schema.prisma)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```
model Section {
  id          String   @id
  crn         String?
  courseId    String
  sectionCode String
  sectionType String
  days        String?
  startTime   String?
  endTime     String?
  term        String?
  capacity    Int?
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Resulting Table in PostgreSQL]
      #table(
        columns: (0.6fr, 0.5fr, 0.5fr, 0.4fr, 0.5fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 3pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*crn*], [*courseId*], [*code*], [*type*], [*days*],
        [10234], [SYSC3303], [A], [LEC], [MWF],
        [10235], [SYSC3303], [B], [LEC], [MW],
        [10236], [SYSC3303], [L1], [LAB], [T],
        [10237], [SYSC3303], [L2], [LAB], [R],
      )
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[Each row = one section a student can register for using the CRN]
      ]
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
        "You can't take SYSC 4001 - you're missing SYSC 3303."
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
        - *Prerequisite(s)* - what we need
        - Preclusions (courses that conflict)
      ]
      #v(0.2em)
      #text(size: 13pt, style: "italic")[
        Sounds simple enough... right?
      ]
    ]
  )
]

// 4.8 - Fetching and Saving Course Pages
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Fetching Course Pages]
  #text(size: 15pt, fill: rgb("#666666"))[Downloading and saving HTML files locally]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[The Fetch Process]
      #text(size: 10pt)[Each course page has a predictable URL:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```bash
curl "https://calendar.carleton.ca/undergrad/
      courses/SYSC/SYSC3303/" > sysc3303.html
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Where It's Saved]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[```
courses/
  sysc/
    sysc1005.html
    sysc1006.html
    sysc3303.html
    ...
  comp/
    comp1405.html
    comp1406.html
    ...
```]
      ]
      #text(size: 9pt)[*348 HTML files* organized by department]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Why Save Locally?]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *1. Avoid repeated requests* \
          Don't want to hit Carleton's server 348 times every time I test my parser \
          \
          *2. Faster development* \
          Parsing local files is instant vs. waiting for network \
          \
          *3. Reproducibility* \
          If Carleton updates their site, I still have the original HTML to debug
        ]
      ]
      #v(0.1em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[*Alternative:* Fetch live each time - but slow, unreliable, and risks getting rate-limited]
      ]
    ]
  )
]

// 4.8b - Unpredictable HTML Structure
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Unpredictable HTML]
  #text(size: 15pt, fill: rgb("#666666"))[Not all course pages have the same fields]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[COMP 1005 - No Prerequisites]
      #image("images/unpredictable-html-1.png", width: 100%)
      #text(size: 9pt)[Has "Also listed as", "Precludes", but *no prerequisite line*]
    ],
    [
      #text(weight: "semibold", size: 12pt)[COMP 1406 - Has Prerequisites]
      #image("images/unpredictable-html-2.png", width: 100%)
      #text(size: 9pt)[Has prerequisites *plus* program restrictions in the same line]
    ]
  )

  #v(0.2em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt)[
    #text(size: 10pt)[*The challenge:* Can't assume any field exists. Parser must handle missing fields, varying formats, and mixed content (course prereqs + program restrictions in one line).]
  ]
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

// 4.10 - HTML to JSON: The Complete Flow
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: HTML → JSON]
  #text(size: 15pt, fill: rgb("#666666"))[Converting messy HTML into clean, structured data]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Why Convert to JSON?]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *HTML is for display* - full of tags, styles, formatting \
          *JSON is for data* - clean key-value pairs \
          \
          The app doesn't need HTML. It needs: \
          → Course code: "SYSC3303" \
          → Title: "Real-Time Concurrent Systems" \
          → Credits: 0.5 \
          \
          JSON is easy to read, edit, and load into the database.
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Step 1: Read HTML, extract with regex]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
const html = fs.readFileSync('courses/sysc/sysc3303.html')
const titleMatch = html.match(/credit[s]?\]<br\/>\s*([^<]+)/)
// titleMatch[1] = "Real-Time Concurrent Systems"
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Step 2: Build object for each course]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
courses["SYSC3303"] = {
  title: "Real-Time Concurrent Systems",
  credits: 0.5,
  description: "..."
}
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Step 3: Write all courses to JSON]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
fs.writeFileSync(
  'course_titles.json',
  JSON.stringify(courses, null, 2)
)
```]
      ]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *Result:* 348 HTML files → 1 clean JSON file \
          Now the seed script can easily load this into the database
        ]
      ]
    ]
  )
]

// 4.10b - The Regex Patterns
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The Regex Patterns]
  #text(size: 15pt, fill: rgb("#666666"))[How we reliably extract data from unpredictable HTML]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Finding Course Blocks]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
// Each course is wrapped in a courseblock div
const courseBlockRegex = 
  /<div class="courseblock">([\s\S]*?)<\/div>/g

while ((match = courseBlockRegex.exec(html))) {
  const blockContent = match[1]
  // Now parse this one course...
}
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Extracting Code, Credits, Title]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 7pt)[```typescript
// Pattern matches: "SYSC 3303 [0.5 credit] Title"
const headerRegex = /<span class="courseblockcode">
  ([A-Z]{2,5})&#160;(\d{4})<\/span>\s+
  \[([0-9.]+)\s+credit[s]?\]<br\/>\s*
  ([^<]+)<\/span>/

const [, dept, num, credits, title] = 
  headerRegex.exec(blockContent)
// dept="SYSC", num="3303", credits="0.5", 
// title="Real-Time Concurrent Systems"
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[What the Parsed JSON Looks Like]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```json
{
  "fetchedAt": "2025-01-15T...",
  "totalCourses": 348,
  "courses": {
    "SYSC3303": {
      "title": "Real-Time Concurrent Systems",
      "credits": 0.5,
      "description": "Scheduling, concurrency
        control, exception handling..."
    },
    "SYSC4001": {
      "title": "Operating Systems",
      "credits": 0.5,
      "description": "..."
    }
  }
}
```]
      ]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[*Clean, structured data* - ready to merge with prerequisites and load into DB]
      ]
    ]
  )
]

// 4.11 - The JSON Output
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: The JSON Output]
  #text(size: 15pt, fill: rgb("#666666"))[Two JSON files store different pieces of course data]
  #v(0.1em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[course\_titles.json (from regex)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```json
{
  "SYSC1006": {
    "title": "Foundations of Imperative...",
    "credits": 0.5,
    "description": "An intro to..."
  },
  "SYSC3303": {
    "title": "Real-Time Concurrent Systems",
    "credits": 0.5,
    "description": "..."
  }
}
```]
      ]
      #text(size: 9pt)[*Source:* Regex extracted from HTML]
    ],
    [
      #text(weight: "semibold", size: 12pt)[course\_prerequisites\_simple.json]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 8pt)[```json
{
  "SYSC1006": {
    "required": "ECOR1031[C-] || ...",
    "restricted": ["COMP2401"]
  },
  "SYSC3303": {
    "required": "SYSC2004 && SYSC2100",
    "restricted": []
  }
}
```]
      ]
      #text(size: 9pt)[*Source:* Converted to symbolic format for parsing]
    ]
  )
  #v(0.1em)
  #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
    #text(size: 10pt)[*merge-course-data.ts* combines these two files → final `course_prerequisites_simple.json` with all fields]
  ]
]

// 4.12 - Extracting Prerequisites with Regex
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Extracting Prerequisites]
  #text(size: 15pt, fill: rgb("#666666"))[Finding "what courses you need to take first" from the HTML]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[What is a Prerequisite?]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          A *prerequisite* is a course you must complete *before* you can take another course. \
          \
          Example: To take SYSC 3303, you need to have passed SYSC 2004 and SYSC 2100 first.
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Where It Lives in the HTML]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```html
<p class="coursedescadditional">
  Prerequisite(s): SYSC 2004 and SYSC 2100.
</p>
```]
      ]
      #text(size: 9pt)[This is inside each course's HTML page we saved earlier.]
    ],
    [
      #text(weight: "semibold", size: 12pt)[How We Extract It (Regex)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```typescript
// This pattern finds text after "Prerequisite(s):"
const prereqRegex = /Prerequisite\(s\):\s*([^<]+)/

const match = prereqRegex.exec(html)
const prereqText = match[1].trim()
// Result: "SYSC 2004 and SYSC 2100."
```]
      ]
      #text(size: 9pt)[*What this does:* Searches the HTML for the word "Prerequisite(s):" and grabs everything after it until the next HTML tag.]
      #v(0.1em)
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *The problem:* We get English text like "and", "or". \
          Computers don't understand English - we need to convert this to code the computer can evaluate.
        ]
      ]
    ]
  )
]

// 4.12b - Converting English to Code
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: English → JSON]
  #text(size: 15pt, fill: rgb("#666666"))[Python script converts HTML prerequisites to symbolic format]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[Input: HTML from curl]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```html
<div class="coursedescadditional">
  Prerequisite(s): SYSC 2004 and SYSC 4001.
</div>
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Python Parser (parse\_prerequisites\_simple.py)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```python
from bs4 import BeautifulSoup
import re

# Extract text from HTML
soup = BeautifulSoup(content, 'html.parser')
text = soup.get_text()

# Find course codes with regex
courses = re.findall(
  r'[A-Z]{4}\s*\d{4}', text)
# ['SYSC 2004', 'SYSC 4001']

# Detect AND/OR relationships
if ' and ' in text:
  return ' && '.join(courses)
if ' or ' in text:
  return ' || '.join(courses)
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Output: JSON file]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 8pt)[```json
{
  "SYSC3303": {
    "required": "SYSC2004 && SYSC4001",
    "restricted": []
  }
}
```]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Translation Rules in Python]
      #table(
        columns: (1fr, 1fr),
        stroke: 0.5pt + rgb("#ddd"),
        inset: 4pt,
        fill: (col, row) => if row == 0 { rgb("#f5f5f5") } else { white },
        [*English Pattern*], [*Output*],
        ["and"], [`&&`],
        ["or"], [`||`],
        ["SYSC 2004"], [`SYSC2004`],
        ["fourth-year standing"], [`FOURTH_YEAR`],
        ["permission of"], [`PERMISSION`],
      )
    ]
  )
]

// 4.13 - Conversion Examples
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: Conversion Examples]
  #text(size: 15pt, fill: rgb("#666666"))[Real examples of English to code conversion]
  #v(0.2em)

  #text(weight: "semibold", size: 14pt)[Example 1: SYSC 3303]
  #v(0.1em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[From the HTML page:]
    #text(size: 10pt)[ `"Prerequisite(s): SYSC 2004 and SYSC 2100."`]
  ]
  #v(0.05em)
  #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[What we store in JSON:]
    #text(size: 10pt)[ `"SYSC2004 && SYSC2100"`]
    #text(size: 9pt)[ - Computer reads: "student must have BOTH courses"]
  ]

  #v(0.15em)
  #text(weight: "semibold", size: 14pt)[Example 2: SYSC 1006 (more complex)]
  #v(0.1em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[From the HTML page:]
    #text(size: 9pt)[ `"Prerequisite(s): ECOR 1031 or (ECOR 1041 and ECOR 1042), all with minimum grade C-."`]
  ]
  #v(0.05em)
  #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[What we store in JSON:]
    #text(size: 10pt)[ `"ECOR1031[C-] || (ECOR1041[C-] && ECOR1042[C-])"`]
    #text(size: 9pt)[ - Computer reads: "ECOR1031 with C- OR (both ECOR1041 AND ECOR1042 with C-)"]
  ]

  #v(0.15em)
  #text(weight: "semibold", size: 14pt)[Example 3: Can't be converted]
  #v(0.1em)
  #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[From the HTML page:]
    #text(size: 9pt)[ `"Prerequisite(s): restricted to students in the B.C.S. program..."`]
  ]
  #v(0.05em)
  #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt, width: 100%)[
    #text(weight: "semibold", size: 11pt)[What we store:]
    #text(size: 10pt)[ `"OTHER_REQUIREMENT"`]
    #text(size: 9pt)[ - This isn't about courses, it's about which program you're in. We can't check that.]
  ]
]

// 4.14 - The Final JSON Structure
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
      #text(size: 11pt)[*Solution:* These become `OTHER_REQUIREMENT` or `PERMISSION` - the app flags them as "check manually".]
    ]
  ]
]

// 4.21 - Parsing Symbolic Expressions to Tree Nodes
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Data Acquisition: JSON → Database]
  #text(size: 15pt, fill: rgb("#666666"))[How seed.ts parses symbolic expressions into tree nodes]
  #v(0.15em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Input: Symbolic Expression from JSON]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 9pt)[`"ECOR1031[C-] || (ECOR1041 && ECOR1042)"`]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[Prisma Insert (seed.ts)]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #text(size: 7pt)[```typescript
async function createPrerequisiteTree(
  courseId, parsedNode, parentId) {
  
  const node = await prisma.prerequisiteNode
    .create({
      data: {
        courseId,
        nodeType: parsedNode.type,
        requiredCourseId: parsedNode.value,
        requiredGrade: parsedNode.grade,
        parentId: parentId || null
      }
    })
  // Recursively create children
  for (const child of parsedNode.children) {
    await createPrerequisiteTree(
      courseId, child, node.id)
  }
}
```]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Output: Tree Structure in Database]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 4pt)[
        #align(center)[#text(size: 9pt)[```
        [OR] ← root node (parentId: null)
       /    \
[COURSE]    [AND]
ECOR1031     /   \
 [C-]   [COURSE] [COURSE]
        ECOR1041  ECOR1042
```]]
      ]
      #v(0.1em)
      #text(size: 9pt)[Each node becomes a row in `prerequisite_nodes`:]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 3pt)[
        #text(size: 7pt)[```
id | nodeType | requiredCourseId | grade | parentId
1  | OR       | null             | null  | null
2  | COURSE   | ECOR1031         | C-    | 1
3  | AND      | null             | null  | 1
4  | COURSE   | ECOR1041         | null  | 3
5  | COURSE   | ECOR1042         | null  | 3
```]
      ]
      #text(size: 8pt)[Tree traversal validates if student meets prereqs]
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
      #text(weight: "semibold", size: 11pt)[Why This Approach?]
      #text(size: 9pt)[
        - Natural language is *ambiguous*
        - "all with a minimum grade" - which courses?
        - Regex extracts, parser handles logic
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

// 4.23 - Engineering Principles: Data Acquisition
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Engineering Principles in Data Acquisition]
  #text(size: 15pt, fill: rgb("#666666"))[How software engineering principles shaped the pipeline]
  #v(0.2em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[High Cohesion & Low Coupling]
      #v(0.1em)
      #text(size: 11pt)[Each script does *one thing well* and can run independently:]
      #v(0.1em)
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          *fetch-all-course-titles.ts* \
          → Scrapes pages → `course_titles.json` \
          \
          *import-timetable.ts* \
          → Parses `sectiondata.txt` → `Section` table (DB) \
          \
          *merge-course-data.ts* \
          → Merges → `course_prerequisites_simple.json` \
          \
          *seed.ts* \
          → Reads JSON → `Course`, `PrerequisiteNode` tables
        ]
      ]
      #v(0.1em)
      #text(size: 10pt, style: "italic")[If Carleton changes their timetable format, only `import-timetable.ts` needs updating.]
    ],
    [
      #text(weight: "semibold", size: 14pt)[Separation of Concerns]
      #v(0.1em)
      #text(size: 11pt)[Data acquisition is completely separate from the application:]
      #v(0.1em)
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          *Data Layer* (scripts/) \
          → Fetching, parsing, transforming \
          → Outputs: JSON files \
          \
          *Database Layer* (prisma/) \
          → Schema definition \
          → Seeding from JSON \
          \
          *Application Layer* (server/, src/) \
          → API routes, React UI \
          → Reads from database only
        ]
      ]
      #v(0.1em)
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[*Benefit:* App doesn't care *how* data was acquired - it just queries the DB.]
      ]
    ]
  )
]

// ============================================
// SUMMARY SECTION: Engineering Deep Dive
// ============================================

// Summary 1 - Problems Solved Overview
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Summary: Engineering Problems Solved]
  #text(size: 15pt, fill: rgb("#666666"))[The core challenges we overcame in data acquisition]
  #v(0.2em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[Problem 1: No Public API]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Challenge:* Carleton has no API to get course data \
          *Solution:* Reverse-engineered the Schedule Builder \
          *How:* Used browser DevTools to find the hidden endpoint \
          *Result:* Single curl command gets ~3,800 sections
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[Problem 2: Inconsistent HTML Structure]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Challenge:* Course pages have different fields \
          *Solution:* Defensive parsing with optional field extraction \
          *How:* Regex that doesn't fail if field is missing \
          *Result:* Parser handles all 348 courses despite variations
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[Problem 3: Ambiguous Natural Language]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Challenge:* "SYSC 2004 and SYSC 2100" isn't code \
          *Solution:* Python script with BeautifulSoup + regex \
          *How:* Extract text, find course codes, detect AND/OR \
          *Result:* 348 courses in `&&`/`||` format in JSON
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[Problem 4: Unparseable Requirements]
      #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 10pt)[
          *Challenge:* "restricted to B.C.S. students" can't be checked \
          *Solution:* Graceful degradation with `OTHER_REQUIREMENT` \
          *How:* Flag for manual review instead of failing \
          *Result:* App warns user instead of crashing
        ]
      ]
    ]
  )
]

// Summary 2 - Designs Used
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Summary: Designs Used]
  #text(size: 15pt, fill: rgb("#666666"))[Software engineering designs that shaped the architecture]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 12pt)[1. Pipeline Design]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* Data flows through discrete stages, each transforming it \
          *Our pipeline:* \
          `curl` → raw text → `parser` → objects → `Prisma` → database \
          *Why:* Each stage is testable and replaceable independently
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[2. Repository Design]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* Abstract data storage behind a clean interface \
          *Our use:* Prisma acts as repository. App calls `prisma.course.findMany()`, doesn't know it's PostgreSQL \
          *Why:* Could switch to MySQL without changing app code
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[3. Composite Design (Tree)]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* Tree structure where nodes can contain other nodes \
          *Our use:* Prerequisites stored as tree: OR node contains AND nodes, which contain COURSE nodes \
          *Why:* Handles arbitrary nesting: `A || (B && C) || (D && E && F)`
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[4. Adapter Design]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* Convert one interface to another \
          *Our use:* Parser "adapts" Carleton's TSV format to our database schema \
          *Example:* TSV has 14 columns → Parser outputs object matching Prisma model
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[5. Single Responsibility Principle]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* Each module does one thing well \
          *Our scripts:* \
          - `import-timetable.ts` - only parses timetable \
          - `fetch-all-course-titles.ts` - only fetches HTML \
          - `seed.ts` - only seeds database \
          *Why:* Easy to debug, test, and modify one without affecting others
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 12pt)[6. Fail-Safe Defaults]
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *What it is:* When something fails, fail in the safest way \
          *Our use:* Unknown prerequisites → `OTHER_REQUIREMENT` (warns user) rather than crashing or silently ignoring
        ]
      ]
    ]
  )
]

// Summary 3 - Thought Process: Decision Making
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Summary: Key Decisions & Trade-offs]
  #text(size: 15pt, fill: rgb("#666666"))[The reasoning behind major architectural choices]
  #v(0.15em)

  #text(weight: "semibold", size: 13pt)[Decision 1: Reverse-engineer vs. Build from scratch]
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
    #grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 0.5em,
      [#text(size: 9pt)[*Option A:* Scrape every course page individually \ 1000s of requests, slow, might get blocked]],
      [#text(size: 9pt)[*Option B:* Parse PDF timetables \ Fragile, format changes yearly]],
      [#text(size: 9pt, fill: rgb("#006600"))[*Chosen:* Find existing endpoint \ One request, all data, fast]],
    )
  ]

  #v(0.1em)
  #text(weight: "semibold", size: 13pt)[Decision 2: Prerequisite Parsing Strategy]
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
    #grid(
      columns: (1fr, 1fr),
      gutter: 0.5em,
      [#text(size: 9pt)[*Option A:* Build NLP parser to understand English \ Complex, error-prone, edge cases everywhere]],
      [#text(size: 9pt, fill: rgb("#006600"))[*Chosen:* Regex extracts text, symbolic JSON created, then parsed to tree \ Regex + recursive descent parser handles the logic]],
    )
  ]

  #v(0.1em)
  #text(weight: "semibold", size: 13pt)[Decision 3: Store raw HTML vs. Parse immediately]
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
    #grid(
      columns: (1fr, 1fr),
      gutter: 0.5em,
      [#text(size: 9pt)[*Option A:* Parse directly from network \ Fast initially, but can't debug or re-run without re-fetching]],
      [#text(size: 9pt, fill: rgb("#006600"))[*Chosen:* Save HTML files locally first \ Enables offline development, reproducible parsing, debugging]],
    )
  ]

  #v(0.1em)
  #text(weight: "semibold", size: 13pt)[Decision 4: Tree structure vs. Flat list for prerequisites]
  #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
    #grid(
      columns: (1fr, 1fr),
      gutter: 0.5em,
      [#text(size: 9pt)[*Option A:* Store as flat string "SYSC2004 && SYSC2100" \ Simple, but app must re-parse every time]],
      [#text(size: 9pt, fill: rgb("#006600"))[*Chosen:* Parse once into tree nodes in DB \ Query-friendly, validation is just tree traversal]],
    )
  ]
]

// Summary 4 - Data Flow Diagram
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Summary: Complete Data Flow]
  #text(size: 15pt, fill: rgb("#666666"))[How data moves from Carleton's servers to our database]
  #v(0.2em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 8pt, inset: 10pt, width: 95%)[
      #text(size: 11pt)[
        #grid(
          columns: (1fr, 0.15fr, 1fr, 0.15fr, 1fr),
          gutter: 0.2em,
          align: center + horizon,
          [
            #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
              #text(weight: "bold")[External Sources] \
              #text(size: 9pt)[
                Schedule Builder endpoint \
                Course Calendar HTML pages
              ]
            ]
          ],
          [→],
          [
            #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 6pt)[
              #text(weight: "bold")[Local Files] \
              #text(size: 9pt)[
                `sectiondata.txt` (TSV) \
                `courses/*.html` (348 files) \
                `course_titles.json` \
                `course_prerequisites_simple.json`
              ]
            ]
          ],
          [→],
          [
            #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 6pt)[
              #text(weight: "bold")[PostgreSQL Database] \
              #text(size: 9pt)[
                `courses` table \
                `sections` table \
                `prerequisite_nodes` table
              ]
            ]
          ],
        )
      ]
    ]
  ]

  #v(0.2em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 0.6em,
    [
      #text(weight: "semibold", size: 12pt)[Scripts & Their Responsibilities]
      #rect(fill: rgb("#f5f5f5"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *curl* → Fetches raw data from Carleton \
          *fetch-all-course-titles.ts* → Downloads HTML pages \
          *import-timetable.ts* → Parses TSV → Section table \
          *merge-course-data.ts* → Combines JSON files \
          *seed.ts* → Loads JSON → Course & PrerequisiteNode tables
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 12pt)[Why This Architecture?]
      #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 5pt)[
        #text(size: 9pt)[
          *Reproducibility:* Can re-run any step without re-fetching \
          *Debuggability:* Inspect intermediate files (JSON, HTML) \
          *Maintainability:* Change one script without affecting others \
          *Testability:* Each script can be unit tested in isolation
        ]
      ]
    ]
  )
]

// Summary 5 - Lessons Learned
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Summary: Lessons Learned]
  #text(size: 15pt, fill: rgb("#666666"))[What this project taught about real-world data engineering]
  #v(0.15em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 0.8em,
    [
      #text(weight: "semibold", size: 13pt)[1. Data is Never Clean]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Expected: Consistent HTML structure \
          Reality: Missing fields, varying formats, edge cases \
          *Lesson:* Always write defensive parsers that handle missing/malformed data
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[2. Understand Before Automating]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Temptation: Build full NLP to parse "SYSC 2004 and SYSC 2100" \
          Reality: Edge cases make full automation unreliable \
          *Lesson:* Use automation where reliable (regex for structure), handle ambiguity separately
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[3. Save Intermediate Artifacts]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Temptation: Stream directly from network to database \
          Reality: Bugs require re-running, re-fetching is slow \
          *Lesson:* Save HTML files, JSON files. Makes debugging 10x faster
        ]
      ]
    ],
    [
      #text(weight: "semibold", size: 13pt)[4. Design for Change]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Known risk: Carleton could change their endpoint/HTML \
          Mitigation: Isolated parsers, clear boundaries \
          *Lesson:* Assume external dependencies will change. Isolate them
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[5. Fail Gracefully]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Problem: Can't parse "restricted to B.C.S. students" \
          Bad solution: Crash or silently skip \
          Good solution: Flag as `OTHER_REQUIREMENT`, let user decide \
          *Lesson:* When you can't handle something, degrade gracefully
        ]
      ]
      #v(0.1em)
      #text(weight: "semibold", size: 13pt)[6. Multi-Stage Parsing Works]
      #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 6pt)[
        #text(size: 10pt)[
          Stage 1: Regex extracts prerequisite text from HTML \
          Stage 2: Symbolic format stored in JSON \
          Stage 3: Recursive descent parser builds tree in database \
          *Lesson:* Break complex parsing into manageable stages
        ]
      ]
    ]
  )
]

// Final Thank You Slide
#slide[
  #align(center + horizon)[
    #text(size: 40pt, weight: "bold")[Data Acquisition Complete]
    #v(0.8em)
    #text(size: 22pt, fill: rgb("#666666"))[Questions?]
    #v(1em)
    
    #rect(fill: rgb("#f5f5f5"), radius: 10pt, inset: 15pt)[
      #text(size: 14pt)[
        *What We Built:* \
        A complete pipeline from Carleton's scattered data sources to a clean, queryable database \
        \
        *Key Engineering Wins:* \
        → Single endpoint discovery saved 1000s of requests \
        → Regex + recursive descent parser handles prerequisite logic \
        → Isolated scripts make the system maintainable \
        → Tree structure enables complex prerequisite validation \
        \
        *Data Acquired:* \
        ~3,800 sections • 348 courses • Full prerequisite logic
      ]
    ]
    
    #v(1em)
    #rect(fill: rgb("#bf112b"), width: 100%, height: 6pt)
  ]
]
