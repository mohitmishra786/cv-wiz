'use client';

/**
 * Profile Page
 * Main dashboard for managing career profile
 */

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { UserProfile, Experience, Project, Skill, Education } from '@/types';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('experiences');

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'experiences', label: 'Experience', count: profile?.experiences?.length || 0 },
        { id: 'projects', label: 'Projects', count: profile?.projects?.length || 0 },
        { id: 'skills', label: 'Skills', count: profile?.skills?.length || 0 },
        { id: 'education', label: 'Education', count: profile?.educations?.length || 0 },
    ];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">CV-Wiz</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="/templates" className="text-gray-600 hover:text-gray-900 font-medium">
                            Templates
                        </a>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{session?.user?.email}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {profile?.name?.[0] || session?.user?.email?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {profile?.name || 'Your Name'}
                                </h1>
                                <p className="text-gray-600">{session?.user?.email}</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            Edit Profile
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile?.experiences?.length || 0}</div>
                            <div className="text-sm text-gray-500">Experiences</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile?.projects?.length || 0}</div>
                            <div className="text-sm text-gray-500">Projects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile?.skills?.length || 0}</div>
                            <div className="text-sm text-gray-500">Skills</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile?.educations?.length || 0}</div>
                            <div className="text-sm text-gray-500">Education</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="flex gap-4 px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'experiences' && (
                            <ExperienceList experiences={profile?.experiences || []} onRefresh={fetchProfile} />
                        )}
                        {activeTab === 'projects' && (
                            <ProjectList projects={profile?.projects || []} onRefresh={fetchProfile} />
                        )}
                        {activeTab === 'skills' && (
                            <SkillList skills={profile?.skills || []} onRefresh={fetchProfile} />
                        )}
                        {activeTab === 'education' && (
                            <EducationList educations={profile?.educations || []} onRefresh={fetchProfile} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Experience List Component
function ExperienceList({ experiences, onRefresh }: { experiences: Experience[]; onRefresh: () => void }) {
    if (experiences.length === 0) {
        return (
            <EmptyState
                title="No work experience yet"
                description="Add your work history to build your resume"
                actionLabel="Add Experience"
                onAction={() => {/* TODO: Open modal */ }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {experiences.map((exp) => (
                <div key={exp.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                                {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                            </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                    </div>
                    {exp.highlights?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {exp.highlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                + Add Experience
            </button>
        </div>
    );
}

// Project List Component
function ProjectList({ projects, onRefresh }: { projects: Project[]; onRefresh: () => void }) {
    if (projects.length === 0) {
        return (
            <EmptyState
                title="No projects yet"
                description="Showcase your work and side projects"
                actionLabel="Add Project"
                onAction={() => { }}
            />
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {projects.map((proj) => (
                <div key={proj.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{proj.description}</p>
                    {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {proj.technologies.slice(0, 4).map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <button className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center">
                + Add Project
            </button>
        </div>
    );
}

// Skill List Component
function SkillList({ skills, onRefresh }: { skills: Skill[]; onRefresh: () => void }) {
    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    if (skills.length === 0) {
        return (
            <EmptyState
                title="No skills added"
                description="Add your technical and soft skills"
                actionLabel="Add Skill"
                onAction={() => { }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categorySkills.map((skill) => (
                            <span
                                key={skill.id}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 transition-colors"
                            >
                                {skill.name}
                                {skill.proficiency && (
                                    <span className="ml-2 text-xs text-gray-400">{skill.proficiency}</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
            <button className="py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                + Add Skill
            </button>
        </div>
    );
}

// Education List Component
function EducationList({ educations, onRefresh }: { educations: Education[]; onRefresh: () => void }) {
    if (educations.length === 0) {
        return (
            <EmptyState
                title="No education added"
                description="Add your educational background"
                actionLabel="Add Education"
                onAction={() => { }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {educations.map((edu) => (
                <div key={edu.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">
                        {new Date(edu.startDate).getFullYear()} -
                        {edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' Present'}
                        {edu.gpa && ` • GPA: ${edu.gpa.toFixed(2)}`}
                    </p>
                </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                + Add Education
            </button>
        </div>
    );
}

// Empty State Component
function EmptyState({ title, description, actionLabel, onAction }: {
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 mb-4">{description}</p>
            <button
                onClick={onAction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                {actionLabel}
            </button>
        </div>
    );
}
