'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export async function createShareLink(snapshot?: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const slug = randomBytes(4).toString("hex") // 8 char slug

  let resumeSnapshot = null
  if (snapshot) {
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
    if (user) {
      resumeSnapshot = {
        name: user.name,
        email: user.email,
        experiences: user.experiences,
        projects: user.projects,
        educations: user.educations,
        skills: user.skills,
        publications: user.publications,
      }
    }
  }

  try {
    const share = await prisma.sharedResume.create({
      data: {
        userId: session.user.id,
        slug,
        snapshot: resumeSnapshot as any,
        isActive: true,
      },
    })
    revalidatePath("/resumes/share")
    return { success: true, url: `/p/${share.slug}` }
  } catch (error) {
    return { error: "Failed to create share link" }
  }
}

export async function toggleShareLink(id: string, isActive: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  await prisma.sharedResume.update({
    where: { id, userId: session.user.id },
    data: { isActive },
  })
  revalidatePath("/resumes/share")
}

export async function getSharedLinks() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.sharedResume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPublicResume(slug: string) {
  const share = await prisma.sharedResume.findUnique({
    where: { slug },
    include: {
        user: {
            select: {
                name: true,
                email: true,
                experiences: true,
                projects: true,
                educations: true,
                skills: true,
                publications: true
            }
        }
    }
  })

  if (!share || !share.isActive) return null

  // Increment view count
  await prisma.sharedResume.update({
    where: { id: share.id },
    data: { views: { increment: 1 } },
  })

  if (share.snapshot) {
    return share.snapshot // Static version
  }

  // Live version
  return {
    ...share.user,
    // Add any formatting if needed
  }
}
