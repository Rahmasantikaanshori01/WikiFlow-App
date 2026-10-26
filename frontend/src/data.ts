export type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  updated: string;
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
    read: "8 mnt",
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
    read: "6 mnt",
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
    read: "12 mnt",
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
    read: "5 mnt",
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
    read: "10 mnt",
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