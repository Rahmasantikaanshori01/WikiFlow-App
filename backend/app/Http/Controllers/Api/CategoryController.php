<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Menampilkan semua kategori.
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount('articles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Daftar kategori berhasil diambil.',
            'data' => $categories,
        ]);
    }

    /**
     * Membuat kategori baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $slug = Str::slug($validated['slug'] ?? $validated['name']);

        if (Category::where('slug', $slug)->exists()) {
            return response()->json([
                'message' => 'Slug kategori sudah digunakan. Silakan gunakan slug lain.',
            ], 422);
        }

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil dibuat.',
            'data' => $category,
        ], 201);
    }

    /**
     * Menampilkan detail kategori.
     */
    public function show(Category $category): JsonResponse
    {
        $category->loadCount('articles');

        return response()->json([
            'message' => 'Detail kategori berhasil diambil.',
            'data' => $category,
        ]);
    }

    /**
     * Memperbarui kategori.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($category->id),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $slugSource = $validated['slug'] ?? $validated['name'] ?? $category->name;
        $slug = Str::slug($slugSource);

        if (
            Category::where('slug', $slug)
                ->where('id', '!=', $category->id)
                ->exists()
        ) {
            return response()->json([
                'message' => 'Slug kategori sudah digunakan. Silakan gunakan slug lain.',
            ], 422);
        }

        if (array_key_exists('name', $validated)) {
            $category->name = $validated['name'];
        }

        if (array_key_exists('slug', $validated) || array_key_exists('name', $validated)) {
            $category->slug = $slug;
        }

        if (array_key_exists('description', $validated)) {
            $category->description = $validated['description'];
        }

        $category->save();

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    /**
     * Menghapus kategori yang belum digunakan artikel.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->articles()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih digunakan oleh artikel.',
            ], 409);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }
}
