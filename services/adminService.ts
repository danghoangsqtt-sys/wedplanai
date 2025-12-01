
import * as Firestore from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";

const { collection, getDocs, query, orderBy, limit, where, Timestamp } = Firestore;

export interface AdminAnalytics {
  dailyVisits: { name: string; visits: number }[];
  onlineNow: number;
  totalUsers: number;
  userRoles: { admin: number; user: number; guest: number; inactive: number };
  trafficSources: { name: string; value: number }[]; // NEW: Thống kê nguồn truy cập
}

export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    // OPTIMIZATION: Limit to 50 most recent users to save Firestore Reads.
    // In a real production app, you would implement "Load More" pagination.
    const q = query(
      collection(db, "public_profiles"),
      limit(50)
    );
    const snapshot = await getDocs(q);

    const users = snapshot.docs.map(doc => doc.data() as UserProfile);

    // Sort in memory (Newest first)
    return users.sort((a, b) => {
      const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn("Admin Service: Cannot fetch profiles (Permission Denied). Check Firestore Rules.");
    } else {
      console.error("Error fetching profiles:", error);
    }
    return [];
  }
};

export const fetchAnalyticsData = async (): Promise<AdminAnalytics> => {
  if (!db) {
    return {
      dailyVisits: [],
      onlineNow: 0,
      totalUsers: 0,
      userRoles: { admin: 0, user: 0, guest: 0, inactive: 0 },
      trafficSources: []
    };
  }

  try {
    // 1. Get Logs for Chart (Last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logsQ = query(
      collection(db, "analytics_logs"),
      where("timestamp", ">", sevenDaysAgo)
    );
    const logsSnapshot = await getDocs(logsQ);

    // Process logs into daily buckets & Traffic Sources
    const daysMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {}; // Map đếm nguồn traffic
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = weekDays[d.getDay()];
      if (!daysMap[key]) daysMap[key] = 0;
    }

    logsSnapshot.forEach(doc => {
      const data = doc.data() as { timestamp: number; referrer?: string };

      // A. Daily Visits Logic
      const date = new Date(data.timestamp);
      const dayName = weekDays[date.getDay()];
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName]++;
      }

      // B. Traffic Source Logic
      let sourceName = 'Direct';
      const rawRef = data.referrer ? data.referrer.toLowerCase() : '';

      if (!rawRef || rawRef === 'direct' || rawRef === '') {
        sourceName = 'Direct';
      } else if (rawRef.includes('facebook')) {
        sourceName = 'Facebook';
      } else if (rawRef.includes('google')) {
        sourceName = 'Google';
      } else if (rawRef.includes('youtube')) {
        sourceName = 'YouTube';
      } else if (rawRef.includes('zalo')) {
        sourceName = 'Zalo';
      } else if (rawRef.includes('tiktok')) {
        sourceName = 'TikTok';
      } else {
        try {
          // Cố gắng lấy hostname (ví dụ: https://abc.com/xyz -> abc.com)
          const url = new URL(data.referrer || '');
          sourceName = url.hostname.replace('www.', '');
          // Nếu là nội bộ (localhost hoặc domain của app)
          if (sourceName.includes(window.location.hostname)) sourceName = 'Internal';
        } catch {
          sourceName = 'Other';
        }
      }

      sourceMap[sourceName] = (sourceMap[sourceName] || 0) + 1;
    });

    const dailyVisits = Object.keys(daysMap).map(key => ({
      name: key,
      visits: daysMap[key]
    }));

    // Convert sourceMap to Array & Sort by value descending
    const trafficSources = Object.keys(sourceMap)
      .map(key => ({ name: key, value: sourceMap[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Lấy top 5 nguồn phổ biến nhất

    // 2. Calculate Online Users (Active in last 10 mins)
    // OPTIMIZATION: Instead of reading ALL users to count them, we ideally use a counter document.
    // For now, we still query but with a limit or specific where clause if possible.
    // However, to get accurate "Total Users", we unfortunately need to count.
    // To save costs, we rely on the client-side caching in the Store (don't call this function often).
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const profilesQ = query(collection(db, "public_profiles"));
    const profilesSnap = await getDocs(profilesQ);

    let onlineCount = 0;
    let roleCounts = { admin: 0, user: 0, guest: 0, inactive: 0 };

    profilesSnap.forEach(doc => {
      const p = doc.data() as UserProfile & { lastSeen?: number };
      // Count Roles
      if (p.role === 'ADMIN') roleCounts.admin++;
      else if (p.role === 'GUEST') roleCounts.guest++;
      else if (p.role === 'USER') {
        if (p.isActive) roleCounts.user++;
        else roleCounts.inactive++;
      }

      // Check online status (based on lastSeen field added in cloudService)
      if (p.lastSeen && p.lastSeen > tenMinsAgo) {
        onlineCount++;
      }
    });

    return {
      dailyVisits,
      onlineNow: onlineCount,
      totalUsers: profilesSnap.size,
      userRoles: roleCounts,
      trafficSources
    };

  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn("Admin Service: Cannot fetch analytics (Permission Denied).");
    } else {
      console.error("Error fetching analytics:", error);
    }
    return {
      dailyVisits: [],
      onlineNow: 0,
      totalUsers: 0,
      userRoles: { admin: 0, user: 0, guest: 0, inactive: 0 },
      trafficSources: []
    };
  }
};
