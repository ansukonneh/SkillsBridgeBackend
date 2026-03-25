import * as db from '../db/index.js'
import { success, error } from '../utils/response.js'

function jsonField(str) {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

function toProjectDto(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    technologies: jsonField(p.technologies),
    links: jsonField(p.links),
    userId: p.userId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export async function create(req, res, next) {
  try {
    const { title, description, technologies, links } = req.body
    const project = await db.createProject({
      userId: req.user.id,
      title,
      description: description || '',
      technologies: technologies || [],
      links: links || [],
    })
    return success(res, toProjectDto(project), 201)
  } catch (e) { next(e) }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params
    const project = await db.getProjectById(id)
    if (!project || project.userId !== req.user.id) return error(res, 'Project not found', 404)
    const { title, description, technologies, links } = req.body
    const data = { id }
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (technologies !== undefined) data.technologies = technologies
    if (links !== undefined) data.links = links
    const updated = await db.updateProject(id, data)
    return success(res, toProjectDto(updated))
  } catch (e) { next(e) }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params
    const project = await db.getProjectById(id)
    if (!project || project.userId !== req.user.id) return error(res, 'Project not found', 404)
    await db.deleteProject(id)
    return success(res, { deleted: true })
  } catch (e) { next(e) }
}

export async function getByUser(req, res, next) {
  try {
    const { userId } = req.params
    if (userId !== req.user.id) return error(res, 'Forbidden', 403)
    const projects = await db.getProjectsByUserId(userId)
    return success(res, projects.map(toProjectDto))
  } catch (e) { next(e) }
}

export async function uploadFile(req, res, next) {
  try {
    const { id } = req.params
    const project = await db.getProjectById(id)
    if (!project || project.userId !== req.user.id) return error(res, 'Project not found', 404)
    if (!req.file) return error(res, 'No file uploaded', 400)
    const publicUrl = `/uploads/projects/${req.file.filename}`
    let links = []
    try {
      links = jsonField(project.links)
    } catch {
      links = []
    }
    links.push({ label: req.file.originalname, url: publicUrl })
    const updated = await db.updateProject(id, { links })
    return success(res, toProjectDto(updated))
  } catch (e) { next(e) }
}
