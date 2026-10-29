/**
 * Modul Klien API WikiFlow
 * Menghubungkan antarmuka frontend secara langsung ke Laravel API backend.
 */

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export type ApiUser = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | string;
    created_at?: string;
    updated_at?: string;
};

export type ApiCategory = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    articles_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type ApiTag = {
    id: number;
    name: string;
    slug: string;
    articles_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type ApiArticle = {
    id: number;
    user_id?: number;
    category_id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    status: "draft" | "published";
    views: number;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    tags?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
};

export type PaginatedData<T> = {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};

export type LoginResponse = {
    message: string;
    user: ApiUser;
    token: string;
    token_type: string;
};

export type ApiError = Error & {
    status?: number;
    errors?: Record<string, string[]>;
};

/**
 * Utilitas pembantu permintaan HTTP terpadu dengan penanganan otentikasi Sanctum Bearer token
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null,
): Promise<T> {
    const headers = new Headers(options.headers);

    headers.set("Accept", "application/json");

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const authToken =
        token ||
        (typeof window !== "undefined"
            ? localStorage.getItem("wikiflow-token")
            : null);

    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(
            data?.message || `Permintaan gagal (${response.status})`,
        ) as ApiError;

        error.status = response.status;
        error.errors = data?.errors;

        throw error;
    }

    return data as T;
}

// =====================================================
// AUTENTIKASI
// =====================================================

export async function loginApi(
    email: string,
    password: string,
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function getCurrentUser(token?: string | null): Promise<{ user: ApiUser }> {
    return apiRequest<{ user: ApiUser }>("/auth/user", {}, token);
}

export async function logoutApi(token?: string | null): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        "/auth/logout",
        { method: "POST" },
        token,
    );
}

// =====================================================
// KATEGORI
// =====================================================

export async function getCategoriesApi(): Promise<{
    message: string;
    data: ApiCategory[];
}> {
    return apiRequest<{ message: string; data: ApiCategory[] }>("/categories");
}

export async function createCategoryApi(
    data: { name: string; slug?: string; description?: string },
    token?: string | null,
): Promise<{ message: string; data: ApiCategory }> {
    return apiRequest<{ message: string; data: ApiCategory }>(
        "/categories",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function updateCategoryApi(
    id: number,
    data: { name?: string; slug?: string; description?: string },
    token?: string | null,
): Promise<{ message: string; data: ApiCategory }> {
    return apiRequest<{ message: string; data: ApiCategory }>(
        `/categories/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function deleteCategoryApi(
    id: number,
    token?: string | null,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        `/categories/${id}`,
        { method: "DELETE" },
        token,
    );
}

// =====================================================
// TAG
// =====================================================

export async function getTagsApi(): Promise<{
    message: string;
    data: ApiTag[];
}> {
    return apiRequest<{ message: string; data: ApiTag[] }>("/tags");
}

export async function createTagApi(
    data: { name: string; slug?: string },
    token?: string | null,
): Promise<{ message: string; data: ApiTag }> {
    return apiRequest<{ message: string; data: ApiTag }>(
        "/tags",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function updateTagApi(
    id: number,
    data: { name?: string; slug?: string },
    token?: string | null,
): Promise<{ message: string; data: ApiTag }> {
    return apiRequest<{ message: string; data: ApiTag }>(
        `/tags/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function deleteTagApi(
    id: number,
    token?: string | null,
): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(
        `/tags/${id}`,
        { method: "DELETE" },
        token,
    );
}

// =====================================================
// ARTIKEL
// =====================================================

export type ArticleQueryParams = {
    search?: string;
    category?: string;
    category_id?: number;
    tag?: string;
    tag_id?: number;
    sort?: "latest" | "popular" | "oldest";
    status?: "draft" | "published";
    page?: number;
    per_page?: number;
};

export async function getArticlesApi(
    params: ArticleQueryParams = {},
    token?: string | null,
): Promise<{
    message: string;
    data: PaginatedData<ApiArticle>;
}> {
    const searchParams = new URLSearchParams();

    if (params.search) searchParams.set("search", params.search);
    if (params.category) searchParams.set("category", params.category);
    if (params.category_id) searchParams.set("category_id", String(params.category_id));
    if (params.tag) searchParams.set("tag", params.tag);
    if (params.tag_id) searchParams.set("tag_id", String(params.tag_id));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.per_page) searchParams.set("per_page", String(params.per_page));

    const queryString = searchParams.toString();
    const endpoint = `/articles${queryString ? `?${queryString}` : ""}`;

    return apiRequest<{ message: string; data: PaginatedData<ApiArticle> }>(
        endpoint,
        {},
        token,
    );
}

export async function getPopularArticlesApi(
    limit = 4,
): Promise<{
    message: string;
    data: ApiArticle[];
}> {
    return apiRequest<{ message: string; data: ApiArticle[] }>(
        `/articles/popular?limit=${limit}`,
    );
}

export async function getArticleBySlugApi(
    slug: string,
    token?: string | null,
): Promise<{
    message: string;
    data: ApiArticle;
}> {
    return apiRequest<{ message: string; data: ApiArticle }>(
        `/articles/${slug}`,
        {},
        token,
    );
}

export async function recordArticleViewApi(
    slug: string,
): Promise<{
    message: string;
    views: number;
}> {
    return apiRequest<{ message: string; views: number }>(
        `/articles/${slug}/view`,
        { method: "POST" },
    );
}

export async function createArticleApi(
    data: {
        title: string;
        content: string;
        excerpt?: string | null;
        category_id: number;
        tag_ids?: number[];
        status: "draft" | "published";
    },
    token?: string | null,
): Promise<{
    message: string;
    data: ApiArticle;
}> {
    return apiRequest<{ message: string; data: ApiArticle }>(
        "/articles",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function updateArticleApi(
    id: number,
    data: {
        title?: string;
        content?: string;
        excerpt?: string | null;
        category_id?: number;
        tag_ids?: number[];
        status?: "draft" | "published";
    },
    token?: string | null,
): Promise<{
    message: string;
    data: ApiArticle;
}> {
    return apiRequest<{ message: string; data: ApiArticle }>(
        `/articles/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
        token,
    );
}

export async function deleteArticleApi(
    id: number,
    token?: string | null,
): Promise<{
    message: string;
}> {
    return apiRequest<{ message: string }>(
        `/articles/${id}`,
        { method: "DELETE" },
        token,
    );
}

// =====================================================
// PENGGUNA (ADMIN)
// =====================================================

export async function getAdminUsersApi(
    token?: string | null,
): Promise<{
    message: string;
    data: ApiUser[];
}> {
    return apiRequest<{ message: string; data: ApiUser[] }>(
        "/admin/users",
        {},
        token,
    );
}

export async function updateUserRoleApi(
    userId: number,
    role: "admin" | "user",
    token?: string | null,
): Promise<{
    message: string;
    data: ApiUser;
}> {
    return apiRequest<{ message: string; data: ApiUser }>(
        `/admin/users/${userId}/role`,
        {
            method: "PUT",
            body: JSON.stringify({ role }),
        },
        token,
    );
}