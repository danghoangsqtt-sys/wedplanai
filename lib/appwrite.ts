import { Client, Account, Databases, Storage, ID, Query, OAuthProvider, Permission, Role } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID as string;

export const COLLECTIONS = {
  USER_DATA: 'user_data',
  PUBLIC_PROFILES: 'public_profiles',
  PUBLIC_INVITATIONS: 'public_invitations',
  ANALYTICS_LOGS: 'analytics_logs',
  GUEST_USAGE: 'guest_usage',
} as const;

export { ID, Query, OAuthProvider, Permission, Role };
