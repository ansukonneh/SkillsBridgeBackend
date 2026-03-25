import sqlite3 from 'sqlite3'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.SQLITE_DIR || join(__dirname, '..', '..', 'data')
const dbPath = process.env.SQLITE_PATH || join(dataDir, 'dev.db')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

let db = null

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

// Wrapper for potential future use; db.exec used inline in init()
// eslint-disable-next-line no-unused-vars -- keep for API consistency
function dbExec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function runMigration() {
  const reqCols = await dbAll("PRAGMA table_info(UniversityRequest)")
  if (!reqCols.some((c) => c.name === 'requestedByEmail')) {
    await dbRun('ALTER TABLE UniversityRequest ADD COLUMN requestedByEmail TEXT')
  }
  let userCols = await dbAll('PRAGMA table_info(User)')
  if (!userCols.some((c) => c.name === 'emailVerified')) {
    await dbRun('ALTER TABLE User ADD COLUMN emailVerified INTEGER NOT NULL DEFAULT 1')
  }
  userCols = await dbAll('PRAGMA table_info(User)')
  if (!userCols.some((c) => c.name === 'verificationToken')) {
    await dbRun('ALTER TABLE User ADD COLUMN verificationToken TEXT')
  }
  userCols = await dbAll('PRAGMA table_info(User)')
  if (!userCols.some((c) => c.name === 'verificationTokenExpires')) {
    await dbRun('ALTER TABLE User ADD COLUMN verificationTokenExpires TEXT')
  }
  userCols = await dbAll('PRAGMA table_info(User)')
  if (!userCols.some((c) => c.name === 'passwordResetToken')) {
    await dbRun('ALTER TABLE User ADD COLUMN passwordResetToken TEXT')
  }
  userCols = await dbAll('PRAGMA table_info(User)')
  if (!userCols.some((c) => c.name === 'passwordResetTokenExpires')) {
    await dbRun('ALTER TABLE User ADD COLUMN passwordResetTokenExpires TEXT')
  }

  // Message table: safe no-op if already exists
  await dbRun(
    `CREATE TABLE IF NOT EXISTS Message (
      id TEXT PRIMARY KEY,
      toUserId TEXT NOT NULL,
      fromName TEXT NOT NULL,
      fromEmail TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      readAt TEXT,
      FOREIGN KEY (toUserId) REFERENCES User(id) ON DELETE CASCADE
    )`
  )
  await dbRun('CREATE INDEX IF NOT EXISTS idx_message_toUserId ON Message(toUserId)')
  await dbRun('CREATE INDEX IF NOT EXISTS idx_message_createdAt ON Message(createdAt)')

  await dbRun(
    `CREATE TABLE IF NOT EXISTS NewsletterSubscriber (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  )
  await dbRun('CREATE INDEX IF NOT EXISTS idx_newsletter_email ON NewsletterSubscriber(email)')
}

export async function init() {
  if (db) return
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) return reject(err)
      db.run('PRAGMA journal_mode = WAL')
      db.run('PRAGMA foreign_keys = ON')
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
      db.exec(schema, async (e) => {
        if (e) return reject(e)
        try {
          await runMigration()
        } catch {
          // Ignore migration errors (e.g. column already exists)
        }
        resolve()
      })
    })
  })
}

export function uuid() {
  return crypto.randomUUID()
}

export function now() {
  return new Date().toISOString()
}

// --- University ---
export async function getUniversities(approvedOnly = true) {
  const sql = approvedOnly
    ? 'SELECT * FROM University WHERE approved = 1 ORDER BY name'
    : 'SELECT * FROM University ORDER BY name'
  return dbAll(sql)
}

export async function getUniversityById(id) {
  return dbGet('SELECT * FROM University WHERE id = ?', [id])
}

export async function getUniversityByName(name) {
  return dbGet('SELECT * FROM University WHERE name = ?', [name])
}

export async function createUniversity(id, name, approved = 1) {
  await dbRun('INSERT INTO University (id, name, approved) VALUES (?, ?, ?)', [id, name, approved])
  return getUniversityById(id)
}

// --- User ---
function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    password: row.password,
    role: row.role,
    bio: row.bio,
    image: row.image,
    contactInfo: row.contactInfo,
    isPublic: !!row.isPublic,
    isSuspended: !!row.isSuspended,
    emailVerified: !!row.emailVerified,
    verificationToken: row.verificationToken,
    verificationTokenExpires: row.verificationTokenExpires,
    passwordResetToken: row.passwordResetToken,
    passwordResetTokenExpires: row.passwordResetTokenExpires,
    universityId: row.universityId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getUserById(id) {
  const user = await dbGet('SELECT * FROM User WHERE id = ?', [id])
  return user ? rowToUser(user) : null
}

export async function getUserByEmail(email) {
  const user = await dbGet('SELECT * FROM User WHERE email = ?', [email])
  return user ? rowToUser(user) : null
}

export async function deleteUserById(id) {
  await dbRun('DELETE FROM User WHERE id = ?', [id])
}

export async function createUser(data) {
  const id = uuid()
  const nowStr = now()
  await dbRun(
    `INSERT INTO User (id, fullName, email, password, role, bio, image, contactInfo, isPublic, isSuspended, emailVerified, verificationToken, verificationTokenExpires, passwordResetToken, passwordResetTokenExpires, universityId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.fullName,
      data.email,
      data.password,
      data.role ?? 'student',
      data.bio ?? null,
      data.image ?? null,
      data.contactInfo ?? null,
      data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : 1,
      data.isSuspended !== undefined ? (data.isSuspended ? 1 : 0) : 0,
      data.emailVerified !== undefined ? (data.emailVerified ? 1 : 0) : 0,
      data.verificationToken ?? null,
      data.verificationTokenExpires ?? null,
      data.passwordResetToken ?? null,
      data.passwordResetTokenExpires ?? null,
      data.universityId,
      nowStr,
      nowStr,
    ]
  )
  return getUserById(id)
}

