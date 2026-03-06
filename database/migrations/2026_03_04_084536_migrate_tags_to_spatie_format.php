<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add Spatie-required columns and convert existing name/slug to JSON format.
     */
    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('type')->nullable()->after('slug');
            $table->integer('order_column')->nullable()->after('type');
        });

        // Drop the unique constraint on slug before converting to JSON
        Schema::table('tags', function (Blueprint $table) {
            $table->dropUnique('tags_slug_unique');
        });

        // Convert existing plain-string name/slug values to Spatie JSON format
        DB::table('tags')->get()->each(function ($tag) {
            DB::table('tags')->where('id', $tag->id)->update([
                'name' => json_encode(['en' => $tag->name]),
                'slug' => json_encode(['en' => $tag->slug]),
            ]);
        });
    }

    /**
     * Revert JSON columns back to plain strings and remove Spatie columns.
     */
    public function down(): void
    {
        // Convert JSON name/slug back to plain strings
        DB::table('tags')->get()->each(function ($tag) {
            $name = json_decode($tag->name, true);
            $slug = json_decode($tag->slug, true);

            DB::table('tags')->where('id', $tag->id)->update([
                'name' => is_array($name) ? ($name['en'] ?? $tag->name) : $tag->name,
                'slug' => is_array($slug) ? ($slug['en'] ?? $tag->slug) : $tag->slug,
            ]);
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->unique('slug', 'tags_slug_unique');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn(['type', 'order_column']);
        });
    }
};
