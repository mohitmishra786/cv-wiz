import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const ProfileImportSchema = z.object({
  name: z.string().optional(),
  about: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(z.object({
    company: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional().nullable(),
    current: z.boolean().optional(),
    location: z.string().optional(),
    highlights: z.array(z.string()).optional(),
  })).optional(),
  educations: z.array(z.object({
    school: z.string().optional(),
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.number().optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string().optional(),
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    gpa: z.number().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    url: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
  publications: z.array(z.object({
    title: z.string(),
    venue: z.string().optional(),
    year: z.string().optional(),
    authors: z.array(z.string()).optional(),
    url: z.string().optional(),
  })).optional(),
  certifications: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();

    logger.info('[Import] Starting profile import', {
      userId: session.user.id,
      hasExperiences: !!json.experiences?.length,
      hasProjects: !!json.projects?.length,
      hasSkills: !!json.skills?.length,
      hasEducation: !!(json.education?.length || json.educations?.length),
    });

    const result = ProfileImportSchema.safeParse(json);

    if (!result.success) {
      logger.warn('[Import] Validation failed', {
        errors: result.error.flatten(),
        receivedKeys: Object.keys(json),
      });
      return NextResponse.json({ error: "Invalid data", details: result.error }, { status: 400 });
    }

    const data = result.data;
    const userId = session.user.id;

    // Merge education arrays (LLM returns "education", frontend might use "educations")
    const allEducation = [...(data.education || []), ...(data.educations || [])];

    const importStats = {
      name: false,
      summary: false,
      experiencesImported: 0,
      projectsImported: 0,
      skillsImported: 0,
      educationsImported: 0,
    };

    await prisma.$transaction(async (tx) => {
      // Update Name and Summary
      if (data.name || data.summary || data.about) {
        // Bio precedence: about takes priority over summary
        const bio = data.about || data.summary;
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.name && { name: data.name }),
            ...(bio && { bio }),
          },
        });
        if (data.name) importStats.name = true;
        if (bio) importStats.summary = true;
      }

      // Import Experiences with deduplication
      if (data.experiences?.length) {
        for (const exp of data.experiences) {
          // Build description from description + highlights
          let fullDescription = exp.description || "";
          if (exp.highlights?.length) {
            fullDescription += (fullDescription ? "\n\n" : "") + "Key Achievements:\n• " + exp.highlights.join("\n• ");
          }

          // Check for existing experience (use description if no startDate)
          const whereClause: {
            userId: string;
            company: string;
            title: string;
            startDate?: Date;
            description?: string;
          } = {
            userId,
            company: exp.company,
            title: exp.title,
          };
          if (exp.startDate) {
            whereClause.startDate = new Date(exp.startDate);
          } else {
            // Use description as additional identifier when startDate missing
            whereClause.description = fullDescription;
          }

          const existing = await tx.experience.findFirst({ where: whereClause });

          if (!existing) {
            await tx.experience.create({
              data: {
                userId,
                company: exp.company,
                title: exp.title,
                description: fullDescription,
                startDate: exp.startDate ? new Date(exp.startDate) : new Date(0), // Epoch for unknown dates
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                current: exp.current || false,
                location: exp.location,
              },
            });
            importStats.experiencesImported++;
          }
        }
      }

      // Import Education with deduplication
      if (allEducation.length) {
        for (const edu of allEducation) {
          const institution = edu.institution || edu.school || "Unknown Institution";

          // Check for existing education
          const existing = await tx.education.findFirst({
            where: {
              userId,
              institution,
              degree: edu.degree || "Degree",
              field: edu.field || "Field",
            },
          });

          if (!existing) {
            await tx.education.create({
              data: {
                userId,
                institution,
                degree: edu.degree || "Degree",
                field: edu.field || "Field",
                startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
                endDate: edu.endDate ? new Date(edu.endDate) : null,
              },
            });
            importStats.educationsImported++;
          }
        }
      }

      // Import Skills
      if (data.skills?.length) {
        for (const skillName of data.skills) {
          if (!skillName || typeof skillName !== 'string') continue;

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
            importStats.skillsImported++;
          }
        }
      }

      // Import Projects with deduplication
      if (data.projects?.length) {
        const createdProjectNames: string[] = [];
        for (const project of data.projects) {
          if (!project.name) continue;

          // Check for existing project
          const existing = await tx.project.findFirst({
            where: {
              userId,
              name: project.name,
            },
          });

          if (!existing) {
            await tx.project.create({
              data: {
                userId,
                name: project.name,
                description: project.description || "",
                technologies: project.technologies || [],
                url: project.url,
                startDate: project.startDate ? new Date(project.startDate) : undefined,
                endDate: project.endDate ? new Date(project.endDate) : undefined,
              },
            });
            importStats.projectsImported++;
            createdProjectNames.push(project.name);
          }
        }

        logger.info('[Import] Projects imported', {
          userId,
          count: importStats.projectsImported,
          projectNames: createdProjectNames,
        });
      }
    });

    logger.info('[Import] Profile import completed successfully', {
      userId,
      ...importStats,
    });

    return NextResponse.json({
      success: true,
      imported: importStats,
    });
  } catch (error) {
    logger.error('[Import] Profile import failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
