/**
 * ProjectForm Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectForm from '../ProjectForm';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
};

describe('ProjectForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders form fields correctly', () => {
        render(<ProjectForm {...defaultProps} />);

        expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Project URL/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Technologies/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Key Features/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Project/i })).toBeInTheDocument();
    });

    it('shows validation errors for required fields', async () => {
        render(<ProjectForm {...defaultProps} />);

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Project name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
        });
    });

    it('validates URL format correctly', async () => {
        render(<ProjectForm {...defaultProps} />);

        const urlInput = screen.getByLabelText(/Project URL/i);
        await userEvent.type(urlInput, 'invalid-url');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid URL starting with http/i)).toBeInTheDocument();
        });
    });

    it('accepts valid HTTPS URLs', async () => {
        render(<ProjectForm {...defaultProps} />);

        const urlInput = screen.getByLabelText(/Project URL/i);
        await userEvent.type(urlInput, 'https://github.com/user/project');

        const nameInput = screen.getByLabelText(/Project Name/i);
        await userEvent.type(nameInput, 'Test Project');

        const descInput = screen.getByLabelText(/Description/i);
        await userEvent.type(descInput, 'A test project');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.queryByText(/Please enter a valid URL/i)).not.toBeInTheDocument();
        });
    });

    it('rejects javascript: URLs for security', async () => {
        render(<ProjectForm {...defaultProps} />);

        const urlInput = screen.getByLabelText(/Project URL/i);
        await userEvent.type(urlInput, 'javascript:alert(1)');

        const nameInput = screen.getByLabelText(/Project Name/i);
        await userEvent.type(nameInput, 'Test Project');

        const descInput = screen.getByLabelText(/Description/i);
        await userEvent.type(descInput, 'A test project');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid URL starting with http/i)).toBeInTheDocument();
        });
    });

    it('rejects data: URLs for security', async () => {
        render(<ProjectForm {...defaultProps} />);

        const urlInput = screen.getByLabelText(/Project URL/i);
        await userEvent.type(urlInput, 'data:text/html,<script>alert(1)</script>');

        const nameInput = screen.getByLabelText(/Project Name/i);
        await userEvent.type(nameInput, 'Test Project');

        const descInput = screen.getByLabelText(/Description/i);
        await userEvent.type(descInput, 'A test project');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid URL starting with http/i)).toBeInTheDocument();
        });
    });

    it('calls onCancel when cancel button is clicked', async () => {
        render(<ProjectForm {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await userEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('submits form with correct data', async () => {
        mockOnSubmit.mockResolvedValue(undefined);

        render(<ProjectForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/Project Name/i);
        await userEvent.type(nameInput, 'My Project');

        const descInput = screen.getByLabelText(/Description/i);
        await userEvent.type(descInput, 'A great project');

        const urlInput = screen.getByLabelText(/Project URL/i);
        await userEvent.type(urlInput, 'https://github.com/user/project');

        const techInput = screen.getByLabelText(/Technologies/i);
        await userEvent.type(techInput, 'React, TypeScript, Node.js');

        const highlightsInput = screen.getByLabelText(/Key Features/i);
        await userEvent.type(highlightsInput, 'Feature 1\nFeature 2\nFeature 3');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            expect(mockOnSubmit).toHaveBeenCalledWith({
                name: 'My Project',
                description: 'A great project',
                url: 'https://github.com/user/project',
                technologies: ['React', 'TypeScript', 'Node.js'],
                highlights: ['Feature 1', 'Feature 2', 'Feature 3'],
            });
        });
    });

    it('shows loading state during submission', async () => {
        mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<ProjectForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/Project Name/i);
        await userEvent.type(nameInput, 'My Project');

        const descInput = screen.getByLabelText(/Description/i);
        await userEvent.type(descInput, 'A great project');

        const submitButton = screen.getByRole('button', { name: /Save Project/i });
        await userEvent.click(submitButton);

        expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
    });

    it('pre-fills data when project prop is provided', async () => {
        const existingProject = {
            id: '1',
            name: 'Existing Project',
            description: 'An existing project',
            url: 'https://github.com/user/existing',
            startDate: '2023-01-01T00:00:00Z',
            endDate: '2023-12-31T00:00:00Z',
            technologies: ['Python', 'Django'],
            highlights: ['Feature A', 'Feature B'],
        };

        render(<ProjectForm {...defaultProps} project={existingProject} />);

        expect(screen.getByLabelText(/Project Name/i)).toHaveValue('Existing Project');
        expect(screen.getByLabelText(/Description/i)).toHaveValue('An existing project');
        expect(screen.getByLabelText(/Project URL/i)).toHaveValue('https://github.com/user/existing');
        expect(screen.getByLabelText(/Start Date/i)).toHaveValue('2023-01-01');
        expect(screen.getByLabelText(/End Date/i)).toHaveValue('2023-12-31');
        expect(screen.getByLabelText(/Technologies/i)).toHaveValue('Python, Django');
        expect(screen.getByLabelText(/Key Features/i)).toHaveValue('Feature A\nFeature B');
    });
});
