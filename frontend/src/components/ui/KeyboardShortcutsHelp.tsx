'use client';

/**
 * Keyboard Shortcuts Help Modal
 * Displays available keyboard shortcuts in a user-friendly modal
 */

import React from 'react';
import { Modal } from './Modal';
import { KeyboardShortcut } from '@/lib/keyboardNavigation';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: KeyboardShortcut[];
    title?: string;
}

/**
 * Format a keyboard shortcut for display
 */
function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('⌘');

    // Format special keys
    let key = shortcut.key;
    switch (key) {
        case 'ArrowUp':
            key = '↑';
            break;
        case 'ArrowDown':
            key = '↓';
            break;
        case 'ArrowLeft':
            key = '←';
            break;
        case 'ArrowRight':
            key = '→';
            break;
        case 'Enter':
            key = '↵';
            break;
        case 'Escape':
            key = 'Esc';
            break;
        case 'Tab':
            key = 'Tab';
            break;
        case ' ':
            key = 'Space';
            break;
    }

    parts.push(key);

    return parts.join(' + ');
}

/**
 * Group shortcuts by scope
 */
function groupShortcutsByScope(shortcuts: KeyboardShortcut[]): Map<string, KeyboardShortcut[]> {
    const groups = new Map<string, KeyboardShortcut[]>();

    for (const shortcut of shortcuts) {
        const scope = shortcut.scope || 'General';
        if (!groups.has(scope)) {
            groups.set(scope, []);
        }
        groups.get(scope)!.push(shortcut);
    }

    return groups;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
    isOpen,
    onClose,
    shortcuts,
    title = 'Keyboard Shortcuts',
}) => {
    const groupedShortcuts = groupShortcutsByScope(shortcuts);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use these keyboard shortcuts to navigate and interact with the application more efficiently.
                </p>

                {Array.from(groupedShortcuts.entries()).map(([scope, scopeShortcuts]) => (
                    <div key={scope}>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                            {scope}
                        </h3>
                        <div className="space-y-2">
                            {scopeShortcuts.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {shortcut.description}
                                    </span>
                                    <kbd className="px-2 py-1 text-xs font-mono font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded shadow-sm">
                                        {formatShortcut(shortcut)}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">?</kbd> anytime to show this help dialog.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default KeyboardShortcutsHelp;
