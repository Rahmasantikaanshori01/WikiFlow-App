"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { BackButton } from "./components/BackButton";
import { SafeMarkdown } from "./components/SafeMarkdown";
import {
  loginApi,
  logoutApi,
  getCurrentUser,
  getArticlesApi,
  getPopularArticlesApi,
  getArticleBySlugApi,
  recordArticleViewApi,
  createArticleApi,
  updateArticleApi,
  deleteArticleApi,
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  getTagsApi,
  createTagApi,
  updateTagApi,
  deleteTagApi,
  getAdminUsersApi,
  updateUserRoleApi,
  type ApiUser,
  type ApiCategory,
  type ApiTag,
} from "./api";
import {
  formatArticle,
  type FormattedArticle,
} from "./utils/formatters";

/**
 * Komponen Icon SVG serbaguna untuk navigasi dan elemen UI
 */
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const iconPaths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    fire: (
      <path d="M12 22c4 0 7-3 7-7 0-3-2-6-5-9 0 3-2 4-3 5 0-3-1-6-3-9 0 5-4 7-4 13 0 4 4 7 8 7z" />
    ),
    folder: <path d="M3 6h7l2 2h9v11H3z" />,
    tag: (
      <>
        <path d="M20 13 13 20 3 10V3h7z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4-1 11-11-3-3L5 16zM14 7l3 3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6m3-3h-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m20 20-4.5-4.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    book: (
      <>
        <path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z" />
        <path d="M20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4z" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M15 4h5v16h-5" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V5H5v11h3" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name] || iconPaths.file}
    </svg>
  );
}

/**
 * Logo dan nama Brand WikiFlow
 */
function Brand() {
  return (
    <button className="brand" onClick={() => go("/")}>
      <span>W</span>
      <b>WikiFlow</b>
    </button>
  );
}

/**
 * Navigasi aplikasi berbasis client-side History API
 */