export async function updateUser(id, data) {
  const allowed = [
    'fullName',
    'bio',
    'image',
    'contactInfo',
    'isPublic',
    'isSuspended',
    'emailVerified',
    'verificationToken',
    'verificationTokenExpires',
    'passwordResetToken',
    'passwordResetTokenExpires',
    'role',
    'password',
  ]
  const updates = []
  const values = []
  for (const key of allowed) {
    if (data[key] === undefined) continue
    if (key === 'isPublic' || key === 'isSuspended' || key === 'emailVerified') {
      updates.push(`${key} = ?`)
      values.push(data[key] ? 1 : 0)
    } else {
      updates.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (updates.length === 0) return getUserById(id)
  updates.push('updatedAt = ?')
  values.push(now())
  values.push(id)
  await dbRun(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`, values)
  return getUserById(id)
}

export async function getUserWithUniversity(id) {
  const user = await getUserById(id)
  if (!user) return null
  const university = await getUniversityById(user.universityId)
  return { ...user, university: university || null }
}

export async function getUserByVerificationToken(token) {
  const row = await dbGet('SELECT * FROM User WHERE verificationToken = ? AND verificationTokenExpires > ?', [token, now()])
  return row ? rowToUser(row) : null
}

export async function getUserByPasswordResetToken(token) {
  const row = await dbGet(
    'SELECT * FROM User WHERE passwordResetToken = ? AND passwordResetTokenExpires > ?',
    [token, now()]
  )
  return row ? rowToUser(row) : null
}

export async function getUserByEmailWithUniversity(email) {
  const user = await getUserByEmail(email)
  if (!user) return null
  const university = await getUniversityById(user.universityId)
  return { ...user, university: university || null }
}

export async function getUserProfile(userId) {
  const user = await getUserById(userId)
  if (!user) return null
  const university = await getUniversityById(user.universityId)
  const skills = await getUserSkills(userId)
  const projects = await getProjectsByUserId(userId)
  return {
    ...user,
    university: university || null,
    skills: skills.map((s) => s.name),
    projects,
  }
}

// --- UniversityRequest ---
export async function getUniversityRequests(pendingOnly = true) {
  const sql = pendingOnly
    ? "SELECT * FROM UniversityRequest WHERE status = 'pending' ORDER BY createdAt DESC"
    : 'SELECT * FROM UniversityRequest ORDER BY createdAt DESC'
  return dbAll(sql)
}

export async function getUniversityRequestById(id) {
  return dbGet('SELECT * FROM UniversityRequest WHERE id = ?', [id])
}

export async function getUsersByRole(role) {
  const rows = await dbAll('SELECT * FROM User WHERE role = ? ORDER BY createdAt DESC', [role])
  return rows.map(rowToUser)
}

export async function createUniversityRequest(id, requestedName, requestedById, requestedByEmail) {
  await dbRun(
    'INSERT INTO UniversityRequest (id, requestedName, status, requestedById, requestedByEmail) VALUES (?, ?, ?, ?, ?)',
    [id, requestedName, 'pending', requestedById, requestedByEmail || null]
  )
  return getUniversityRequestById(id)
}

export async function updateUniversityRequest(id, status, reviewedById = null) {
  await dbRun('UPDATE UniversityRequest SET status = ?, reviewedById = ? WHERE id = ?', [status, reviewedById, id])
  return getUniversityRequestById(id)
}

// --- Project ---
function rowToProject(row) {
  return row
    ? {
        id: row.id,
        title: row.title,
        description: row.description,
        technologies: row.technologies,
        links: row.links,
        userId: row.userId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }
    : null
}

export async function getProjectsByUserId(userId) {
  const rows = await dbAll('SELECT * FROM Project WHERE userId = ? ORDER BY updatedAt DESC', [userId])
  return rows.map(rowToProject)
}

export async function getProjectById(id) {
  const row = await dbGet('SELECT * FROM Project WHERE id = ?', [id])
  return rowToProject(row)
}

export async function createProject(data) {
  const id = uuid()
  const nowStr = now()
  const tech = typeof data.technologies === 'string' ? data.technologies : JSON.stringify(data.technologies || [])
  const links = typeof data.links === 'string' ? data.links : JSON.stringify(data.links || [])
  await dbRun(
    'INSERT INTO Project (id, title, description, technologies, links, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, data.title, data.description ?? '', tech, links, data.userId, nowStr, nowStr]
  )
  return getProjectById(id)
}

export async function updateProject(id, data) {
  const updates = []
  const values = []
  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.technologies !== undefined) {
    updates.push('technologies = ?')
    values.push(typeof data.technologies === 'string' ? data.technologies : JSON.stringify(data.technologies))
  }
  if (data.links !== undefined) {
    updates.push('links = ?')
    values.push(typeof data.links === 'string' ? data.links : JSON.stringify(data.links))
  }
  if (updates.length === 0) return getProjectById(id)
  updates.push('updatedAt = ?')
  values.push(now())
  values.push(id)
  await dbRun(`UPDATE Project SET ${updates.join(', ')} WHERE id = ?`, values)
  return getProjectById(id)
}

export async function deleteProject(id) {
  await dbRun('DELETE FROM Project WHERE id = ?', [id])
}

// --- Skill ---
export async function getSkillById(id) {
  return dbGet('SELECT * FROM Skill WHERE id = ?', [id])
}

export async function getSkillByName(name) {
  return dbGet('SELECT * FROM Skill WHERE name = ?', [name])
}

export async function createSkill(id, name) {
  await dbRun('INSERT INTO Skill (id, name) VALUES (?, ?)', [id, name])
  return getSkillById(id)
}

export async function getOrCreateSkillByName(name) {
  let s = await getSkillByName(name)
  if (!s) {
    await createSkill(uuid(), name)
    s = await getSkillByName(name)
  }
  return s
}

// --- UserSkill ---
export async function getUserSkills(userId) {
  return dbAll(
    'SELECT s.id, s.name FROM Skill s INNER JOIN UserSkill us ON us.skillId = s.id WHERE us.userId = ?',
    [userId]
  )
}

export async function setUserSkills(userId, skillNames) {
  await dbRun('DELETE FROM UserSkill WHERE userId = ?', [userId])
  const names = [...new Set((skillNames || []).filter(Boolean).map((s) => String(s).trim()))]
  for (const name of names) {
    const skill = await getOrCreateSkillByName(name)
    if (skill) {
      await dbRun('INSERT OR IGNORE INTO UserSkill (userId, skillId) VALUES (?, ?)', [userId, skill.id])
    }
  }
  const updated = await getUserSkills(userId)
  return updated.map((s) => s.name)
}

export async function deleteUserSkillsByUserId(userId) {
  await dbRun('DELETE FROM UserSkill WHERE userId = ?', [userId])
}

// --- Explore ---
export async function getPublicStudents({ universityId, skill, sort = 'newest', limit = 10, offset = 0 }) {
  let where = "u.role = 'student' AND u.isPublic = 1 AND u.isSuspended = 0"
  const params = []
  if (universityId) {
    where += ' AND u.universityId = ?'
    params.push(universityId)
  }
  if (skill) {
    where += ' AND EXISTS (SELECT 1 FROM UserSkill us JOIN Skill s ON us.skillId = s.id WHERE us.userId = u.id AND s.name LIKE ?)'
    params.push('%' + skill + '%')
  }
  const countSql = `SELECT COUNT(*) AS total FROM User u WHERE ${where}`
  const countRow = await dbGet(countSql, params)
  const total = countRow?.total ?? 0
  const orderBy = (() => {
    switch (String(sort || '').toLowerCase()) {
      case 'name_asc':
        return 'u.fullName ASC, u.updatedAt DESC'
      case 'name_desc':
        return 'u.fullName DESC, u.updatedAt DESC'
      case 'oldest':
        return 'u.updatedAt ASC'
      case 'newest':
      default:
        return 'u.updatedAt DESC'
    }
  })()
  const sql = `SELECT u.id FROM User u WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  const rows = await dbAll(sql, [...params, limit, offset])
  const students = []
  for (const r of rows) {
    const u = await getUserProfile(r.id)
    if (u) students.push(u)
  }
  return { students, total }
}

// --- Analytics ---
export async function getAnalyticsSummary() {
  const totalStudentsRow = await dbGet("SELECT COUNT(*) AS total FROM User WHERE role = 'student'")
  const totalPublicRow = await dbGet(
    "SELECT COUNT(*) AS total FROM User WHERE role = 'student' AND isPublic = 1 AND isSuspended = 0"
  )
  const totalUniversitiesRow = await dbGet('SELECT COUNT(*) AS total FROM University', [])
  const topSkillsRows = await dbAll(
    `SELECT s.name, COUNT(*) AS count
     FROM UserSkill us
     JOIN Skill s ON us.skillId = s.id
     GROUP BY s.id, s.name
     ORDER BY count DESC
     LIMIT 10`
  )
  return {
    totalStudents: totalStudentsRow?.total ?? 0,
    totalPublicProfiles: totalPublicRow?.total ?? 0,
    totalUniversities: totalUniversitiesRow?.total ?? 0,
    topSkills: topSkillsRows.map((r) => ({ name: r.name, count: r.count })),
  }
}

// --- Messaging ---
function rowToMessage(row) {
  if (!row) return null
  return {
    id: row.id,
    toUserId: row.toUserId,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    subject: row.subject,
    body: row.body,
    createdAt: row.createdAt,
    readAt: row.readAt,
  }
}

export async function createMessage({ toUserId, fromName, fromEmail, subject, body }) {
  const id = uuid()
  const createdAt = now()
  await dbRun(
    'INSERT INTO Message (id, toUserId, fromName, fromEmail, subject, body, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, toUserId, fromName, fromEmail, subject || null, body, createdAt]
  )
  const row = await dbGet('SELECT * FROM Message WHERE id = ?', [id])
  return rowToMessage(row)
}

export async function getInboxMessages(toUserId, { limit = 50, offset = 0 } = {}) {
  const rows = await dbAll(
    'SELECT * FROM Message WHERE toUserId = ? ORDER BY datetime(createdAt) DESC LIMIT ? OFFSET ?',
    [toUserId, limit, offset]
  )
  return rows.map(rowToMessage)
}

export async function markMessageRead(toUserId, messageId) {
  const msg = await dbGet('SELECT * FROM Message WHERE id = ? AND toUserId = ?', [messageId, toUserId])
  if (!msg) return null
  if (!msg.readAt) {
    await dbRun('UPDATE Message SET readAt = ? WHERE id = ? AND toUserId = ?', [now(), messageId, toUserId])
  }
  const row = await dbGet('SELECT * FROM Message WHERE id = ?', [messageId])
  return rowToMessage(row)
}

// --- Newsletter ---
export async function createNewsletterSubscriber(email) {
  const id = uuid()
  const createdAt = now()
  await dbRun('INSERT OR IGNORE INTO NewsletterSubscriber (id, email, createdAt) VALUES (?, ?, ?)', [
    id,
    email,
    createdAt,
  ])
  const row = await dbGet('SELECT * FROM NewsletterSubscriber WHERE email = ?', [email])
  return row || null
}

export async function getNewsletterSubscriberByEmail(email) {
  if (!email) return null
  const row = await dbGet('SELECT * FROM NewsletterSubscriber WHERE email = ?', [email])
  return row || null
}
