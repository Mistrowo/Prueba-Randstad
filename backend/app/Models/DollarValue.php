<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DollarValue extends Model
{
    protected $fillable = ['date', 'value', 'origin'];

    protected $casts = [
        'date' => 'date',
        'value' => 'decimal:2',
    ];
}