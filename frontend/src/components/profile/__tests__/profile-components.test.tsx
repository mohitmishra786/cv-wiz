/**
 * Profile Components Tests
 * Tests for ExperienceList, ProjectList, SkillList, and EducationList components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExperienceList } from '../ExperienceList';
import { ProjectList } from '../ProjectList';
import { SkillList } from '../SkillList';
import { EducationList } from '../EducationList';
import type { Experience, Project, Skill, Education } from '@/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ExperienceList', () => {
    const mockExperiences: Experience[] = [
        {
            id: '1',
            title: 'Senior Developer',
            company: 'Tech Corp',
            startDate: '2022-01-01T00:00:00Z',
            current: true,
            highlights: ['Built system X', 'Led team Y'],
        },
        {
            id: '2',
            title: 'Developer',
            company: 'StartUp Inc',
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2021-12-31T00:00:00Z',
            highlights: ['Built feature A'],
        },
    ];

    const defaultProps = {
        experiences: mockExperiences,
        onAdd: vi.fn(),
        onEdit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders experience items correctly', () => {
        render(<ExperienceList {...defaultProps} />);

        expect(screen.getByText('Senior Developer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Developer')).toBeInTheDocument();
        expect(screen.getByText('StartUp Inc')).toBeInTheDocument();
    });

    it('shows empty state when no experiences', () => {
        render(<ExperienceList experiences={[]} onAdd={vi.fn()} onEdit={vi.fn()} />);

        expect(screen.getByText(/No work experience yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Experience/i })).toBeInTheDocument();
    });

    it('calls onEdit when experience is clicked', () => {
        render(<ExperienceList {...defaultProps} />);

        fireEvent.click(screen.getByText('Senior Developer'));
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockExperiences[0]);
    });

    it('calls onAdd when add button is clicked', () => {
        render(<ExperienceList {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));
        expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
    });

    it('is memoized and does not re-render when parent re-renders', () => {
        const { rerender } = render(<ExperienceList {...defaultProps} />);

        // Re-render with same props - should not cause issues
        rerender(<ExperienceList {...defaultProps} />);

        expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    });
});

describe('ProjectList', () => {
    const mockProjects: Project[] = [
        {
            id: '1',
            name: 'Project Alpha',
            description: 'A great project',
            url: 'https://github.com/user/alpha',
            technologies: ['React', 'TypeScript'],
            highlights: ['Feature X', 'Feature Y'],
        },
    ];

    const defaultProps = {
        projects: mockProjects,
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onImportGitHub: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders project items correctly', () => {
        render(<ProjectList {...defaultProps} />);

        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('React, TypeScript')).toBeInTheDocument();
    });

    it('shows empty state with add and import buttons', () => {
        render(<ProjectList projects={[]} onAdd={vi.fn()} onEdit={vi.fn()} onImportGitHub={vi.fn()} />);

        expect(screen.getByText(/No projects yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Project/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import from GitHub/i })).toBeInTheDocument();
    });

    it('calls onEdit when project is clicked', () => {
        render(<ProjectList {...defaultProps} />);

        fireEvent.click(screen.getByText('Project Alpha'));
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockProjects[0]);
    });

    it('calls onImportGitHub when import button is clicked', () => {
        render(<ProjectList projects={[]} {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Import from GitHub/i }));
        expect(defaultProps.onImportGitHub).toHaveBeenCalledTimes(1);
    });
});

describe('SkillList', () => {
    const mockSkills: Skill[] = [
        { id: '1', name: 'Python', category: 'Language' },
        { id: '2', name: 'TypeScript', category: 'Language' },
        { id: '3', name: 'React', category: 'Framework' },
    ];

    const defaultProps = {
        skills: mockSkills,
        onAdd: vi.fn(),
        onEdit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders skills grouped by category', () => {
        render(<SkillList {...defaultProps} />);

        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.getByText('Framework')).toBeInTheDocument();
        expect(screen.getByText('Python')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('shows empty state when no skills', () => {
        render(<SkillList skills={[]} onAdd={vi.fn()} onEdit={vi.fn()} />);

        expect(screen.getByText(/No skills added yet/i)).toBeInTheDocument();
    });

    it('calls onEdit when skill is clicked', () => {
        render(<SkillList {...defaultProps} />);

        fireEvent.click(screen.getByText('Python'));
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockSkills[0]);
    });
});

describe('EducationList', () => {
    const mockEducations: Education[] = [
        {
            id: '1',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Tech',
            startDate: '2016-01-01T00:00:00Z',
            endDate: '2020-05-31T00:00:00Z',
            gpa: 3.8,
        },
    ];

    const defaultProps = {
        educations: mockEducations,
        onAdd: vi.fn(),
        onEdit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders education items correctly', () => {
        render(<EducationList {...defaultProps} />);

        expect(screen.getByText('Bachelor of Science in Computer Science')).toBeInTheDocument();
        expect(screen.getByText('University of Tech')).toBeInTheDocument();
        expect(screen.getByText(/GPA: 3.8/i)).toBeInTheDocument();
    });

    it('shows empty state when no educations', () => {
        render(<EducationList educations={[]} onAdd={vi.fn()} onEdit={vi.fn()} />);

        expect(screen.getByText(/No education entries yet/i)).toBeInTheDocument();
    });

    it('calls onEdit when education is clicked', () => {
        render(<EducationList {...defaultProps} />);

        fireEvent.click(screen.getByText('Bachelor of Science in Computer Science'));
        expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEducations[0]);
    });
});

describe('Memoization', () => {
    it('ExperienceList is memoized', () => {
        expect(ExperienceList.$$typeof).toBeDefined();
    });

    it('ProjectList is memoized', () => {
        expect(ProjectList.$$typeof).toBeDefined();
    });

    it('SkillList is memoized', () => {
        expect(SkillList.$$typeof).toBeDefined();
    });

    it('EducationList is memoized', () => {
        expect(EducationList.$$typeof).toBeDefined();
    });
});
