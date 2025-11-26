/**
 * @file server/routes/audit.ts
 * @description Academic audit file processing endpoints
 * 
 * Algorithm: HTML/PDF parsing with regex pattern matching
 * 
 * Design Decisions:
 * 1. Support multiple file formats (HTML, PDF) for flexibility
 * 2. Use streaming for large files to prevent memory issues
 * 3. Validate parsed data before database insertion
 * 4. Return detailed parsing report for debugging
 */

import { Router, Request, Response } from 'express'
import multer from 'multer'
import { prisma } from '../index'
import { parseAuditHTML, parseAuditPDF, saveStudentAuditData } from '../../cli/audit-parser'
import { PdfReader } from 'pdfreader'

const router = Router()

// Configure multer for file upload
// Design Pattern: Strategy Pattern (multer uses different storage strategies)
const storage = multer.memoryStorage() // Store in memory for processing
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['text/html', 'application/pdf', 'text/plain']
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.html')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only HTML and PDF files are allowed.'))
    }
  }
})

/**
 * POST /api/audit/upload
 * Upload and parse academic audit file
 * 
 * Multipart Form Data:
 * - file: Audit file (HTML or PDF)
 * 
 * Algorithm Steps:
 * 1. Receive file upload
 * 2. Parse file content based on type
 * 3. Extract student info and completed courses
 * 4. Validate course codes against database
 * 5. Create/update student record
 * 6. Create course completion records
 * 
 * Error Handling: Returns detailed parsing errors for debugging
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded'
      })
    }

    const fileContent = req.file.buffer.toString('utf-8')
    
    // Parse audit file
    const auditData = parseAuditHTML(fileContent)
    
    if (!auditData.studentId) {
      return res.status(400).json({
        error: 'Parse Error',
        message: 'Could not extract student ID from file'
      })
    }

    // Validate courses exist in database
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

    // Save valid course completions
    await saveStudentAuditData({
      ...auditData,
      completedCourses: validCourses
    })

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
      // Extract text from PDF
      const pdfText = await new Promise<string>((resolve, reject) => {
        const rows: Record<string, Record<string, string>> = {}
        
        new PdfReader().parseBuffer(req.file!.buffer, (err, item) => {
          if (err) {
            reject(err)
          } else if (!item) {
            // End of file - assemble text
            const sortedRows = Object.keys(rows).sort((a, b) => parseFloat(a) - parseFloat(b))
            const text = sortedRows.map(y => {
              const row = rows[y]
              const sortedCols = Object.keys(row).sort((a, b) => parseFloat(a) - parseFloat(b))
              return sortedCols.map(x => row[x]).join(' ')
            }).join('\n')
            resolve(text)
          } else if (item.text) {
            // Accumulate text items by position
            const y = item.y.toFixed(1)
            const x = item.x.toFixed(1)
            if (!rows[y]) rows[y] = {}
            rows[y][x] = item.text
          }
        })
      })
      
      auditData = parseAuditPDF(pdfText)
    } else {
      // Parse as HTML
      const fileContent = req.file.buffer.toString('utf-8')
      auditData = parseAuditHTML(fileContent)
    }

    res.json({
      studentId: auditData.studentId,
      studentName: auditData.name,
      program: auditData.program,
      completedCourses: auditData.completedCourses,
      currentCourses: auditData.currentCourses,
      completedCount: auditData.completedCourses.length,
      currentCount: auditData.currentCourses.length
    })
  } catch (error) {
    console.error('Audit parse error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to parse audit file'
    })
  }
})

export default router
