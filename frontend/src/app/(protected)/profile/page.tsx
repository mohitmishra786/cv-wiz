'use client';

/**
 * Profile Page
 * Main dashboard for managing career profile
 * Refactored to use smaller, focused components
 */

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ExperienceList, ProjectList, SkillList, EducationList } from '@/components/profile/ProfileLists';

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

    // Memoized tabs configuration
    const tabs = useMemo(() => [
        { id: 'experiences', label: 'Experience', count: profile?.experiences?.length || 0 },
        { id: 'projects', label: 'Projects', count: profile?.projects?.length || 0 },
        { id: 'skills', label: 'Skills', count: profile?.skills?.length || 0 },
        { id: 'education', label: 'Education', count: profile?.educations?.length || 0 },
        { id: 'cover-letters', label: 'Cover Letters', count: 0 },
    ], [profile]);

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

    const openModal = useCallback((type: ModalType, item?: Experience | Project | Skill | Education) => {
        logger.info('[ProfilePage] Opening modal', { type, hasItem: !!item });
        setModalType(type);
        setEditingItem(item || null);
    }, []);

    const closeModal = useCallback(() => {
        logger.debug('[ProfilePage] Closing modal');
        setModalType(null);
        setEditingItem(null);
    }, []);

    // Generic save handler factory
    const createSaveHandler = useCallback((
        endpoint: string,
        operationName: string,
        successMessage: string,
        updateMessage: string
    ) => {
        return async (data: Record<string, unknown>) => {
            logger.startOperation(`ProfilePage:${operationName}`);
            try {
                const method = editingItem?.id ? 'PUT' : 'POST';
                const url = editingItem?.id
                    ? `/api/profile/${endpoint}?id=${editingItem.id}`
                    : `/api/profile/${endpoint}`;

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    logger.info(`[ProfilePage] ${operationName} saved successfully`);
                    logger.endOperation(`ProfilePage:${operationName}`);
                    success(editingItem?.id ? updateMessage : successMessage);
                    closeModal();
                    await fetchProfile();
                } else {
                    throw new Error(`Failed to save ${operationName.toLowerCase()}`);
                }
            } catch (error) {
                logger.failOperation(`ProfilePage:${operationName}`, error);
                toastError(`Failed to save ${operationName.toLowerCase()}. Please try again.`);
                throw error;
            }
        };
    }, [editingItem, success, closeModal, fetchProfile, toastError]);

    // Handlers using the factory
    const handleExperienceSubmit = useMemo(() => 
        createSaveHandler('experiences', 'saveExperience', 'Experience added successfully', 'Experience updated successfully'),
    [createSaveHandler]);

    const handleProjectSubmit = useMemo(() => 
        createSaveHandler('projects', 'saveProject', 'Project added successfully', 'Project updated successfully'),
    [createSaveHandler]);

    const handleSkillSubmit = useMemo(() => 
        createSaveHandler('skills', 'saveSkill', 'Skill added successfully', 'Skill updated successfully'),
    [createSaveHandler]);

    const handleEducationSubmit = useMemo(() => 
        createSaveHandler('educations', 'saveEducation', 'Education added successfully', 'Education updated successfully'),
    [createSaveHandler]);

    const handleProfileSubmit = useCallback(async (data: { name: string; image?: string }) => {
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
    }, [success, closeModal, fetchProfile, toastError]);

    const handleResumeDataExtracted = useCallback(async (data: Record<string, unknown>) => {
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
        await fetchProfile();
    }, [success, closeModal, fetchProfile]);

    const handleGitHubImport = useCallback(async (projects: Partial<Project>[]) => {
        logger.startOperation('ProfilePage:importGitHub');
        try {
            await Promise.all(
                projects.map(project =>
                    fetch('/api/profile/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(project),
                    })
                )
            );
            logger.info('[ProfilePage] GitHub projects imported');
            logger.endOperation('ProfilePage:importGitHub');
            success(`${projects.length} projects imported successfully`);
            await fetchProfile();
        } catch (error) {
            logger.failOperation('ProfilePage:importGitHub', error);
            toastError('Failed to import some projects');
        }
    }, [success, fetchProfile, toastError]);

    // Memoized tab content renderer
    const renderTabContent = useMemo(() => {
        switch (activeTab) {
            case 'experiences':
                return (
                    <ExperienceList
                        experiences={profile?.experiences || []}
                        onAdd={() => openModal('experience')}
                        onEdit={(exp) => openModal('experience', exp)}
                    />
                );
            case 'projects':
                return (
                    <ProjectList
                        projects={profile?.projects || []}
                        onAdd={() => openModal('project')}
                        onEdit={(proj) => openModal('project', proj)}
                        onImportGitHub={() => setGithubModalOpen(true)}
                    />
                );
            case 'skills':
                return (
                    <SkillList
                        skills={profile?.skills || []}
                        onAdd={() => openModal('skill')}
                        onEdit={(skill) => openModal('skill', skill)}
                    />
                );
            case 'education':
                return (
                    <EducationList
                        educations={profile?.educations || []}
                        onAdd={() => openModal('education')}
                        onEdit={(edu) => openModal('education', edu)}
                    />
                );
            case 'cover-letters':
                return <CoverLetterSection />;
            default:
                return null;
        }
    }, [activeTab, profile, openModal]);

    if (status === 'loading' || loading) {
        return <ProfileSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="max-w-6xl mx-auto px-4 py-8">
                <ProfileHeader
                    profile={profile}
                    userEmail={session?.user?.email}
                    onUploadResume={() => openModal('upload')}
                    onEditProfile={() => openModal('profile')}
                />

                <ProfileTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mt-6">
                    <div className="p-6">
                        {renderTabContent}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={modalType === 'profile'} onClose={closeModal} title="Edit Profile">
                <ProfileEditForm
                    currentName={profile?.name || ''}
                    currentImage={profile?.image || ''}
                    onSubmit={handleProfileSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal isOpen={modalType === 'experience'} onClose={closeModal} title={editingItem ? 'Edit Experience' : 'Add Experience'} size="lg">
                <ExperienceForm
                    experience={editingItem as Experience | undefined}
                    onSubmit={handleExperienceSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal isOpen={modalType === 'project'} onClose={closeModal} title={editingItem ? 'Edit Project' : 'Add Project'} size="lg">
                <ProjectForm
                    project={editingItem as Project | undefined}
                    onSubmit={handleProjectSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal isOpen={modalType === 'skill'} onClose={closeModal} title={editingItem ? 'Edit Skill' : 'Add Skill'}>
                <SkillForm
                    skill={editingItem as Skill | undefined}
                    onSubmit={handleSkillSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal isOpen={modalType === 'education'} onClose={closeModal} title={editingItem ? 'Edit Education' : 'Add Education'} size="lg">
                <EducationForm
                    education={editingItem as Education | undefined}
                    onSubmit={handleEducationSubmit}
                    onCancel={closeModal}
                />
            </Modal>

            <Modal isOpen={modalType === 'upload'} onClose={closeModal} title="Upload Resume" size="lg">
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
                    isPublicInitial={(profile.settings?.resumePreferences as { isPublic?: boolean })?.isPublic || false}
                    onUpdate={(isPublic) => {
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
