<?php
use App\Http\Controllers\Api\DollarController;
use Illuminate\Support\Facades\Route;

Route::get('/dolar-history', [DollarController::class, 'index']);