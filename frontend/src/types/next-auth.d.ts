import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        idToken?: string;
    }

    interface Account {
        access_token?: string;
        id_token?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        idToken?: string;
    }
}
