export type NewsStatus = 'draft' | 'published';

export interface NewsPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    status: NewsStatus;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    authorId: string | null;
}

export interface NewsPostInput {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    status: NewsStatus;
    publishedAt?: string | null;
}

export interface NewsUser {
    id: string;
    email: string | null;
}

export interface NewsSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: NewsUser;
}

