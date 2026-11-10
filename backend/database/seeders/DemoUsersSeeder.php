<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@wikiflow.test'],
            [
                'name' => 'Admin WikiFlow',
                'password' => 'password',
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@wikiflow.test'],
            [
                'name' => 'User WikiFlow',
                'password' => 'password',
                'role' => 'user',
            ]
        );
    }
}