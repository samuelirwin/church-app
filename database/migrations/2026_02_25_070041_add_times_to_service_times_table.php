<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('service_times', function (Blueprint $table) {
            $table->time('start_time')->nullable()->after('slug');
            $table->time('end_time')->nullable()->after('start_time');
        });

        // Set sensible defaults for seeded records
        DB::table('service_times')->where('slug', 'morning')->update([
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);

        DB::table('service_times')->where('slug', 'evening')->update([
            'start_time' => '17:00',
            'end_time' => '19:00',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_times', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time']);
        });
    }
};
