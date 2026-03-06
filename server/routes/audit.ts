/*
 * API endpoints for uploading and parsing Carleton academic audit files.
 * Supports both HTML and PDF formats.
 */

import { Router, Request, Response } from 'express'
import multer from 'multer'
import { prisma } from '../index'
import { parseAuditHTML, parseAuditPDF, saveStudentAuditData, getUnfulfilledRequirements, getRemainingCourses, getElectiveRequirements } from '../../cli/audit-parser'
import { expandElectiveCategories, ELECTIVE_CATEGORIES } from '../../cli/elective-mappings'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import crypto from 'crypto'

const execAsync = promisify(exec)

const router = Router()

// File upload configuration - store files in memory temporarily
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/html', 'application/pdf', 'text/plain']
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.html')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only HTML and PDF files are allowed.'))
    }
  }
})

// Upload endpoint - saves parsed audit data to database
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded'
      })
    }

    let auditData

    // Check if file is PDF
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      // Convert PDF to text (using -layout flag to preserve column alignment)
      const tmpDir = os.tmpdir()
      const tmpPdfPath = path.join(tmpDir, `audit-${Date.now()}.pdf`)
      const tmpTxtPath = tmpPdfPath.replace('.pdf', '.txt')
      
      try {
        fs.writeFileSync(tmpPdfPath, req.file.buffer)
        await execAsync(`pdftotext -layout "${tmpPdfPath}" "${tmpTxtPath}"`)
        const pdfText = fs.readFileSync(tmpTxtPath, 'utf-8')
        
        // Delete temp files
        fs.unlinkSync(tmpPdfPath)
        fs.unlinkSync(tmpTxtPath)
        
        auditData = parseAuditPDF(pdfText)
      } catch (error) {
        // Delete temp files even if parsing fails
        if (fs.existsSync(tmpPdfPath)) fs.unlinkSync(tmpPdfPath)
        if (fs.existsSync(tmpTxtPath)) fs.unlinkSync(tmpTxtPath)
        throw error
      }
    } else {
      // HTML format
      const fileContent = req.file.buffer.toString('utf-8')
      auditData = parseAuditHTML(fileContent)
    }
    
    if (!auditData.studentId) {
      return res.status(400).json({
        error: 'Parse Error',
        message: 'Could not extract student ID from file'
      })
    }

    // Check that all extracted courses actually exist in our database
    const validCourses: Array<{ courseId: string; grade: string }> = []
    const invalidCourses: string[] = []
    
    for (const completion of auditData.completedCourses) {
      const course = await prisma.course.findUnique({
        where: { id: completion.courseId }
      })
      
      if (course) {
        validCourses.push(completion)
      } else {
        invalidCourses.push(completion.courseId)
      }
    }

    // Generate hash for deduplication
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')

    // Save student data
    await saveStudentAuditData({
      ...auditData,
      completedCourses: validCourses
    })

    // Store the raw audit file for the team if not a duplicate for this student
    const dbStudent = await prisma.student.findUnique({
      where: { studentId: auditData.studentId }
    })

    if (dbStudent) {
      const existingAudit = await prisma.savedAudit.findUnique({
        where: {
          studentId_fileHash: {
            studentId: dbStudent.id,
            fileHash: fileHash
          }
        }
      })

      if (!existingAudit) {
        await prisma.savedAudit.create({
          data: {
            studentId: dbStudent.id,
            fileName: req.file.originalname,
            fileHash: fileHash,
            content: req.file.mimetype === 'application/pdf' ? 'PDF_CONTENT_STORED_IN_FILESYSTEM_OR_BLOB' : req.file.buffer.toString('utf-8')
          }
        })
      }
    }

    res.json({
      success: true,
      studentId: auditData.studentId,
      studentName: auditData.name,
      program: auditData.program,
      coursesImported: validCourses.length,
      coursesSkipped: invalidCourses.length,
      invalidCourses: invalidCourses,
      message: `Successfully imported ${validCourses.length} courses`
    })
  } catch (error) {
    console.error('Audit upload error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to process audit file'
    })
  }
})

