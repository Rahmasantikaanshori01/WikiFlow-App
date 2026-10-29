<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Menampilkan daftar pengguna untuk admin.
     * Mendukung pencarian berdasarkan nama/email dan filter role.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::select(['id', 'name', 'email', 'role', 'created_at']);

        if ($request->filled('search')) {
            $keyword = $request->input('search');
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%");
            });
        }

        if ($request->filled('role')) {
            $roleFilter = strtolower($request->input('role'));
            if (in_array($roleFilter, ['admin', 'user'], true)) {
                $query->where('role', $roleFilter);
            }
        }

        $users = $query->orderBy('name')->get();

        return response()->json([
            'message' => 'Daftar pengguna berhasil diambil.',
            'data' => $users,
        ]);
    }

    /**
     * Memperbarui role pengguna.
     * Hanya admin yang berwenang. Mencegah admin mengubah role dirinya sendiri jika dapat menghilangkan admin terakhir.
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'user'])],
        ]);

        $currentUser = $request->user();

        // Mencegah penurunan role diri sendiri (self-demotion) agar admin tidak terkunci
        if ($currentUser && $currentUser->id === $user->id && $validated['role'] !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak dapat mengubah role akun Anda sendiri menjadi user untuk mencegah terkuncinya akses admin.',
            ], 422);
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'message' => 'Role pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }
}
