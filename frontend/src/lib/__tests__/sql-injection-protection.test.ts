import { describe, it, expect } from 'vitest';
import {
    sanitizeTableName,
    sanitizeEntityType,
    ALLOWED_TABLES
} from '@/lib/audit';

describe('SQL Injection Protection', () => {
    describe('sanitizeTableName', () => {
        it('should accept valid table names', () => {
            ALLOWED_TABLES.forEach((table: string) => {
                expect(() => sanitizeTableName(table)).not.toThrow();
            });
        });

        it('should reject invalid table names', () => {
            const invalidTables = [
                'users',
                'admin',
                'DROP TABLE users;--',
                '../../../etc/passwd',
                '${malicious}',
                'null',
                'undefined',
            ];

            invalidTables.forEach((table: string) => {
                expect(() => sanitizeTableName(table)).toThrow('Invalid table name');
            });
        });

        it('should reject table names with SQL injection patterns', () => {
            const maliciousInputs = [
                "user'; DROP TABLE users;--",
                'admin/*comment*/',
                "1' OR '1'='1",
                'UNION SELECT',
                'EXEC xp_cmdshell',
            ];

            maliciousInputs.forEach((input: string) => {
                expect(() => sanitizeTableName(input)).toThrow('Invalid table name');
            });
        });

        it('should reject empty and null values', () => {
            expect(() => sanitizeTableName('')).toThrow('Invalid table name');
        });

        it('should reject whitespace-only values', () => {
            expect(() => sanitizeTableName('   ')).toThrow('Invalid table name');
        });
    });

    describe('sanitizeEntityType', () => {
        it('should accept valid entity types', () => {
            const validTypes = [
                'User', 'Experience', 'Skill', 'Education', 'Project',
                'Publication', 'CoverLetter', 'UserSettings', 'Feedback', 'Profile'
            ];

            validTypes.forEach((type: string) => {
                expect(() => sanitizeEntityType(type)).not.toThrow();
            });
        });

        it('should reject invalid entity types', () => {
            const invalidTypes = [
                'user',  // Case-sensitive
                'admin',
                'System',
                'root',
            ];

            invalidTypes.forEach((type: string) => {
                expect(() => sanitizeEntityType(type)).toThrow('Invalid entity type');
            });
        });

        it('should reject SQL injection patterns in entity types', () => {
            const maliciousInputs = [
                "User'; DROP TABLE users;--",
                'Experience OR 1=1',
                'Skill UNION SELECT',
            ];

            maliciousInputs.forEach((input: string) => {
                expect(() => sanitizeEntityType(input)).toThrow('Invalid entity type');
            });
        });
    });
});
