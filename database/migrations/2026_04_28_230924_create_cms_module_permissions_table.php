<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_module_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role');
            $table->integer('module_id');
            $table->boolean('is_add')->default(1);
            $table->boolean('is_view')->default(1);
            $table->boolean('is_update')->default(1);
            $table->boolean('is_delete')->default(1);
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_module_permissions');
    }
};
