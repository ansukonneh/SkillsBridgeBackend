import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { getUserWithUniversity } from '../db/index.js'

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    const token = auth.slice(7)
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await getUserWithUniversity(decoded.userId)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended' })
    }
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
    next(err)
  }
}
