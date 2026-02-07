'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { Project } from '@/types';
import { isValidGitHubUsername, sanitizeGitHubUsername } from '@/lib/github-validation';

interface GitHubImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (projects: Partial<Project>[]) => Promise<void>;
}

export default function GitHubImportModal({ isOpen, onClose, onImport }: GitHubImportModalProps) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [repos, setRepos] = useState<any[]>([]);
    const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
    const { error } = useToast();

    const fetchRepos = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            error('Please enter a GitHub username');
            return;
        }

        // Validate username format on client side
        if (!isValidGitHubUsername(trimmedUsername)) {
            error('Invalid GitHub username. Use only letters, numbers, and hyphens. Cannot start or end with a hyphen.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/integrations/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            setRepos(data.projects);
            if (data.projects.length === 0) {
                error('No public repositories found');
            }
        } catch (err) {
            error(err instanceof Error ? err.message : 'Failed to fetch GitHub data');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        const projectsToImport = repos.filter(r => selectedRepos.has(r.name));
        await onImport(projectsToImport);
        onClose();
        // Reset state
        setRepos([]);
        setUsername('');
        setSelectedRepos(new Set());
    };

    const toggleRepo = (name: string) => {
        const next = new Set(selectedRepos);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        setSelectedRepos(next);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import from GitHub">
            <div className="space-y-6">
                {repos.length === 0 ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            GitHub Username
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(sanitizeGitHubUsername(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && fetchRepos()}
                                placeholder="e.g. facebook"
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                onClick={fetchRepos}
                                disabled={loading || !username.trim()}
                                className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
                            >
                                {loading ? 'Fetching...' : 'Fetch'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Select repositories to import</h3>
                            <button 
                                onClick={() => setRepos([])}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Change user
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {repos.map((repo) => (
                                <div 
                                    key={repo.name}
                                    className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${selectedRepos.has(repo.name) ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                                    onClick={() => toggleRepo(repo.name)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRepos.has(repo.name)}
                                        onChange={() => toggleRepo(repo.name)}
                                        className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{repo.name}</div>
                                        <div className="text-sm text-gray-500 line-clamp-1">{repo.description}</div>
                                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                                            {repo.technologies.join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedRepos.size === 0}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                Import {selectedRepos.size} Project{selectedRepos.size !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}