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

export async function getResumeVersions() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.resumeVersion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
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
