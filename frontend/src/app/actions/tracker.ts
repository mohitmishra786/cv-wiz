'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  status: z.enum(["applied", "interviewing", "offer", "rejected"]),
  url: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  salary: z.string().optional(),
  notes: z.string().optional(),
})

export async function getApplications() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createApplication(_prevState: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const validatedFields = ApplicationSchema.safeParse({
    company: formData.get("company"),
    position: formData.get("position"),
    status: formData.get("status"),
    url: formData.get("url"),
    location: formData.get("location"),
    salary: formData.get("salary"),
    notes: formData.get("notes"),
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  try {
    await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        ...validatedFields.data,
      },
    })
    revalidatePath("/tracker")
    return { success: true }
  } catch {
    return { error: "Failed to create application" }
  }
}

export async function updateApplicationStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    // Validate status against schema enum if desired, but string is okay for now if UI controls it
    await prisma.jobApplication.update({
      where: { id, userId: session.user.id },
      data: { status },
    })
    revalidatePath("/tracker")
    return { success: true }
  } catch {
    return { error: "Failed to update status" }
  }
}

export async function deleteApplication(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.jobApplication.delete({
      where: { id, userId: session.user.id },
    })
    revalidatePath("/tracker")
    return { success: true }
  } catch {
    return { error: "Failed to delete application" }
  }
}
