<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_id')->constrained('approval_processes')->cascadeOnDelete();
            $table->unsignedInteger('step_number')->default(1);
            $table->foreignId('assignee_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, completed
            $table->string('decision')->nullable(); // approve, reject
            $table->text('comment')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
