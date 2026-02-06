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
    Schema::create('dollar_values', function (Blueprint $table) {
        $table->id();
        $table->date('date')->unique(); // Evita duplicados por fecha
        $table->decimal('value', 10, 2);
        $table->string('origin')->default('mindicador');
        $table->timestamps();
        
        $table->index('date'); // Optimiza búsquedas por rango
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dollar_values');
    }
};
