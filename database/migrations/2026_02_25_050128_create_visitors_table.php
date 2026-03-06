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
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->date('first_visit_date');
            $table->string('how_heard')->nullable();
            $table->text('prayer_requests')->nullable();
            $table->text('notes')->nullable();
            $table->string('follow_up_status')->default('new');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('converted_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('follow_up_status');
            $table->index('assigned_to');
            $table->index('first_visit_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
