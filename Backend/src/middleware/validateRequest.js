/**
 * Validate req.body with Zod schema. On failure respond 400 and return.
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (result.success) {
      req.body = result.data
      return next()
    }
    const first = result.error.errors[0]
    const message = first ? `${first.path.join('.')}: ${first.message}` : 'Validation failed'
    return res.status(400).json({ success: false, message })
  }
}
