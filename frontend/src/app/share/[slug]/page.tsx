import { getPublicResume } from "@/app/actions/sharing";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Define interface for what getPublicResume returns
interface Experience {
  company: string;
  title: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  current: boolean;
  description: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

interface Skill {
  name: string;
}

interface ResumeData {
  name: string | null;
  email: string;
  experiences: Experience[];
  projects: Project[];
  educations: any[]; // Less critical for now
  skills: Skill[];
  publications: any[];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const resume = await getPublicResume(slug) as unknown as ResumeData | null;
  if (!resume) return { title: "Resume Not Found" };
  
  return {
    title: `${resume.name}'s Resume | CV-Wiz`,
    description: `Professional resume of ${resume.name}`,
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { slug } = await params;
  const resume = await getPublicResume(slug) as unknown as ResumeData | null;

  if (!resume) {
    notFound();
  }

  // Simple rendering of the resume data
  // In a real app, this would use the ResumeRenderer component
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8 text-center">
          <h1 className="text-4xl font-bold">{resume.name}</h1>
          {resume.email && <p className="mt-2 text-slate-300">{resume.email}</p>}
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Experience */}
          {resume.experiences && resume.experiences.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Experience</h2>
              <div className="space-y-6">
                { }
                {resume.experiences.map((exp: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xl font-semibold text-gray-800">{exp.title}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                      </span>
                    </div>
                    <p className="text-lg text-gray-700">{exp.company}</p>
                    <p className="mt-2 text-gray-600 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Projects</h2>
              <div className="space-y-6">
                { }
                {resume.projects.map((proj: any, i: number) => (
                  <div key={i}>
                    <h3 className="text-xl font-semibold text-gray-800">{proj.name}</h3>
                    <p className="text-gray-600 mt-1">{proj.description}</p>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {proj.technologies.map((tech: string, j: number) => (
                          <span key={j} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                { }
                {resume.skills.map((skill: any, i: number) => (
                  <span key={i} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-medium">
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resume.projects?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Projects</h2>
              <div className="space-y-6">
                {resume.projects.map((proj, i) => (
                  <div key={i}>
                    <h3 className="text-xl font-semibold text-gray-800">{proj.name}</h3>
                    <p className="text-gray-600 mt-1">{proj.description}</p>
                    {proj.technologies?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {proj.technologies.map((tech, j) => (
                          <span key={j} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <span key={i} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-medium">
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t">
            Powered by <Link href="/" className="text-blue-600 hover:underline">CV-Wiz</Link>
        </div>
      </div>
    </div>
  );
}
