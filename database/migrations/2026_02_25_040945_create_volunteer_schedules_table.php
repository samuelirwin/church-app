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
        Schema::create('volunteer_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('volunteer_role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('scheduled_date');
            $table->string('service_time')->default('morning');
            $table->string('status')->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('scheduled_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['volunteer_role_id', 'user_id', 'scheduled_date', 'service_time'], 'volunteer_schedule_unique');
            $table->index(['volunteer_role_id', 'scheduled_date']);
            $table->index(['user_id', 'scheduled_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteer_schedules');
    }
};
