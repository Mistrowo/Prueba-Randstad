<?php
namespace App\Console\Commands;

use App\Jobs\SyncDollarJob;
use Illuminate\Console\Command;

class SyncDollarValues extends Command
{
    protected $signature = 'dolar:sync {--years= : Años separados por coma}';
    protected $description = 'Sincroniza valores del dólar';

    public function handle()
    {
        $yearsInput = $this->option('years');
        $years = $yearsInput ? explode(',', $yearsInput) : [2024, 2025];

        $this->info("Sincronizando años: " . implode(', ', $years));
        SyncDollarJob::dispatch($years);
        $this->info("Job despachado correctamente.");
    }
}