<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AddressListTemplateExport implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
{
    public function collection()
    {
        return new Collection([]);
    }

    public function headings(): array
    {
        return [
            'Card Code',
            'Company Name',
            'Card Type',
            'Street 1',
            'Street 2',
            'Street 3',
            'City',
            'State',
            'Country',
            'Postal Code',
            'Contact Name',
            'Contact',
            'Phone',
            'Email',
            'Tax ID',
            'Phone 1',
            'Website',
            'EORI Number',
            'Bind Incoterms',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12], 'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E2EFDA'],
            ]],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 30,
            'C' => 15,
            'D' => 30,
            'E' => 30,
            'F' => 30,
            'G' => 20,
            'H' => 15,
            'I' => 15,
            'J' => 15,
            'K' => 25,
            'L' => 15,
            'M' => 15,
            'N' => 30,
            'O' => 20,
            'P' => 15,
            'Q' => 30,
            'R' => 20,
            'S' => 20,
        ];
    }
}
