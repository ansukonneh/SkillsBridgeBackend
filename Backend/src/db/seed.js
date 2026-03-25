import 'dotenv/config'
import bcrypt from 'bcrypt'
import * as db from './index.js'

const config = { bcryptRounds: 10 }

async function seed() {
  await db.init()

  const universities = [
    (await db.getUniversityByName('African Methodist Episcopal University')) || (await db.createUniversity(db.uuid(), 'African Methodist Episcopal University', 1)),
    (await db.getUniversityByName('Starz University')) || (await db.createUniversity(db.uuid(), 'Starz University', 1)),
    (await db.getUniversityByName('Bluecrest University College')) || (await db.createUniversity(db.uuid(), 'Bluecrest University College', 1)),
  ]
  const ame = universities.find((u) => u.name === 'African Methodist Episcopal University') || universities[0]

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (adminEmail && adminPassword) {
    if (!(await db.getUserByEmail(adminEmail))) {
      const adminHash = await bcrypt.hash(adminPassword, config.bcryptRounds)
      await db.createUser({
        fullName: 'Admin',
        email: adminEmail,
        password: adminHash,
        role: 'admin',
        universityId: ame.id,
        emailVerified: true,
      })
      console.log(`Created admin user: ${adminEmail}`)
    } else {
      console.log(`Admin user ${adminEmail} already exists`)
    }
  } else {
    console.log('Skipping admin creation: set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create an admin')
  }

  const hash = await bcrypt.hash('password123', config.bcryptRounds)

  const existingTestUser = await db.getUserByEmail('student@test.com')
  if (!existingTestUser) {
    await db.createUser({
      fullName: 'Test Admin',
      email: 'student@test.com',
      password: hash,
      role: 'admin',
      universityId: ame.id,
      isPublic: true,
      emailVerified: true,
    })
    console.log('Created student@test.com (admin, password: password123)')
  } else {
    const updates = {}
    if (!existingTestUser.emailVerified) updates.emailVerified = true
    if (existingTestUser.role !== 'admin') updates.role = 'admin'
    if (Object.keys(updates).length) {
      await db.updateUser(existingTestUser.id, updates)
      console.log('Updated student@test.com: admin, email verified for dev use')
    }
  }

  console.log('Seed done')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
