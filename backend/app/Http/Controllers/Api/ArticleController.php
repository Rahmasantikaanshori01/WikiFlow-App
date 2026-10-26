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
     * Menampilkan daftar artikel yang dipublikasikan.
     * Admin yang login juga dapat melihat artikel draft.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Article::with([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ]);

        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            $query->where('status', 'published');
        }

        if ($request->filled('search')) {
            $keyword = $request->input('search');

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('content', 'like', "%{$keyword}%")
                    ->orWhere('excerpt', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('tag_id')) {
            $tagId = $request->integer('tag_id');

            $query->whereHas('tags', function ($q) use ($tagId) {
                $q->where('tags.id', $tagId);
            });
        }

        $articles = $query
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'message' => 'Daftar artikel berhasil diambil.',
            'data' => $articles,
        ]);
    }

    /**
     * Membuat artikel baru.
     * Hanya admin yang boleh mengakses endpoint ini.
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
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $query = Article::with([
            'user:id,name,email',
            'category:id,name,slug',
            'tags:id,name,slug',
        ])->where('slug', $slug);

        $user = $request->user();

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
     * Memperbarui artikel.
     * Hanya admin yang boleh mengakses endpoint ini.
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
     * Hanya admin yang boleh mengakses endpoint ini.
     */
    public function destroy(int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'message' => 'Artikel tidak ditemukan.',
            ], 404);
        }

        $article->delete();

        return response()->json([
            'message' => 'Artikel berhasil dihapus.',
        ]);
    }

    /**
     * Membuat slug unik.
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
