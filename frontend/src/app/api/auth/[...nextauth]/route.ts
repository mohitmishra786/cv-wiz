/**
 * NextAuth.js Route Handler
 * Handles all /api/auth/* routes
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
