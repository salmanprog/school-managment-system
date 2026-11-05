<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_scale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grading_scale_id')->constrained('grading_scales')->cascadeOnDelete();
            $table->decimal('minimum_percentage', 5, 2);
            $table->decimal('maximum_percentage', 5, 2);
            $table->string('grade');
            $table->decimal('grade_point', 4, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('grading_scale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grading_scale_items');
    }
};
