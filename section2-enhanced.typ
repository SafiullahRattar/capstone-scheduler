#import "@preview/polylux:0.4.0": *

// ============================================================================
// SECTION 2: PREREQUISITE REPRESENTATION (~10 minutes)
// ENHANCED VERSION WITH VISUAL AIDS
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

// ============================================================================
// VISUAL AID: What Are Prerequisites? (Simple Example)
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[What Are Prerequisites?]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[A prerequisite is a rule: "Before you take X, you must first take Y"]
  #v(0.5em)

  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 8pt, inset: 20pt, width: 80%)[
      #text(size: 14pt)[
        #align(center)[
          #table(
            columns: (1fr, 0.3fr, 1fr),
            stroke: none,
            align: center + horizon,
            [#rect(fill: rgb("#ffcccc"), radius: 4pt, inset: 12pt)[#text(size: 12pt, weight: "bold")[SYSC 4001]]],
            [#text(size: 16pt)[→]],
            [#rect(fill: rgb("#ccffcc"), radius: 4pt, inset: 12pt)[#text(size: 12pt, weight: "bold")[Needs SYSC 3303]]],
          )
        ]
      ]
    ]
  ]

  #v(0.5em)
  #text(size: 14pt, fill: rgb("#666666"))[But sometimes the rules get more complex...]
  #v(0.5em)

  #align(center)[
    #rect(fill: rgb("#fff8e8"), radius: 8pt, inset: 16pt, width: 85%)[
      #text(size: 13pt)[
        *SYSC 4001 requires:* \
        #text(weight: "bold")["SYSC 3303 AND (SYSC 3310 OR SYSC 3320)"]
        #v(0.3em)
        This means you need:
        - SYSC 3303 ✓
        - AND at least one of: SYSC 3310 OR SYSC 3320 ✓
      ]
    ]
  ]
]

// ============================================================================
// VISUAL AID: The Tree Structure (Key Concept)
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[The Tree Structure]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Think of prerequisites like a family tree]
  #v(0.4em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 8pt, inset: 20pt, width: 90%)[
      #text(size: 11pt)[
        #align(center)[
          ```
                             [AND] ← ROOT (top-level rule)
                         /            \
                        /              \
               [COURSE]                 [OR] ← GROUP (pick ONE)
               SYSC3303               /        \
                                  [COURSE]   [COURSE]
                                  SYSC3310   SYSC3320
          ```
        ]
      ]
    ]
  ]

  #v(0.4em)
  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
        #text(size: 12pt)[
          *AND node:* \
          Everything under it must be true
        ]
      ],
      [
        #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
          #text(size: 12pt)[
            *OR node:* \
            You only need ONE of the options
          ]
        ],
      ]
    ]
  )

  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 8pt)[
      #text(size: 12pt)[💡 *Key insight:* Complex rules become simple when drawn as trees!]
    ]
  ]
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

// ============================================================================
// VISUAL AID: Database Table Example
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[How We Store the Tree]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Each row in the table represents one "box" in the tree]
  #v(0.4em)

  #align(center)[
    #table(
      columns: (0.5fr, 0.8fr, 1fr, 0.8fr, 0.8fr),
      stroke: 0.5pt + rgb("#ddd"),
      inset: 6pt,
      fill: (col, row) => if row == 0 { rgb("#bf112b") } else if row == 1 { rgb("#e8f4fc") } else { white },
      align: center + horizon,
      text(fill: white, weight: "bold", size: 10pt)[id],
      text(fill: white, weight: "bold", size: 10pt)[nodeType],
      text(fill: white, weight: "bold", size: 10pt)[requiredCourse],
      text(fill: white, weight: "bold", size: 10pt)[parentId],
      text(fill: white, weight: "bold", size: 10pt)[Meaning],
      [node1], [AND], [null], [null], [ROOT - must pass everything],
      [node2], [COURSE], [SYSC3303], [node1], [Need SYSC 3303],
      [node3], [OR], [null], [node1], [Need one of these],
      [node4], [COURSE], [SYSC3310], [node3], [Option A],
      [node5], [COURSE], [SYSC3320], [node3], [Option B],
    )
  ]

  #v(0.5em)
  #text(size: 13pt, fill: rgb("#666666"))[
    *Left side:* The database table rows \
    *Right side:* What each row represents in the tree
  ]
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

// ============================================================================
// VISUAL AID: Expression → Tree Animation
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[From Text to Tree: Step by Step]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[How the parser reads: "SYSC3303 && (SYSC3310 || SYSC3320)"]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr, 1fr),
    gutter: 0.5em,
    [
      #align(center)[
        #rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt, width: 100%)[
          #text(size: 11pt, weight: "bold")[Step 1: Find AND]
          #v(0.3em)
          #text(size: 10pt)[
            `"SYSC3303" && "(SYSC3310 || SYSC3320)"`
          ]
          #v(0.3em)
          #text(size: 10pt)[
            Two parts separated by AND
          ]
        ]
      ],
      [
        #align(center)[
          #rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt, width: 100%)[
            #text(size: 11pt, weight: "bold")[Step 2: Find OR in parentheses]
            #v(0.3em)
            #text(size: 10pt)[
              `"SYSC3310" || "SYSC3320"`
            ]
            #v(0.3em)
            #text(size: 10pt)[
              OR group inside ( )
            ]
          ]
        ]
      ],
      [
        #align(center)[
          #rect(fill: rgb("#e8f4fc"), radius: 6pt, inset: 10pt, width: 100%)[
            #text(size: 11pt, weight: "bold")[Step 3: Build the tree]
            #v(0.3em)
            #text(size: 9pt)[
              ```
                    [AND]
                   /      \
             [COURSE]    [OR]
             SYSC3303   /    \
                      [...]  [...]
              ```
            ]
          ]
        ]
      ]
    ]
  )

  #v(0.5em)
  #align(center)[
    #rect(fill: rgb("#f0f9f0"), radius: 4pt, inset: 12pt, width: 70%)[
      #text(size: 12pt)[
        *Result:* A tree structure the computer can evaluate!
      ]
    ]
  ]
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

