# Data Acquisition - Presentation Slides

## My Role: Data Extraction & Formatting

**Task:** Extract prerequisite data from Carleton's website and format it for the parser to consume.

---

## Slide 1: The Problem

### The System Needs Prerequisite Data

The prerequisite validator needs to know what courses are required before taking each course.

**This data exists only as prose text on Carleton's website.**

**No API. No structured data. Just HTML pages.**

---

## Slide 2: The Data We Needed

| Field | Example | Purpose |
|-------|---------|---------|
| Course Code | `COMP2401` | Identifier |
| Prerequisites | `(COMP1006 or COMP1406) with grade C-` | Validation logic |
| Preclusions | `SYSC1006, SYSC2006` | Can't take both |
| Title | `Introduction to Systems Programming` | Display |
| Credits | `0.5` | Degree tracking |

**Source:** `https://calendar.carleton.ca/undergrad/courses/{DEPT}/{CODE}/`

---

## Slide 3: Problem → Constraints → Options

### Problem
- 348 engineering courses need prerequisite data
- Data is embedded in HTML pages as natural language
- No structured API available

### Constraints
- Must extract from HTML reliably
- Must convert prose to machine-readable format
- Parser expects specific symbolic notation

### Options
| Option | Verdict |
|--------|---------|
| Manual copy-paste from browser | Too slow, error-prone |
| Full page download | Unnecessary data, large files |
| **Targeted curl extraction** | Efficient, gets only what we need |

---

## Slide 4: Chosen Approach - Curl Extraction

### Step 1: Fetch HTML for Each Course

```bash
curl "https://calendar.carleton.ca/undergrad/courses/COMP/COMP2401/"
```

### Step 2: Extract the Relevant Div

The prerequisite info lives in `<div class="coursedescadditional">`

```bash
curl "https://calendar.carleton.ca/undergrad/courses/COMP/COMP2401/" \
    | grep -o '<div class="coursedescadditional">.*</div>' \
    > courses/comp/comp2401.html
```

### Result: 348 HTML Files

```
courses/
├── comp/
│   ├── comp1005.html
│   ├── comp2401.html
│   └── ...
├── sysc/
│   ├── sysc2004.html
│   ├── sysc4907.html
│   └── ...
└── (30 departments)
```

---

## Slide 5: What the Raw HTML Looks Like

### Example: `courses/comp/comp2401.html`

```html
<div class="coursedescadditional">
  Precludes additional credit for 
  <a class="bubblelink code" href="...">SYSC 1006</a>, 
  <a class="bubblelink code" href="...">SYSC 2006</a>.<br/>
  
  Prerequisite(s): 
  (<a class="bubblelink code" href="...">COMP 1006</a> or 
   <a class="bubblelink code" href="...">COMP 1406</a>) 
  with a minimum grade of <span class="keeptogether">C-</span>.<br/>
</div>
```

**Problem:** This is not machine-readable. The parser can't use this.

---

## Slide 6: The Formatting Task

### My Job: Convert HTML Prose → Symbolic JSON

**INPUT (raw HTML):**
```
Prerequisite(s): (COMP 1006 or COMP 1406) with a minimum grade of C-.
Precludes additional credit for SYSC 1006, SYSC 2006.
```

**OUTPUT (formatted JSON):**
```json
{
  "COMP2401": {
    "required": "(COMP1006[C-] || COMP1406[C-])",
    "restricted": ["SYSC1006", "SYSC2006"]
  }
}
```

---

## Slide 7: Symbolic Notation Rules

### Format Required by Parser

| Prose | Symbol | Example |
|-------|--------|---------|
| "and" | `&&` | `SYSC2004 && SYSC4001` |
| "or" | `\|\|` | `COMP1006 \|\| COMP1406` |
| "with a minimum grade of C-" | `[C-]` | `COMP1805[C-]` |
| "fourth-year status" | `FOURTH_YEAR` | `FOURTH_YEAR` |
| "permission of instructor" | `PERMISSION` | `PERMISSION` |
| Grouping | `()` | `(A \|\| B) && C` |

---

## Slide 8: Conversion Examples

### Example 1: Simple AND
```
INPUT:  "ELEC 2507 and ELEC 2607"
OUTPUT: "ELEC2507 && ELEC2607"
```

### Example 2: OR with Grade
```
INPUT:  "(COMP 1006 or COMP 1406) with a minimum grade of C-"
OUTPUT: "(COMP1006[C-] || COMP1406[C-])"
```

### Example 3: Complex Nested
```
INPUT:  "COMP 1805 with a minimum grade of C-, and either COMP 2402 
         or (SYSC 2004 and SYSC 2100)"
OUTPUT: "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))"
```

### Example 4: Year Standing
```
INPUT:  "Fourth-year status in Engineering"
OUTPUT: "FOURTH_YEAR"
```

