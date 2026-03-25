import * as db from '../db/index.js'
import { success } from '../utils/response.js'

function parseJson(str) {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

export async function getStudents(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const offset = (page - 1) * limit
    const university = req.query.university || null
    const skill = req.query.skill || null
    const sort = req.query.sort || 'newest'
    const { students, total } = await db.getPublicStudents({ universityId: university, skill, sort, limit, offset })
    const totalPages = Math.ceil(total / limit) || 1
    const items = students.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      bio: u.bio,
      image: u.image,
      university: u.university ? { id: u.university.id, name: u.university.name } : null,
      universityId: u.universityId,
      skills: u.skills || [],
      projects: (u.projects || []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        technologies: parseJson(p.technologies),
        links: parseJson(p.links),
      })),
    }))
    return success(res, { students: items, pagination: { total, page, limit, totalPages } })
  } catch (e) { next(e) }
}
