'use client';

/**
 * Pagination Component
 * Provides a consistent, accessible pagination UI for list views
 */

import React from 'react';
import { generatePageNumbers } from '@/lib/pagination';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    className = '',
}) => {
    if (totalPages <= 1) return null;

    const pages = generatePageNumbers(currentPage, totalPages);
    const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
    const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

    return (
        <nav
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
            aria-label="Pagination"
        >
            {/* Results info */}
            {totalItems !== undefined && itemsPerPage !== undefined && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                </p>
            )}

            {/* Page buttons */}
            <div className="flex items-center gap-1">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Previous page"
                >
                    <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pages.map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                    ...
                                </span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page as number)}
                                    className={`inline-flex items-center justify-center min-w-[40px] px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        currentPage === page
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                                    }`}
                                    aria-label={`Page ${page}`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Next page"
                >
                    Next
                    <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </nav>
    );
};

export default Pagination;
