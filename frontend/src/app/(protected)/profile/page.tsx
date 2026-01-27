'use client';

/**
 * Profile Page
 * Main dashboard for managing career profile
 */

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserProfile, Experience, Project, Skill, Education } from '@/types';
import { createLogger } from '@/lib/logger';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import ExperienceForm from '@/components/forms/ExperienceForm';
import ProjectForm from '@/components/forms/ProjectForm';
import SkillForm from '@/components/forms/SkillForm';
import EducationForm from '@/components/forms/EducationForm';
import ProfileEditForm from '@/components/forms/ProfileEditForm';
import CoverLetterSection from '@/components/CoverLetterSection';
import ResumeUpload from '@/components/ResumeUpload';
import ShareProfileModal from '@/components/ui/ShareProfileModal';
import GitHubImportModal from '@/components/GitHubImportModal';

const logger = createLogger({ component: 'ProfilePage' });

type ModalType = 'profile' | 'experience' | 'project' | 'skill' | 'education' | 'upload' | null;

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const { success, error: toastError } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('experiences');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editingItem, setEditingItem] = useState<Experience | Project | Skill | Education | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [githubModalOpen, setGithubModalOpen] = useState(false);

    const fetchProfile = useCallback(async () => {
        logger.startOperation('ProfilePage:fetchProfile');
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                logger.failOperation('ProfilePage:fetchProfile', errorBody);
                toastError(errorBody?.message ?? 'Failed to load profile data');
                return;
            }
            const data = await response.json();
            setProfile(data);
            logger.info('[ProfilePage] Profile fetched', {
                experiencesCount: data.experiences?.length,
                projectsCount: data.projects?.length,
                skillsCount: data.skills?.length,
                educationsCount: data.educations?.length,
            });
            logger.endOperation('ProfilePage:fetchProfile');
        } catch (error) {
            logger.failOperation('ProfilePage:fetchProfile', error);
            toastError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        if (status === 'authenticated') {
            logger.info('[ProfilePage] User authenticated, fetching profile');
            fetchProfile();
        }
    }, [status, fetchProfile]);

    const openModal = (type: ModalType, item?: Experience | Project | Skill | Education) => {
        logger.info('[ProfilePage] Opening modal', { type, hasItem: !!item });
        setModalType(type);
        setEditingItem(item || null);
    };

    const closeModal = () => {
        logger.debug('[ProfilePage] Closing modal');
        setModalType(null);
        setEditingItem(null);
    };

    // Experience handlers
    const handleExperienceSubmit = async (data: Partial<Experience>) => {
        logger.startOperation('ProfilePage:saveExperience');
        try {
            const method = editingItem?.id ? 'PUT' : 'POST';
            const url = editingItem?.id
                ? `/api/profile/experiences?id=${editingItem.id}`
                : '/api/profile/experiences';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('[ProfilePage] Experience saved successfully');
                logger.endOperation('ProfilePage:saveExperience');
                success(editingItem?.id ? 'Experience updated successfully' : 'Experience added successfully');
                closeModal();
                await fetchProfile();
            } else {
                throw new Error('Failed to save experience');
            }
        } catch (error) {
            logger.failOperation('ProfilePage:saveExperience', error);
            toastError('Failed to save experience. Please try again.');
            throw error;
        }
    };

    // Project handlers
    const handleProjectSubmit = async (data: Partial<Project>) => {
        logger.startOperation('ProfilePage:saveProject');
        try {
            const method = editingItem?.id ? 'PUT' : 'POST';
            const url = editingItem?.id
                ? `/api/profile/projects?id=${editingItem.id}`
                : '/api/profile/projects';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('[ProfilePage] Project saved successfully');
                logger.endOperation('ProfilePage:saveProject');
                success(editingItem?.id ? 'Project updated successfully' : 'Project added successfully');
                closeModal();
                await fetchProfile();
            } else {
                throw new Error('Failed to save project');
            }
        } catch (error) {
            logger.failOperation('ProfilePage:saveProject', error);
            toastError('Failed to save project. Please try again.');
            throw error;
        }
    };

    // Skill handlers
    const handleSkillSubmit = async (data: Partial<Skill>) => {
        logger.startOperation('ProfilePage:saveSkill');
        try {
            const method = editingItem?.id ? 'PUT' : 'POST';
            const url = editingItem?.id
                ? `/api/profile/skills?id=${editingItem.id}`
                : '/api/profile/skills';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('[ProfilePage] Skill saved successfully');
                logger.endOperation('ProfilePage:saveSkill');
                success(editingItem?.id ? 'Skill updated successfully' : 'Skill added successfully');
                closeModal();
                await fetchProfile();
            } else {
                throw new Error('Failed to save skill');
            }
        } catch (error) {
            logger.failOperation('ProfilePage:saveSkill', error);
            toastError('Failed to save skill. Please try again.');
            throw error;
        }
    };

    // Education handlers
    const handleEducationSubmit = async (data: Partial<Education>) => {
        logger.startOperation('ProfilePage:saveEducation');
        try {
            const method = editingItem?.id ? 'PUT' : 'POST';
            const url = editingItem?.id
                ? `/api/profile/educations?id=${editingItem.id}`
                : '/api/profile/educations';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('[ProfilePage] Education saved successfully');
                logger.endOperation('ProfilePage:saveEducation');
                success(editingItem?.id ? 'Education updated successfully' : 'Education added successfully');
                closeModal();
                await fetchProfile();
            } else {
                throw new Error('Failed to save education');
            }
        } catch (error) {
            logger.failOperation('ProfilePage:saveEducation', error);
            toastError('Failed to save education. Please try again.');
            throw error;
        }
    };

    // Profile edit handler
    const handleProfileSubmit = async (data: { name: string; image?: string }) => {
        logger.startOperation('ProfilePage:saveProfile');
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                logger.info('[ProfilePage] Profile updated successfully');
                logger.endOperation('ProfilePage:saveProfile');
                success('Profile updated successfully');
                closeModal();
                await fetchProfile();
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            logger.failOperation('ProfilePage:saveProfile', error);
            toastError('Failed to update profile. Please try again.');
            throw error;
        }
    };

    // Resume upload handler - accepts ExtractedData from ResumeUpload component
    const handleResumeDataExtracted = async (data: Record<string, unknown>) => {
        logger.info('[ProfilePage] Resume data extracted', {
            hasName: !!data.name,
            experiencesCount: (data.experiences as unknown[])?.length,
            skillsCount: (data.skills as unknown[])?.length,
            educationCount: (data.education as unknown[])?.length,
            projectsCount: (data.projects as unknown[])?.length,
            extractionMethod: data.extraction_method,
        });
        success('Resume uploaded and parsed successfully!');
        closeModal();
        // Refresh profile to show any extracted data that was saved
        await fetchProfile();
    };

    // GitHub Import handler
    const handleGitHubImport = async (projects: Partial<Project>[]) => {
        logger.startOperation('ProfilePage:importGitHub');
        try {
            // Sequential import to avoid race conditions or rate limits
            for (const project of projects) {
                await fetch('/api/profile/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(project),
                });
            }
            logger.info('[ProfilePage] GitHub projects imported');
            logger.endOperation('ProfilePage:importGitHub');
            success(`${projects.length} projects imported successfully`);
            await fetchProfile();
        } catch (error) {
            logger.failOperation('ProfilePage:importGitHub', error);
            toastError('Failed to import some projects');
        }
    };

    if (status === 'loading' || loading) {
        return <ProfileSkeleton />;
    }

    const tabs = [
        { id: 'experiences', label: 'Experience', count: profile?.experiences?.length || 0 },
        { id: 'projects', label: 'Projects', count: profile?.projects?.length || 0 },
        { id: 'skills', label: 'Skills', count: profile?.skills?.length || 0 },
        { id: 'education', label: 'Education', count: profile?.educations?.length || 0 },
        { id: 'cover-letters', label: 'Cover Letters', count: 0 },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="CV-Wiz Logo"
                            width={40}
                            height={40}
                            className="rounded-xl"
                        />
                        <span className="text-xl font-bold text-gray-900">CV-Wiz</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                logger.info('[ProfilePage] Share clicked');
                                setShareModalOpen(true);
                            }}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        >
                            Share Profile
                        </button>
                        <button
                            onClick={() => {
                                logger.info('[ProfilePage] Upload Resume clicked');
                                openModal('upload');
                            }}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        >
                            Upload Resume
                        </button>
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                            Dashboard
                        </Link>
                        <Link href="/templates" className="text-gray-600 hover:text-gray-900 font-medium">
                            Templates
                        </Link>
                        <Link href="/interview-prep" className="text-gray-600 hover:text-gray-900 font-medium">
                            Interview Prep
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{session?.user?.email}</span>
                            <button
                                onClick={() => {
                                    logger.info('[ProfilePage] Sign out clicked');
                                    signOut({ callbackUrl: '/' });
                                }}
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
                        <button
                            onClick={() => {
                                logger.info('[ProfilePage] Edit Profile clicked');
                                openModal('profile');
                            }}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            Edit Profile
                        </button>
                    </div>

                 {/* Stats */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
                         <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.experiences?.length || 0}</div>
                             <div className="text-xs sm:text-sm text-gray-500">Experiences</div>
                         </div>
                         <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.projects?.length || 0}</div>
                             <div className="text-xs sm:text-sm text-gray-500">Projects</div>
                         </div>
                         <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.skills?.length || 0}</div>
                             <div className="text-xs sm:text-sm text-gray-500">Skills</div>
                         </div>
                         <div className="text-center">
                             <div className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.educations?.length || 0}</div>
                             <div className="text-xs sm:text-sm text-gray-500">Education</div>
                         </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm">
                    <div className="border-b border-gray-200">
                         <nav className="flex gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-auto">
                             {tabs.map((tab) => (
                                 <button
                                     key={tab.id}
                                     onClick={() => {
                                         logger.debug('[ProfilePage] Tab switched', { tab: tab.id });
                                         setActiveTab(tab.id);
                                     }}
                                     className={`py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                         ? 'border-indigo-500 text-indigo-600'
                                         : 'border-transparent text-gray-500 hover:text-gray-700'
                                         }`}
                                 >
                                     {tab.label}
                                     {tab.id !== 'cover-letters' && (
                                         <span className="ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                                             {tab.count}
                                         </span>
                                     )}
                                 </button>
                             ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'experiences' && (
                            <ExperienceList
                                experiences={profile?.experiences || []}
                                onAdd={() => openModal('experience')}
                                onEdit={(exp) => openModal('experience', exp)}
                            />
                        )}
                        {activeTab === 'projects' && (
                            <ProjectList
                                projects={profile?.projects || []}
                                onAdd={() => openModal('project')}
                                onEdit={(proj) => openModal('project', proj)}
                                onImportGitHub={() => setGithubModalOpen(true)}
                            />
                        )}
                        {activeTab === 'skills' && (
                            <SkillList
                                skills={profile?.skills || []}
                                onAdd={() => openModal('skill')}
                                onEdit={(skill) => openModal('skill', skill)}
                            />
                        )}
                        {activeTab === 'education' && (
                            <EducationList
                                educations={profile?.educations || []}
                                onAdd={() => openModal('education')}
                                onEdit={(edu) => openModal('education', edu)}
                            />
                        )}
                        {activeTab === 'cover-letters' && (
                            <CoverLetterSection />
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal
                isOpen={modalType === 'profile'}
                onClose={closeModal}
                title="Edit Profile"
            >
                <ProfileEditForm
                    currentName={profile?.name || ''}
                    currentImage={profile?.image || ''}
                    onSubmit={handleProfileSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal
                isOpen={modalType === 'experience'}
                onClose={closeModal}
                title={editingItem ? 'Edit Experience' : 'Add Experience'}
                size="lg"
            >
                <ExperienceForm
                    experience={editingItem as Experience | undefined}
                    onSubmit={handleExperienceSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal
                isOpen={modalType === 'project'}
                onClose={closeModal}
                title={editingItem ? 'Edit Project' : 'Add Project'}
                size="lg"
            >
                <ProjectForm
                    project={editingItem as Project | undefined}
                    onSubmit={handleProjectSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal
                isOpen={modalType === 'skill'}
                onClose={closeModal}
                title={editingItem ? 'Edit Skill' : 'Add Skill'}
            >
                <SkillForm
                    skill={editingItem as Skill | undefined}
                    onSubmit={handleSkillSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal
                isOpen={modalType === 'education'}
                onClose={closeModal}
                title={editingItem ? 'Edit Education' : 'Add Education'}
                size="lg"
            >
                <EducationForm
                    education={editingItem as Education | undefined}
                    onSubmit={handleEducationSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal
                isOpen={modalType === 'upload'}
                onClose={closeModal}
                title="Upload Resume"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Upload your existing resume to automatically extract your experience, education, and skills.
                    </p>
                    <ResumeUpload onDataExtracted={handleResumeDataExtracted} />
                </div>
            </Modal>

            {profile && (
                <ShareProfileModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    userId={profile.id}
                    isPublicInitial={(profile.settings?.resumePreferences as any)?.isPublic || false}
                    onUpdate={(isPublic) => {
                        // Optimistic update
                        if (profile.settings) {
                            setProfile({
                                ...profile,
                                settings: {
                                    ...profile.settings,
                                    resumePreferences: {
                                        ...(profile.settings.resumePreferences || {}),
                                        isPublic
                                    }
                                }
                            });
                        }
                    }}
                />
            )}

            <GitHubImportModal
                isOpen={githubModalOpen}
                onClose={() => setGithubModalOpen(false)}
                onImport={handleGitHubImport}
            />
        </div>
    );
}

// Experience List Component
function ExperienceList({
    experiences,
    onAdd,
    onEdit
}: {
    experiences: Experience[];
    onAdd: () => void;
    onEdit: (exp: Experience) => void;
}) {
    const listLogger = createLogger({ component: 'ExperienceList' });

    if (experiences.length === 0) {
        return (
            <EmptyState
                title="No work experience yet"
                description="Add your work history to build your resume"
                actionLabel="Add Experience"
                onAction={() => {
                    listLogger.info('[ExperienceList] Add Experience from empty state');
                    onAdd();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {experiences.map((exp) => (
                <div
                    key={exp.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        listLogger.debug('[ExperienceList] Edit experience clicked', { id: exp.id });
                        onEdit(exp);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -
                                {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit experience at ${exp.company}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(exp);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
            <button
                onClick={() => {
                    listLogger.info('[ExperienceList] Add Experience clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
                + Add Experience
            </button>
        </div>
    );
}

// Project List Component
function ProjectList({
    projects,
    onAdd,
    onEdit,
    onImportGitHub
}: {
    projects: Project[];
    onAdd: () => void;
    onEdit: (proj: Project) => void;
    onImportGitHub: () => void;
}) {
    const listLogger = createLogger({ component: 'ProjectList' });

    if (projects.length === 0) {
        return (
            <div className="space-y-4">
                <EmptyState
                    title="No projects yet"
                    description="Showcase your work and side projects"
                    actionLabel="Add Project"
                    onAction={() => {
                        listLogger.info('[ProjectList] Add Project from empty state');
                        onAdd();
                    }}
                />
                <button
                    onClick={onImportGitHub}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 4.238 9.611 9.647 10.674.6.099.817-.26.817-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.44-1.304.806-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.212.685.827.569 5.405-1.065 9.641-5.372 9.641-10.674 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Import from GitHub
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
                <div
                    key={proj.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        listLogger.debug('[ProjectList] Edit project clicked', { id: proj.id });
                        onEdit(proj);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">{proj.name}</h3>
                        <button
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0 focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 outline-none"
                            aria-label={`Edit project ${proj.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(proj);
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
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
            <button
                onClick={() => {
                    listLogger.info('[ProjectList] Add Project clicked');
                    onAdd();
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center"
            >
                + Add Project
            </button>
            <button
                onClick={onImportGitHub}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 4.238 9.611 9.647 10.674.6.099.817-.26.817-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.44-1.304.806-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.212.685.827.569 5.405-1.065 9.641-5.372 9.641-10.674 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Import
            </button>
        </div>
    );
}

// Skill List Component
function SkillList({
    skills,
    onAdd,
    onEdit
}: {
    skills: Skill[];
    onAdd: () => void;
    onEdit: (skill: Skill) => void;
}) {
    const listLogger = createLogger({ component: 'SkillList' });

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
                onAction={() => {
                    listLogger.info('[SkillList] Add Skill from empty state');
                    onAdd();
                }}
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
                                onClick={() => {
                                    listLogger.debug('[SkillList] Edit skill clicked', { id: skill.id });
                                    onEdit(skill);
                                }}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
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
            <button
                onClick={() => {
                    listLogger.info('[SkillList] Add Skill clicked');
                    onAdd();
                }}
                className="py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
                + Add Skill
            </button>
        </div>
    );
}

// Education List Component
function EducationList({
    educations,
    onAdd,
    onEdit
}: {
    educations: Education[];
    onAdd: () => void;
    onEdit: (edu: Education) => void;
}) {
    const listLogger = createLogger({ component: 'EducationList' });

    if (educations.length === 0) {
        return (
            <EmptyState
                title="No education added"
                description="Add your educational background"
                actionLabel="Add Education"
                onAction={() => {
                    listLogger.info('[EducationList] Add Education from empty state');
                    onAdd();
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            {educations.map((edu) => (
                <div
                    key={edu.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => {
                        listLogger.debug('[EducationList] Edit education clicked', { id: edu.id });
                        onEdit(edu);
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                            <p className="text-gray-600">{edu.institution}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(edu.startDate).getFullYear()} -
                                {edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ' Present'}
                                {edu.gpa && ` • GPA: ${edu.gpa.toFixed(2)}`}
                            </p>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(edu);
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    listLogger.info('[EducationList] Add Education clicked');
                    onAdd();
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
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
