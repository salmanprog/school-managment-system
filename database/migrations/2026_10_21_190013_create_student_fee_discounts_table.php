<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_fee_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('fee_discount_id')->constrained('fee_discounts')->cascadeOnDelete();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_enrollment_id', 'fee_discount_id'], 'student_fee_discounts_enrollment_discount');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_fee_discounts');
    }
};
