<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('exam_type_id')->constrained('exam_types')->restrictOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('scheduled');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['academic_session_id', 'exam_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
