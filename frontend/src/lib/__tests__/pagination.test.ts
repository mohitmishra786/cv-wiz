/**
 * Pagination Utilities Tests
 */

import {
    parsePaginationParams,
    calculatePagination,
    calculateSkip,
    createPaginatedResponse,
    buildPaginationLinks,
    generatePageNumbers,
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    type PaginationParams,
} from '../pagination';

describe('parsePaginationParams', () => {
    it('returns default values when no params provided', () => {
        const searchParams = new URLSearchParams();
        const result = parsePaginationParams(searchParams);

        expect(result.page).toBe(DEFAULT_PAGE);
        expect(result.limit).toBe(DEFAULT_LIMIT);
        expect(result.sortBy).toBeUndefined();
        expect(result.sortOrder).toBe('desc');
        expect(result.search).toBeUndefined();
    });

    it('parses page and limit correctly', () => {
        const searchParams = new URLSearchParams('page=3&limit=20');
        const result = parsePaginationParams(searchParams);

        expect(result.page).toBe(3);
        expect(result.limit).toBe(20);
    });

    it('enforces minimum page of 1', () => {
        const searchParams = new URLSearchParams('page=0');
        const result = parsePaginationParams(searchParams);

        expect(result.page).toBe(1);
    });

    it('enforces minimum limit of 1', () => {
        const searchParams = new URLSearchParams('limit=0');
        const result = parsePaginationParams(searchParams);

        expect(result.limit).toBe(1);
    });

    it('enforces maximum limit', () => {
        const searchParams = new URLSearchParams(`limit=${MAX_LIMIT + 10}`);
        const result = parsePaginationParams(searchParams);

        expect(result.limit).toBe(MAX_LIMIT);
    });

    it('parses sort parameters', () => {
        const searchParams = new URLSearchParams('sortBy=name&sortOrder=asc');
        const result = parsePaginationParams(searchParams);

        expect(result.sortBy).toBe('name');
        expect(result.sortOrder).toBe('asc');
    });

    it('parses search parameter', () => {
        const searchParams = new URLSearchParams('search=test query');
        const result = parsePaginationParams(searchParams);

        expect(result.search).toBe('test query');
    });

    it('handles invalid page numbers gracefully', () => {
        const searchParams = new URLSearchParams('page=invalid');
        const result = parsePaginationParams(searchParams);

        expect(result.page).toBe(1);
    });
});

describe('calculatePagination', () => {
    it('calculates pagination correctly', () => {
        const result = calculatePagination(100, 2, 10);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.total).toBe(100);
        expect(result.totalPages).toBe(10);
        expect(result.hasNextPage).toBe(true);
        expect(result.hasPrevPage).toBe(true);
    });

    it('calculates total pages correctly', () => {
        expect(calculatePagination(95, 1, 10).totalPages).toBe(10);
        expect(calculatePagination(100, 1, 10).totalPages).toBe(10);
        expect(calculatePagination(101, 1, 10).totalPages).toBe(11);
    });

    it('detects first page correctly', () => {
        const result = calculatePagination(100, 1, 10);

        expect(result.hasPrevPage).toBe(false);
        expect(result.hasNextPage).toBe(true);
    });

    it('detects last page correctly', () => {
        const result = calculatePagination(100, 10, 10);

        expect(result.hasPrevPage).toBe(true);
        expect(result.hasNextPage).toBe(false);
    });

    it('handles empty results', () => {
        const result = calculatePagination(0, 1, 10);

        expect(result.totalPages).toBe(0);
        expect(result.hasNextPage).toBe(false);
        expect(result.hasPrevPage).toBe(false);
    });
});

describe('calculateSkip', () => {
    it('calculates skip for first page', () => {
        expect(calculateSkip(1, 10)).toBe(0);
    });

    it('calculates skip for subsequent pages', () => {
        expect(calculateSkip(2, 10)).toBe(10);
        expect(calculateSkip(3, 10)).toBe(20);
        expect(calculateSkip(5, 25)).toBe(100);
    });
});

describe('createPaginatedResponse', () => {
    it('creates paginated response with correct structure', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const params: PaginationParams = { page: 2, limit: 10 };
        const result = createPaginatedResponse(data, 25, params);

        expect(result.data).toEqual(data);
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.total).toBe(25);
        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasNextPage).toBe(true);
        expect(result.pagination.hasPrevPage).toBe(true);
    });
});

describe('buildPaginationLinks', () => {
    it('builds correct links for middle page', () => {
        const params: PaginationParams = { page: 5, limit: 10 };
        const links = buildPaginationLinks('/api/items', params, 100);

        expect(links.first).toBe('/api/items?page=1&limit=10');
        expect(links.prev).toBe('/api/items?page=4&limit=10');
        expect(links.next).toBe('/api/items?page=6&limit=10');
        expect(links.last).toBe('/api/items?page=10&limit=10');
    });

    it('returns null for prev on first page', () => {
        const params: PaginationParams = { page: 1, limit: 10 };
        const links = buildPaginationLinks('/api/items', params, 100);

        expect(links.prev).toBeNull();
        expect(links.next).not.toBeNull();
    });

    it('returns null for next on last page', () => {
        const params: PaginationParams = { page: 10, limit: 10 };
        const links = buildPaginationLinks('/api/items', params, 100);

        expect(links.next).toBeNull();
        expect(links.prev).not.toBeNull();
    });

    it('includes sort and search parameters', () => {
        const params: PaginationParams = { 
            page: 2, 
            limit: 10, 
            sortBy: 'name', 
            sortOrder: 'asc',
            search: 'test' 
        };
        const links = buildPaginationLinks('/api/items', params, 100);

        expect(links.first).toContain('sortBy=name');
        expect(links.first).toContain('sortOrder=asc');
        expect(links.first).toContain('search=test');
    });
});

describe('generatePageNumbers', () => {
    it('returns all pages when total is less than max visible', () => {
        const pages = generatePageNumbers(3, 5, 7);

        expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('shows ellipsis when current page is in the middle', () => {
        const pages = generatePageNumbers(10, 20, 5);

        expect(pages).toContain(1);
        expect(pages).toContain('...');
        expect(pages).toContain(10);
        expect(pages).toContain(20);
    });

    it('shows correct range near start', () => {
        const pages = generatePageNumbers(2, 20, 5);

        expect(pages).toEqual([1, 2, 3, 4, 5, '...', 20]);
    });

    it('shows correct range near end', () => {
        const pages = generatePageNumbers(19, 20, 5);

        expect(pages).toEqual([1, '...', 16, 17, 18, 19, 20]);
    });

    it('handles single page', () => {
        const pages = generatePageNumbers(1, 1, 5);

        expect(pages).toEqual([1]);
    });

    it('handles two pages', () => {
        const pages = generatePageNumbers(1, 2, 5);

        expect(pages).toEqual([1, 2]);
    });
});
