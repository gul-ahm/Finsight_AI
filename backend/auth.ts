import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import { verifyPassword, isValidEmailDomain } from './auth-utils';

// Define the NextAuth options
export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {

        // In a real application, you would validate the credentials against your database
        if (credentials?.email && credentials?.password) {
          // Validate email domain
          if (!isValidEmailDomain(credentials.email)) {
            throw new Error('Please use a valid email from a recognized provider');
          }

          // Find user
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          // Check if user has verified their email (if applicable)
          if (user.emailVerificationToken) {
            throw new Error('Please verify your email before signing in');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          };
        }

        return null;
      }
    })
  ],

  // Configure session
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure JWT
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  // Configure callbacks
  callbacks: {
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        // Extend the session user type to include id
        (session.user as any).id = token.sub;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
      }
      return token;
    },

    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered', { user, account, profile });

      // For OAuth providers, create user if they don't exist
      if (account?.provider) {
        try {
          // Check if user already exists
          let existingUser = await prisma.user.findUnique({ where: { email: user.email! } });

          if (!existingUser) {
            // Validate email domain for OAuth users too
            if (user.email && !isValidEmailDomain(user.email)) {
              console.log('OAuth user with invalid email domain rejected');
              return false;
            }

            // Create new user
            console.log('Creating new user');
            existingUser = await prisma.user.create({
              data: {
                name: user.name!,
                email: user.email!,
                image: user.image,
                // Prisma user model defaults initialize relations/arrays as empty automatically or via default
              }
            });
          }

          // Update user image if it has changed
          if (user.image && existingUser.image !== user.image) {
            console.log('Updating user image');
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image: user.image }
            });
          }

          // Add user ID to the user object
          user.id = existingUser.id;
          console.log('SignIn successful', { userId: user.id });
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }

      console.log('Credentials signIn successful');
      return true;
    },
    async redirect({ url, baseUrl }) {
      // DEBUG LOG
      console.log('Redirect Callback:', { url, baseUrl });

      // Force root redirect to go to dashboard/home
      if (url === '/' || url === baseUrl) {
        return baseUrl; // Secure: uses configured NEXTAUTH_URL
      }

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        // Ensure we don't double up the basePath if it's already there
        if (url.startsWith("/finsight-ai")) {
          return `${baseUrl}${url.substring("/finsight-ai".length)}`;
        }
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  // Add error handling
  events: {
    async signOut(message) {
      console.log('User signed out:', message);
    }
  },

  // Configure pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Error code passed in query string as ?error=
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
