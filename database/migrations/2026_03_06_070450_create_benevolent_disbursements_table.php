<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benevolent_disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('benevolent_request_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method');
            $table->string('reference_number')->nullable();
            $table->foreignId('disbursed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('disbursed_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benevolent_disbursements');
    }
};
