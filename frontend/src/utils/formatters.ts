import { ApiArticle } from "../api";

export interface FormattedArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  categoryId?: number;
  categorySlug?: string;
  tags: string[];
  tagIds: number[];
  author: string;
  updated: string;
  read: string;
  views: number;
  status: "Published" | "Draft";
  publishedAt: number;
  content: string;
}

/**
 * Format tanggal ke format bahasa Indonesia yang mudah dibaca
 */
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return "Baru saja";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Baru saja";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Baru saja";
  }
}

/**
 * Menghitung estimasi waktu membaca artikel
 */
export function calculateReadTime(content?: string): string {
  if (!content) return "1 mnt";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} mnt`;
}

/**
 * Mengonversi model ApiArticle dari backend ke objek yang digunakan antarmuka pengguna
 */
export function formatArticle(api: ApiArticle): FormattedArticle {
  const publishedTimestamp = api.published_at
    ? new Date(api.published_at).getTime()
    : api.created_at
      ? new Date(api.created_at).getTime()
      : Date.now();

  return {
    id: api.id,
    title: api.title,
    slug: api.slug,
    summary:
      api.excerpt?.trim() ||
      (api.content
        ? api.content.replace(/[#*`>_-]/g, "").slice(0, 140).trim() + "..."
        : "Tidak ada ringkasan."),
    category: api.category?.name || "Umum",
    categoryId: api.category_id || api.category?.id,
    categorySlug: api.category?.slug,
    tags: (api.tags || []).map((t) => t.name),
    tagIds: (api.tags || []).map((t) => t.id),
    author: api.user?.name || "WikiFlow Member",
    updated: formatDateIndo(api.updated_at || api.published_at || api.created_at),
    read: calculateReadTime(api.content),
    views: Number(api.views) || 0,
    status: api.status === "published" ? "Published" : "Draft",
    publishedAt: publishedTimestamp,
    content: api.content || "",
  };
}
