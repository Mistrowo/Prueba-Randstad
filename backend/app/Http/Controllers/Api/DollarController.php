<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetDollarHistoryRequest;
use App\Http\Resources\DollarValueResource;
use App\Models\DollarValue;

class DollarController extends Controller
{
    public function index(GetDollarHistoryRequest $request)
    {
        $data = DollarValue::whereBetween('date', [
                $request->fecha_inicio, 
                $request->fecha_fin
            ])
            ->orderBy('date', 'asc')
            ->get();

        return DollarValueResource::collection($data);
    }
}