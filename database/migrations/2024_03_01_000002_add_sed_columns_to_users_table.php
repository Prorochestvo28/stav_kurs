<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('name');
            $table->string('position')->nullable()->after('full_name');
            $table->foreignId('department_id')->nullable()->after('position')->constrained('departments')->nullOnDelete();
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('user')->after('password'); // admin, editor, user
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn(['full_name', 'position', 'department_id', 'phone', 'role', 'is_active']);
        });
    }
};
