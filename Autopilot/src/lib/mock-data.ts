export type Product = {
  id: string;
  name: string;
  url: string;
  trackedSlug: string;
  clicks: number;
  views: number;
  recovered: number;
  revenue: number;
};

export const products: Product[] = [
  { id: "p1", name: "Design System Mastery", url: "https://gumroad.com/l/dsm", trackedSlug: "ap.link/dsm-x7k2", clicks: 1248, views: 942, recovered: 47, revenue: 1410 },
  { id: "p2", name: "Notion OS Template", url: "https://gumroad.com/l/notion-os", trackedSlug: "ap.link/notion-q9p1", clicks: 864, views: 612, recovered: 31, revenue: 620 },
  { id: "p3", name: "AI Prompt Pack Vol.2", url: "https://lemonsqueezy.com/prompts", trackedSlug: "ap.link/prmpt-m3z8", clicks: 2143, views: 1789, recovered: 92, revenue: 2760 },
  { id: "p4", name: "Indie Hacker Course", url: "https://gumroad.com/l/indie", trackedSlug: "ap.link/indie-w4r6", clicks: 412, views: 298, recovered: 12, revenue: 1188 },
  { id: "p5", name: "Brand Kit Bundle", url: "https://gumroad.com/l/brand", trackedSlug: "ap.link/brand-k8t3", clicks: 1567, views: 1102, recovered: 58, revenue: 1740 },
];

export type Notification = {
  id: string;
  user: string;
  productId: string;
  type: "discount" | "bundle" | "upgrade" | "reminder";
  status: "sent" | "opened" | "clicked" | "converted" | "ignored";
  intent: "low" | "medium" | "high";
  sentAt: string;
};

export const notifications: Notification[] = [
  { id: "n1", user: "ada@hey.com", productId: "p3", type: "discount", status: "converted", intent: "high", sentAt: "2026-05-05 09:14" },
  { id: "n2", user: "0x4f...a92e", productId: "p1", type: "bundle", status: "clicked", intent: "high", sentAt: "2026-05-05 08:42" },
  { id: "n3", user: "marc@design.co", productId: "p5", type: "reminder", status: "opened", intent: "medium", sentAt: "2026-05-04 19:20" },
  { id: "n4", user: "lia@studio.io", productId: "p2", type: "discount", status: "sent", intent: "medium", sentAt: "2026-05-04 16:03" },
  { id: "n5", user: "0x9c...11b3", productId: "p3", type: "upgrade", status: "converted", intent: "high", sentAt: "2026-05-04 12:50" },
  { id: "n6", user: "tom@indie.dev", productId: "p4", type: "reminder", status: "ignored", intent: "low", sentAt: "2026-05-04 09:15" },
  { id: "n7", user: "sara@kit.app", productId: "p5", type: "bundle", status: "clicked", intent: "high", sentAt: "2026-05-03 22:11" },
  { id: "n8", user: "0x77...e2f0", productId: "p1", type: "discount", status: "converted", intent: "high", sentAt: "2026-05-03 18:48" },
];

export type Engagement = {
  user: string;
  productId: string;
  visits: number;
  timeOnPage: number;
  intent: "low" | "medium" | "high";
  score: number;
  lastSeen: string;
};

export const engagement: Engagement[] = [
  { user: "ada@hey.com", productId: "p3", visits: 4, timeOnPage: 312, intent: "high", score: 92, lastSeen: "2m ago" },
  { user: "0x4f...a92e", productId: "p1", visits: 3, timeOnPage: 248, intent: "high", score: 87, lastSeen: "14m ago" },
  { user: "marc@design.co", productId: "p5", visits: 2, timeOnPage: 142, intent: "medium", score: 64, lastSeen: "1h ago" },
  { user: "lia@studio.io", productId: "p2", visits: 2, timeOnPage: 98, intent: "medium", score: 58, lastSeen: "2h ago" },
  { user: "0x9c...11b3", productId: "p3", visits: 5, timeOnPage: 401, intent: "high", score: 95, lastSeen: "3h ago" },
  { user: "tom@indie.dev", productId: "p4", visits: 1, timeOnPage: 22, intent: "low", score: 18, lastSeen: "5h ago" },
  { user: "sara@kit.app", productId: "p5", visits: 3, timeOnPage: 187, intent: "high", score: 81, lastSeen: "6h ago" },
  { user: "kev@build.fm", productId: "p2", visits: 1, timeOnPage: 41, intent: "low", score: 24, lastSeen: "8h ago" },
];

// Daily clicks for last 14 days
export const clicksDaily = [
  { d: "Apr 22", clicks: 142, recoveries: 4 },
  { d: "Apr 23", clicks: 168, recoveries: 6 },
  { d: "Apr 24", clicks: 201, recoveries: 8 },
  { d: "Apr 25", clicks: 187, recoveries: 7 },
  { d: "Apr 26", clicks: 224, recoveries: 11 },
  { d: "Apr 27", clicks: 198, recoveries: 9 },
  { d: "Apr 28", clicks: 256, recoveries: 12 },
  { d: "Apr 29", clicks: 289, recoveries: 14 },
  { d: "Apr 30", clicks: 312, recoveries: 16 },
  { d: "May 01", clicks: 278, recoveries: 13 },
  { d: "May 02", clicks: 334, recoveries: 18 },
  { d: "May 03", clicks: 367, recoveries: 21 },
  { d: "May 04", clicks: 401, recoveries: 24 },
  { d: "May 05", clicks: 389, recoveries: 22 },
];
