export function globalErrorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'
  if (process.env.NODE_ENV !== 'test') {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Error]', status, message)
    } else {
      console.error('[Error]', err)
    }
  }
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : message,
  })
}
