import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadRoot = join(__dirname, '..', '..', 'uploads')
const projectDir = join(uploadRoot, 'projects')
const avatarDir = join(uploadRoot, 'avatars')

if (!existsSync(uploadRoot)) mkdirSync(uploadRoot, { recursive: true })
if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true })
if (!existsSync(avatarDir)) mkdirSync(avatarDir, { recursive: true })

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']

function fileFilter(req, file, cb) {
  const mimeOk = ALLOWED_MIMES.includes(file.mimetype)
  const ext = file.originalname && file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
  const extOk = ext && ALLOWED_EXTENSIONS.includes(ext)
  if (mimeOk && extOk) {
    cb(null, true)
  } else {
    const err = new Error('Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) and PDF.')
    err.statusCode = 400
    cb(err, false)
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, projectDir)
  },
  filename: (req, file, cb) => {
    const projectId = req.params.id || req.params.projectId || 'project'
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${projectId}-${unique}-${safeName}`)
  },
})

export const projectUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter,
})

const AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

function avatarFileFilter(_req, file, cb) {
  const mimeOk = AVATAR_MIMES.includes(file.mimetype)
  const ext = file.originalname && file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
  const extOk = ext && AVATAR_EXTENSIONS.includes(ext)
  if (mimeOk && extOk) cb(null, true)
  else {
    const err = new Error('Invalid avatar file type. Allowed: JPEG, PNG, GIF, WebP.')
    err.statusCode = 400
    cb(err, false)
  }
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'user'
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${userId}-${unique}-${safeName}`)
  },
})

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB (supports 18MB)
  fileFilter: avatarFileFilter,
})

