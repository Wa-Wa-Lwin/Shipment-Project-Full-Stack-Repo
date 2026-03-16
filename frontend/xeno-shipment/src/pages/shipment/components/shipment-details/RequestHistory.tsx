import { Button, Chip, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ShipmentGETData } from './types';
import { formatDateTime, getDisplayStatusHistory } from './utils';

interface RequestHistoryProps {
  shipment: ShipmentGETData;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

const RequestHistory = ({ shipment, showHistory, setShowHistory }: RequestHistoryProps) => {
  return (
    <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-left gap-2 mb-4 border-gray-200">
        <div className="flex items-center gap-2">
          <Icon icon="solar:history-bold" width={22} className="text-blue-600" />
          <h3 className="font-semibold text-blue-900 text-base">Request History</h3>
        </div>
        <Button
          color="primary"
          size="sm"
          variant="bordered"
          startContent={<Icon icon={showHistory ? "solar:eye-closed-bold" : "solar:eye-bold"} width={16} />}
          onPress={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide History" : "Show History"}
        </Button>
      </div>

      {showHistory &&
        shipment.shipment_request_histories &&
        shipment.shipment_request_histories.length > 0 && (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent"></div>

            {shipment.shipment_request_histories
              .sort((a: any, b: any) => {
                const dateA = new Date(
                  a.history_record_date_time || a.shipment_request_created_date_time || 0
                );
                const dateB = new Date(
                  b.history_record_date_time || b.shipment_request_created_date_time || 0
                );
                return dateB.getTime() - dateA.getTime();
              })
              .map((history: any, idx: number) => {
                const statusColor = history.status?.includes('approved') ? 'success' :
                  history.status?.includes('rejected') ? 'danger' :
                  history.status?.includes('updated') ? 'warning' : 'primary';

                const iconName = history.status?.includes('approved') ? 'solar:check-circle-bold' :
                  history.status?.includes('rejected') ? 'solar:close-circle-bold' :
                  history.status?.includes('updated') ? 'solar:pen-bold' : 'solar:document-bold';

                return (
                  <div key={idx} className="relative pl-10 pb-2">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      statusColor === 'success' ? 'bg-green-100' :
                      statusColor === 'danger' ? 'bg-red-100' :
                      statusColor === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <Icon icon={iconName} width={14} className={
                        statusColor === 'success' ? 'text-green-600' :
                        statusColor === 'danger' ? 'text-red-600' :
                        statusColor === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      } />
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{history.user_name}</span>
                        <Chip size="sm" variant="flat" color="default">
                          {history.user_role || 'logistics'}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={statusColor}
                          startContent={<Icon icon={iconName} width={12} />}
                        >
                          {getDisplayStatusHistory(history.status)}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <Icon icon="solar:calendar-bold" width={14} />
                        <span>{formatDateTime(history.history_record_date_time || history.shipment_request_created_date_time)}</span>
                      </div>
                      {history.remark && history.remark !== 'N/A' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs font-medium text-gray-600">Remark: </span>
                          <span className="text-xs text-gray-700">{history.remark}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

      {showHistory && (!shipment.shipment_request_histories || shipment.shipment_request_histories.length === 0) && (
        <div className="text-center py-6 text-gray-500">
          <Icon icon="solar:inbox-line-bold" width={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No history records available</p>
        </div>
      )}
    </Card>
  );
};

export default RequestHistory;