function go(path: string, replace = false) {
  if (typeof window === "undefined") return;
  const index = history.state?.idx ?? 0;
  if (replace) {
    history.replaceState({ ...(history.state || {}), idx: index }, "", path);
  } else {
    history.pushState({ idx: index + 1 }, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Komponen Pemilih Tema (System, Light, Dark)
 * Mendukung deteksi otomatis tema laptop / sistem operasi secara real-time
 */
function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wikiflow-theme") || "system";
    }
    return "system";
  });

  useEffect(() => {
    const saved = localStorage.getItem("wikiflow-theme") || "system";

    const applyTheme = (pref: string) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = pref === "dark" || (pref === "system" && prefersDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      document.documentElement.dataset.themePreference = pref;
    };

    applyTheme(saved);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentSaved = localStorage.getItem("wikiflow-theme") || "system";
      if (currentSaved === "system") {
        document.documentElement.dataset.theme = e.matches ? "dark" : "light";
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    const handleThemeSync = (event: Event) => {
      const nextTheme = (event as CustomEvent<string>).detail;
      setTheme(nextTheme);
    };
    window.addEventListener("wikiflow:theme", handleThemeSync);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("wikiflow:theme", handleThemeSync);
    };
  }, []);

  const changeTheme = (newPreference: string) => {
    setTheme(newPreference);
    localStorage.setItem("wikiflow-theme", newPreference);

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = newPreference === "dark" || (newPreference === "system" && prefersDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.dataset.themePreference = newPreference;

    window.dispatchEvent(
      new CustomEvent("wikiflow:theme", { detail: newPreference })
    );
  };

  return (
    <label className="theme-toggle" title="Pilih tema">
      <span>◐</span>
      <select
        aria-label="Tema"
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}

const navItems = [
  ["Beranda", "grid", "/app"],
  ["Artikel", "file", "/articles"],
  ["Kategori", "folder", "/categories"],
  ["Tag", "tag", "/tags"],
];

const adminNavItems = [
  ["Kelola Artikel", "edit", "/admin/articles"],
  ["Kelola Kategori", "folder", "/admin/categories"],
  ["Kelola Tag", "tag", "/admin/tags"],
  ["Kelola Pengguna", "users", "/admin/users"],
];

/**
 * Sidebar Navigasi Utama dan Menu Administrasi
 */
function Sidebar({
  role,
  user,
  close,
  logout,
}: {
  role: "Admin" | "User";
  user: ApiUser | null;
  close?: () => void;
  logout: () => void;
}) {
  const path = location.pathname;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role === "Admin"
      ? "AD"
      : "US";

  const renderLink = ([label, icon, href]: string[]) => {
    const isActive =
      path === href || (href === "/articles" && path.startsWith("/articles/"));
    return (
      <button
        key={label}
        className={isActive ? "navitem active" : "navitem"}
        onClick={() => {
          go(href);
          close?.();
        }}
      >
        <Icon name={icon} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <div className="side-top">
        <Brand />
        <button className="close-mobile" onClick={close}>
          ×
        </button>
      </div>

      <div className="workspace">
        <i>WF</i>
        <div>
          <span>WORKSPACE</span>
          <b>Internal Knowledge Base</b>
        </div>
      </div>

      <nav>
        <small>UTAMA</small>
        {navItems.map(renderLink)}
        {role === "Admin" && (
          <>
            <div className="navline" />
            <small>ADMINISTRATION</small>
            {adminNavItems.map(renderLink)}
          </>
        )}
      </nav>

      <div className="side-bottom">
        <button className="navitem" onClick={() => go("/articles")}>
          <Icon name="book" />
          <span>Dokumentasi Tim</span>
        </button>

        <div className="profile">
          <span className="avatar">{initials}</span>
          <div>
            <b>{user?.name || (role === "Admin" ? "Administrator" : "User WikiFlow")}</b>
            <small>{role}</small>
          </div>
          <button title="Keluar" onClick={logout}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Modal Dialog Pencarian Cepat (Ctrl+K)
 * Terhubung langsung ke database backend melalui parameter search
 */
function Search({ close }: { close: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormattedArticle[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getArticlesApi({ search: query.trim(), per_page: 5 });
        const list = res.data?.data || [];
        setResults(list.map(formatArticle));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="modal-bg" onMouseDown={close}>
      <div className="searchbox" onMouseDown={(e) => e.stopPropagation()}>
        <div className="searchfield">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari artikel, panduan, atau solusi teknis..."
          />
          <kbd>ESC</kbd>
        </div>

        <div className="results">
          <small>
            {loading
              ? "MENCARI..."
              : query
                ? `${results.length} HASIL DITEMUKAN`
                : "ARTIKEL YANG DISARANKAN"}
          </small>
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                go(`/articles/${item.slug}`);
                close();
              }}
            >
              <span className="result-icon">
                <Icon name="file" />
              </span>
              <div>
                <b>{item.title}</b>
                <p>{item.summary}</p>
                <em>
                  {item.category} · {item.updated}
                </em>
              </div>
              <Icon name="arrow" />
            </button>
          ))}
          {!loading && !results.length && (
            <div className="empty">
              Tidak ada hasil ditemukan.
              <span>Coba gunakan kata kunci lain.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Topbar Navigasi Atas
 */
function Topbar({
  role,
  user,
  openMenu,
  openSearch,
}: {
  role: "Admin" | "User";
  user: ApiUser | null;
  openMenu: () => void;
  openSearch: () => void;
}) {
  const title = location.pathname.includes("admin")
    ? "Administration"
    : location.pathname.includes("articles")
      ? "Artikel"
      : location.pathname.includes("categories")
        ? "Kategori"
        : location.pathname.includes("tags")
          ? "Tag"
          : "Knowledge Hub";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role === "Admin"
      ? "AD"
      : "US";

  return (
    <header className="topbar">
      <div className="crumb">
        <button onClick={openMenu} className="hamb" aria-label="Buka menu">
          <Icon name="menu" />
        </button>
        <span>WikiFlow</span>
        <i>/</i>
        <b>{title}</b>
      </div>

      <div className="top-actions">
        <button className="topsearch" onClick={openSearch}>
          <Icon name="search" size={16} />
          <span>Cari dokumentasi...</span>
          <kbd>Ctrl K</kbd>
        </button>

        <ThemeToggle />

        <button className="bell" aria-label="Notifikasi">
          <Icon name="bell" />
        </button>

        <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>

        <button
          className="avatar avatar-button"
          onClick={() => go("/profile")}
          aria-label="Buka profil"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

/**
 * Kartu Ringkasan Artikel
 */
function ArticleCard({
  a,
  showViews = false,
}: {
  a: FormattedArticle;
  showViews?: boolean;
}) {
  const authorInitials = a.author
    ? a.author
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "WF";

  return (
    <button className="article-card" onClick={() => go(`/articles/${a.slug}`)}>
      <div className="card-copy">
        <div className="badges">
          <span>{a.category}</span>
          {a.tags.slice(0, 2).map((t) => (
            <i key={t}>#{t}</i>
          ))}
          {showViews && (
            <span className="view-badge">
              <Icon name="eye" size={12} />
              {a.views} dilihat
            </span>
          )}
        </div>
        <h3>{a.title}</h3>
        <p>{a.summary}</p>
        <footer>
          <span className="mini-avatar">{authorInitials}</span>
          <b>{a.author}</b>
          <i>•</i>
          <span>{a.updated}</span>
          <i>•</i>
          <span>{a.read}</span>
        </footer>
      </div>
      <span className="open-arrow">
        <Icon name="arrow" />
      </span>
    </button>
  );
}

/**
 * Halaman Dashboard Utama
 */
function Dashboard({
  role,
  user,
}: {
  role: "Admin" | "User";
  user: ApiUser | null;
}) {
  const [latestArticles, setLatestArticles] = useState<FormattedArticle[]>([]);
  const [popularArticles, setPopularArticles] = useState<FormattedArticle[]>([]);
  const [categoriesList, setCategoriesList] = useState<ApiCategory[]>([]);
  const [tagsList, setTagsList] = useState<ApiTag[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [articlesRes, popularRes, categoriesRes, tagsRes] = await Promise.all([
          getArticlesApi({ sort: "latest", per_page: 3 }),
          getPopularArticlesApi(4),
          getCategoriesApi(),
          getTagsApi(),
        ]);

        if (!isMounted) return;

        const latestList = (articlesRes.data?.data || []).map(formatArticle);
        const popList = (popularRes.data || []).map(formatArticle);

        setLatestArticles(latestList);
        setPopularArticles(popList);
        setCategoriesList(categoriesRes.data || []);
        setTagsList(tagsRes.data || []);
        setTotalArticles(articlesRes.data?.total || latestList.length);

        const viewsSum = popList.reduce((acc, curr) => acc + curr.views, 0);
        setTotalViews(viewsSum);
      } catch {
        // Fallback jika jaringan mengalami timeout sementara
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const statList = [
    ["file", String(totalArticles), "Total Artikel", "pink"],
    ["folder", String(categoriesList.length), "Kategori", "lime"],
    ["tag", String(tagsList.length), "Total Tag", "yellow"],
    ["fire", String(totalViews), "Total Tayangan", "purple"],
  ];

  const accents = ["pink", "lime", "yellow", "purple"];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Knowledge Hub</h1>
          <p>Semua pengetahuan teknis tim, dalam satu ruang kerja.</p>
        </div>
        {role === "Admin" && (
          <button className="primary" onClick={() => go("/admin/articles/new")}>
            <Icon name="plus" />
            Buat Artikel Baru
          </button>
        )}
      </div>

      <section className="welcome">
        <div className="stars">✦</div>
        <div>
          <small>SELAMAT DATANG KEMBALI</small>
          <h2>
            Halo, {user?.name || "Tim WikiFlow"}. <span>Mari berbagi pengetahuan.</span>
          </h2>
          <p>
            Temukan panduan, solusi teknis, dan dokumentasi terbaru dari tim.
          </p>
        </div>
        <button onClick={() => go("/articles")}>
          Jelajahi artikel <Icon name="arrow" />
        </button>
        <i className="spark">✣</i>
      </section>

      <div className="stats">
        {statList.map(([icon, count, label, color]) => (
          <div className="stat" key={label}>
            <span className={color}>
              <Icon name={icon} />
            </span>
            <div>
              <b>{loading ? "..." : count}</b>
              <small>{label}</small>
            </div>
            <em>↗ live</em>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section>
          <div className="section-title">
            <div>
              <h2>Artikel Terbaru</h2>
              <p>Pengetahuan terbaru yang dibagikan tim.</p>
            </div>
            <button onClick={() => go("/articles?sort=latest")}>
              Lihat semua <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="article-list">
            {latestArticles.map((a) => (
              <ArticleCard a={a} key={a.id} />
            ))}
            {!loading && latestArticles.length === 0 && (
              <div className="empty">
                Belum ada artikel yang diterbitkan.
                <span>Mulai dengan membuat artikel baru.</span>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="popular panel">
            <div className="section-title">
              <div>
                <h2>Artikel Populer</h2>
                <p>Paling banyak dibaca.</p>
              </div>
              <button
                className="popular-link"
                aria-label="Lihat semua artikel populer"
                onClick={() => go("/articles?sort=popular")}
              >
                <Icon name="fire" />
              </button>
            </div>
            {popularArticles.map((a, i) => (
              <button key={a.id} onClick={() => go(`/articles/${a.slug}`)}>
                <b>0{i + 1}</b>
                <div>
                  <strong>{a.title}</strong>
                  <span>
                    {a.category} · {a.views} tayangan
                  </span>
                </div>
              </button>
            ))}
            {!loading && popularArticles.length === 0 && (
              <div className="empty" style={{ padding: "16px 0" }}>
                Belum ada artikel populer.
              </div>
            )}
          </div>

          <div className="topics panel">
            <div className="section-title">
              <h2>Topik Populer</h2>
            </div>
            <div>
              {tagsList.slice(0, 7).map((t) => (
                <button
                  key={t.id}
                  onClick={() => go(`/articles?tag=${encodeURIComponent(t.name)}`)}
                >
                  #{t.name}
                  <span>{t.articles_count ?? 1}</span>
                </button>
              ))}
              {!loading && tagsList.length === 0 && (
                <small style={{ color: "var(--muted)" }}>Belum ada tag.</small>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="explore">
        <div className="section-title">
          <div>
            <h2>Jelajahi Kategori</h2>
            <p>Temukan dokumentasi berdasarkan area kerja.</p>
          </div>
          <button onClick={() => go("/categories")}>
            Semua kategori <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="cat-grid">
          {categoriesList.slice(0, 4).map((c, idx) => (
            <button
              key={c.id}
              onClick={() => go(`/articles?category=${encodeURIComponent(c.name)}`)}
              className={accents[idx % accents.length]}
            >
              <span>
                <Icon name="folder" />
              </span>
              <h3>{c.name}</h3>
              <p>{c.description || "Dokumentasi bidang kerja."}</p>
              <footer>
                {c.articles_count ?? 0} artikel <Icon name="arrow" size={14} />
              </footer>
            </button>
          ))}
          {!loading && categoriesList.length === 0 && (
            <div className="empty">Belum ada kategori terdaftar.</div>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Halaman Semua Artikel dengan Pencarian, Filter Kategori/Tag, dan Pengurutan Berbasis Database
 */
function ArticlesPage({ role }: { role: "Admin" | "User" }) {
  const params = new URLSearchParams(location.search);
  const requestedSort = params.get("sort");
  const sort =
    requestedSort === "popular" || requestedSort === "oldest"
      ? requestedSort
      : "latest";
  const query = params.get("q") || "";
  const selectedCategory = params.get("category") || "Semua kategori";
  const selectedTag = params.get("tag") || "Semua tag";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [articlesList, setArticlesList] = useState<FormattedArticle[]>([]);
  const [categoriesList, setCategoriesList] = useState<ApiCategory[]>([]);
  const [tagsList, setTagsList] = useState<ApiTag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const updateFilters = (values: Record<string, string>) => {
    const next = new URLSearchParams(location.search);
    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== "Semua kategori" && value !== "Semua tag") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    const searchString = next.toString();
    go(`/articles${searchString ? `?${searchString}` : ""}`);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      try {
        const [cats, tgs] = await Promise.all([
          getCategoriesApi(),
          getTagsApi(),
        ]);
        if (isMounted) {
          setCategoriesList(cats.data || []);
          setTagsList(tgs.data || []);
        }
      } catch {
        // ignore
      }
    }
    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchArticles() {
      setLoading(true);
      try {
        const res = await getArticlesApi({
          search: query,
          category: selectedCategory !== "Semua kategori" ? selectedCategory : undefined,
          tag: selectedTag !== "Semua tag" ? selectedTag : undefined,
          sort: sort as "latest" | "popular" | "oldest",
          page: 1,
          per_page: page * 6,
        });

        if (!isMounted) return;

        const list = (res.data?.data || []).map(formatArticle);
        setArticlesList(list);
        setTotalCount(res.data?.total || list.length);
      } catch {
        if (isMounted) setArticlesList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, [query, selectedCategory, selectedTag, sort, page]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">KNOWLEDGE BASE</span>
          <h1>Semua Artikel</h1>
          <p>Jelajahi seluruh dokumentasi teknis tim.</p>
        </div>
        {role === "Admin" && (
          <button className="primary" onClick={() => go("/admin/articles/new")}>
            <Icon name="plus" />
            Buat Artikel
          </button>
        )}
      </div>

      <div className="filters">
        <label>
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => updateFilters({ q: e.target.value, page: "1" })}
            placeholder="Cari judul atau isi artikel..."
          />
        </label>

        <select
          value={selectedCategory}
          onChange={(e) =>
            updateFilters({ category: e.target.value, page: "1" })
          }
        >
          <option>Semua kategori</option>
          {categoriesList.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => updateFilters({ tag: e.target.value, page: "1" })}
        >
          <option>Semua tag</option>
          {tagsList.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="sort-segment" aria-label="Urutkan artikel">
          {[
            ["latest", "Terbaru"],
            ["popular", "Populer"],
            ["oldest", "Terlama"],
          ].map(([val, label]) => (
            <button
              key={val}
              className={sort === val ? "active" : ""}
              onClick={() => updateFilters({ sort: val, page: "1" })}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className="sort-mobile"
          aria-label="Urutkan artikel"
          value={sort}
          onChange={(e) => updateFilters({ sort: e.target.value, page: "1" })}
        >
          <option value="latest">Terbaru</option>
          <option value="popular">Populer</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      {loading && articlesList.length === 0 && (
        <div className="empty">Memuat artikel...</div>
      )}

      <div className="article-list">
        {articlesList.map((a) => (
          <ArticleCard
            a={a}
            showViews={sort === "popular"}
            key={a.id}
          />
        ))}
      </div>

      {!loading && articlesList.length === 0 && (
        <div className="empty large">
          Tidak ada artikel ditemukan.
          <span>Coba hapus filter atau gunakan kata kunci lain.</span>
        </div>
      )}

      {articlesList.length < totalCount && (
        <button
          className="loadmore"
          onClick={() => updateFilters({ page: String(page + 1) })}
        >
          Muat lebih banyak ({articlesList.length} dari {totalCount})
        </button>
      )}
    </>
  );
}

/**
 * Halaman Jelajahi Kategori atau Tag
 */
function CategoriesPage({ tagsPage = false }: { tagsPage?: boolean }) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (tagsPage) {
          const res = await getTagsApi();
          if (isMounted) setTags(res.data || []);
        } else {
          const res = await getCategoriesApi();
          if (isMounted) setCategories(res.data || []);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [tagsPage]);

  const accents = ["pink", "lime", "yellow", "purple"];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">DISCOVERY</span>
          <h1>{tagsPage ? "Jelajahi Tag" : "Kategori"}</h1>
          <p>
            {tagsPage
              ? "Temukan dokumentasi berdasarkan topik teknis."
              : "Dokumentasi terorganisir berdasarkan area kerja."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty">Memuat data...</div>
      ) : tagsPage ? (
        <div className="tag-cloud">
          {tags.map((t) => (
            <button
              onClick={() => go(`/articles?tag=${encodeURIComponent(t.name)}`)}
              key={t.id}
            >
              #{t.name}
              <span>{t.articles_count ?? 1}</span>
            </button>
          ))}
          {tags.length === 0 && <div className="empty">Belum ada tag.</div>}
        </div>
      ) : (
        <div className="cat-grid big">
          {categories.map((c, index) => (
            <button
              key={c.id}
              className={accents[index % accents.length]}
              onClick={() => go(`/articles?category=${encodeURIComponent(c.name)}`)}
            >
              <span>
                <Icon name="folder" />
              </span>
              <h3>{c.name}</h3>
              <p>{c.description || "Kategori dokumentasi teknis."}</p>
              <footer>
                {c.articles_count ?? 0} artikel <Icon name="arrow" />
              </footer>
            </button>
          ))}
          {categories.length === 0 && (
            <div className="empty">Belum ada kategori.</div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Halaman Detail Artikel Dokumentasi dengan Safe Markdown Rendering dan View Tracking
 */
function ArticleDetail() {
  const slug = location.pathname.split("/").pop() || "";
  const [article, setArticle] = useState<FormattedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      if (!slug) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setNotFound(false);
      try {
        const res = await getArticleBySlugApi(slug);
        if (!isMounted) return;
        const formatted = formatArticle(res.data);
        setArticle(formatted);

        // View tracking akurat: Hanya hitung 1 kali per slug per tab session
        const sessionKey = `wf-viewed-${slug}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
          recordArticleViewApi(slug).then((viewRes) => {
            if (isMounted && viewRes?.views) {
              setArticle((prev) =>
                prev ? { ...prev, views: viewRes.views } : prev
              );
            }
          }).catch(() => {});
        }
      } catch {
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticle();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="empty">Memuat detail artikel...</div>;
  }

  if (notFound || !article) {
    return (
      <EmptyPage
        title="Artikel tidak ditemukan"
        text="Artikel yang Anda cari tidak tersedia, berstatus draft, atau telah dipindahkan."
      />
    );
  }

  const authorInitials = article.author
    ? article.author
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "WF";

  return (
    <article className="doc">
      <div className="doccrumb">
        Knowledge Hub / {article.category} / Artikel
      </div>
      <span className="category-pill">{article.category}</span>
      <h1>{article.title}</h1>
      {article.summary && <p className="lead">{article.summary}</p>}

      <div className="docmeta">
        <span className="avatar">{authorInitials}</span>
        <div>
          <b>{article.author}</b>
          <small>
            Diperbarui {article.updated} · {article.read} baca · {article.views} tayangan
          </small>
        </div>
        <div className="doc-tags">
          {article.tags.map((t) => (
            <i key={t}>#{t}</i>
          ))}
        </div>
      </div>

      <div className="docbody new-article">
        <aside>
          <b>Di halaman ini</b>
          <a href="#isi-artikel">Isi artikel</a>
        </aside>
        <section id="isi-artikel">
          <SafeMarkdown content={article.content} className="published-markdown" />
        </section>
      </div>
    </article>
  );
}

/**
 * Halaman Editor untuk Membuat dan Mengedit Artikel
 */
function Editor() {
  const path = location.pathname;
  const isEditing = path.includes("/edit");
  const editId = isEditing
    ? Number(path.split("/")[3]) || null
    : null;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  const [categoryOptions, setCategoryOptions] = useState<ApiCategory[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [tagOptions, setTagOptions] = useState<ApiTag[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTag, setNewTag] = useState("");

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Load Kategori & Tag
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, tgs] = await Promise.all([
          getCategoriesApi(),
          getTagsApi(),
        ]);
        setCategoryOptions(cats.data || []);
        setTagOptions(tgs.data || []);
      } catch {
        // ignore
      }
    }
    loadMeta();
  }, []);

  // Jika mode edit, muat artikel yang sudah ada
  useEffect(() => {
    if (!isEditing || !editId) return;

    async function loadExistingArticle() {
      setLoading(true);
      try {
        const articlesRes = await getArticlesApi({ per_page: 100 });
        const found = (articlesRes.data?.data || []).find((a) => a.id === editId);

        if (found) {
          setTitle(found.title);
          setSummary(found.excerpt || "");
          setContent(found.content || "");
          setCategoryId(found.category_id || found.category?.id || "");
          setSelectedTagIds((found.tags || []).map((t) => t.id));
        }
      } catch {
        setError("Gagal memuat artikel untuk diedit.");
      } finally {
        setLoading(false);
      }
    }

    loadExistingArticle();
  }, [isEditing, editId]);

  useEffect(() => {
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const handleBack = (e: Event) => {
      if (!dirty) return;
      e.preventDefault();
      setConfirm(() => (e as CustomEvent).detail.proceed);
    };

    addEventListener("beforeunload", handleUnload);
    addEventListener("wikiflow:before-back", handleBack);

    return () => {
      removeEventListener("beforeunload", handleUnload);
      removeEventListener("wikiflow:before-back", handleBack);
    };
  }, [dirty]);

  const handleSave = async (status: "draft" | "published") => {
    setError("");

    if (!title.trim()) {
      setError("Judul artikel wajib diisi.");
      return;
    }

    if (!content.trim()) {
      setError("Isi artikel wajib diisi.");
      return;
    }

    if (!categoryId) {
      setError("Kategori artikel wajib dipilih.");
      return;
    }

    setLoading(true);

    try {
      if (isEditing && editId) {
        await updateArticleApi(editId, {
          title: title.trim(),
          content: content.trim(),
          excerpt: summary.trim() || null,
          category_id: Number(categoryId),
          tag_ids: selectedTagIds,
          status,
        });
      } else {
        await createArticleApi({
          title: title.trim(),
          content: content.trim(),
          excerpt: summary.trim() || null,
          category_id: Number(categoryId),
          tag_ids: selectedTagIds,
          status,
        });
      }

      setDirty(false);
      setSaved(true);

      if (status === "published") {
        go("/admin/articles", true);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      const validationMsgs = apiErr.errors
        ? Object.values(apiErr.errors).flat().join(" ")
        : null;
      setError(validationMsgs || apiErr.message || "Gagal menyimpan artikel.");
    } finally {
      setLoading(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setContent((prev) => `${prev}${prev ? "\n" : ""}${snippet}`);
    setDirty(true);
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    try {
      const res = await createCategoryApi({ name });
      const created = res.data;
      setCategoryOptions((prev) => [...prev, created]);
      setCategoryId(created.id);
      setNewCategory("");
      setShowCategoryForm(false);
      setDirty(true);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || "Gagal membuat kategori baru.");
    }
  };

  const handleCreateTag = async () => {
    const name = newTag.trim();
    if (!name) return;

    try {
      const res = await createTagApi({ name });
      const created = res.data;
      setTagOptions((prev) => [...prev, created]);
      if (!selectedTagIds.includes(created.id)) {
        setSelectedTagIds((prev) => [...prev, created.id]);
      }
      setNewTag("");
      setShowTagForm(false);
      setDirty(true);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || "Gagal membuat tag baru.");
    }
  };

  return (
    <>
      <div className="page-head editor-head">
        <div>
          <span className="eyebrow">
            {isEditing ? "KELOLA ARTIKEL / EDIT" : "KELOLA ARTIKEL / BUAT"}
          </span>
          <h1>{isEditing ? "Edit Artikel" : "Buat Artikel Baru"}</h1>
          <p>Dokumentasikan pengetahuan teknis untuk tim.</p>
        </div>
        <div>
          {saved && <span className="saved-state">Draft tersimpan</span>}
          <button
            className="secondary"
            disabled={loading}
            onClick={() => handleSave("draft")}
          >
            {loading ? "Menyimpan..." : "Simpan Draft"}
          </button>
          <button
            className="primary"
            disabled={loading}
            onClick={() => handleSave("published")}
          >
            {loading ? "Menerbitkan..." : "Publikasikan"}
          </button>
        </div>
      </div>

      {error && (
        <div className="editor-error" role="alert">
          {error}
        </div>
      )}

      <div
        className="editor-card"
        onInput={() => {
          setDirty(true);
          setSaved(false);
        }}
      >
        <div className="formgrid">
          <label>
            Judul Artikel
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Panduan Setup Development Environment"
            />
          </label>

          <label>
            Slug
            <input value={slug} readOnly placeholder="slug-artikel" />
          </label>

          <label className="wide">
            Ringkasan
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tuliskan ringkasan singkat artikel..."
            />
          </label>

          <div className="field-group">
            <label>
              Kategori
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value) || "")}
              >
                <option value="">Pilih kategori</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {showCategoryForm ? (
              <div className="inline-create">
                <input
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Nama kategori baru"
                />
                <button type="button" onClick={handleAddCategory}>
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="field-action"
                onClick={() => setShowCategoryForm(true)}
              >
                + Tambah kategori
              </button>
            )}
          </div>

          <div className="field-group">
            <label>
              Tag
              <select
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedTagIds.includes(val)) {
                    setSelectedTagIds((prev) => [...prev, val]);
                    setDirty(true);
                  }
                }}
              >
                <option value="">Pilih tag</option>
                {tagOptions
                  .filter((t) => !selectedTagIds.includes(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>

            {selectedTagIds.length > 0 && (
              <div className="selected-chips">
                {selectedTagIds.map((tid) => {
                  const tagItem = tagOptions.find((t) => t.id === tid);
                  return (
                    <span key={tid}>
                      #{tagItem?.name || tid}
                      <button
                        type="button"
                        aria-label="Hapus tag"
                        onClick={() =>
                          setSelectedTagIds((prev) =>
                            prev.filter((item) => item !== tid)
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {showTagForm ? (
              <div className="inline-create">
                <input
                  autoFocus
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  placeholder="Nama tag baru"
                />
                <button type="button" onClick={handleCreateTag}>
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagForm(false)}
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="field-action"
                onClick={() => setShowTagForm(true)}
              >
                + Buat tag
              </button>
            )}
          </div>
        </div>

        <div className="markdown">
          <header>
            <div>
              <b>Isi Artikel (Markdown)</b>
              <small> Wajib diisi</small>
            </div>
            <div>
              <button type="button" onClick={() => insertSnippet("## Heading")}>
                H
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("**teks tebal**")}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("*teks miring*")}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertSnippet("[tautan](https://)")}
              >
                ↗
              </button>
              <button
                type="button"
                onClick={() =>
                  insertSnippet("```typescript\n// tulis kode di sini\n```")
                }
              >
                {"</>"}
              </button>
            </div>
          </header>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                "# Judul bagian\n\nTuliskan penjelasan teknis, langkah-langkah, contoh kode, dan catatan penting di sini..."
              }
            />
            <section>
              <small>LIVE PREVIEW (AMAN & XSS-FREE)</small>
              {content ? (
                <SafeMarkdown content={content} className="preview-content" />
              ) : (
                <div className="preview-empty">
                  Preview isi artikel akan tampil di sini.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="modal-bg">
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-title"
          >
            <span>!</span>
            <h2 id="discard-title">Perubahan belum disimpan</h2>
            <p>Yakin ingin kembali? Perubahan yang Anda buat akan hilang.</p>
            <div>
              <button
                className="secondary"
                onClick={() => setConfirm(null)}
              >
                Tetap di sini
              </button>
              <button
                className="danger"
                onClick={() => {
                  setDirty(false);
                  confirm();
                }}
              >
                Buang perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Halaman Manajemen Administrasi (Artikel, Kategori, Tag, Pengguna)
 * Terhubung langsung ke API CRUD dan otorisasi role Admin di Laravel
 */
function AdminPage({ type }: { type: string }) {
  const labels: Record<string, string> = {
    articles: "Artikel",
    categories: "Kategori",
    tags: "Tag",
    users: "Pengguna",
  };

  const [articles, setArticles] = useState<FormattedArticle[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Delete Article
  const [deletingArticle, setDeletingArticle] = useState<FormattedArticle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modal Ubah Role Pengguna
  const [pendingUserRole, setPendingUserRole] = useState<{
    user: ApiUser;
    nextRole: "admin" | "user";
  } | null>(null);

  // Modal Tambah / Edit Kategori / Tag
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null);
  const [editingTag, setEditingTag] = useState<ApiTag | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const loadData = useCallback(async () => {
    Promise.resolve().then(() => setLoading(true));
    try {
      if (type === "articles") {
        const res = await getArticlesApi({ per_page: 50 });
        setArticles((res.data?.data || []).map(formatArticle));
      } else if (type === "categories") {
        const res = await getCategoriesApi();
        setCategories(res.data || []);
      } else if (type === "tags") {
        const res = await getTagsApi();
        setTags(res.data || []);
      } else if (type === "users") {
        const res = await getAdminUsersApi();
        setUsers(res.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) await loadData();
    })();
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const confirmDeleteArticle = async () => {
    if (!deletingArticle) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteArticleApi(deletingArticle.id);
      setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id));
      setDeletingArticle(null);
      setFeedback("Artikel berhasil dihapus.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setDeleteError(apiErr.message || "Gagal menghapus artikel.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmChangeRole = async () => {
    if (!pendingUserRole) return;
    const { user, nextRole } = pendingUserRole;

    try {
      await updateUserRoleApi(user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      setPendingUserRole(null);
      setFeedback(`Role ${user.name} berhasil diubah menjadi ${nextRole}.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      alert(apiErr.message || "Gagal mengubah role pengguna.");
      setPendingUserRole(null);
    }
  };

  const handleSaveCategoryOrTag = async () => {
    if (!createName.trim()) return;

    try {
      if (type === "categories") {
        if (editingCategory) {
          await updateCategoryApi(editingCategory.id, {
            name: createName.trim(),
            description: createDesc.trim() || undefined,
          });
          setFeedback("Kategori berhasil diperbarui.");
        } else {
          await createCategoryApi({
            name: createName.trim(),
            description: createDesc.trim() || undefined,
          });
          setFeedback("Kategori berhasil ditambahkan.");
        }
      } else if (type === "tags") {
        if (editingTag) {
          await updateTagApi(editingTag.id, { name: createName.trim() });
          setFeedback("Tag berhasil diperbarui.");
        } else {
          await createTagApi({ name: createName.trim() });
          setFeedback("Tag berhasil ditambahkan.");
        }
      }

      setCreateName("");
      setCreateDesc("");
      setEditingCategory(null);
      setEditingTag(null);
      setShowCreateModal(false);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      alert(apiErr.message || "Gagal menyimpan data.");
    }
  };

  const handleDeleteCategory = async (cat: ApiCategory) => {
    if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;

    try {
      await deleteCategoryApi(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setFeedback("Kategori berhasil dihapus.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      alert(apiErr.message || "Kategori tidak dapat dihapus.");
    }
  };

  const handleDeleteTag = async (t: ApiTag) => {
    if (!window.confirm(`Hapus tag "${t.name}"?`)) return;

    try {
      await deleteTagApi(t.id);
      setTags((prev) => prev.filter((item) => item.id !== t.id));
      setFeedback("Tag berhasil dihapus.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      alert(apiErr.message || "Gagal menghapus tag.");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>Kelola {labels[type]}</h1>
          <p>Kelola data dan hak akses workspace Wikiflow.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            if (type === "articles") {
              go("/admin/articles/new");
            } else {
              setEditingCategory(null);
              setEditingTag(null);
              setCreateName("");
              setCreateDesc("");
              setShowCreateModal(true);
            }
          }}
        >
          <Icon name="plus" />
          Tambah {labels[type]}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 16px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "8px",
            color: "#10b981",
            fontSize: "13px",
          }}
        >
          {feedback}
        </div>
      )}

      <div className="admin-card">
        <div className="filters">
          <label>
            <Icon name="search" />
            <input placeholder={`Cari ${labels[type]?.toLowerCase()}...`} />
          </label>
          <select>
            <option>Semua status</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>

        <div className="table">
          {loading ? (
            <div className="empty">Memuat data {labels[type]}...</div>
          ) : type === "articles" ? (
            articles.map((a) => (
              <div className="tr" key={a.id}>
                <div>
                  <b>{a.title}</b>
                  <small>
                    {a.category} · {a.author}
                  </small>
                </div>
                <span className={`status ${a.status.toLowerCase()}`}>
                  {a.status}
                </span>
                <span>{a.updated}</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => go(`/admin/articles/${a.id}/edit`)}
                    style={{
                      border: 0,
                      background: "none",
                      color: "var(--pink)",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingArticle(a);
                    }}
                    style={{
                      border: 0,
                      background: "none",
                      color: "#f472b6",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          ) : type === "users" ? (
            users.map((user) => (
              <div className="tr user-row" key={user.id}>
                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
                <span>{user.created_at ? user.created_at.slice(0, 10) : "Aktif"}</span>
                <select
                  aria-label={`Ubah role ${user.name}`}
                  value={user.role}
                  onChange={(e) =>
                    setPendingUserRole({
                      user,
                      nextRole: e.target.value as "admin" | "user",
                    })
                  }
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
              </div>
            ))
          ) : type === "categories" ? (
            categories.map((c) => (
              <div className="tr" key={c.id}>
                <div>
                  <b>{c.name}</b>
                  <small>{c.description || c.slug}</small>
                </div>
                <span className="status published">
                  {c.articles_count ?? 0} artikel
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(c);
                      setEditingTag(null);
                      setCreateName(c.name);
                      setCreateDesc(c.description || "");
                      setShowCreateModal(true);
                    }}
                    style={{
                      border: 0,
                      background: "none",
                      color: "var(--pink)",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c)}
                    style={{
                      border: 0,
                      background: "none",
                      color: "#f472b6",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          ) : (
            tags.map((t) => (
              <div className="tr" key={t.id}>
                <div>
                  <b>#{t.name}</b>
                  <small>{t.slug}</small>
                </div>
                <span className="status published">
                  {t.articles_count ?? 0} artikel
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTag(t);
                      setEditingCategory(null);
                      setCreateName(t.name);
                      setCreateDesc("");
                      setShowCreateModal(true);
                    }}
                    style={{
                      border: 0,
                      background: "none",
                      color: "var(--pink)",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(t)}
                    style={{
                      border: 0,
                      background: "none",
                      color: "#f472b6",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Ubah Role Pengguna */}
      {pendingUserRole && (
        <div className="modal-bg">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <span>!</span>
            <h2>Ubah role pengguna?</h2>
            <p>
              Ubah role {pendingUserRole.user.name} menjadi{" "}
              <b>{pendingUserRole.nextRole}</b>?
            </p>
            <div>
              <button
                className="secondary"
                onClick={() => setPendingUserRole(null)}
              >
                Batal
              </button>
              <button className="primary" onClick={confirmChangeRole}>
                Ubah role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Artikel */}
      {deletingArticle && (
        <div className="modal-bg">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <span>!</span>
            <h2>Hapus artikel?</h2>
            <p>
              Apakah Anda yakin ingin menghapus artikel &ldquo;
              {deletingArticle.title}&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </p>
            {deleteError && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(244, 114, 182, 0.12)",
                  border: "1px solid rgba(244, 114, 182, 0.25)",
                  color: "var(--pink)",
                  fontSize: "12px",
                }}
                role="alert"
              >
                {deleteError}
              </div>
            )}
            <div>
              <button
                type="button"
                className="secondary"
                disabled={deleteLoading}
                onClick={() => {
                  setDeletingArticle(null);
                  setDeleteError(null);
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger"
                disabled={deleteLoading}
                onClick={confirmDeleteArticle}
              >
                {deleteLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Kategori / Tag */}
      {showCreateModal && (
        <div
          className="modal-bg"
          onMouseDown={() => {
            setShowCreateModal(false);
            setEditingCategory(null);
            setEditingTag(null);
            setCreateName("");
            setCreateDesc("");
          }}
        >
          <div
            className="confirm-dialog"
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", textAlign: "left" }}
          >
            <h2>
              {editingCategory || editingTag
                ? `Edit ${labels[type]}`
                : `Tambah ${labels[type]} Baru`}
            </h2>
            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              <label style={{ fontSize: "12px", display: "grid", gap: "4px" }}>
                Nama {labels[type]}
                <input
                  autoFocus
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={`Contoh: ${type === "categories" ? "DevOps" : "CI/CD"}`}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                  }}
                />
              </label>

              {type === "categories" && (
                <label style={{ fontSize: "12px", display: "grid", gap: "4px" }}>
                  Deskripsi
                  <textarea
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Deskripsi singkat kategori..."
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      minHeight: "70px",
                    }}
                  />
                </label>
              )}
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCategory(null);
                  setEditingTag(null);
                  setCreateName("");
                  setCreateDesc("");
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSaveCategoryOrTag}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Halaman Landing Page Publik WikiFlow
 */
function Landing() {
  const [popularArticles, setPopularArticles] = useState<FormattedArticle[]>([]);

  useEffect(() => {
    getPopularArticlesApi(3)
      .then((res) => {
        setPopularArticles((res.data || []).map(formatArticle));
      })
      .catch(() => {});
  }, []);

  const featureList = [
    [
      "edit",
      "Markdown Editor",
      "Tulis dokumentasi teknis dengan preview langsung.",
    ],
    ["search", "Pencarian Cepat", "Temukan solusi dalam hitungan detik."],
    ["folder", "Kategori", "Susun pengetahuan berdasarkan area kerja."],
    ["tag", "Tag Fleksibel", "Hubungkan topik lintas dokumentasi."],
    [
      "users",
      "Role Admin/User",
      "Kontrol akses yang jelas untuk setiap anggota.",
    ],
    ["fire", "Artikel Populer", "Temukan pengetahuan yang paling relevan."],
  ];

  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#popular-preview">Popular</a>
          <a href="#contact">Contact</a>
        </nav>
        <div>
          <ThemeToggle />
          <button className="pill outline" onClick={() => go("/login")}>
            Masuk
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="switch-pill">
            <span>What&apos;s new?</span>
            <a href="#features">Explore Features</a>
          </div>

          <i className="hero-star one">✦</i>
          <i className="hero-star two">✣</i>
          <i className="hero-star three">✦</i>

          <h1>
            <span className="landing-word word-1">Keep</span>{" "}
            <span className="landing-word word-2">your</span>{" "}
            <em className="landing-word word-3">knowledge</em>
            <br />
            <strong className="landing-word word-4">moving</strong>{" "}
            <span className="landing-word word-5">with you</span>
          </h1>

          <p>
            Satu ruang kerja untuk menyimpan, menemukan, dan membagikan
            pengetahuan teknis tim Scrum.
          </p>

          <div className="hero-cta">
            <button className="pill solid" onClick={() => go("/login")}>
              Get started <Icon name="arrow" />
            </button>
            <a className="pill outline" href="#demo">
              Show demo
            </a>
          </div>

          <div className="floating-demo" id="demo">
            <div className="shortcut-row">
              {[
                ["folder", "Kategori", "/categories"],
                ["tag", "Tag", "/tags"],
                ["clock", "Terbaru", "/articles?sort=latest"],
                ["fire", "Populer", "/articles?sort=popular"],
              ].map(([icon, label, targetPath]) => (
                <button key={label} onClick={() => go(targetPath)}>
                  <i>
                    <Icon name={icon} />
                  </i>
                  {label}
                </button>
              ))}
            </div>

            <div className="feature-article">
              <small>ARTIKEL UNGGULAN</small>
              <h2>Panduan Setup Development Environment</h2>
              <p>
                Konfigurasi environment lokal yang konsisten untuk seluruh tim
                engineering.
              </p>
              <footer>
                <span>Engineering</span>
                <b>8 menit baca →</b>
              </footer>
            </div>

            <div className="contributors">
              <span className="avatar">RP</span>
              <span className="avatar">NA</span>
              <span className="avatar">AR</span>
              <b>+12 kontributor</b>
            </div>

            <div className="landing-stat">
              <Icon name="folder" />
              <small>KATEGORI AKTIF</small>
              <strong>24</strong>
              <span>Dokumentasi tim</span>
            </div>

            <div className="publish-card">
              <div>
                <span>Status dokumentasi</span>
                <b>82%</b>
              </div>
              <i>
                <em />
              </i>
              <small>Draft</small>
              <small>Published</small>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-heading">
            <span>BUILT FOR KNOWLEDGE</span>
            <h2>Semua yang timmu butuhkan.</h2>
            <p>Dari ide singkat hingga dokumentasi teknis yang terstruktur.</p>
          </div>
          <div className="feature-grid">
            {featureList.map(([icon, featTitle, desc]) => (
              <article key={featTitle}>
                <i>
                  <Icon name={icon} />
                </i>
                <h3>{featTitle}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section how" id="how">
          <div className="landing-heading">
            <span>CARA KERJA</span>
            <h2>Sederhana dari awal.</h2>
          </div>
          <div className="steps-grid">
            {[
              ["01", "Login ke workspace", "Akses aman untuk Admin dan User."],
              ["02", "Cari dan baca", "Temukan jawaban dari dokumentasi tim."],
              [
                "03",
                "Bagikan pengetahuan",
                "Admin menerbitkan panduan yang tervalidasi.",
              ],
            ].map(([step, stepTitle, desc]) => (
              <article key={step}>
                <b>{step}</b>
                <h3>{stepTitle}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="popular-preview">
          <div className="landing-heading">
            <span>PALING DIBACA</span>
            <h2>Pengetahuan yang menggerakkan tim.</h2>
          </div>
          <div className="preview-grid">
            {popularArticles.map((a) => (
              <article key={a.id} onClick={() => go(`/articles/${a.slug}`)} style={{ cursor: "pointer" }}>
                <span>{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
                <footer>
                  {a.read} baca <Icon name="arrow" />
                </footer>
              </article>
            ))}
            {popularArticles.length === 0 && (
              <article>
                <span>Dokumentasi</span>
                <h3>Panduan WikiFlow</h3>
                <p>Jelajahi panduan pengembangan dan arsitektur WikiFlow.</p>
                <footer>Mulai baca →</footer>
              </article>
            )}
          </div>
        </section>

        <section className="final-cta cta-split">
          <div className="cta-copy">
            <span>MULAI HARI INI</span>
            <h2>Dokumentasikan pengetahuan timmu.</h2>
            <p>
              Ubah pengalaman harian tim jadi dokumentasi yang rapi dan mudah
              dicari.
            </p>
            <button
              className="pill cta-button"
              onClick={() => go("/login")}
            >
              Masuk ke WikiFlow <Icon name="arrow" />
            </button>
          </div>
          <div className="cta-visual">
            <span className="cta-chip category-chip">24 kategori</span>
            <div className="cta-stat">
              <strong>38+</strong>
              <span>artikel diterbitkan</span>
            </div>
            <span className="cta-chip contributor-chip">+12 kontributor</span>
          </div>
        </section>
      </main>

      <footer className="landing-footer" id="contact">
        <Brand />
        <p>Dibuat oleh tim PKL · WikiFlow 2026</p>
      </footer>
    </div>
  );
}

/**
 * Halaman Login Pengguna
 * Menghubungkan secara eksklusif ke Laravel Sanctum API (Tanpa mock fallback)
 */
function Login({
  onLogin,
}: {
  onLogin: (user: ApiUser, role: "Admin" | "User") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fill = (targetRole: "Admin" | "User") => {
    setEmail(
      targetRole === "Admin" ? "admin@wikiflow.test" : "user@wikiflow.test"
    );
    setPassword("password");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginApi(email.trim(), password);

      if (res.token && res.user) {
        localStorage.setItem("wikiflow-token", res.token);
        const resolvedRole: "Admin" | "User" =
          res.user.role?.toLowerCase() === "admin" ? "Admin" : "User";
        localStorage.setItem("wikiflow-role", resolvedRole);

        onLogin(res.user, resolvedRole);
        go("/app", true);
        return;
      }

      setError(res.message || "Login gagal.");
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      const validationMsgs = apiErr.errors
        ? Object.values(apiErr.errors).flat().join(" ")
        : null;
      setError(
        validationMsgs ||
          apiErr.message ||
          "Gagal masuk. Periksa kembali email dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <section className="login-story">
        <Brand />
        <svg
          className="flow-ribbons"
          viewBox="0 0 620 260"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="flow-pink"
            d="M38 90C160 20 242 168 374 91S543 28 610 71"
          />
          <path
            className="flow-green"
            d="M14 146c118-70 225 78 342 13s172-87 254-35"
          />
          <circle className="node-pink" cx="38" cy="90" r="5" />
          <circle className="node-pink" cx="610" cy="71" r="5" />
          <circle className="node-green" cx="14" cy="146" r="5" />
          <circle className="node-green" cx="610" cy="124" r="5" />
        </svg>

        <svg
          className="knowledge-cluster"
          viewBox="0 0 170 120"
          fill="none"
          aria-hidden="true"
        >
          <path d="m20 77 44-42 47 33 39-45M64 35l14 65m33-32 39 28" />
          <circle cx="20" cy="77" r="6" />
          <circle cx="64" cy="35" r="7" />
          <circle cx="78" cy="100" r="5" />
          <circle cx="111" cy="68" r="7" />
          <circle cx="150" cy="23" r="5" />
          <circle cx="150" cy="96" r="6" />
        </svg>

        <div className="login-copy">
          <span>INTERNAL KNOWLEDGE BASE</span>
          <h1>
            Pengetahuan tim,
            <br />
            tersimpan dalam <em>satu tempat.</em>
          </h1>
          <p>
            Temukan dokumentasi teknis, bagikan solusi, dan bangun pengetahuan
            bersama tim.
          </p>
          <div className="story-chips">
            <span>
              <Icon name="file" size={14} />
              Dokumentasi
            </span>
            <span>
              <Icon name="users" size={14} />
              Kolaborasi
            </span>
          </div>
        </div>

        <i className="login-sparkle">✦</i>
        <footer>WIKIFLOW · BUILD KNOWLEDGE TOGETHER</footer>
      </section>

      <main className="login-main">
        <div className="login-container">
          <div className="login-top-bar">
            <BackButton fallback="/" label="Kembali ke beranda" variant="ghost" />
            <ThemeToggle />
          </div>

          <form onSubmit={submit} className="login-card">
            <div className="form-logo">
              <span>W</span>
            </div>
            <h2>Selamat datang kembali</h2>
            <p>Masuk ke workspace WikiFlow.</p>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <label>
              Email
              <input
                required
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
              />
            </label>

            <label>
              Password
              <input
                required
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
              />
            </label>

            <div className="remember">
              <label>
                <input type="checkbox" /> Ingat saya
              </label>
              <button type="button">Lupa password?</button>
            </div>

            <button
              disabled={loading || !email || !password}
              className="primary login-btn"
            >
              {loading ? "Memverifikasi..." : "Masuk ke WikiFlow"}
              <Icon name="arrow" />
            </button>

            <div className="test-accounts">
              <span>AKUN UJI</span>
              <p>Pilih role untuk mengisi kredensial otomatis.</p>
              <div>
                <button
                  type="button"
                  className="pill outline"
                  onClick={() => fill("Admin")}
                >
                  Masuk sebagai Admin
                </button>
                <button
                  type="button"
                  className="pill outline"
                  onClick={() => fill("User")}
                >
                  Masuk sebagai User
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/**
 * Halaman Profil Pengguna
 */
function ProfilePage({
  role,
  user,
  logout,
}: {
  role: "Admin" | "User";
  user: ApiUser | null;
  logout: () => void;
}) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role === "Admin"
      ? "AD"
      : "US";

  return (
    <div className="profile-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>Profil</h1>
          <p>Informasi akun dan preferensi tampilan.</p>
        </div>
      </div>

      <div className="profile-card">
        <span className="avatar">{initials}</span>
        <div>
          <h2>{user?.name || (role === "Admin" ? "Administrator" : "User WikiFlow")}</h2>
          <p>{user?.email || (role === "Admin" ? "admin@wikiflow.test" : "user@wikiflow.test")}</p>
          <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
        </div>
        <ThemeToggle />
        <button className="secondary" onClick={logout}>
          <Icon name="logout" />
          Logout
        </button>
      </div>
    </div>
  );
}

/**
 * Halaman 403 Forbidden
 */
function ForbiddenPage() {
  return (
    <div className="empty-page">
      <span className="forbidden-icon">
        <Icon name="lock" size={28} />
      </span>
      <h1>Akses ditolak</h1>
      <p>Kamu tidak punya izin membuka halaman ini</p>
      <button className="primary" onClick={() => go("/app")}>
        <Icon name="arrow" />
        Ke beranda
      </button>
    </div>
  );
}

/**
 * Halaman 404 Kosong
 */
function EmptyPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-page">
      <span>✦</span>
      <h1>{title}</h1>
      <p>{text}</p>
      <button className="primary" onClick={() => go("/app")}>
        Kembali ke dashboard
      </button>
    </div>
  );
}

/**
 * Komponen Induk Aplikasi WikiFlow
 */
export default function App() {
  const [routeKey, setRouteKey] = useState(() =>
    typeof window !== "undefined" ? location.pathname + location.search : ""
  );
  const [search, setSearch] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [role, setRole] = useState<"Admin" | "User" | null>(null);
  const [sessionChecking, setSessionChecking] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("wikiflow-token"));
  });

  // Inisialisasi rute dan session
  useEffect(() => {
    if (history.state?.idx === undefined) {
      history.replaceState({ ...(history.state || {}), idx: 0 }, "");
    }
    const pop = () => setRouteKey(location.pathname + location.search);
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") {
        setSearch(false);
      }
    };

    addEventListener("popstate", pop);
    addEventListener("keydown", handleKey);

    // Verifikasi sesi login aktif ke backend Laravel API
    const token = localStorage.getItem("wikiflow-token");
    if (token) {
      getCurrentUser(token)
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            const resolvedRole =
              res.user.role?.toLowerCase() === "admin" ? "Admin" : "User";
            setRole(resolvedRole);
            localStorage.setItem("wikiflow-role", resolvedRole);
          }
        })
        .catch(() => {
          // Token tidak valid atau kedaluwarsa (401)
          localStorage.removeItem("wikiflow-token");
          localStorage.removeItem("wikiflow-role");
          setUser(null);
          setRole(null);
        })
        .finally(() => {
          setSessionChecking(false);
        });
    }

    return () => {
      removeEventListener("popstate", pop);
      removeEventListener("keydown", handleKey);
    };
  }, []);

  const path = typeof window !== "undefined" ? location.pathname : "/";
  const activeRole = role || "User";

  // Redirect alias /latest dan /popular
  useEffect(() => {
    if (path === "/latest") go("/articles?sort=latest", true);
    if (path === "/popular") go("/articles?sort=popular", true);
  }, [routeKey, path]);

  // Hak akses Admin
  useEffect(() => {
    if (role === "User" && path.startsWith("/admin")) {
      go("/403", true);
    }
  }, [role, routeKey, path]);

  const logout = async () => {
    const token = localStorage.getItem("wikiflow-token");
    try {
      if (token) {
        await logoutApi(token);
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("wikiflow-role");
      localStorage.removeItem("wikiflow-token");
      setUser(null);
      setRole(null);
      go("/login", true);
    }
  };

  const loginSuccess = (newUser: ApiUser, newRole: "Admin" | "User") => {
    setUser(newUser);
    setRole(newRole);
  };

  const pageContent = useMemo(() => {
    void routeKey;
    if (role === "User" && path.startsWith("/admin")) {
      return <ForbiddenPage />;
    }
    if (path === "/app") return <Dashboard role={activeRole} user={user} />;
    if (path === "/articles" || path === "/search") {
      return <ArticlesPage role={activeRole} />;
    }
    if (path === "/categories") return <CategoriesPage />;
    if (path === "/tags") return <CategoriesPage tagsPage />;
    if (path === "/403") return <ForbiddenPage />;
    if (path === "/profile") {
      return <ProfilePage role={activeRole} user={user} logout={logout} />;
    }
    if (path.startsWith("/articles/")) return <ArticleDetail />;
    if (
      path === "/admin/articles/new" ||
      path.match(/\/admin\/articles\/\d+\/edit/)
    ) {
      return <Editor />;
    }
    if (path === "/admin") return <AdminPage type="articles" />;
    if (path.startsWith("/admin/")) {
      return <AdminPage type={path.split("/").pop() || "articles"} />;
    }
    if (path.startsWith("/categories/") || path.startsWith("/tags/")) {
      return <ArticlesPage role={activeRole} />;
    }
    return (
      <EmptyPage
        title="Halaman tidak ditemukan"
        text="Alamat yang Anda buka tidak tersedia."
      />
    );
  }, [routeKey, role, path, activeRole, user]);

  if (sessionChecking) {
    return (
      <div className="empty-page" style={{ minHeight: "100vh" }}>
        <span>✦</span>
        <h1>WikiFlow</h1>
        <p>Memuat workspace...</p>
      </div>
    );
  }

  if (path === "/") return <Landing />;
  if (path === "/login") return <Login onLogin={loginSuccess} />;
  if (!role) return <Login onLogin={loginSuccess} />;

  const fallback = path.startsWith("/articles/")
    ? "/articles"
    : path.startsWith("/categories/")
      ? "/categories"
      : path.startsWith("/tags/")
        ? "/tags"
        : path === "/admin/articles/new" ||
          path.match(/\/admin\/articles\/\d+\/edit/)
          ? "/articles"
          : path.startsWith("/admin/articles/")
            ? "/admin/articles"
            : path.startsWith("/admin/")
              ? "/admin"
              : "/app";

  const showBack = path !== "/app" && path !== "/admin";

  return (
    <div className="app">
      <Sidebar role={role} user={user} logout={logout} />
      <div className="app-body">
        <Topbar
          role={role}
          user={user}
          openMenu={() => setDrawer(true)}
          openSearch={() => setSearch(true)}
        />
        <main className="content">
          {showBack && (
            <BackButton
              fallback={fallback}
              variant={path.startsWith("/admin/") ? "ghost" : "pill"}
            />
          )}
          {pageContent}
        </main>
      </div>

      {drawer && (
        <div className="mobile-drawer">
          <div onClick={() => setDrawer(false)} />
          <Sidebar
            role={role}
            user={user}
            logout={logout}
            close={() => setDrawer(false)}
          />
        </div>
      )}

      {search && <Search close={() => setSearch(false)} />}
    </div>
  );
}
