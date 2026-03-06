import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'carleton-secret-key'

/**
 * POST /api/auth/login
 * Simple login for development and testing.
 * Supports a hardcoded test/test user as requested.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Special case for test user
    if (email === 'test' && password === 'test') {
      const token = jwt.sign(
        { userId: 'test-id', email: 'test@carleton.ca', role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '24h' }
      )
      return res.json({
        token,
        user: { id: 'test-id', email: 'test@carleton.ca', name: 'Test User', role: 'ADMIN' }
      })
    }

    // Regular DB user check (optional for now, but implemented)
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error during login' })
  }
})

/**
 * GET /api/auth/me
 * Validate current session token
 */
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // For test user, return mock data
    if (decoded.userId === 'test-id') {
      return res.json({ id: 'test-id', email: 'test@carleton.ca', name: 'Test User', role: 'ADMIN' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
