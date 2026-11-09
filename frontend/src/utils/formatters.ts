import { useSyncExternalStore } from "react";
import type { ApiArticle } from "../api";

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
  fixedDate: string;
  relativeTime: string;
  read: string;
  views: number;
  status: "Published" | "Draft";
  publishedAt: number;
  serverTimestamp: number;
  content: string;
}

/**
 * Format tanggal tetap ke format bahasa Indonesia (ID) menggunakan zona waktu server (UTC).
 * Tanggal di UI harus sama untuk semua user, sesuai timestamp server (bukan zona waktu lokal user).
 */
export function formatFixedDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "Baru saja";
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Baru saja";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return "Baru saja";
  }
}

/**
 * Alias backward-compatible untuk formatDateIndo dengan format server tetap
 */
export function formatDateIndo(dateStr?: string | number | Date | null): string {
  return formatFixedDate(dateStr);
}

/**
 * Format label waktu relatif dalam bahasa Indonesia:
 * "baru saja", "2 menit yang lalu", "1 minggu yang lalu", dll.
 * Dihitung dari timestamp tetap vs waktu sekarang.
 */
export function formatRelativeTime(
  dateInput?: string | number | Date | null,
  nowTimestamp: number = Date.now()
): string {
  if (!dateInput) return "baru saja";
  try {
    const timestamp =
      typeof dateInput === "number"
        ? dateInput
        : new Date(dateInput).getTime();

    if (isNaN(timestamp) || timestamp <= 0) return "baru saja";

    const diffMs = nowTimestamp - timestamp;
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSeconds < 45) {
      return "baru saja";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes === 1) {
      return "1 menit yang lalu";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) {
      return "1 jam yang lalu";
    }
    if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return "kemarin";
    }
    if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) {
      return "1 minggu yang lalu";
    }
    if (diffWeeks < 4) {
      return `${diffWeeks} minggu yang lalu`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths <= 1) {
      return "1 bulan yang lalu";
    }
    if (diffMonths < 12) {
      return `${diffMonths} bulan yang lalu`;
    }

    const diffYears = Math.floor(diffDays / 365);
    if (diffYears <= 1) {
      return "1 tahun yang lalu";
    }
    return `${diffYears} tahun yang lalu`;
  } catch {
    return "baru saja";
  }
}

// Global time ticker untuk sinkronisasi pembaruan label relatif di UI
let tickerListeners: Array<() => void> = [];
let tickerTimerId: ReturnType<typeof setInterval> | null = null;

function subscribeToTimeTicker(callback: () => void): () => void {
  tickerListeners.push(callback);
  if (!tickerTimerId && typeof window !== "undefined") {
    tickerTimerId = setInterval(() => {
      tickerListeners.forEach((fn) => fn());
    }, 15000);
  }

  return () => {
    tickerListeners = tickerListeners.filter((fn) => fn !== callback);
    if (tickerListeners.length === 0 && tickerTimerId) {
      clearInterval(tickerTimerId);
      tickerTimerId = null;
    }
  };
}

function getTimeSnapshot(): number {
  return Math.floor(Date.now() / 15000);
}

function getServerTimeSnapshot(): number {
  return 0;
}

/**
 * React hook untuk memperbarui keterangan waktu relatif secara reaktif di UI seiring waktu
 * (mis. dari "2 menit yang lalu" -> "3 menit yang lalu") tanpa mengubah data tanggal di database.
 */
export function useRelativeTime(
  timestamp?: number | string | Date | null
): string {
  useSyncExternalStore(
    subscribeToTimeTicker,
    getTimeSnapshot,
    getServerTimeSnapshot
  );

  return formatRelativeTime(timestamp);
}

/**
 * Menghitung estimasi waktu membaca artikel
 */
export function calculateReadTime(content?: string): string {
  if (!content) return "1 mnt baca";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} mnt baca`;
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

  const fixedDate = formatFixedDate(api.published_at || api.created_at || publishedTimestamp);
  const relativeTime = formatRelativeTime(publishedTimestamp);

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
    updated: fixedDate,
    fixedDate,
    relativeTime,
    read: calculateReadTime(api.content),
    views: Number(api.views) || 0,
    status: api.status === "published" ? "Published" : "Draft",
    publishedAt: publishedTimestamp,
    serverTimestamp: publishedTimestamp,
    content: api.content || "",
  };
}
