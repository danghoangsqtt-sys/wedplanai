import { databases, DB_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { UserProfile } from '../types';

export interface AdminAnalytics {
  dailyVisits: { name: string; visits: number }[];
  onlineNow: number;
  totalUsers: number;
  userRoles: { admin: number; user: number; guest: number; inactive: number };
  trafficSources: { name: string; value: number }[];
}

export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
  try {
    const response = await databases.listDocuments(DB_ID, COLLECTIONS.PUBLIC_PROFILES, [
      Query.limit(100),
      Query.orderDesc('lastSeen'),
    ]);
    const users = response.documents.map(doc => ({
      uid: doc.uid,
      email: doc.email,
      displayName: doc.displayName,
      photoURL: doc.photoURL,
      role: doc.role,
      isActive: doc.isActive,
      joinedAt: doc.joinedAt,
      lastSeen: doc.lastSeen,
      enableCloudStorage: doc.enableCloudStorage,
      allowCustomApiKey: doc.allowCustomApiKey,
    } as UserProfile));
    return users.sort((a, b) => {
      const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
};

export const fetchAnalyticsData = async (): Promise<AdminAnalytics> => {
  const empty: AdminAnalytics = {
    dailyVisits: [],
    onlineNow: 0,
    totalUsers: 0,
    userRoles: { admin: 0, user: 0, guest: 0, inactive: 0 },
    trafficSources: [],
  };

  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logsResponse = await databases.listDocuments(DB_ID, COLLECTIONS.ANALYTICS_LOGS, [
      Query.greaterThan('timestamp', sevenDaysAgo),
      Query.limit(500),
    ]);

    const daysMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = weekDays[d.getDay()];
      if (!daysMap[key]) daysMap[key] = 0;
    }

    logsResponse.documents.forEach(doc => {
      const dayName = weekDays[new Date(doc.timestamp).getDay()];
      if (daysMap[dayName] !== undefined) daysMap[dayName]++;

      const rawRef = (doc.referrer || '').toLowerCase();
      let sourceName = 'Direct';
      if (!rawRef || rawRef === 'direct') sourceName = 'Direct';
      else if (rawRef.includes('facebook')) sourceName = 'Facebook';
      else if (rawRef.includes('google')) sourceName = 'Google';
      else if (rawRef.includes('youtube')) sourceName = 'YouTube';
      else if (rawRef.includes('zalo')) sourceName = 'Zalo';
      else if (rawRef.includes('tiktok')) sourceName = 'TikTok';
      else {
        try {
          const url = new URL(doc.referrer || '');
          sourceName = url.hostname.replace('www.', '');
          if (sourceName.includes(window.location.hostname)) sourceName = 'Internal';
        } catch {
          sourceName = 'Other';
        }
      }
      sourceMap[sourceName] = (sourceMap[sourceName] || 0) + 1;
    });

    const dailyVisits = Object.keys(daysMap).map(key => ({ name: key, visits: daysMap[key] }));
    const trafficSources = Object.keys(sourceMap)
      .map(key => ({ name: key, value: sourceMap[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const profilesResponse = await databases.listDocuments(DB_ID, COLLECTIONS.PUBLIC_PROFILES, [
      Query.limit(500),
    ]);

    let onlineCount = 0;
    const roleCounts = { admin: 0, user: 0, guest: 0, inactive: 0 };

    profilesResponse.documents.forEach(doc => {
      if (doc.role === 'ADMIN') roleCounts.admin++;
      else if (doc.role === 'GUEST') roleCounts.guest++;
      else if (doc.role === 'USER') {
        if (doc.isActive) roleCounts.user++;
        else roleCounts.inactive++;
      }
      if (doc.lastSeen && doc.lastSeen > tenMinsAgo) onlineCount++;
    });

    return {
      dailyVisits,
      onlineNow: onlineCount,
      totalUsers: profilesResponse.total,
      userRoles: roleCounts,
      trafficSources,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return empty;
  }
};
