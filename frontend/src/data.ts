export type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  updated: string;
  fixedDate?: string;
  relativeTime?: string;
  read: string;
  views: number;
  status: "Published" | "Draft";
  content?: string;
  publishedAt: number;
};

export const articles: Article[] = [
  {
    id: 1,
    title: "Panduan Setup Development Environment",
    slug: "setup-development-environment",
    summary:
      "Konfigurasi environment lokal yang konsisten untuk seluruh tim engineering.",
    category: "Engineering",
    tags: ["Development", "Docker"],
    author: "Raka Putra",
    updated: "12 Jun 2025",
    fixedDate: "12 Jun 2025",
    read: "8 mnt baca",
    views: 148,
    status: "Published",
    publishedAt: Date.parse("2025-06-12T09:00:00Z"),
  },
  {
    id: 2,
    title: "Standar Git Workflow untuk Tim Scrum",
    slug: "git-workflow-tim-scrum",
    summary:
      "Branching strategy, conventional commits, dan proses pull request yang efektif.",
    category: "Workflow",
    tags: ["Git", "Scrum"],
    author: "Nadia Aulia",
    updated: "10 Jun 2025",
    fixedDate: "10 Jun 2025",
    read: "6 mnt baca",
    views: 264,
    status: "Published",
    publishedAt: Date.parse("2025-06-10T09:00:00Z"),
  },
  {
    id: 3,
    title: "Integrasi API Authentication dengan JWT",
    slug: "api-authentication-jwt",
    summary:
      "Implementasi access token dan refresh token yang aman pada aplikasi internal.",
    category: "Backend",
    tags: ["API", "Security"],
    author: "Aditya Rama",
    updated: "8 Jun 2025",
    fixedDate: "8 Jun 2025",
    read: "12 mnt baca",
    views: 312,
    status: "Published",
    publishedAt: Date.parse("2025-06-08T09:00:00Z"),
  },
  {
    id: 4,
    title: "Checklist Code Review Frontend",
    slug: "checklist-code-review-frontend",
    summary:
      "Panduan praktis memastikan kualitas, aksesibilitas, dan performa antarmuka.",
    category: "Frontend",
    tags: ["React", "Quality"],
    author: "Sinta Dewi",
    updated: "6 Jun 2025",
    fixedDate: "6 Jun 2025",
    read: "5 mnt baca",
    views: 121,
    status: "Published",
    publishedAt: Date.parse("2025-06-06T09:00:00Z"),
  },
  {
    id: 5,
    title: "Strategi Database Migration",
    slug: "strategi-database-migration",
    summary: "Prinsip zero-downtime migration untuk layanan production.",
    category: "Backend",
    tags: ["Database", "DevOps"],
    author: "Raka Putra",
    updated: "4 Jun 2025",
    fixedDate: "4 Jun 2025",
    read: "10 mnt baca",
    views: 87,
    status: "Draft",
    publishedAt: 0,
  },
];

export const categories = [
  {
    name: "Engineering",
    slug: "engineering",
    count: 12,
    desc: "Arsitektur, standar, dan praktik engineering.",
    accent: "pink",
  },
  {
    name: "Frontend",
    slug: "frontend",
    count: 8,
    desc: "UI, React, aksesibilitas, dan design system.",
    accent: "lime",
  },
  {
    name: "Backend",
    slug: "backend",
    count: 10,
    desc: "API, database, keamanan, dan layanan.",
    accent: "yellow",
  },
  {
    name: "Workflow",
    slug: "workflow",
    count: 6,
    desc: "Scrum, Git, review, dan kolaborasi tim.",
    accent: "purple",
  },
];

export const tags = [
  "React",
  "TypeScript",
  "API",
  "Docker",
  "Git",
  "Scrum",
  "Security",
  "DevOps",
  "Database",
  "Quality",
];

export type SearchFilterOptions = {
  query?: string;
  category?: string;
  tag?: string;
  includeDrafts?: boolean;
};

/**
 * Utilitas pencarian artikel:
 * - partial match dan case-insensitive pada judul, kategori, dan tag
 * - filter boleh digabung (contoh: judul mengandung "JWT" + kategori "Backend")
 * - hanya artikel berstatus published yang muncul (kecuali includeDrafts bernilai true)
 */
export function searchArticles(
  items: Article[],
  options: SearchFilterOptions = {}
): Article[] {
  const { query, category, tag, includeDrafts = false } = options;
  const qClean = (query || "").trim().toLowerCase();
  const catClean =
    category && category !== "Semua kategori"
      ? category.trim().toLowerCase()
      : null;
  const tagClean =
    tag && tag !== "Semua tag" ? tag.trim().toLowerCase() : null;

  return items.filter((art) => {
    // Hanya artikel published, kecuali includeDrafts aktif
    if (!includeDrafts && art.status !== "Published") {
      return false;
    }

    // Filter kategori (partial match & case-insensitive)
    if (catClean) {
      const artCat = art.category.toLowerCase();
      if (!artCat.includes(catClean)) {
        return false;
      }
    }

    // Filter tag (partial match & case-insensitive)
    if (tagClean) {
      const hasMatchingTag = art.tags.some((t) =>
        t.toLowerCase().includes(tagClean)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Pencarian kata kunci pada judul, kategori, dan tag
    if (qClean) {
      const matchTitle = art.title.toLowerCase().includes(qClean);
      const matchCategory = art.category.toLowerCase().includes(qClean);
      const matchTag = art.tags.some((t) => t.toLowerCase().includes(qClean));
      const matchSummary = art.summary.toLowerCase().includes(qClean);
      const matchContent = (art.content || "").toLowerCase().includes(qClean);

      if (
        !matchTitle &&
        !matchCategory &&
        !matchTag &&
        !matchSummary &&
        !matchContent
      ) {
        return false;
      }
    }

    return true;
  });
}