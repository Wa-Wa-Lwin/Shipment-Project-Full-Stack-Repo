import { Card, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ShipmentGETData } from './types';

interface ParcelsSectionProps {
  shipment: ShipmentGETData;
}

const ParcelsSection = ({ shipment }: ParcelsSectionProps) => {
  if (!shipment.parcels?.length) {
    return null;
  }

  return (
    <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-gray-200">
        <Icon icon="solar:box-minimalistic-bold" width={22} className="text-blue-600" />
        <h3 className="font-semibold text-blue-900 text-base">Parcels & Items</h3>
        <Chip size="sm" color="primary" variant="flat">{shipment.parcels.length}</Chip>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          shadow="none"
          aria-label="Parcels Table"
          removeWrapper
          classNames={{
            th: "bg-gray-50 text-gray-700 font-semibold text-xs",
            td: "text-xs text-gray-700"
          }}
        >
          <TableHeader>
            <TableColumn className="w-12">No.</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Box Type</TableColumn>
            <TableColumn>Dimensions LWH ({shipment.parcels[0].dimension_unit})</TableColumn>
            <TableColumn>Weight ({shipment.parcels[0].weight_unit})</TableColumn>
            <TableColumn className="min-w-[400px]">Items</TableColumn>
          </TableHeader>
          <TableBody>
            {shipment.parcels.map((parcel: any, idx: number) => (
              <TableRow key={idx} className="hover:bg-gray-50">
                <TableCell>
                  <Chip size="sm" variant="flat" color="default">{idx + 1}</Chip>
                </TableCell>
                <TableCell>{parcel.description || '-'}</TableCell>
                <TableCell>
                  <span className="font-medium">{parcel.box_type_name || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">
                    {Math.floor(parseFloat(parcel.depth) || 0)} × {Math.floor(parseFloat(parcel.height) || 0)} × {Math.floor(parseFloat(parcel.width) || 0)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">{parseFloat(parcel.weight_value) || 0}</span>
                </TableCell>
                <TableCell>
                  {parcel.items?.length > 0 ? (
                    <div className="space-y-2">
                      {parcel.items.map((item: any, i: number) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div>
                              <span className="text-gray-600">Mat Code:</span>{' '}
                              <span className="font-medium">{item.material_code || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">SKU:</span>{' '}
                              <span className="font-medium">{item.sku || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Description:</span>{' '}
                              <span className="font-medium">{item.description}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Price:</span>{' '}
                              <span className="font-semibold">{parseFloat(item.price_amount) || 0} {item.price_currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Qty:</span>{' '}
                              <span className="font-medium">{parseInt(item.quantity) || 1} pcs</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Weight:</span>{' '}
                              <span className="font-medium">{(parseFloat(item.weight_value) || 0).toFixed(5)} {item.weight_unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">HS CODE:</span>{' '}
                              <span className="font-medium">{item.hs_code || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Origin:</span>{' '}
                              <span className="font-medium">{item.origin_country}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No items</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ParcelsSection;
