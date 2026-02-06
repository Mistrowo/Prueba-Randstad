<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MindicadorService
{
    private const BASE_URL = 'https://mindicador.cl/api/dolar';

    public function getValuesByYear(int $year): array
    {
        try {
            $response = Http::timeout(15)->get(self::BASE_URL . '/' . $year);

            if ($response->failed()) {
                Log::error("Error API Mindicador año {$year}");
                return [];
            }

            return $response->json()['serie'] ?? [];
        } catch (\Exception $e) {
            Log::error("Excepción Mindicador: " . $e->getMessage());
            return [];
        }
    }
}