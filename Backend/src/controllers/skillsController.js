import * as db from '../db/index.js'
import { success } from '../utils/response.js'

export async function putMySkills(req, res, next) {
  try {
    const { skills } = req.body
    const userId = req.user.id
    const names = [...new Set((skills || []).map((s) => String(s).trim()).filter(Boolean))]
    const updated = await db.setUserSkills(userId, names)
    return success(res, { skills: updated })
  } catch (e) { next(e) }
}
