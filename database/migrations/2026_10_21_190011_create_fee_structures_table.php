<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('fee_category_id')->constrained('fee_categories')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('effective_from');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['academic_session_id', 'class_id', 'fee_category_id'], 'fee_structures_session_class_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};
