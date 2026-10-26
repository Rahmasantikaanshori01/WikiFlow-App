"use client";

import { useEffect, useMemo, useState } from "react";
import { articles, categories, tags, type Article } from "./data";
import { BackButton } from "./components/BackButton";

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
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const saved = localStorage.getItem("wikiflow-theme") || "system";
    setTheme(saved);

    const applyTheme = (pref: string) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = pref === "dark" || (pref === "system" && prefersDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      document.documentElement.dataset.themePreference = pref;
    };

    applyTheme(saved);

    // Deteksi perubahan tema pada level sistem/laptop secara dinamis
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentSaved = localStorage.getItem("wikiflow-theme") || "system";
      if (currentSaved === "system") {
        document.documentElement.dataset.theme = e.matches ? "dark" : "light";
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Sinkronisasi antar dropdown tema pada halaman
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
  close,
  logout,
}: {
  role: "Admin" | "User";
  close?: () => void;
  logout: () => void;
}) {
  const path = location.pathname;

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
        {label === "Artikel Terbaru" && <i>4</i>}
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
        <button className="navitem">
          <Icon name="book" />
          <span>Help & Documentation</span>
        </button>

        <div className="profile">
          <span className="avatar">{role === "Admin" ? "RP" : "US"}</span>
          <div>
            <b>{role === "Admin" ? "Raka Putra" : "WikiFlow User"}</b>
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
 */
function Search({ close }: { close: () => void }) {
  const [query, setQuery] = useState("");
  const results = articles.filter(
    (a) =>
      a.status === "Published" &&
      `${a.title} ${a.summary}`.toLowerCase().includes(query.toLowerCase())
  );

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
            {query
              ? `${results.length} HASIL DITEMUKAN`
              : "ARTIKEL YANG DISARANKAN"}
          </small>
          {results.slice(0, 4).map((item) => (
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
          {!results.length && (
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
  openMenu,
  openSearch,
}: {
  role: "Admin" | "User";
  openMenu: () => void;
  openSearch: () => void;
}) {
  const title = location.pathname.includes("admin")
    ? "Administration"
    : location.pathname.includes("articles")
    ? "Artikel"
    : "Knowledge Hub";

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
          {role === "Admin" ? "RP" : "US"}
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
  a: Article;
  showViews?: boolean;
}) {
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
          <span className="mini-avatar">
            {a.author
              .split(" ")
              .map((x) => x[0])
              .join("")}
          </span>
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
function Dashboard({ role }: { role: "Admin" | "User" }) {
  const statList = [
    ["file", "36", "Total Artikel", "pink"],
    ["folder", "4", "Kategori", "lime"],
    ["tag", "10", "Total Tag", "yellow"],
    ["fire", "248", "Artikel Populer", "purple"],
  ];

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
            Halo, Raka. <span>Mari berbagi pengetahuan.</span>
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
              <b>{count}</b>
              <small>{label}</small>
            </div>
            <em>↗ 12%</em>
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
            {articles
              .filter((a) => a.status === "Published")
              .sort((a, b) => b.publishedAt - a.publishedAt)
              .slice(0, 3)
              .map((a) => (
                <ArticleCard a={a} key={a.id} />
              ))}
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
            {articles
              .filter((a) => a.status === "Published")
              .sort((a, b) => b.views - a.views)
              .slice(0, 4)
              .map((a, i) => (
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
          </div>

          <div className="topics panel">
            <div className="section-title">
              <h2>Topik Populer</h2>
            </div>
            <div>
              {tags.slice(0, 7).map((t, i) => (
                <button
                  key={t}
                  onClick={() => go(`/tags/${t.toLowerCase()}`)}
                >
                  #{t}
                  <span>{12 - i}</span>
                </button>
              ))}
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
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => go(`/categories/${c.slug}`)}
              className={c.accent}
            >
              <span>
                <Icon name="folder" />
              </span>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
              <footer>
                {c.count} artikel <Icon name="arrow" size={14} />
              </footer>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Halaman Semua Artikel dengan Pencarian, Filter Kategori/Tag, dan Pengurutan
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

  const hasViews = articles.some((a) => a.status === "Published" && a.views > 0);
  const effectiveSort = sort === "popular" && !hasViews ? "latest" : sort;

  const rows = articles
    .filter(
      (a) =>
        a.status === "Published" &&
        (selectedCategory === "Semua kategori" ||
          a.category === selectedCategory) &&
        (selectedTag === "Semua tag" || a.tags.includes(selectedTag)) &&
        `${a.title} ${a.summary}`.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      if (effectiveSort === "popular") {
        return b.views - a.views || b.publishedAt - a.publishedAt;
      }
      if (effectiveSort === "oldest") {
        return a.publishedAt - b.publishedAt;
      }
      return b.publishedAt - a.publishedAt;
    });

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
          {categories.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => updateFilters({ tag: e.target.value, page: "1" })}
        >
          <option>Semua tag</option>
          {tags.map((t) => (
            <option key={t}>{t}</option>
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

      {sort === "popular" && !hasViews && (
        <p className="sort-note">
          Belum ada data kunjungan, ditampilkan berdasarkan terbaru.
        </p>
      )}

      <div className="article-list">
        {rows.slice(0, page * 3).map((a) => (
          <ArticleCard
            a={a}
            showViews={sort === "popular" && hasViews}
            key={a.id}
          />
        ))}
      </div>

      {!rows.length && (
        <div className="empty large">
          Tidak ada artikel ditemukan.
          <span>Coba hapus filter atau gunakan kata kunci lain.</span>
        </div>
      )}

      {page * 3 < rows.length && (
        <button
          className="loadmore"
          onClick={() => updateFilters({ page: String(page + 1) })}
        >
          Muat lebih banyak
        </button>
      )}
    </>
  );
}

/**
 * Halaman Jelajahi Kategori atau Tag
 */
function CategoriesPage({ tagsPage = false }: { tagsPage?: boolean }) {
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

      {tagsPage ? (
        <div className="tag-cloud">
          {tags.map((t, i) => (
            <button onClick={() => go(`/tags/${t.toLowerCase()}`)} key={t}>
              #{t}
              <span>{14 - i}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="cat-grid big">
          {categories.map((c) => (
            <button
              key={c.name}
              className={c.accent}
              onClick={() => go(`/categories/${c.slug}`)}
            >
              <span>
                <Icon name="folder" />
              </span>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
              <footer>
                {c.count} artikel <Icon name="arrow" />
              </footer>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Halaman Detail Artikel Dokumentasi
 */
function ArticleDetail() {
  const slug = location.pathname.split("/").pop();
  const article = articles.find((x) => x.slug === slug);

  if (!article) {
    return (
      <EmptyPage
        title="Halaman tidak ditemukan"
        text="Artikel yang Anda cari tidak tersedia atau telah dipindahkan."
      />
    );
  }

  return (
    <article className="doc">
      <div className="doccrumb">
        Knowledge Hub / {article.category} / Artikel
      </div>
      <span className="category-pill">{article.category}</span>
      <h1>{article.title}</h1>
      <p className="lead">{article.summary}</p>

      <div className="docmeta">
        <span className="avatar">RP</span>
        <div>
          <b>{article.author}</b>
          <small>
            Diperbarui {article.updated} · {article.read} baca
          </small>
        </div>
        <div className="doc-tags">
          {article.tags.map((t) => (
            <i key={t}>#{t}</i>
          ))}
        </div>
      </div>

      {article.content ? (
        <div className="docbody new-article">
          <aside>
            <b>Di halaman ini</b>
            <a href="#isi-artikel">Isi artikel</a>
          </aside>
          <section id="isi-artikel">
            <div className="published-markdown">{article.content}</div>
          </section>
        </div>
      ) : (
        <div className="docbody">
          <aside>
            <b>Di halaman ini</b>
            <a href="#overview">Ringkasan</a>
            <a href="#prasyarat">Prasyarat</a>
            <a href="#implementasi">Implementasi</a>
          </aside>
          <section>
            <h2 id="overview">Ringkasan</h2>
            <p>
              Panduan ini menjelaskan standar yang digunakan tim Wikiflow agar
              proses pengembangan tetap konsisten, aman, dan mudah direproduksi
              oleh seluruh anggota tim.
            </p>
            <div className="note">
              <b>Catatan penting</b>
              <p>
                Pastikan Anda memiliki akses ke repository internal dan
                environment development sebelum memulai.
              </p>
            </div>

            <h2 id="prasyarat">Prasyarat</h2>
            <ul>
              <li>Node.js versi 18 atau lebih baru</li>
              <li>Docker Desktop dan Git</li>
              <li>Akses ke workspace internal tim</li>
            </ul>

            <h2 id="implementasi">Implementasi</h2>
            <p>
              Salin repository dan pasang dependency proyek menggunakan
              perintah berikut:
            </p>
            <div className="code">
              <header>
                <span>bash</span>
                <button
                  onClick={() => navigator.clipboard.writeText("pnpm install")}
                >
                  <Icon name="copy" />
                  Salin
                </button>
              </header>
              <pre>
                git clone git@github.com:team/wikiflow.git{"\n"}
                cd wikiflow{"\n"}
                pnpm install{"\n"}
                pnpm dev
              </pre>
            </div>

            <h2>Langkah berikutnya</h2>
            <p>
              Baca standar Git Workflow sebelum membuat branch dan mengirim
              pull request pertama Anda.
            </p>
          </section>
        </div>
      )}
    </article>
  );
}

/**
 * Halaman Manajemen Administrasi (Artikel, Kategori, Tag, Pengguna)
 */
function AdminPage({ type }: { type: string }) {
  const labels: Record<string, string> = {
    articles: "Artikel",
    categories: "Kategori",
    tags: "Tag",
    users: "Pengguna",
  };

  const [users, setUsers] = useState([
    { name: "Raka Putra", role: "Admin" as const },
    { name: "Nadia Aulia", role: "User" as const },
    { name: "Aditya Rama", role: "User" as const },
    { name: "Sinta Dewi", role: "User" as const },
  ]);

  const [pending, setPending] = useState<null | {
    index: number;
    role: "Admin" | "User";
  }>(null);

  const confirmRole = () => {
    if (!pending) return;
    setUsers((current) =>
      current.map((user, index) =>
        index === pending.index ? { ...user, role: pending.role } : user
      )
    );
    setPending(null);
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
          onClick={() =>
            type === "articles"
              ? go("/admin/articles/new")
              : alert(`Form tambah ${labels[type]} siap dibuka.`)
          }
        >
          <Icon name="plus" />
          Tambah {labels[type]}
        </button>
      </div>

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
          {type === "articles" ? (
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
                <button onClick={() => go(`/admin/articles/${a.id}/edit`)}>
                  Edit
                </button>
              </div>
            ))
          ) : type === "users" ? (
            users.map((user, index) => (
              <div className="tr user-row" key={user.name}>
                <div>
                  <b>{user.name}</b>
                  <small>
                    {user.name.toLowerCase().replace(" ", ".")}@wikiflow.id
                  </small>
                </div>
                <span className={`role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
                <span>12 Mei 2025</span>
                <select
                  aria-label={`Ubah role ${user.name}`}
                  value={user.role}
                  onChange={(e) =>
                    setPending({
                      index,
                      role: e.target.value as "Admin" | "User",
                    })
                  }
                >
                  <option>Admin</option>
                  <option>User</option>
                </select>
              </div>
            ))
          ) : (
            <div className="tag-cloud compact">
              {(type === "tags" ? tags : categories.map((c) => c.name)).map(
                (item, index) => (
                  <button key={item}>
                    {item}
                    <span>{14 - index} artikel</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <div className="modal-bg">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <span>!</span>
            <h2>Ubah role pengguna?</h2>
            <p>
              Ubah role {users[pending.index].name} menjadi {pending.role}?
            </p>
            <div>
              <button
                className="secondary"
                onClick={() => setPending(null)}
              >
                Batal
              </button>
              <button className="primary" onClick={confirmRole}>
                Ubah role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Halaman Editor untuk Membuat dan Mengedit Artikel
 */
function Editor() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  const [categoryOptions, setCategoryOptions] = useState([...categories]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [tagOptions, setTagOptions] = useState([...tags]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTag, setNewTag] = useState("");

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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

  const uniqueSlug = () => {
    let value = slug || "artikel-baru";
    let count = 2;
    while (articles.some((a) => a.slug === value)) {
      value = `${slug}-${count++}`;
    }
    return value;
  };

  const makeArticle = (status: "Draft" | "Published") => ({
    id: Math.max(...articles.map((a) => a.id)) + 1,
    title: title.trim() || "Draft tanpa judul",
    slug: uniqueSlug(),
    summary: summary.trim() || "Ringkasan belum ditambahkan.",
    content: content.trim(),
    category: category || "Engineering",
    tags: selectedTags.length ? selectedTags : ["Dokumentasi"],
    author: "Raka Putra",
    updated: "Hari ini",
    read: "5 mnt",
    views: 0,
    status,
    publishedAt: status === "Published" ? Date.now() : 0,
  });

  const saveDraft = () => {
    const article = makeArticle("Draft");
    articles.unshift(article);
    setDirty(false);
    setSaved(true);
    setError("");
  };

  const publishArticle = () => {
    if (!title.trim() || !content.trim()) {
      setError(
        !title.trim()
          ? "Judul artikel wajib diisi."
          : "Isi artikel wajib diisi sebelum publikasi."
      );
      return;
    }
    const article = makeArticle("Published");
    articles.unshift(article);
    setDirty(false);
    go(`/articles/${article.slug}`, true);
  };

  const insertSnippet = (snippet: string) => {
    setContent((prev) => `${prev}${prev ? "\n" : ""}${snippet}`);
    setDirty(true);
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    const existing = categoryOptions.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setCategory(existing.name);
    } else {
      const item = {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        count: 0,
        desc: "Kategori dokumentasi baru.",
        accent: "pink",
      };
      categories.push(item);
      setCategoryOptions((prev) => [...prev, item]);
      setCategory(name);
    }
    setNewCategory("");
    setShowCategoryForm(false);
    setDirty(true);
  };

  const addSelectedTag = (tagName: string) => {
    if (tagName && !selectedTags.includes(tagName)) {
      setSelectedTags((prev) => [...prev, tagName]);
      setDirty(true);
    }
  };

  const createNewTag = () => {
    const name = newTag.trim();
    if (!name) return;
    const existing =
      tagOptions.find((t) => t.toLowerCase() === name.toLowerCase()) || name;
    if (!tagOptions.includes(existing)) {
      tags.push(existing);
      setTagOptions((prev) => [...prev, existing]);
    }
    addSelectedTag(existing);
    setNewTag("");
    setShowTagForm(false);
  };

  return (
    <>
      <div className="page-head editor-head">
        <div>
          <span className="eyebrow">KELOLA ARTIKEL / BUAT</span>
          <h1>Buat Artikel Baru</h1>
          <p>Dokumentasikan pengetahuan teknis untuk tim.</p>
        </div>
        <div>
          {saved && <span className="saved-state">Draft tersimpan</span>}
          <button className="secondary" onClick={saveDraft}>
            Simpan Draft
          </button>
          <button className="primary" onClick={publishArticle}>
            Publikasikan
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {categoryOptions.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            {showCategoryForm ? (
              <div className="inline-create">
                <input
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="Nama kategori baru"
                />
                <button type="button" onClick={addCategory}>
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
                onChange={(e) => addSelectedTag(e.target.value)}
              >
                <option value="">Pilih tag</option>
                {tagOptions
                  .filter((t) => !selectedTags.includes(t))
                  .map((t) => (
                    <option key={t}>{t}</option>
                  ))}
              </select>
            </label>

            {selectedTags.length > 0 && (
              <div className="selected-chips">
                {selectedTags.map((tag) => (
                  <span key={tag}>
                    #{tag}
                    <button
                      type="button"
                      aria-label={`Hapus tag ${tag}`}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.filter((item) => item !== tag)
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {showTagForm ? (
              <div className="inline-create">
                <input
                  autoFocus
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewTag()}
                  placeholder="Nama tag baru"
                />
                <button type="button" onClick={createNewTag}>
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
              <b>Isi Artikel</b>
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
              <small>LIVE PREVIEW</small>
              {content ? (
                <div className="preview-content">{content}</div>
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
 * Halaman Landing Page Publik WikiFlow
 */
function Landing() {
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
            <span>What's new?</span>
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
              ].map(([icon, label, path]) => (
                <button key={label} onClick={() => go(path)}>
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
              <span>36 artikel diterbitkan</span>
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
            {featureList.map(([icon, title, desc]) => (
              <article key={title}>
                <i>
                  <Icon name={icon} />
                </i>
                <h3>{title}</h3>
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
            ].map(([step, title, desc]) => (
              <article key={step}>
                <b>{step}</b>
                <h3>{title}</h3>
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
            {articles.slice(0, 3).map((a) => (
              <article key={a.id}>
                <span>{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
                <footer>
                  {a.read} baca <Icon name="arrow" />
                </footer>
              </article>
            ))}
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

      {/* Footer tanpa ganti tema (karena sudah ada di header atas) */}
      <footer className="landing-footer" id="contact">
        <Brand />
        <p>Dibuat oleh tim PKL · WikiFlow 2026</p>
      </footer>
    </div>
  );
}

/**
 * Halaman Login Pengguna
 * Penataan tombol kembali dan toggle tema terstruktur rapi di atas kartu login (tidak menumpuk)
 */
function Login({ onLogin }: { onLogin: (role: "Admin" | "User") => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fill = (role: "Admin" | "User") => {
    setEmail(
      role === "Admin" ? "admin@wikiflow.test" : "user@wikiflow.test"
    );
    setPassword("password");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const role =
      email.toLowerCase() === "admin@wikiflow.test"
        ? "Admin"
        : email.toLowerCase() === "user@wikiflow.test"
        ? "User"
        : null;

    if (!role || password !== "password") {
      setError("Email atau password salah");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onLogin(role);
      go("/app", true);
    }, 650);
  };

  return (
    <div className="login">
      <section className="login-story">
        <Brand />

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
  logout,
}: {
  role: "Admin" | "User";
  logout: () => void;
}) {
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
        <span className="avatar">{role === "Admin" ? "RP" : "US"}</span>
        <div>
          <h2>{role === "Admin" ? "Raka Putra" : "WikiFlow User"}</h2>
          <p>
            {role === "Admin"
              ? "admin@wikiflow.test"
              : "user@wikiflow.test"}
          </p>
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
  const [routeKey, setRouteKey] = useState(
    location.pathname + location.search
  );
  const [search, setSearch] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [role, setRole] = useState<"Admin" | "User" | null>(() => {
    const saved = localStorage.getItem("wikiflow-role");
    return saved === "Admin" || saved === "User" ? saved : null;
  });

  const path = location.pathname;
  const activeRole = role || "User";

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

    return () => {
      removeEventListener("popstate", pop);
      removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (path === "/latest") go("/articles?sort=latest", true);
    if (path === "/popular") go("/articles?sort=popular", true);
  }, [routeKey]);

  useEffect(() => {
    if (role === "User" && path.startsWith("/admin")) {
      go("/403", true);
    }
  }, [role, routeKey]);

  const logout = () => {
    localStorage.removeItem("wikiflow-role");
    setRole(null);
    go("/login", true);
  };

  const login = (nextRole: "Admin" | "User") => {
    localStorage.setItem("wikiflow-role", nextRole);
    setRole(nextRole);
  };

  const pageContent = useMemo(() => {
    if (role === "User" && path.startsWith("/admin")) {
      return <ForbiddenPage />;
    }
    if (path === "/app") return <Dashboard role={activeRole} />;
    if (path === "/articles" || path === "/search") {
      return <ArticlesPage role={activeRole} />;
    }
    if (path === "/categories") return <CategoriesPage />;
    if (path === "/tags") return <CategoriesPage tagsPage />;
    if (path === "/403") return <ForbiddenPage />;
    if (path === "/profile") {
      return <ProfilePage role={activeRole} logout={logout} />;
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
  }, [routeKey, role]);

  if (path === "/") return <Landing />;
  if (path === "/login") return <Login onLogin={login} />;
  if (!role) return <Login onLogin={login} />;

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
      <Sidebar role={role} logout={logout} />
      <div className="app-body">
        <Topbar
          role={role}
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
            logout={logout}
            close={() => setDrawer(false)}
          />
        </div>
      )}

      {search && <Search close={() => setSearch(false)} />}
    </div>
  );
}
