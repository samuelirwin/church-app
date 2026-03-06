<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('counseling_cases', function (Blueprint $table) {
            $table->renameColumn('client_name', 'person_name');
            $table->renameColumn('client_contact', 'person_contact');
            $table->renameColumn('client_email', 'person_email');
        });
    }

    public function down(): void
    {
        Schema::table('counseling_cases', function (Blueprint $table) {
            $table->renameColumn('person_name', 'client_name');
            $table->renameColumn('person_contact', 'client_contact');
            $table->renameColumn('person_email', 'client_email');
        });
    }
};
