/*
 * API endpoints for uploading and parsing Carleton academic audit files.
 * Supports both HTML and PDF formats.
 */

import { Router, Request, Response } from 'express'
import multer from 'multer'
import { prisma } from '../index'
import { parseAuditHTML, parseAuditPDF, saveStudentAuditData } from '../../cli/audit-parser'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

    // Save to database
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
    const { getRemainingCourses } = require('../../cli/audit-parser')
    const remainingCourses = getRemainingCourses(auditData)
    
    res.json({
      studentId: auditData.studentId,
      studentName: auditData.name,
      program: auditData.program,
      completedCourses: auditData.completedCourses,
      currentCourses: auditData.currentCourses,
      remainingCourses: remainingCourses,
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

export default router
