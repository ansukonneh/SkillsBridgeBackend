import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'

function parseJson(str) {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

function sanitizePublicProfile(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    bio: user.bio,
    image: user.image,
    isPublic: user.isPublic,
    universityId: user.universityId,
    university: user.university ? { id: user.university.id, name: user.university.name } : null,
    skills: (user.skills || []).map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean),
    projects: (user.projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      technologies: parseJson(p.technologies),
      links: parseJson(p.links),
    })),
    contact: user.contactInfo ? parseJson(user.contactInfo) : null,
  }
}

export async function getMeProfileByUserId(req, res, next) {
  if (req.params.userId !== req.user.id) return error(res, 'Forbidden', 403)
  return getMe(req, res, next)
}

export async function getMe(req, res, next) {
  try {
    const user = await db.getUserProfile(req.user.id)
    if (!user) return error(res, 'User not found', 404)
    const profile = { ...sanitizePublicProfile(user), email: user.email, contactInfo: user.contactInfo }
    return success(res, profile)
  } catch (e) { next(e) }
}

export async function putMe(req, res, next) {
  try {
    const { fullName, bio, image, contactInfo, isPublic } = req.body
    const data = {}
    if (fullName !== undefined) data.fullName = fullName
    if (bio !== undefined) data.bio = bio
    if (image !== undefined) data.image = image
    if (contactInfo !== undefined) data.contactInfo = typeof contactInfo === 'string' ? contactInfo : JSON.stringify(contactInfo || {})
    if (isPublic !== undefined) data.isPublic = isPublic
    await db.updateUser(req.user.id, data)
    const user = await db.getUserProfile(req.user.id)
    const profile = { ...sanitizePublicProfile(user), email: user.email, contactInfo: user.contactInfo }
    return success(res, profile)
  } catch (e) { next(e) }
}

export async function patchMeVisibility(req, res, next) {
  try {
    const isPublic = req.body.isPublic === true
    await db.updateUser(req.user.id, { isPublic })
    const user = await db.getUserById(req.user.id)
    return success(res, { isPublic: user.isPublic })
  } catch (e) { next(e) }
}

export async function patchVisibilityByUserId(req, res, next) {
  if (req.params.userId !== req.user.id) return error(res, 'Forbidden', 403)
  req.body = { isPublic: req.body.isPublic }
  return patchMeVisibility(req, res, next)
}

export async function getPublicProfile(req, res, next) {
  try {
    const { id } = req.params
    const user = await db.getUserProfile(id)
    if (!user) return error(res, 'Profile not found', 404)
    if (user.isSuspended || !user.isPublic) return error(res, 'Profile not found', 404)
    return success(res, sanitizePublicProfile(user))
  } catch (e) { next(e) }
}

export async function deleteMe(req, res, next) {
  try {
    await db.deleteUserById(req.user.id)
    return success(res, { message: 'Account deleted' })
  } catch (e) {
    next(e)
  }
}
