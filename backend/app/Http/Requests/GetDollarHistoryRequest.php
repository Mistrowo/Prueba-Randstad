<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetDollarHistoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
   public function rules(): array
{
    return [
        'fecha_inicio' => 'required|date|date_format:Y-m-d',
        'fecha_fin'    => 'required|date|date_format:Y-m-d|after_or_equal:fecha_inicio',
    ];
}
}