/**
 * POST /api/audit/parse
 * Parse audit file without saving (preview mode)
 * 
 * Use Case: Allow users to review parsed data before confirming import
 * Supports both HTML and PDF formats
 */
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded'
      })
    }

    let auditData

    // Check if file is PDF
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      // Convert PDF to text (using -layout flag to preserve column alignment)
      const tmpDir = os.tmpdir()
      const tmpPdfPath = path.join(tmpDir, `audit-${Date.now()}.pdf`)
      const tmpTxtPath = tmpPdfPath.replace('.pdf', '.txt')
      
      try {
        fs.writeFileSync(tmpPdfPath, req.file.buffer)
        await execAsync(`pdftotext -layout "${tmpPdfPath}" "${tmpTxtPath}"`)
        const pdfText = fs.readFileSync(tmpTxtPath, 'utf-8')
        
        // Delete temp files
        fs.unlinkSync(tmpPdfPath)
        fs.unlinkSync(tmpTxtPath)
        
        auditData = parseAuditPDF(pdfText)
      } catch (error) {
        // Delete temp files even if parsing fails
        if (fs.existsSync(tmpPdfPath)) fs.unlinkSync(tmpPdfPath)
        if (fs.existsSync(tmpTxtPath)) fs.unlinkSync(tmpTxtPath)
        throw error
      }
    } else {
      // HTML format
      const fileContent = req.file.buffer.toString('utf-8')
      auditData = parseAuditHTML(fileContent)
    }

    // Figure out which required courses the student still needs
    const remainingCourses = getRemainingCourses(auditData)
    
    // Extract structured elective requirements (categories with available options)
    const electiveRequirements = getElectiveRequirements(auditData)
    
    res.json({
      studentId: auditData.studentId,
      studentName: auditData.name,
      program: auditData.program,
      completedCourses: auditData.completedCourses,
      currentCourses: auditData.currentCourses,
      remainingCourses: remainingCourses,
      electiveRequirements: electiveRequirements,
      requirements: auditData.requirements,
      completedCount: auditData.completedCourses.length,
      currentCount: auditData.currentCourses.length,
      remainingCount: remainingCourses.length
    })
  } catch (error) {
    console.error('Audit parse error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to parse audit file'
    })
  }
})

/**
 * POST /api/audit/suggest-courses
 * Suggest courses based on parsed audit data
 * 
 * Takes audit data (from /parse endpoint) and returns courses that:
 * 1. Satisfy unfulfilled requirements
 * 2. Have sections available in the database
 * 3. Prerequisites are met based on completed courses
 * 
 * Body:
 * - remainingCourses: Array of course IDs from audit parsing
 * - completedCourses: Array of {courseId, grade} from audit
 * - maxSuggestions: Optional limit (default 20)
 */
router.post('/suggest-courses', async (req: Request, res: Response) => {
  try {
    const { remainingCourses, completedCourses, maxSuggestions = 20 } = req.body

    if (!remainingCourses || !Array.isArray(remainingCourses)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'remainingCourses array is required'
      })
    }

    const completedIds = (completedCourses || []).map((c: any) => 
      typeof c === 'string' ? c.toUpperCase() : c.courseId?.toUpperCase()
    ).filter(Boolean)

    // Find which remaining courses actually exist in our database with sections
    const coursesWithSections = await prisma.course.findMany({
      where: {
        id: { in: remainingCourses.map((c: string) => c.toUpperCase()) },
        sections: { some: {} } // Must have at least one section
      },
      include: {
        prerequisiteNodes: {
          where: { nodeType: 'COURSE' },
          select: { requiredCourseId: true }
        },
        _count: {
          select: { sections: true }
        }
      }
    })

    // Helper to check if prerequisites are met
    const arePrerequisitesMet = (prerequisites: string[]): boolean => {
      if (prerequisites.length === 0) return true
      return prerequisites.every(prereq => completedIds.includes(prereq.toUpperCase()))
    }

    // Filter and rank suggestions
    const suggestions = coursesWithSections
      .map(course => {
        const prerequisites = course.prerequisiteNodes
          .filter(node => node.requiredCourseId)
          .map(node => node.requiredCourseId as string)

        const prereqsMet = arePrerequisitesMet(prerequisites)
        const missingPrereqs = prereqsMet ? [] : 
          prerequisites.filter(p => !completedIds.includes(p.toUpperCase()))

        return {
          code: course.id,
          name: course.title || 'No title available',
          credits: course.credits || 0.5,
          description: course.description || '',
          prerequisites,
          prereqsMet,
          missingPrereqs,
          sectionCount: course._count.sections,
          // Score: prioritize courses with prereqs met and more sections available
          score: (prereqsMet ? 100 : 0) + course._count.sections
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)

    // Separate into ready-to-take and needs-prereqs
    const readyToTake = suggestions.filter(s => s.prereqsMet)
    const needsPrereqs = suggestions.filter(s => !s.prereqsMet)

    res.json({
      suggestions,
      readyToTake,
      needsPrereqs,
      totalFound: coursesWithSections.length,
      totalRequested: remainingCourses.length,
      coursesNotInDatabase: remainingCourses.filter(
        (c: string) => !coursesWithSections.some(cs => cs.id === c.toUpperCase())
      )
    })
  } catch (error) {
    console.error('Suggest courses error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to suggest courses'
    })
  }
})

export default router
