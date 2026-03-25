-- SkillsBridge SQLite schema

CREATE TABLE IF NOT EXISTS University (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  approved INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  bio TEXT,
  image TEXT,
  contactInfo TEXT,
  isPublic INTEGER NOT NULL DEFAULT 1,
  isSuspended INTEGER NOT NULL DEFAULT 0,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  verificationToken TEXT,
  verificationTokenExpires TEXT,
  passwordResetToken TEXT,
  passwordResetTokenExpires TEXT,
  universityId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (universityId) REFERENCES University(id)
);
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_universityId ON User(universityId);
CREATE INDEX IF NOT EXISTS idx_user_isPublic ON User(isPublic);
CREATE INDEX IF NOT EXISTS idx_user_isSuspended ON User(isSuspended);

CREATE TABLE IF NOT EXISTS UniversityRequest (
  id TEXT PRIMARY KEY,
  requestedName TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requestedById TEXT,
  requestedByEmail TEXT,
  reviewedById TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (requestedById) REFERENCES User(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Project (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT NOT NULL DEFAULT '[]',
  links TEXT NOT NULL DEFAULT '[]',
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Skill (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS UserSkill (
  userId TEXT NOT NULL,
  skillId TEXT NOT NULL,
  PRIMARY KEY (userId, skillId),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (skillId) REFERENCES Skill(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_userSkill_userId ON UserSkill(userId);
CREATE INDEX IF NOT EXISTS idx_userSkill_skillId ON UserSkill(skillId);

CREATE TABLE IF NOT EXISTS Message (
  id TEXT PRIMARY KEY,
  toUserId TEXT NOT NULL,
  fromName TEXT NOT NULL,
  fromEmail TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  readAt TEXT,
  FOREIGN KEY (toUserId) REFERENCES User(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_message_toUserId ON Message(toUserId);
CREATE INDEX IF NOT EXISTS idx_message_createdAt ON Message(createdAt);

CREATE TABLE IF NOT EXISTS NewsletterSubscriber (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON NewsletterSubscriber(email);
