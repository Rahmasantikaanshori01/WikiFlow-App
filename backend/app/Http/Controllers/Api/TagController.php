<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TagController extends Controller
{
    /**
     * Menampilkan daftar tag.
     */
    public function index(): JsonResponse
    {
        $tags = Tag::withCount('articles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Daftar tag berhasil diambil.',
            'data' => $tags,
        ]);
    }

    /**
     * Membuat tag baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:tags,name',
            ],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $slugSource = $validated['slug'] ?? $validated['name'];
        $slug = Str::slug($slugSource);

        if ($slug === '') {
            return response()->json([
                'message' => 'Nama atau slug tag tidak valid.',
            ], 422);
        }

        if (Tag::where('slug', $slug)->exists()) {
            return response()->json([
                'message' => 'Slug tag sudah digunakan. Silakan gunakan slug lain.',
            ], 422);
        }

        $tag = Tag::create([
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return response()->json([
            'message' => 'Tag berhasil dibuat.',
            'data' => $tag,
        ], 201);
    }

    /**
     * Menampilkan detail tag beserta artikel terkait.
     */
    public function show(Tag $tag): JsonResponse
    {
        $tag->load([
            'articles' => function ($query) {
                $query->where('status', 'published')
                    ->with([
                        'user:id,name',
                        'category:id,name,slug',
                    ])
                    ->orderByDesc('published_at');
            },
        ]);

        return response()->json([
            'message' => 'Detail tag berhasil diambil.',
            'data' => $tag,
        ]);
    }

    /**
     * Memperbarui tag.
     */
    public function update(Request $request, Tag $tag): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('tags', 'name')->ignore($tag->id),
            ],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('tags', 'slug')->ignore($tag->id),
            ],
        ]);

        $slugSource = $validated['slug']
            ?? $validated['name']
            ?? $tag->slug;

        $slug = Str::slug($slugSource);

        if ($slug === '') {
            return response()->json([
                'message' => 'Nama atau slug tag tidak valid.',
            ], 422);
        }

        if (
            Tag::where('slug', $slug)
                ->where('id', '!=', $tag->id)
                ->exists()
        ) {
            return response()->json([
                'message' => 'Slug tag sudah digunakan. Silakan gunakan slug lain.',
            ], 422);
        }

        if (array_key_exists('name', $validated)) {
            $tag->name = $validated['name'];
        }

        if (
            array_key_exists('slug', $validated)
            || array_key_exists('name', $validated)
        ) {
            $tag->slug = $slug;
        }

        $tag->save();

        return response()->json([
            'message' => 'Tag berhasil diperbarui.',
            'data' => $tag,
        ]);
    }

    /**
     * Menghapus tag.
     */
    public function destroy(Tag $tag): JsonResponse
    {
        $tag->articles()->detach();
        $tag->delete();

        return response()->json([
            'message' => 'Tag berhasil dihapus.',
        ]);
    }
}
