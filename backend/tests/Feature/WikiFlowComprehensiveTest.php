<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WikiFlowComprehensiveTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin(string $email = 'admin@wikiflow.test'): User
    {
        return User::create([
            'name' => 'Admin WikiFlow',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
    }

    protected function createUser(string $email = 'user@wikiflow.test'): User
    {
        return User::create([
            'name' => 'User WikiFlow',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
    }

    protected function createCategory(string $name = 'Engineering', string $slug = 'engineering'): Category
    {
        return Category::create([
            'name' => $name,
            'slug' => $slug,
            'description' => 'Dokumentasi teknis.',
        ]);
    }

    protected function createTag(string $name = 'Laravel', string $slug = 'laravel'): Tag
    {
        return Tag::create([
            'name' => $name,
            'slug' => $slug,
        ]);
    }

    protected function actAsGuest(): void
    {
        $this->flushHeaders();
        $this->app['auth']->forgetGuards();
        auth()->forgetGuards();
    }

    // 1. Valid login
    public function test_01_valid_login(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@wikiflow.test',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'user', 'token', 'token_type'])
            ->assertJsonPath('user.email', 'admin@wikiflow.test');
    }

    // 2. Invalid login
    public function test_02_invalid_login(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@wikiflow.test',
            'password' => 'salah-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonStructure(['message']);
    }

    // 3. Authenticated user retrieval
    public function test_03_authenticated_user_retrieval(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/user');

        $response->assertStatus(200)
            ->assertJsonPath('user.email', 'admin@wikiflow.test')
            ->assertJsonPath('user.role', 'admin');
    }

    // 4. Logout and token invalidation
    public function test_04_logout_and_token_invalidation(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        // Setelah logout, pastikan token telah terhapus dari database
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Reset memory guard untuk menguji pembacaan ulang token dari database
        $this->app['auth']->forgetGuards();

        $protectedCheck = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/user');

        $protectedCheck->assertStatus(401);
    }

    // 5. Unauthenticated access to protected routes
    public function test_05_unauthenticated_access_to_protected_routes(): void
    {
        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(401);
    }

    // 6. Admin access to administrative routes
    public function test_06_admin_access_to_administrative_routes(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users');

        $response->assertStatus(200);
    }

    // 7. User denial of administrative access
    public function test_07_user_denial_of_administrative_access(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    // 8. User-list access restrictions
    public function test_08_user_list_access_restrictions(): void
    {
        $admin = $this->createAdmin();
        $this->createUser();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/admin/users');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    // 9. Role-update validation and authorization
    public function test_09_role_update_validation_and_authorization(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();
        $adminToken = $admin->createToken('test')->plainTextToken;

        // Admin mengubah role user menjadi admin
        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/users/{$user->id}/role", [
                'role' => 'admin',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.role', 'admin');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'admin',
        ]);

        // Pencegahan self-demotion
        $selfRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/users/{$admin->id}/role", [
                'role' => 'user',
            ]);

        $selfRes->assertStatus(422);
    }

    // 10. Article creation validation
    public function test_10_article_creation_validation(): void
    {
        $admin = $this->createAdmin();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content', 'category_id', 'status']);
    }

    // 11. Article slug uniqueness
    public function test_11_article_slug_uniqueness(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $firstRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Panduan Setup',
                'content' => 'Konten artikel pertama.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $firstRes->assertStatus(201)
            ->assertJsonPath('data.slug', 'panduan-setup');

        $secondRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Panduan Setup',
                'content' => 'Konten artikel kedua.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $secondRes->assertStatus(201)
            ->assertJsonPath('data.slug', 'panduan-setup-1');
    }

    // 12. Article editing
    public function test_12_article_editing(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Judul Lama',
                'content' => 'Isi Lama',
                'category_id' => $cat->id,
                'status' => 'draft',
            ]);

        $articleId = $createRes->json('data.id');

        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/articles/{$articleId}", [
                'title' => 'Judul Baru yang Diedit',
                'content' => 'Isi yang telah diperbarui.',
                'status' => 'published',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Judul Baru yang Diedit')
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('articles', [
            'id' => $articleId,
            'title' => 'Judul Baru yang Diedit',
            'status' => 'published',
        ]);
    }

    // 13. Article deletion
    public function test_13_article_deletion(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $tag = $this->createTag();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel untuk Dihapus',
                'content' => 'Isi konten.',
                'category_id' => $cat->id,
                'tag_ids' => [$tag->id],
                'status' => 'published',
            ]);

        $articleId = $createRes->json('data.id');

        $deleteRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->deleteJson("/api/articles/{$articleId}");

        $deleteRes->assertStatus(200);

        $this->assertDatabaseMissing('articles', ['id' => $articleId]);
        $this->assertDatabaseMissing('article_tag', ['article_id' => $articleId]);
    }

    // 14. Draft privacy
    public function test_14_draft_privacy(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Rahasia Draft',
                'content' => 'Konten internal yang belum dipublikasikan.',
                'category_id' => $cat->id,
                'status' => 'draft',
            ]);

        // Publik melihat list artikel tanpa otentikasi
        $this->actAsGuest();
        $publicList = $this->getJson('/api/articles');
        $publicList->assertStatus(200)
            ->assertJsonCount(0, 'data.data');

        // Publik mengakses slug artikel draft langsung
        $this->actAsGuest();
        $publicDetail = $this->getJson('/api/articles/artikel-rahasia-draft');
        $publicDetail->assertStatus(404);
    }

    // 15. Published article visibility
    public function test_15_published_article_visibility(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Terbuka Publik',
                'content' => 'Konten umum.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $publicList = $this->getJson('/api/articles');
        $publicList->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        $publicDetail = $this->getJson('/api/articles/artikel-terbuka-publik');
        $publicDetail->assertStatus(200)
            ->assertJsonPath('data.title', 'Artikel Terbuka Publik');
    }

    // 16. Category CRUD and validation
    public function test_16_category_crud_and_validation(): void
    {
        $admin = $this->createAdmin();
        $adminToken = $admin->createToken('test')->plainTextToken;

        // Create
        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/categories', [
                'name' => 'Backend Architecture',
                'description' => 'Panduan sistem backend.',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.slug', 'backend-architecture');

        $catId = $createRes->json('data.id');

        // Duplikat nama dicegah
        $dupRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/categories', [
                'name' => 'Backend Architecture',
            ]);
        $dupRes->assertStatus(422);

        // Update
        $updateRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/categories/{$catId}", [
                'name' => 'Cloud & Backend Architecture',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('data.name', 'Cloud & Backend Architecture');
    }

    // 17. Category deletion constraints
    public function test_17_category_deletion_constraints(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory('Database Ops', 'database-ops');
        $adminToken = $admin->createToken('test')->plainTextToken;

        // Hubungkan dengan artikel
        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Panduan MySQL',
                'content' => 'Setup MySQL.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        // Hapus kategori yang memiliki artikel harus ditolak (409 Conflict)
        $delRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->deleteJson("/api/categories/{$cat->id}");

        $delRes->assertStatus(409);
        $this->assertDatabaseHas('categories', ['id' => $cat->id]);
    }

    // 18. Tag creation and duplicate prevention
    public function test_18_tag_creation_and_duplicate_prevention(): void
    {
        $admin = $this->createAdmin();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $res1 = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/tags', ['name' => 'Docker']);
        $res1->assertStatus(201);

        $res2 = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/tags', ['name' => 'Docker']);
        $res2->assertStatus(422);
    }

    // 19. Article-tag relationship persistence
    public function test_19_article_tag_relationship_persistence(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $tag1 = $this->createTag('Docker', 'docker');
        $tag2 = $this->createTag('Security', 'security');
        $adminToken = $admin->createToken('test')->plainTextToken;

        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Container Security',
                'content' => 'Panduan Docker aman.',
                'category_id' => $cat->id,
                'tag_ids' => [$tag1->id, $tag2->id],
                'status' => 'published',
            ]);

        $articleId = $createRes->json('data.id');
        $this->assertDatabaseHas('article_tag', ['article_id' => $articleId, 'tag_id' => $tag1->id]);
        $this->assertDatabaseHas('article_tag', ['article_id' => $articleId, 'tag_id' => $tag2->id]);

        // Update tag: lepaskan tag1, sisakan tag2
        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/articles/{$articleId}", [
                'tag_ids' => [$tag2->id],
            ]);

        $this->assertDatabaseMissing('article_tag', ['article_id' => $articleId, 'tag_id' => $tag1->id]);
        $this->assertDatabaseHas('article_tag', ['article_id' => $articleId, 'tag_id' => $tag2->id]);
    }

    // 20. Search by title
    public function test_20_search_by_title(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Kubernetes Cluster Deployment',
                'content' => 'Panduan orkestrasi.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $res = $this->getJson('/api/articles?search=Kubernetes');
        $res->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.title', 'Kubernetes Cluster Deployment');
    }

    // 21. Search by body
    public function test_21_search_by_body(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Panduan Server',
                'content' => 'Gunakan perintah terraform apply untuk deploy.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $res = $this->getJson('/api/articles?search=terraform');
        $res->assertStatus(200)
            ->assertJsonCount(1, 'data.data');
    }

    // 22. Search result privacy
    public function test_22_search_result_privacy(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Draft Rahasia Internal',
                'content' => 'KeywordKunciRahasia di dalam draft.',
                'category_id' => $cat->id,
                'status' => 'draft',
            ]);

        $this->actAsGuest();
        $res = $this->getJson('/api/articles?search=KeywordKunciRahasia');
        $res->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    // 23. Article detail by slug
    public function test_23_article_detail_by_slug(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Pengenalan GraphQL',
                'content' => 'Materi pengenalan GraphQL untuk API.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $this->flushHeaders();
        $res = $this->getJson('/api/articles/pengenalan-graphql');
        $res->assertStatus(200)
            ->assertJsonPath('data.title', 'Pengenalan GraphQL')
            ->assertJsonPath('data.slug', 'pengenalan-graphql');
    }

    // 24. Missing article handling
    public function test_24_missing_article_handling(): void
    {
        $res = $this->getJson('/api/articles/slug-yang-tidak-ada-pasti-404');
        $res->assertStatus(404);
    }

    // 25. Latest articles filtering and sorting
    public function test_25_latest_articles_filtering_and_sorting(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Pertama',
                'content' => 'Isi 1',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Kedua',
                'content' => 'Isi 2',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $this->flushHeaders();
        $res = $this->getJson('/api/articles?sort=latest');
        $res->assertStatus(200);
        $articles = $res->json('data.data');
        $this->assertEquals('Artikel Kedua', $articles[0]['title']);
    }

    // 26. Persistent article view tracking
    public function test_26_persistent_article_view_tracking(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Tracking View',
                'content' => 'Isi konten.',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $viewRes = $this->postJson('/api/articles/artikel-tracking-view/view');
        $viewRes->assertStatus(200)
            ->assertJsonPath('views', 1);

        $viewRes2 = $this->postJson('/api/articles/artikel-tracking-view/view');
        $viewRes2->assertStatus(200)
            ->assertJsonPath('views', 2);

        $this->assertDatabaseHas('articles', [
            'slug' => 'artikel-tracking-view',
            'views' => 2,
        ]);
    }

    // 27. Popular article ranking
    public function test_27_popular_article_ranking(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Sedikit View',
                'content' => 'Isi 1',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Artikel Banyak View',
                'content' => 'Isi 2',
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        // Tambah view pada artikel kedua
        $this->postJson('/api/articles/artikel-banyak-view/view');
        $this->postJson('/api/articles/artikel-banyak-view/view');
        $this->postJson('/api/articles/artikel-banyak-view/view');

        $popularRes = $this->getJson('/api/articles/popular?limit=2');
        $popularRes->assertStatus(200);

        $data = $popularRes->json('data');
        $this->assertEquals('Artikel Banyak View', $data[0]['title']);
        $this->assertEquals(3, $data[0]['views']);
    }

    // 28. Safe handling of malicious Markdown input
    public function test_28_safe_handling_of_malicious_markdown_input(): void
    {
        $admin = $this->createAdmin();
        $cat = $this->createCategory();
        $adminToken = $admin->createToken('test')->plainTextToken;

        $maliciousPayload = "## Heading Normal\n\n<script>alert('XSS')</script>\n<img src=x onerror=alert(1)>\n[Bahaya](javascript:alert(1))";

        $createRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/articles', [
                'title' => 'Uji Input Keamanan Markdown',
                'content' => $maliciousPayload,
                'category_id' => $cat->id,
                'status' => 'published',
            ]);

        $createRes->assertStatus(201);

        $getRes = $this->getJson('/api/articles/uji-input-keamanan-markdown');
        $getRes->assertStatus(200);
        $content = $getRes->json('data.content');

        // Pastikan konten tersimpan persis apa adanya sebagai teks mentah (tidak dieksekusi oleh backend)
        $this->assertStringContainsString("<script>alert('XSS')</script>", $content);
    }
}
