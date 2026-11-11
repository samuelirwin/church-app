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
        Schema::create('care_need_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('care_need_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->date('due_on')->nullable();
            $table->foreignId('volunteer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('care_need_tasks');
    }
};
