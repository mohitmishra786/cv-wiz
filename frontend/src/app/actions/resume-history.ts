'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { logger } from '@/lib/logger';

export async function createResumeSnapshot(name?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    // Fetch complete profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        experiences: true,
        projects: true,
        educations: true,
        skills: true,
        publications: true,
      },
    })

    if (!user) return { error: "User not found" }

    // Create snapshot payload
    const snapshot = {
      experiences: user.experiences,
      projects: user.projects,
      educations: user.educations,
      skills: user.skills,
      publications: user.publications,
      capturedAt: new Date().toISOString(),
    }

    await prisma.resumeVersion.create({
      data: {
        userId: session.user.id,
        name: name || `Version ${new Date().toLocaleDateString()}`,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath("/resumes/history")
    return { success: true };
  } catch (error) {
    logger.error('[ResumeHistory] Snapshot creation failed', { error });
    return { success: false, error: 'Failed to create snapshot' };
  }
}

/** Default page size for history list — keeps DOM and payload small */
export const HISTORY_PAGE_SIZE = 10
/** Hard cap so a crafted query cannot request unbounded rows */
export const HISTORY_MAX_PAGE_SIZE = 50

export type ResumeVersionListItem = {
  id: string
  name: string | null
  snapshot: Prisma.JsonValue
  createdAt: Date
}

export type PaginatedResumeVersions = {
  versions: ResumeVersionListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Fetch a single page of resume versions for the current user.
 * Server-side pagination prevents loading unbounded history into the DOM.
 */
export async function getResumeVersions(
  page: number = 1,
  limit: number = HISTORY_PAGE_SIZE
): Promise<PaginatedResumeVersions> {
  const session = await auth()
  const safeLimit = Math.min(Math.max(1, limit || HISTORY_PAGE_SIZE), HISTORY_MAX_PAGE_SIZE)
  const safePage = Math.max(1, page || 1)

  if (!session?.user?.id) {
    return {
      versions: [],
      total: 0,
      page: safePage,
      limit: safeLimit,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }

  const userId = session.user.id
  const skip = (safePage - 1) * safeLimit

  const [total, versions] = await Promise.all([
    prisma.resumeVersion.count({ where: { userId } }),
    prisma.resumeVersion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      // Only fields needed for the list UI (still includes snapshot for stats)
      select: {
        id: true,
        name: true,
        snapshot: true,
        createdAt: true,
      },
    }),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit)

  return {
    versions,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  }
}

export async function restoreResumeVersion(versionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId, userId: session.user.id },
  })

  if (!version || !version.snapshot) return { error: "Version not found" }

  const snapshot = version.snapshot as any
  const userId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Clear current profile
      await tx.experience.deleteMany({ where: { userId } })
      await tx.project.deleteMany({ where: { userId } })
      await tx.education.deleteMany({ where: { userId } })
      await tx.skill.deleteMany({ where: { userId } })
      await tx.publication.deleteMany({ where: { userId } })

      // 2. Restore from snapshot
      // We explicitly map fields to avoid issues with IDs or metadata in snapshot
      if (snapshot.experiences?.length) {
        await tx.experience.createMany({

          data: snapshot.experiences.map((e: any) => ({
            userId,
            company: e.company,
            title: e.title,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            current: e.current,
            description: e.description,
            highlights: e.highlights,
            keywords: e.keywords,
          })),
        })
      }

      if (snapshot.projects?.length) {
        await tx.project.createMany({

          data: snapshot.projects.map((p: any) => ({
            userId,
            name: p.name,
            description: p.description,
            url: p.url,
            startDate: p.startDate,
            endDate: p.endDate,
            technologies: p.technologies,
            highlights: p.highlights,
          })),
        })
      }

      if (snapshot.educations?.length) {
        await tx.education.createMany({

          data: snapshot.educations.map((e: any) => ({
            userId,
            institution: e.institution,
            degree: e.degree,
            field: e.field,
            startDate: e.startDate,
            endDate: e.endDate,
            gpa: e.gpa,
            honors: e.honors,
          })),
        })
      }

      if (snapshot.skills?.length) {
        await tx.skill.createMany({

          data: snapshot.skills.map((s: any) => ({
            userId,
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
            yearsExp: s.yearsExp,
          })),
        })
      }

      if (snapshot.publications?.length) {
        await tx.publication.createMany({

          data: snapshot.publications.map((p: any) => ({
            userId,
            title: p.title,
            venue: p.venue,
            authors: p.authors,
            date: p.date,
            url: p.url,
            doi: p.doi,
            abstract: p.abstract,
          })),
        })
      }

      if (snapshot.projects?.length) {
        await tx.project.createMany({
          data: snapshot.projects.map((p: any) => ({
            userId,
            name: p.name,
            description: p.description,
            url: p.url,
            startDate: p.startDate,
            endDate: p.endDate,
            technologies: p.technologies,
            highlights: p.highlights,
          })),
        })
      }

      if (snapshot.educations?.length) {
        await tx.education.createMany({
          data: snapshot.educations.map((e: any) => ({
            userId,
            institution: e.institution,
            degree: e.degree,
            field: e.field,
            startDate: e.startDate,
            endDate: e.endDate,
            gpa: e.gpa,
            honors: e.honors,
          })),
        })
      }

      if (snapshot.skills?.length) {
        await tx.skill.createMany({
          data: snapshot.skills.map((s: any) => ({
            userId,
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
            yearsExp: s.yearsExp,
          })),
        })
      }

      if (snapshot.publications?.length) {
        await tx.publication.createMany({
          data: snapshot.publications.map((p: any) => ({
            userId,
            title: p.title,
            venue: p.venue,
            authors: p.authors,
            date: p.date,
            url: p.url,
            doi: p.doi,
            abstract: p.abstract,
          })),
        })
      }
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Restore error:", error)
    return { error: "Failed to restore version" }
  }
}
