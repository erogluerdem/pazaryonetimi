import { ensureUserTenant } from '@/lib/ensure-user-tenant';
import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { verifyCredentials } from "@/lib/auth-credentials"
import { createBackendSessionToken } from "@/lib/backend-session-token"

type AuthProviderSettings = {
    google_id: string;
    google_secret: string;
    facebook_id: string;
    facebook_secret: string;
};

// Lazy loading of auth settings - only fetch when actually needed
let cachedSettings: AuthProviderSettings | null = null;
let settingsFetched = false;

async function getAuthSettings() {
    // Return cached settings if already fetched
    if (settingsFetched) {
        return cachedSettings;
    }

    try {
        // Fetch all auth-related system settings
        const settings = await prisma.systemSettings.findMany({
            where: {
                key: {
                    in: ['google_id', 'google_secret', 'facebook_id', 'facebook_secret']
                }
            }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value as string;
            return acc;
        }, {} as Record<string, string>);

        cachedSettings = {
            google_id: settingsMap.google_id || process.env.GOOGLE_CLIENT_ID || "",
            google_secret: settingsMap.google_secret || process.env.GOOGLE_CLIENT_SECRET || "",
            facebook_id: settingsMap.facebook_id || process.env.FACEBOOK_CLIENT_ID || "",
            facebook_secret: settingsMap.facebook_secret || process.env.FACEBOOK_CLIENT_SECRET || "",
        };
    } catch (error) {
        console.warn("[NextAuth] Failed to load auth settings from database, using env vars:", error);
        cachedSettings = {
            google_id: process.env.GOOGLE_CLIENT_ID || "",
            google_secret: process.env.GOOGLE_CLIENT_SECRET || "",
            facebook_id: process.env.FACEBOOK_CLIENT_ID || "",
            facebook_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
        };
    }
    
    settingsFetched = true;
    return cachedSettings;
}

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
    const dynamicSettings = (await getAuthSettings())!;

    return {
        adapter: PrismaAdapter(prisma),
        providers: [
            // Google OAuth - only register if credentials exist
            ...(dynamicSettings.google_id && dynamicSettings.google_id !== ""
                ? [
                    Google({
                        clientId: dynamicSettings.google_id,
                        clientSecret: dynamicSettings.google_secret,
                        allowDangerousEmailAccountLinking: true,
                    }),
                ]
                : []),
            // Facebook OAuth - only register if credentials exist
            ...(dynamicSettings.facebook_id && dynamicSettings.facebook_id !== ""
                ? [
                    Facebook({
                        clientId: dynamicSettings.facebook_id,
                        clientSecret: dynamicSettings.facebook_secret,
                        allowDangerousEmailAccountLinking: true,
                    }),
                ]
                : []),
            Credentials({
                name: "Credentials",
                credentials: {
                    email: { label: "Email", type: "email" },
                    password: { label: "Password", type: "password" }
                },
                async authorize(credentials) {
                    if (!credentials?.email || !credentials?.password) return null;

                    try {
                        const verified = await verifyCredentials(
                            credentials.email as string,
                            credentials.password as string,
                        );

                        if (!verified) return null;

                        try {
                            if (verified.tenantId) {
                                await prisma.activityLog.create({
                                    data: {
                                        tenantId: verified.tenantId,
                                        userId: verified.id,
                                        action: 'LOGIN',
                                        resource: 'user',
                                        resourceId: verified.id,
                                        details: { method: 'credentials', ip: 'server' },
                                    },
                                });
                            }
                        } catch { }

                        return verified;
                    } catch (error) {
                        console.error("Authentication flow error:", error);
                        return null;
                    }
                }
            })
        ],
        pages: {
            signIn: "/login",
            error: "/login",
        },
        events: {
            async createUser({ user }: { user: any }) {
                const tenantId = await ensureUserTenant(user.id, user.name);
                if (tenantId) user.tenantId = tenantId;
            },
        },
        callbacks: {
            async signIn({ user, account }: { user: any; account: any }) {
                if (account?.provider !== 'credentials' && user.id) {
                    const tenantId = await ensureUserTenant(user.id, user.name);
                    if (tenantId) user.tenantId = tenantId;
                }
                return true;
            },
            async session({ session, token }: { session: any; token: any }) {
                if (session.user && token?.sub) {
                    session.user.id = token.sub;
                    (session.user as any).type = token.type;
                    (session.user as any).tenantId = token.tenantId;
                    (session.user as any).isOnboarded = token.isOnboarded;
                    (session.user as any).accessToken = token.accessToken;
                }
                
                // For OAuth users, if tenantId is missing in token, fetch it
                if (session.user && !(session.user as any).tenantId) {
                    const user = await prisma.user.findUnique({
                        where: { id: session.user.id },
                        select: { tenantId: true, type: true }
                    });
                    if (user) {
                        (session.user as any).tenantId = user.tenantId;
                        (session.user as any).type = user.type;
                    }
                }

                if (session.user?.id) {
                    const currentUser = await prisma.user.findUnique({
                        where: { id: session.user.id },
                        select: { id: true, email: true, tenantId: true, type: true },
                    });
                    if (currentUser?.tenantId) {
                        session.user.tenantId = currentUser.tenantId;
                        session.user.type = currentUser.type;
                        session.user.accessToken = createBackendSessionToken({ ...currentUser, tenantId: currentUser.tenantId }) || session.user.accessToken;
                    } else {
                        session.user.tenantId = undefined;
                        session.user.accessToken = undefined;
                    }
                }
                return session;
            },
            async jwt({ token, user, account }: { token: any; user: any; account: any }) {
                if (user) {
                    token.sub = user.id;
                    token.type = (user as any).type;
                    token.tenantId = (user as any).tenantId;
                    token.isOnboarded = (user as any).isOnboarded;
                    token.accessToken = (user as any).accessToken;
                }
                if (token.tenantId && token.isOnboarded !== true) {
                    try {
                        const tenant = await prisma.tenant.findUnique({
                            where: { id: token.tenantId },
                            select: { isOnboarded: true }
                        });
                        if (tenant?.isOnboarded) {
                            token.isOnboarded = true;
                        }
                    } catch {}
                }
                if (!token.tenantId && token.sub) {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: token.sub },
                            select: { tenantId: true, type: true }
                        });
                        if (dbUser?.tenantId) {
                            token.tenantId = dbUser.tenantId;
                            token.type = dbUser.type;
                        }
                    } catch {}
                }
                return token;
            },
            async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
                if (url.startsWith('/')) return `${baseUrl}${url}`;
                else if (new URL(url).origin === baseUrl) return url;
                return `${baseUrl}/dashboard`;
            },
        },
        session: { strategy: "jwt" },
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "pazaryonetimi_secret_session_key_32_characters_long_2026",
        trustHost: true,
    } as any
})
