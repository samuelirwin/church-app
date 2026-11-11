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
        Schema::create('care_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained()->nullOnDelete();
            $table->string('requester_name')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');
            $table->string('priority')->default('normal');
            $table->string('status')->default('open')->index();
            $table->string('source')->default('manual');
            $table->boolean('is_confidential')->default(false);
            $table->boolean('share_on_prayer_wall')->default(false);
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_on')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('benevolent_request_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('counseling_case_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('care_needs');
    }
};
