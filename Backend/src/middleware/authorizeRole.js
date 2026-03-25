/**
 * Use after authenticate. Restrict by role.
 * authorizeRole('admin') => only admin
 * authorizeRole('student', 'admin') => student or admin
 */
export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    next()
  }
}