// ============================================================================
// VISUAL AID: How Evaluation Works (Step-by-Step Example)
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[How the System Checks Prerequisites]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[Walking through the tree with a student's transcript]
  #v(0.4em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 8pt, inset: 16pt, width: 95%)[
      #grid(
        columns: (1fr, 1fr),
        gutter: 2em,
        [
          #text(size: 12pt, weight: "bold")[Student's Transcript:]
          [],
          #text(size: 11pt)[• SYSC 3303 (completed)],
          #text(size: 11pt)[• SYSC 2006 (completed)],
          #text(size: 11pt)[• MATH 1004 (completed)],
          #text(size: 11pt)[• *Missing: SYSC 3310, SYSC 3320*],
        ]
      )
    ]
  ]

  #v(0.4em)

  #align(center)[
    #rect(fill: rgb("#f5f5f5"), radius: 8pt, inset: 16pt, width: 95%)[
      #text(size: 11pt)[
        #align(center)[
          ```
                    [AND] ← Check: All children must pass
                   /     \
             [✓ SYSC3303]  [OR] ← Check: Any ONE child must pass
                          /    \
                    [✗ SYSC3310] [✗ SYSC3320]

                    RESULT: FAILED (OR group didn't pass)
          ```
        ]
      ]
    ]
  ]

  #v(0.3em)
  #align(center)[
    #rect(fill: rgb("#fff5f5"), radius: 4pt, inset: 10pt)[
      #text(size: 12pt)[
        *Feedback to student:* "You need SYSC 3303 AND (SYSC 3310 OR SYSC 3320) \
        You have SYSC 3303 ✓ \
        You're missing: SYSC 3310 OR SYSC 3320"
      ]
    ]
  ]
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
// VISUAL AID: Before vs After (User Perspective)
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Before vs After: Student Experience]
  #v(0.1em)
  #text(size: 15pt, fill: rgb("#666666"))[What students see with our system vs. the old way]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1.5em,
    [
      #align(center)[
        #rect(fill: rgb("#fff5f5"), radius: 8pt, inset: 16pt, width: 100%)[
          #text(size: 14pt, weight: "bold", fill: rgb("#bf112b"))[OLD WAY]
          #v(0.3em)
          #text(size: 11pt)[
            1. Look up course on calendar \
            2. Read prerequisite text \
            3. Try to register \
            4. *Error:* "Prerequisites not met" \
            #v(0.2em)
            #text(size: 10pt, fill: rgb("#888888"))[
              *But WHICH prerequisite?* \
              *What grade do I need?* \
              *What year standing?*
            ]
          ]
        ]
      ],
      [
        #align(center)[
          #rect(fill: rgb("#f0f9f0"), radius: 8pt, inset: 16pt, width: 100%)[
            #text(size: 14pt, weight: "bold", fill: rgb("#2d7a2d"))[NEW WAY]
            #v(0.3em)
            #text(size: 11pt)[
              1. Select course \
              2. System checks automatically \
              #v(0.2em)
              #text(size: 11pt)[
                *Result:* ✅ PASS \
                or \
                ❌ FAIL: "Missing SYSC 3310 or SYSC 3320"
              ]
              #v(0.2em)
              #text(size: 10pt, fill: rgb("#888888"))[
                *Clear, specific feedback* \
                *Actionable next steps*
              ]
            ]
          ]
        ]
      ]
    ]
  )

  #v(0.4em)
  #align(center)[
    #rect(fill: rgb("#e8f4fc"), radius: 4pt, inset: 10pt)[
      #text(size: 12pt)[
        *Bottom line:* Students know exactly what they need to do next, instead of guessing.
      ]
    ]
  ]
]

// ============================================================================
// SUMMARY SLIDE: Section 2 Key Takeaways
// ============================================================================
#slide[
  #text(size: 26pt, weight: "bold", fill: rgb("#bf112b"))[Section 2: Summary]
  #v(0.2em)
  #text(size: 14pt, fill: rgb("#666666"))[Key concepts and what they enable]
  #v(0.4em)

  #grid(
    columns: (1fr, 1fr),
    gutter: 1em,
    [
      #text(weight: "semibold", size: 14pt)[What We Built]
      #v(0.2em)
      #text(size: 12pt)[
        • Tree-based data model for prerequisites \
        • Parser to convert text expressions to trees \
        • Recursive evaluation algorithm \
        • Grade requirement support \
        • Clear user feedback system
      ],
      [
        #text(weight: "semibold", size: 14pt)[Why It Matters]
        #v(0.2em)
        #text(size: 12pt)[
          • No more guessing about requirements \
          • Automatic validation saves time \
          • Supports complex AND/OR logic \
          • Works for any course in the catalog \
          • Foundation for schedule generation
        ],
      ]
    ]
  )

  #v(0.4em)
  #align(center)[
    #rect(fill: rgb("#fff8e8"), radius: 4pt, inset: 12pt, width: 80%)[
      #text(size: 13pt)[
        *Up next:* Section 3 – How we use this to generate conflict-free schedules
      ]
    ]
  ]
]
