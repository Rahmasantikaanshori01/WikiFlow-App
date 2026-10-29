<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ArticleController extends Controller
{
    /**
     * Menampilkan daftar artikel.
     * Pengunjung umum hanya dapat melihat artikel yang berstatus 'published'.
     * Admin dapat melihat artikel berstatus 'draft' maupun 'published'.
     * Mendukung pencarian, filter kategori/tag, sorting (latest, popular, oldest), dan paginasi.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::with([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ]);

        $user = $request->user('sanctum') ?? $request->user();

        // Hak akses status artikel: Publik/User biasa hanya melihat yang 'published'
        if (!$user || $user->role !== 'admin') {
            $query->where('status', 'published');
        } elseif ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Pencarian pada judul, ringkasan, atau isi artikel
        if ($request->filled('search')) {
            $keyword = $request->input('search');

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('excerpt', 'like', "%{$keyword}%")
                    ->orWhere('content', 'like', "%{$keyword}%");
            });
        }

        // Filter berdasarkan kategori (ID, slug, atau nama)
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        } elseif ($request->filled('category')) {
            $cat = $request->input('category');
            if ($cat !== 'Semua kategori') {
                $query->whereHas('category', function ($q) use ($cat) {
                    $q->where('slug', Str::slug($cat))
                        ->orWhere('name', $cat);
                });
            }
        }

        // Filter berdasarkan tag (ID, slug, atau nama)
        if ($request->filled('tag_id')) {
            $tagId = $request->integer('tag_id');
            $query->whereHas('tags', function ($q) use ($tagId) {
                $q->where('tags.id', $tagId);
            });
        } elseif ($request->filled('tag')) {
            $tagName = $request->input('tag');
            if ($tagName !== 'Semua tag') {
                $query->whereHas('tags', function ($q) use ($tagName) {
                    $q->where('slug', Str::slug($tagName))
                        ->orWhere('name', $tagName);
                });
            }
        }

        // Pengurutan (sorting)
        $sort = $request->input('sort', 'latest');
        if ($sort === 'popular') {
            $query->orderByDesc('views')
                ->orderByDesc('published_at')
                ->orderByDesc('id');
        } elseif ($sort === 'oldest') {
            $query->orderBy('published_at')
                ->orderBy('id');
        } else {
            // Default latest
            $query->orderByDesc('published_at')
                ->orderByDesc('id');
        }

        $perPage = min(max(1, $request->integer('per_page', 10)), 100);
        $articles = $query->paginate($perPage);

        return response()->json([
            'message' => 'Daftar artikel berhasil diambil.',
            'data' => $articles,
        ]);
    }

    /**
     * Mengambil artikel terpopuler yang telah dipublikasikan.
     * Mengurutkan berdasarkan views terbanyak dengan fallback ke tanggal publikasi terbaru.
     */
    public function popular(Request $request): JsonResponse
    {
        $limit = min(max(1, $request->integer('limit', 5)), 20);

        $articles = Article::with([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ])
            ->where('status', 'published')
            ->orderByDesc('views')
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'message' => 'Daftar artikel populer berhasil diambil.',
            'data' => $articles,
        ]);
    }

    /**
     * Membuat artikel baru.
     * Hanya admin yang berwenang.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:tags,id',
            ],
            'status' => [
                'required',
                Rule::in(['draft', 'published']),
            ],
        ]);

        $article = DB::transaction(function () use ($validated, $request) {
            $article = new Article();

            $article->user_id = $request->user()->id;
            $article->category_id = $validated['category_id'];
            $article->title = $validated['title'];
            $article->slug = $this->generateUniqueSlug($validated['title']);
            $article->content = $validated['content'];
            $article->excerpt = $validated['excerpt'] ?? null;
            $article->status = $validated['status'];
            $article->views = 0;
            $article->published_at = $validated['status'] === 'published'
                ? now()
                : null;

            $article->save();

            $article->tags()->sync($validated['tag_ids'] ?? []);

            return $article;
        });

        $article->load([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ]);

        return response()->json([
            'message' => 'Artikel berhasil dibuat.',
            'data' => $article,
        ], 201);
    }

    /**
     * Menampilkan detail artikel berdasarkan slug.
     * Draft hanya dapat diakses oleh admin; publik menerima respon 404.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $query = Article::with([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ]);

        if (is_numeric($slug)) {
            $query->where(function ($q) use ($slug) {
                $q->where('id', (int) $slug)
                    ->orWhere('slug', $slug);
            });
        } else {
            $query->where('slug', $slug);
        }

        $user = $request->user('sanctum') ?? $request->user();

        if (!$user || $user->role !== 'admin') {
            $query->where('status', 'published');
        }

        $article = $query->first();

        if (!$article) {
            return response()->json([
                'message' => 'Artikel tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail artikel berhasil diambil.',
            'data' => $article,
        ]);
    }

    /**
     * Mencatat tayangan artikel yang dipublikasikan secara persisten ke MySQL.
     * Mencegah peningkatan tayangan pada artikel yang berstatus draft atau tidak ada.
     */
    public function recordView(Request $request, string $slug): JsonResponse
    {
        $article = Article::where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$article) {
            return response()->json([
                'message' => 'Artikel tidak ditemukan atau belum dipublikasikan.',
            ], 404);
        }

        $article->increment('views');

        return response()->json([
            'message' => 'Tayangan artikel berhasil dicatat.',
            'views' => $article->views,
        ]);
    }

    /**
     * Memperbarui artikel yang ada.
     * Hanya admin yang berwenang.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'message' => 'Artikel tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:categories,id',
            ],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:tags,id',
            ],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['draft', 'published']),
            ],
        ]);

        DB::transaction(function () use ($article, $validated) {
            if (array_key_exists('title', $validated)) {
                $article->title = $validated['title'];
                $article->slug = $this->generateUniqueSlug(
                    $validated['title'],
                    $article->id
                );
            }

            if (array_key_exists('content', $validated)) {
                $article->content = $validated['content'];
            }

            if (array_key_exists('excerpt', $validated)) {
                $article->excerpt = $validated['excerpt'];
            }

            if (array_key_exists('category_id', $validated)) {
                $article->category_id = $validated['category_id'];
            }

            if (array_key_exists('status', $validated)) {
                $previousStatus = $article->status;
                $article->status = $validated['status'];

                if ($validated['status'] === 'draft') {
                    $article->published_at = null;
                } elseif (
                    $previousStatus !== 'published'
                    || !$article->published_at
                ) {
                    $article->published_at = now();
                }
            }

            $article->save();

            if (array_key_exists('tag_ids', $validated)) {
                $article->tags()->sync($validated['tag_ids']);
            }
        });

        $article->refresh()->load([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ]);

        return response()->json([
            'message' => 'Artikel berhasil diperbarui.',
            'data' => $article,
        ]);
    }

    /**
     * Menghapus artikel.
     * Hanya admin yang berwenang.
     */
    public function destroy(int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'message' => 'Artikel tidak ditemukan.',
            ], 404);
        }

        $article->tags()->detach();
        $article->delete();

        return response()->json([
            'message' => 'Artikel berhasil dihapus.',
        ]);
    }

    /**
     * Membuat slug unik yang aman dari benturan nama (collision-safe).
     */
    private function generateUniqueSlug(
        string $title,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($title);

        if ($baseSlug === '') {
            $baseSlug = 'artikel';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (
            Article::where('slug', $slug)
                ->when(
                    $ignoreId !== null,
                    fn ($query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
