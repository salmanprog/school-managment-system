<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_payment_id')->constrained('fee_payments')->cascadeOnDelete();
            $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->decimal('allocated_amount', 12, 2);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['fee_payment_id', 'fee_invoice_id'], 'fee_payment_allocations_payment_invoice');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payment_allocations');
    }
};
