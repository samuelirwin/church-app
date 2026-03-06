<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benevolent_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('benevolent_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('recommendation');
            $table->decimal('amount_recommended', 10, 2)->nullable();
            $table->text('comments')->nullable();
            $table->timestamp('reviewed_at');
            $table->timestamps();

            $table->unique(['benevolent_request_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benevolent_reviews');
    }
};
