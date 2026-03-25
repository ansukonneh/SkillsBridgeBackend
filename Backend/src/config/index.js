const required = (key) => {
  const v = process.env[key]
  if (v === undefined || v === '') throw new Error('Missing env: ' + key)
  return v
}

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: isProduction ? required('JWT_SECRET') : (process.env.JWT_SECRET || 'dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  rateLimitAuth: { windowMs: 15 * 60 * 1000, max: 10 },
}
