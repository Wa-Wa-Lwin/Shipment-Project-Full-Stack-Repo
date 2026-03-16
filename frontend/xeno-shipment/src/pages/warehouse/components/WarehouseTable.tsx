import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Pagination,
  Select,
  SelectItem,
  Button
} from '@heroui/react'
import { Icon } from "@iconify/react";
import { isRateChosen } from '../../shipment/utils/rateUtils';
import axios from 'axios'
import type { ShipmentFormData, ShipmentRequestsResponse } from '@pages/shipment/types/shipment-form.types';
// import { countries } from '@utils/countries';

const WarehouseTable = () => {
  const navigate = useNavigate()
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming'>('upcoming')

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const pageSizeOptions = [10, 25, 50, 100]

  const fetchShipmentRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = import.meta.env.VITE_APP_GET_ALL_SHIPMENT_REQUESTS
      if (!apiUrl) {
        throw new Error('API URL not configured')
      }

      const response = await axios.get<ShipmentRequestsResponse>(apiUrl)

      // Filter for warehouse: request_status = 'approver_approved' AND label_status = 'created'
      const warehouseRequests = response.data.shipment_requests_desc.filter(request =>
        request.request_status === 'approver_approved' &&
        request.label_status === 'created'
      )

      setShipmentRequests(warehouseRequests)
    } catch (err) {
      console.error('Error fetching warehouse shipment requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouse shipment requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShipmentRequests()
  }, [fetchShipmentRequests])

  // Filter by date
  const filteredRequests = useMemo(() => {
    if (dateFilter === 'all') {
      return shipmentRequests
    }

    // Filter for upcoming shipments (today or future)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day

    return shipmentRequests.filter(request => {
      if (!request.pick_up_date) return false
      const pickupDate = new Date(request.pick_up_date)
      pickupDate.setHours(0, 0, 0, 0) // Reset to start of day
      return pickupDate >= today
    })
  }, [shipmentRequests, dateFilter])

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredRequests.slice(startIndex, endIndex)
  }, [filteredRequests, page, pageSize])

  const totalPages = Math.ceil(filteredRequests.length / pageSize)

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1) // Reset to first page when changing page size
  }

  const handleRowClick = (shipmentRequestID: string | number, event: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons or links
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) {
      return
    }
    navigate(`/warehouse/${shipmentRequestID}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  function formatTime(timeString: string) {
    if (!timeString) return "";
    // Take only HH:mm from HH:mm:ss.0000000
    const [hours, minutes] = timeString.split(":");
    return `${parseInt(hours, 10)}:${minutes}`;
  }

  // const getCountryName = (countryCode: string): string => {
  //   const country = countries.find(c => c.code === countryCode)
  //   return country ? country.name : countryCode
  // }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <p className="text-danger">Error: {error}</p>
        <button
          onClick={fetchShipmentRequests}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="p-0 flex items-center">
            <h2 className="text-xl font-semibold">Xen Logistic System - Warehouse</h2>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={dateFilter === 'all' ? 'solid' : 'bordered'}
              color={dateFilter === 'all' ? 'primary' : 'default'}
              onPress={() => {
                setDateFilter('all')
                setPage(1) // Reset to first page when changing filter
              }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={dateFilter === 'upcoming' ? 'solid' : 'bordered'}
              color={dateFilter === 'upcoming' ? 'primary' : 'default'}
              onPress={() => {
                setDateFilter('upcoming')
                setPage(1) // Reset to first page when changing filter
              }}
            >
              Upcoming
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] sm:max-h-[550px] lg:max-h-[680px]">
        <Table
          aria-label="Warehouse shipment requests table"
          className="text-xs md:text-sm w-auto"
          removeWrapper
          isStriped
        >
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm text-sm">
            <TableColumn className="w-20">ID</TableColumn>
            <TableColumn className="w-32">Requestor</TableColumn>
            <TableColumn className="w-36">Pickup Date</TableColumn>
            <TableColumn className="w-24">Scope</TableColumn>
            <TableColumn className="w-48">Carrier</TableColumn>
            <TableColumn className="w-32">Label</TableColumn>
            <TableColumn className="w-40">Packing Slip</TableColumn>
          </TableHeader>
          <TableBody>
            {paginatedData.map((request) => {
              const chosenRate = request.rates?.find(rate => isRateChosen(rate.chosen));

              return (
                <TableRow
                  key={request.shipmentRequestID}
                  className="cursor-pointer hover:bg-blue-100 transition-colors duration-150"
                  onClick={(event) => handleRowClick(request.shipmentRequestID, event)}
                >
                  {/* ID */}
                  <TableCell className="text-sm whitespace-nowrap py-2">
                    <span className="text-primary font-medium">
                      {request.shipmentRequestID}
                    </span>
                  </TableCell>

                  {/* Requestor */}
                  <TableCell className="text-sm whitespace-nowrap py-2">
                    <div>
                      <p className="font-medium">
                        {(() => {
                          if (!request.created_user_name) return '';
                          const words = request.created_user_name.split(' ');
                          if (words[0].length <= 5 && words.length > 1) {
                            return words.slice(0, 2).join(' ');
                          } else {
                            return words[0];
                          }
                        })()}
                      </p>
                    </div>
                  </TableCell>

                  {/* Pickup Date */}
                  <TableCell className="text-sm whitespace-nowrap py-2">
                    <div>
                      <p className="font-bold">{formatDate(request.pick_up_date)}</p>
                      <p className="text-xs text-gray-600">
                        {formatTime(request.pick_up_start_time)} - {formatTime(request.pick_up_end_time)}
                      </p>
                    </div>
                  </TableCell>

                  {/* Scope */}
                  <TableCell className="text-sm whitespace-nowrap py-2">
                    <span className="font-medium">
                      {request.shipment_scope_type?.toUpperCase()}
                    </span>
                  </TableCell>

                  {/* Carrier */}
                  <TableCell className="text-sm py-2">
                    {(() => {
                      if (request?.shipping_options?.toLowerCase() === 'grab_pickup') {
                        return <p className="font-medium text-xs text-blue-500">Grab Pickup</p>;
                      }
                      if (request?.shipping_options?.toLowerCase() === 'supplier_pickup') {
                        return <p className="font-medium text-xs text-blue-500">Supplier Pickup</p>;
                      }
                      if (chosenRate) {
                        return (
                          <div>
                            <p className="font-medium text-xs">{chosenRate.shipper_account_description}</p>
                            <p className="text-xs text-gray-500">({chosenRate.service_name})</p>
                          </div>
                        );
                      }
                      return <p className="text-xs text-gray-400">No rate selected</p>;
                    })()}
                  </TableCell>

                  {/* Label */}
                  <TableCell className="text-sm py-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<Icon icon="solar:eye-bold" />}
                        onPress={() => {
                          if (!request.files_label_url) return;

                          const chosenRate = request.rates?.find(rate => isRateChosen(rate.chosen));
                          // Check if it's base64 by seeing if it doesn't start with http/https
                          const isBase64Label = !request.files_label_url.startsWith('http') ||
                                               (chosenRate?.shipper_account_slug === 'fedex' &&
                                                chosenRate?.shipper_account_description === 'FedEx Domestic Thailand');

                          if (isBase64Label) {
                            // For base64 encoded labels (FedEx Domestic Thailand)
                            const pdfWindow = window.open("");
                            pdfWindow?.document.write(
                              `<iframe width='100%' height='100%' src='data:application/pdf;base64,${request.files_label_url}'></iframe>`
                            );
                          } else {
                            // For regular URL labels
                            window.open(request.files_label_url, "_blank");
                          }
                        }}
                        isDisabled={!request.files_label_url}
                        className="h-7 text-xs"
                      >
                        View Label
                      </Button>
                    </div>
                  </TableCell>

                  {/* Packing Slip */}
                  <TableCell className="text-sm py-2">
                    <Button
                      size="sm"
                      color="secondary"
                      variant="flat"
                      startContent={<Icon icon="solar:document-text-bold" />}
                      onPress={() => {
                        navigate(`/shipment/packing-slip/${request.shipmentRequestID}`)
                      }}
                      className="h-7 text-xs"
                    >
                      View Packing Slip
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 px-2">
        {/* Left side - Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <Select
            size="sm"
            className="w-20"
            selectedKeys={[pageSize.toString()]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string
              handlePageSizeChange(selected)
            }}
          >
            {pageSizeOptions.map((size) => (
              <SelectItem key={size.toString()} value={size.toString()}>
                {size.toString()}
              </SelectItem>
            ))}
          </Select>
          <span className="text-sm text-gray-600">
            Showing {Math.min((page - 1) * pageSize + 1, filteredRequests.length)} to{' '}
            {Math.min(page * pageSize, filteredRequests.length)} of {filteredRequests.length} entries
          </span>
        </div>

        {/* Right side - Pagination */}
        <Pagination
          total={totalPages}
          page={page}
          onChange={setPage}
          showControls
          size="sm"
          color="primary"
        />
      </div>
    </div>
  )
}

export default WarehouseTable
