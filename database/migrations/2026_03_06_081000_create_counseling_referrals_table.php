<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counseling_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counseling_case_id')->constrained()->cascadeOnDelete();
            $table->string('referred_to');
            $table->string('referral_type');
            $table->date('referral_date');
            $table->text('reason');
            $table->text('outcome')->nullable();
            $table->foreignId('referred_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counseling_referrals');
    }
};
