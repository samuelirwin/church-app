<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reading_plan_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('reading_plan_enrollments')->cascadeOnDelete();
            $table->foreignId('day_id')->constrained('reading_plan_days')->cascadeOnDelete();
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->unique(['enrollment_id', 'day_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reading_plan_progress');
    }
};
