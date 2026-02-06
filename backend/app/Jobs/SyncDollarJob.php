<?php
namespace App\Jobs;

use App\Models\DollarValue;
use App\Services\MindicadorService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncDollarJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected array $years;

    public function __construct(array $years = [2024, 2025]) {
        $this->years = $years;
    }

    public function handle(MindicadorService $service): void
    {
        foreach ($this->years as $year) {
            $data = $service->getValuesByYear($year);
            $upsertData = [];

            foreach ($data as $item) {
                $upsertData[] = [
                    'date' => Carbon::parse($item['fecha'])->format('Y-m-d'),
                    'value' => $item['valor'],
                    'origin' => 'mindicador',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (!empty($upsertData)) {
                DollarValue::upsert($upsertData, ['date'], ['value', 'updated_at']);
            }
        }
    }
}