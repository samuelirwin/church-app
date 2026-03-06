<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->cascadeOnDelete();
            $table->string('label');
            $table->string('type')->default('internal_page');
            $table->string('url')->nullable();
            $table->string('route')->nullable();
            $table->string('target')->default('_self');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['parent_id', 'sort_order']);
            $table->index('is_active');
        });

        $this->seedDefaultMenuItems();
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }

    private function seedDefaultMenuItems(): void
    {
        $now = now();

        $items = [
            ['label' => 'Home', 'type' => 'internal_page', 'route' => '/', 'sort_order' => 0],
            ['label' => 'Sermons', 'type' => 'internal_page', 'route' => '/sermons', 'sort_order' => 1],
            ['label' => 'Updates', 'type' => 'internal_page', 'route' => '/updates', 'sort_order' => 2],
            ['label' => 'Events', 'type' => 'internal_page', 'route' => '/events', 'sort_order' => 3],
            ['label' => 'Ministries', 'type' => 'internal_page', 'route' => '/ministries', 'sort_order' => 4],
            ['label' => 'Academy', 'type' => 'internal_page', 'route' => '/academy', 'sort_order' => 5],
            ['label' => 'Library', 'type' => 'internal_page', 'route' => '/library', 'sort_order' => 6],
        ];

        foreach ($items as $item) {
            DB::table('menu_items')->insert(array_merge($item, [
                'target' => '_self',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }
};
