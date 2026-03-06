<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Replace the custom media system with Spatie Media Library.
     * Drops unused FK columns from all tables and recreates media table with Spatie schema.
     */
    public function up(): void
    {
        // Drop FK constraints first, then columns
        Schema::table('speakers', function (Blueprint $table) {
            $table->dropForeign(['photo_media_id']);
            $table->dropColumn('photo_media_id');
        });

        Schema::table('sermon_series', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('sermons', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropForeign(['audio_media_id']);
            $table->dropColumn(['cover_media_id', 'audio_media_id']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('highlights', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('reading_plans', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('ministries', function (Blueprint $table) {
            $table->dropForeign(['cover_media_id']);
            $table->dropColumn('cover_media_id');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['video_media_id']);
            $table->dropColumn('video_media_id');
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['pdf_media_id']);
            $table->dropColumn('pdf_media_id');
        });

        Schema::table('sermon_resources', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::table('lesson_resources', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::table('assignment_submissions', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        // Drop the custom media table
        Schema::dropIfExists('media');

        // Create Spatie Media Library table
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('model');
            $table->uuid()->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable()->index();
            $table->nullableTimestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');

        // Recreate the custom media table
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('disk')->default('public');
            $table->string('path');
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->text('metadata')->nullable();
            $table->string('collection')->default('default');
            $table->nullableMorphs('mediable');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('collection');
            $table->index('mime_type');
        });

        // Re-add FK columns
        Schema::table('speakers', fn (Blueprint $table) => $table->foreignId('photo_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('sermon_series', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('sermons', function (Blueprint $table) {
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('audio_media_id')->nullable()->constrained('media')->nullOnDelete();
        });
        Schema::table('posts', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('highlights', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('reading_plans', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('courses', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('books', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('events', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('ministries', fn (Blueprint $table) => $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('lessons', fn (Blueprint $table) => $table->foreignId('video_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('certificates', fn (Blueprint $table) => $table->foreignId('pdf_media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('sermon_resources', fn (Blueprint $table) => $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('lesson_resources', fn (Blueprint $table) => $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete());
        Schema::table('assignment_submissions', fn (Blueprint $table) => $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete());
    }
};
