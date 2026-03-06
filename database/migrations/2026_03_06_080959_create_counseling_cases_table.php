<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counseling_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->string('client_name');
            $table->string('client_contact')->nullable();
            $table->string('client_email')->nullable();
            $table->string('case_type');
            $table->string('status')->default('open');
            $table->text('presenting_issue');
            $table->text('background_notes')->nullable();
            $table->string('referral_source')->nullable();
            $table->foreignId('assigned_counselor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('opened_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('closure_reason')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('case_type');
            $table->index('assigned_counselor_id');
            $table->index('case_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counseling_cases');
    }
};
