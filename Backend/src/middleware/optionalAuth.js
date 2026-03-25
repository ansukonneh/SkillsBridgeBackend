import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { getUserWithUniversity } from '../db/index.js'

export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) return next()
    const token = auth.slice(7)
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await getUserWithUniversity(decoded.userId)
    if (user && !user.isSuspended) req.user = user
  } catch {
    // Token invalid or expired — proceed without auth
  }
  next()
}
