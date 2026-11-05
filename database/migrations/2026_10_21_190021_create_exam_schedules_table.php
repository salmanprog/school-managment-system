<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->date('exam_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('total_marks');
            $table->unsignedInteger('passing_marks');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['exam_id', 'section_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_schedules');
    }
};
