import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'

export async function getUniversityRequests(req, res, next) {
  try {
    const list = await db.getUniversityRequests(true)
    const items = await Promise.all(list.map(async (r) => {
      let email = r.requestedByEmail || null
      if (!email && r.requestedById) {
        const requestedBy = await db.getUserById(r.requestedById)
        email = requestedBy?.email || null
      }
      return {
        id: r.id,
        requestedName: r.requestedName,
        universityName: r.requestedName,
        requesterEmail: email,
        status: r.status,
        createdAt: r.createdAt,
      }
    }))
    return success(res, items)
  } catch (e) { next(e) }
}

export async function patchUniversityRequest(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body
    const request = await db.getUniversityRequestById(id)
    if (!request || request.status !== 'pending') return error(res, 'Request not found', 404)
    if (status === 'approved') {
      const uni = await db.createUniversity(db.uuid(), request.requestedName, 1)
      await db.updateUniversityRequest(id, 'approved', req.user.id)
      return success(res, { approved: true, university: { id: uni.id, name: uni.name } })
    }
    await db.updateUniversityRequest(id, 'rejected', req.user.id)
    return success(res, { rejected: true })
  } catch (e) { next(e) }
}

export async function createUniversity(req, res, next) {
  try {
    const { name } = req.body
    const all = await db.getUniversities(false)
    if (all.some((u) => u.name.toLowerCase() === String(name).toLowerCase())) return error(res, 'University already exists', 400)
    const university = await db.createUniversity(db.uuid(), name, 1)
    return success(res, university, 201)
  } catch (e) { next(e) }
}

export async function suspendUser(req, res, next) {
  try {
    const { id } = req.params
    const user = await db.getUserById(id)
    if (!user) return error(res, 'User not found', 404)
    await db.updateUser(id, { isSuspended: true })
    return success(res, { suspended: true })
  } catch (e) { next(e) }
}

export async function unsuspendUser(req, res, next) {
  try {
    const { id } = req.params
    const user = await db.getUserById(id)
    if (!user) return error(res, 'User not found', 404)
    await db.updateUser(id, { isSuspended: false })
    return success(res, { suspended: false })
  } catch (e) { next(e) }
}

export async function getStudents(req, res, next) {
  try {
    const all = await db.getUsersByRole('student')
    const items = await Promise.all(
      all.map(async (u) => {
        const university = await db.getUniversityById(u.universityId)
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          isSuspended: u.isSuspended,
          university: university?.name,
        }
      })
    )
    return success(res, items)
  } catch (e) { next(e) }
}

export async function getAnalytics(req, res, next) {
  try {
    const summary = await db.getAnalyticsSummary()
    return success(res, summary)
  } catch (e) { next(e) }
}