---

## Slide 9: Edge Cases Handled

### Different Programs Have Different Prerequisites

**Raw HTML for SYSC3303:**
```
Prerequisite(s): For students in the Faculty of Engineering: 
SYSC 2004 and SYSC 4001. 
For students in Computer Science: COMP 2401, COMP 2402, and COMP 3000.
```

**Decision:** Format for Engineering students (our target users):
```json
{
  "SYSC3303": {
    "required": "SYSC2004 && SYSC4001"
  }
}
```

### Ambiguous Cases
| Prose | Formatted As |
|-------|--------------|
| "or equivalent" | Ignored (can't validate) |
| "permission of the instructor" | `PERMISSION` |
| "registration in X program" | `PERMISSION` |

---

## Slide 10: Final Output Format

### `course_prerequisites_simple.json`

```json
{
  "COMP2401": {
    "required": "(COMP1006[C-] || COMP1406[C-])",
    "restricted": ["SYSC1006", "SYSC2006"],
    "title": "Introduction to Systems Programming",
    "credits": 0.5,
    "description": "..."
  },
  "SYSC4907": {
    "required": "SYSC4001 && FOURTH_YEAR",
    "restricted": [],
    "title": "Engineering Project",
    "credits": 1.0,
    "description": "..."
  },
  "ELEC3500": {
    "required": "ELEC2507 && ELEC2607",
    "restricted": [],
    "title": "Digital Electronics II",
    "credits": 0.5,
    "description": "..."
  }
}
```

**348 courses formatted and ready for parser**

---

## Slide 11: Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        MY WORK                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   calendar.carleton.ca/undergrad/courses/{DEPT}/{CODE}/         │
│                           │                                      │
│                           │ curl (×348 courses)                  │
│                           ▼                                      │
│                  courses/{dept}/{code}.html                      │
│                      (348 HTML files)                            │
│                           │                                      │
│                           │ Manual formatting                    │
│                           │ (prose → symbolic)                   │
│                           ▼                                      │
│               course_prerequisites_simple.json                   │
│                    (348 JSON entries)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Handed off to parser
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PARSER'S WORK                                │
│                                                                  │
│   course_prerequisites_simple.json  →  seed.ts  →  Database     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Slide 12: Why This Approach Works

### Curl Extraction
- Single command per course
- Gets **only** the prerequisite div (small files)
- Consistent HTML structure across all courses
- Can be scripted for batch fetching

### Manual Formatting
- **Accuracy** — human judgment handles ambiguity
- **Consistency** — same notation rules applied everywhere
- **Edge cases** — program-specific prereqs handled correctly

### JSON Output
- **Structured** — parser can read directly
- **Readable** — easy to verify and debug
- **Complete** — all fields needed by the system

---

## Slide 13: Limitations

### Extraction Limitations
- HTML structure could change (breaks curl extraction)
- 348 individual requests needed
- No automatic sync when calendar updates

### Formatting Limitations
- **Manual work** — 348 courses × ~5 min = ~29 hours
- **Human error risk** — typos possible
- **Maintenance burden** — curriculum changes need re-formatting

### Coverage Limitations
- "Or equivalent" can't be machine-validated
- Some prerequisites are program-specific
- Permission-based prereqs can't be auto-checked

---

## Slide 14: Summary

### What I Did

| Step | Input | Output |
|------|-------|--------|
| **1. Extraction** | Carleton calendar pages | 348 HTML files |
| **2. Formatting** | HTML prose | Symbolic JSON |

### Key Deliverable

**`course_prerequisites_simple.json`**
- 348 courses
- Machine-readable prerequisite expressions
- Ready for parser to consume

### Impact
- Enabled the prerequisite validation system
- Foundation for course eligibility checking
- One-time effort, used by entire application

---

## Slide 15: Example Walkthrough

### COMP3005 - Database Management Systems

**Step 1: Curl**
```bash
curl ".../courses/COMP/COMP3005/" > courses/comp/comp3005.html
```

**Step 2: Read Raw HTML**
```html
Prerequisite(s): COMP 1805 with a minimum grade of C-, 
and either COMP 2402 or (SYSC 2004 and SYSC 2100).
```

**Step 3: Format**
```
"COMP 1805 with a minimum grade of C-"  →  "COMP1805[C-]"
"and"                                    →  "&&"
"either COMP 2402"                       →  "COMP2402"
"or"                                     →  "||"
"(SYSC 2004 and SYSC 2100)"             →  "(SYSC2004 && SYSC2100)"
```

**Step 4: Final JSON**
```json
{
  "COMP3005": {
    "required": "COMP1805[C-] && (COMP2402 || (SYSC2004 && SYSC2100))",
    "restricted": ["BUSI3400"],
    "title": "Database Management Systems",
    "credits": 0.5
  }
}
```

**Done. Parser takes it from here.**
