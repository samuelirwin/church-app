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
        // Create the service_times table
        Schema::create('service_times', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default service times from existing enum values
        $now = now();
        DB::table('service_times')->insert([
            ['name' => 'Morning', 'slug' => 'morning', 'sort_order' => 0, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Evening', 'slug' => 'evening', 'sort_order' => 1, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Add service_time_id FK to volunteer_schedules
        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->foreignId('service_time_id')->nullable()->after('scheduled_date')->constrained()->cascadeOnDelete();
        });

        // Migrate existing string values to FK references
        $morningId = DB::table('service_times')->where('slug', 'morning')->value('id');
        $eveningId = DB::table('service_times')->where('slug', 'evening')->value('id');

        DB::table('volunteer_schedules')
            ->where('service_time', 'morning')
            ->update(['service_time_id' => $morningId]);

        DB::table('volunteer_schedules')
            ->where('service_time', 'evening')
            ->update(['service_time_id' => $eveningId]);

        // Drop old unique constraint, column, and recreate constraint with new FK
        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->dropUnique('volunteer_schedule_unique');
            $table->dropColumn('service_time');
        });

        // Make service_time_id non-nullable now that data is migrated
        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->foreignId('service_time_id')->nullable(false)->change();
        });

        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->unique(
                ['volunteer_role_id', 'user_id', 'scheduled_date', 'service_time_id'],
                'volunteer_schedule_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->dropUnique('volunteer_schedule_unique');
        });

        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->string('service_time')->default('morning')->after('scheduled_date');
        });

        // Restore string values from FK references
        $serviceTimes = DB::table('service_times')->pluck('slug', 'id');
        foreach ($serviceTimes as $id => $slug) {
            DB::table('volunteer_schedules')
                ->where('service_time_id', $id)
                ->update(['service_time' => $slug]);
        }

        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_time_id');
        });

        Schema::table('volunteer_schedules', function (Blueprint $table) {
            $table->unique(
                ['volunteer_role_id', 'user_id', 'scheduled_date', 'service_time'],
                'volunteer_schedule_unique'
            );
        });

        Schema::dropIfExists('service_times');
    }
};
