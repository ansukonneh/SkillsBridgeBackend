import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'

export async function list(req, res, next) {
  try {
    const list = await db.getUniversities(true)
    return success(res, list)
  } catch (e) { next(e) }
}

export async function create(req, res, next) {
  try {
    const { name } = req.body
    const all = await db.getUniversities(false)
    if (all.some((u) => u.name.toLowerCase() === String(name).toLowerCase())) return error(res, 'University already exists', 400)
    const university = await db.createUniversity(db.uuid(), name, 1)
    return success(res, university, 201)
  } catch (e) { next(e) }
}

export async function requestUniversity(req, res, next) {
  try {
    const { universityName, requesterEmail } = req.body
    const all = await db.getUniversities(false)
    const found = all.find((u) => u.name.toLowerCase() === String(universityName).toLowerCase())
    if (found) return error(res, 'University already exists', 400)
    const pending = await db.getUniversityRequests(true)
    if (pending.some((r) => r.requestedName.toLowerCase() === String(universityName).toLowerCase())) return error(res, 'Request already pending', 400)

    const userId = req.user?.id || null
    const email = requesterEmail || req.user?.email || null
    const request = await db.createUniversityRequest(db.uuid(), universityName, userId, email)
    return success(res, { id: request.id, status: 'pending' }, 201)
  } catch (e) { next(e) }
}
