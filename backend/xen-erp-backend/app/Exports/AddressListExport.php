<?php

namespace App\Exports;

use App\Models\Logistic\AddressList;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AddressListExport implements FromCollection, WithColumnWidths, WithHeadings, WithMapping, WithStyles
{
    public function collection()
    {
        return AddressList::where('active', 1)->get();
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

    public function map($address): array
    {
        return [
            $address->CardCode,
            $address->company_name,
            $address->CardType,
            $address->street1,
            $address->street2,
            $address->street3,
            $address->city,
            $address->state,
            $address->country,
            $address->postal_code,
            $address->contact_name,
            $address->contact,
            $address->phone,
            $address->email,
            $address->tax_id,
            $address->phone1,
            $address->website,
            $address->eori_number,
            $address->bind_incoterms,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 12]],
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
