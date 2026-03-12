<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benevolent_requests', function (Blueprint $table) {
            $table->id();
            $table->string('requester_name');
            $table->string('requester_contact')->nullable();
            $table->string('category');
            $table->text('description');
            $table->decimal('amount_requested', 10, 2)->nullable();
            $table->string('urgency');
            $table->string('status')->default('pending');
            $table->decimal('amount_approved', 10, 2)->nullable();
            $table->foreignId('final_decision_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('final_decision_at')->nullable();
            $table->text('final_decision_notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('urgency');
            $table->index('category');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benevolent_requests');
    }
};
