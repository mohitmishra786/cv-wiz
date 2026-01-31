import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProfileImportSchema = z.object({
  name: z.string().optional(),
  about: z.string().optional(),
  experiences: z.array(z.object({
    company: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startDate: z.string().optional(), // ISO string
    endDate: z.string().optional().nullable(),
    current: z.boolean().optional(),
    location: z.string().optional(),
  })).optional(),
  educations: z.array(z.object({
    school: z.string(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const result = ProfileImportSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error }, { status: 400 });
    }

    const data = result.data;
    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      // Update Name
      if (data.name) {
        await tx.user.update({
          where: { id: userId },
          data: { name: data.name },
        });
      }

      // Import Experiences
      if (data.experiences?.length) {
        for (const exp of data.experiences) {
          await tx.experience.create({
            data: {
              userId,
              company: exp.company,
              title: exp.title,
              description: exp.description || "",
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              current: exp.current || false,
              location: exp.location,
            },
          });
        }
      }

      // Import Educations
      if (data.educations?.length) {
        for (const edu of data.educations) {
          await tx.education.create({
            data: {
              userId,
              institution: edu.school,
              degree: edu.degree || "Degree",
              field: edu.field || "Field",
              startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
              endDate: edu.endDate ? new Date(edu.endDate) : null,
            },
          });
        }
      }

      // Import Skills
      if (data.skills?.length) {
        for (const skillName of data.skills) {
          // Upsert skill
          const existing = await tx.skill.findUnique({
            where: { userId_name: { userId, name: skillName } },
          });
          
          if (!existing) {
            await tx.skill.create({
              data: {
                userId,
                name: skillName,
                category: "Imported",
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile import error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
