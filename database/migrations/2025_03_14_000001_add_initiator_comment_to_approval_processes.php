<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_processes', function (Blueprint $table) {
            $table->text('initiator_comment')->nullable()->after('deadline');
        });
    }

    public function down(): void
    {
        Schema::table('approval_processes', function (Blueprint $table) {
            $table->dropColumn('initiator_comment');
        });
    }
};
