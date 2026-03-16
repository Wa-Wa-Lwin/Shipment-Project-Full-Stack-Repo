import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { isRateChosen } from '../utils/rateUtils'
import { useBreadcrumb } from '../../../context/BreadcrumbContext'
import type { ShipmentFormData, ShipmentRequestsResponse } from '../types/shipment-form.types';

const ShipmentTable = () => {
  const { msLoginUser } = useAuth()
  const { activeButton } = useBreadcrumb()
  const navigate = useNavigate()
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'mine'>('mine')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reviewFilter, setReviewFilter] = useState<'waiting' | 'all'>('waiting')
  const [approvalFilter, setApprovalFilter] = useState<'waiting' | 'all' | 'approved' | 'rejected'>('waiting')
  const [carrierFilter, setCarrierFilter] = useState<string>('all')
  const [scopeFilter, setScopeFilter] = useState<string>('all')

  // Sort states
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'waiting', label: 'In Progress(All)' },
    { value: 'requestor_requested', label: 'Waiting Approver' },
    // { value: 'logistic_edited', label: 'Waiting Approver' },
    { value: 'send_to_logistic', label: 'Waiting Logistics' },
    { value: 'logistic_updated', label: 'Logistic Reviewed' },
    { value: 'approver_approved', label: 'Approved' },
    { value: 'approver_rejected', label: 'Rejected' }
  ]

  // Carrier options for filtering
  const carrierOptions = [
    { value: 'all', label: 'All Carriers' },
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dhl', label: 'DHL' }
  ]

  // Scope options for filtering
  const scopeOptions = [
    { value: 'all', label: 'All Scopes' },
    { value: 'domestic', label: 'Domestic' },
    { value: 'international', label: 'International' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' }
  ]

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const pageSizeOptions = [10, 25, 100]

  const fetchShipmentRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = import.meta.env.VITE_APP_GET_ALL_SHIPMENT_REQUESTS
      if (!apiUrl) {
        throw new Error('API URL not configured')
      }

      const response = await axios.get<ShipmentRequestsResponse>(apiUrl)

      // setShipmentRequests(response.data.shipment_requests)
      setShipmentRequests(response.data.shipment_requests_desc)
    } catch (err) {
      console.error('Error fetching shipment requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch shipment requests')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter logic
  const filteredRequests = useMemo(() => {
    let filtered = shipmentRequests

    // Different filtering logic based on active button
    if (activeButton === 'Review') {
      if (reviewFilter === 'waiting') {
        filtered = filtered.filter(
          request =>
            request.request_status === 'send_to_logistic'
        )
      } else if (reviewFilter === 'all') {
        filtered = filtered.filter(
          request =>
            request.request_status === 'send_to_logistic'
            || request.send_to === "Logistic"
        )
      }
    } else if (activeButton === 'Approval') {
      // Approval tab: only show requestor_requested and logistic_updated
      // AND approver_user_mail equals msLoginUser email

      if (!msLoginUser?.email) return [];

      //DONT DELETE YET { Later filter with approver role }
      // filtered = filtered.filter(request =>
      //   request.approver_user_mail?.toLowerCase() === msLoginUser.email.toLowerCase()
      // );

      switch (approvalFilter) {
        case 'waiting':
          filtered = filtered.filter(request =>
            ['requestor_requested', 'logistic_updated', 'logistic_edited'].includes(request.request_status)
          );
          break;
        case 'all':
          filtered = filtered.filter(request =>
            ['requestor_requested', 'logistic_updated', 'logistic_edited', 'approver_edited', 'approver_approved', 'approver_rejected'].includes(request.request_status)
          );
          break;
        case 'approved':
          filtered = filtered.filter(request =>
            request.request_status === 'approver_approved'
          );
          break;
        case 'rejected':
          filtered = filtered.filter(request =>
            request.request_status === 'approver_rejected'
          );
          break;
      }
    } else {
      // Request tab: use original filtering logic
      // Filter by user (mine vs all)
      if (filterType === 'mine' && msLoginUser?.email) {
        filtered = filtered.filter(request =>
          request.created_user_mail.toLowerCase() === msLoginUser.email.toLowerCase()
        )
      }

      // Filter by status
      if (statusFilter !== 'all') {
        if (statusFilter === 'waiting') {
          filtered = filtered.filter(request =>
            ['requestor_requested', 'send_to_logistic', 'logistic_updated'].includes(request.request_status)
          )
        } else {
          filtered = filtered.filter(request =>
            request.request_status === statusFilter
          )
        }
      }

      // Filter by carrier
      if (carrierFilter !== 'all') {
        filtered = filtered.filter(request => {
          const chosenRate = request.rates?.find(rate => isRateChosen(rate.chosen))
          const slug = chosenRate?.shipper_account_slug?.toLowerCase()

          // If DHL is selected, include both 'dhl' and 'dhl-global-mail-asia'
          if (carrierFilter.toLowerCase() === 'dhl') {
            return slug === 'dhl' || slug === 'dhl-global-mail-asia'
          }

          return slug === carrierFilter.toLowerCase()
        })
      }

      // Filter by scope
      if (scopeFilter !== 'all') {
        filtered = filtered.filter(request => {
          const scope = request.shipment_scope_type?.toLowerCase()
          return scope === scopeFilter.toLowerCase()
        })
      }
    }

    // Apply sorting if enabled
    if (sortDirection !== null) {
      filtered = [...filtered].sort((a, b) => {
        const aId = Number(a.shipmentRequestID)
        const bId = Number(b.shipmentRequestID)

        if (sortDirection === 'asc') {
          return aId - bId
        } else {
          return bId - aId
        }
      })
    }

    return filtered
  }, [shipmentRequests, filterType, statusFilter, activeButton, msLoginUser?.email, sortDirection, reviewFilter, approvalFilter, carrierFilter, scopeFilter])

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

  const handleFilterChange = (newFilterType: 'all' | 'mine') => {
    setFilterType(newFilterType)
    setPage(1) // Reset to first page when changing filter
  }

  const handleRowClick = (shipmentRequestID: string | number, event: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons or links
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) {
      return
    }
    navigate(`/shipment/${shipmentRequestID}`)
  }

  useEffect(() => {
    fetchShipmentRequests()
  }, [fetchShipmentRequests])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: '2-digit', // 'numeric',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requestor_requested':
        return 'warning'
      case 'logistic_edited':
        return 'warning'
      case 'send_to_logistic':
        return 'warning'
      case 'logistic_updated':
        return 'warning'
      case 'approver_approved':
        return 'success'
      case 'approver_rejected':
        return 'danger'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'requestor_requested':
        return 'WAITING APPROVER';
      case 'logistic_edited':
        return 'WAITING APPROVER';
      case 'send_to_logistic':
        return 'WAITING LOGISTICS';
      case 'logistic_updated':
        return 'WAITING APPROVER';
      case 'approver_approved':
        return 'APPROVED';
      case 'approver_rejected':
        return 'REJECTED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.replace(/_/g, ' ').toUpperCase()
    }
  };

  // const renderActionButtons = (request: ShipmentRequest) => {
  const renderActionButtons = () => {
    return (
      <div className="flex flex-row items-center justify-center gap-1">
        {/* Conditional buttons based on activeButton */}
        {activeButton === "Review" && (
          <>
            <button
              onClick={() => console.log("Update clicked!")}
              className="bg-yellow-500 hover:bg-yellow-800 text-white px-2 py-0 text-xs flex items-center gap-1 rounded-lg"
            >
              <Icon className="w-3.5 h-3.5 text-white" icon="solar:pen-bold" />
              <span className="text-white text-xs">Update</span>
            </button>
          </>
        )}

        {activeButton === "Approval" && (
          <>
            <button
              onClick={() => console.log("Update clicked!")}
              className="bg-green-500 hover:bg-green-800 text-white px-2 py-0 text-xs flex items-center gap-1 rounded-lg"
            >
              <Icon className="w-3.5 h-3.5 text-white" icon="solar:check-circle-bold" />
              <span className="text-white text-xs">Approve</span>
            </button>
            <button
              onClick={() => console.log("Update clicked!")}
              className="bg-red-500 hover:bg-red-800 text-white px-2 py-0 text-xs flex items-center gap-1 rounded-lg"
            >
              <Icon className="w-3.5 h-3.5 text-white" icon="solar:close-circle-bold" />
              <span className="text-white text-xs">Reject</span>
            </button>
          </>
        )}
      </div>
    );
  };


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

  let hide_column = false;

  return (
    <div className="w-full">
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="p-0 flex items-center">

            <h2 className="text-l font-semibold pr-3">Shipment Requests</h2>
            <Button
              size="md"
              // variant="bordered"
              color="primary"
              onPress={() => {
                navigate('/shipment/request-form')
              }}
              startContent={<Icon icon="solar:add-circle-bold" />}
            >
              Add Request
            </Button>
          </div>

          {/* Filter Toggle Buttons */}
          <div className="flex gap-2">
            {/* Status Filter Row - Only show for Request tab */}
            {activeButton === 'Request' && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 block 2xl:hidden">
                    Status:
                  </span>
                  <span className="text-sm font-medium text-gray-700 hidden 2xl:block">
                    Filter by Status:
                  </span>
                  <Select
                    size="sm"
                    className="w-48"
                    placeholder="Select status..."
                    selectedKeys={[statusFilter]}
                    onSelectionChange={(keys) => {
                      const selectedStatus = Array.from(keys)[0] as string
                      setStatusFilter(selectedStatus)
                      setPage(1) // Reset to first page when changing filter
                    }}
                  >
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <span className="text-sm font-medium text-gray-700 block 2xl:hidden">
                    Carrier:
                  </span>
                  <span className="text-sm font-medium text-gray-700 hidden 2xl:block">
                    Filter by Carrier:
                  </span>
                  <Select
                    size="sm"
                    className="w-48"
                    placeholder="Select carrier..."
                    selectedKeys={[carrierFilter]}
                    onSelectionChange={(keys) => {
                      const selectedCarrier = Array.from(keys)[0] as string
                      setCarrierFilter(selectedCarrier)
                      setPage(1) // Reset to first page when changing filter
                    }}
                  >
                    {carrierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <span className="text-sm font-medium text-gray-700 block 2xl:hidden">
                    Scope:
                  </span>

                  {/* For large screens (desktop), show "Filter by Status:" */}
                  <span className="text-sm font-medium text-gray-700 hidden 2xl:block">
                    Filter by Scope:
                  </span>
                  <Select
                    size="sm"
                    className="w-48"
                    placeholder="Select scope..."
                    selectedKeys={[scopeFilter]}
                    onSelectionChange={(keys) => {
                      const selectedScope = Array.from(keys)[0] as string
                      setScopeFilter(selectedScope)
                      setPage(1) // Reset to first page when changing filter
                    }}
                  >
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {(statusFilter !== 'all' || carrierFilter !== 'all' || scopeFilter !== 'all') && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => {
                        setStatusFilter('all')
                        setCarrierFilter('all')
                        setScopeFilter('all')
                        setPage(1)
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeButton === 'Review' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={reviewFilter === 'waiting' ? 'solid' : 'bordered'}
                  color={reviewFilter === 'waiting' ? 'primary' : 'default'}
                  onPress={() => setReviewFilter('waiting')}
                >
                  Waiting
                </Button>
                <Button
                  size="sm"
                  variant={reviewFilter === 'all' ? 'solid' : 'bordered'}
                  color={reviewFilter === 'all' ? 'primary' : 'default'}
                  onPress={() => setReviewFilter('all')}
                >
                  All
                </Button>
              </div>
            )}

            {activeButton === 'Approval' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={approvalFilter === 'all' ? 'solid' : 'bordered'}
                  color={approvalFilter === 'all' ? 'primary' : 'default'}
                  onPress={() => setApprovalFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={approvalFilter === 'waiting' ? 'solid' : 'bordered'}
                  color={approvalFilter === 'waiting' ? 'primary' : 'default'}
                  onPress={() => setApprovalFilter('waiting')}
                >
                  Waiting
                </Button>
                <Button
                  size="sm"
                  variant={approvalFilter === 'approved' ? 'solid' : 'bordered'}
                  color={approvalFilter === 'approved' ? 'primary' : 'default'}
                  onPress={() => setApprovalFilter('approved')}
                >
                  Approved
                </Button>
                <Button
                  size="sm"
                  variant={approvalFilter === 'rejected' ? 'solid' : 'bordered'}
                  color={approvalFilter === 'rejected' ? 'primary' : 'default'}
                  onPress={() => setApprovalFilter('rejected')}
                >
                  Reject
                </Button>

              </div>
            )}

            {/* Only show All/My Requests filter for Request tab */}
            {activeButton === 'Request' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={filterType === 'all' ? 'solid' : 'bordered'}
                  color={filterType === 'all' ? 'primary' : 'default'}
                  onPress={() => handleFilterChange('all')}
                >
                  All Requests
                </Button>
                <Button
                  size="sm"
                  variant={filterType === 'mine' ? 'solid' : 'bordered'}
                  color={filterType === 'mine' ? 'primary' : 'default'}
                  onPress={() => handleFilterChange('mine')}
                  isDisabled={!msLoginUser?.email}
                >
                  My Requests
                </Button>
              </div>
            )}
          </div>
        </div>


      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] sm:max-h-[550px] lg:max-h-[680px]">
        <Table
          aria-label="Shipment requests table"
          className="min-w-full text-xs md:text-[8px] md:text-sm overflow-x-auto"
          removeWrapper
        >
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm text-sm">
            <TableColumn>
              <div className="flex items-center gap-1">
                ID
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  className="h-5 w-5 min-w-0"
                  onPress={() => {
                    setSortDirection(current => {
                      if (current === null) return 'desc'
                      if (current === 'desc') return 'asc'
                      return null
                    })
                  }}
                >
                  <Icon
                    icon={
                      sortDirection === null ? "solar:sort-bold" :
                        sortDirection === 'desc' ? "solar:sort-from-top-to-bottom-bold" :
                          "solar:sort-from-bottom-to-top-bold"
                    }
                    className="w-3 h-3"
                  />
                </Button>
              </div>
            </TableColumn>
            <TableColumn>Scope</TableColumn>
            <TableColumn>Topic (PO)</TableColumn>
            <TableColumn>FROM</TableColumn>
            <TableColumn>TO</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Carrier</TableColumn>
            <TableColumn>Requestor</TableColumn>
            <TableColumn>Approver</TableColumn>
            <TableColumn>Request Date</TableColumn>
            <TableColumn>Pickup Date</TableColumn>
            <TableColumn>Label</TableColumn>
          </TableHeader>
          <TableBody>
            {paginatedData.map((request) => (
              <TableRow
                key={request.shipmentRequestID}
                className={`border-b border-gray-200 h-4 hover:bg-blue-300 cursor-pointer transition-colors duration-150 ${request.service_options === 'Urgent' ? 'bg-yellow-100' : ''
                  }`}
                onClick={(event) => handleRowClick(request.shipmentRequestID, event)}
              >
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0" >
                  <Link
                    to={`/shipment/${request.shipmentRequestID}`}
                    className="text-primary hover:text-primary-600 font-medium"
                  >
                    {request.shipmentRequestID}
                  </Link>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  {
                    request.shipment_scope_type?.toUpperCase().replace(/_/g, ' ')
                  }
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  {request.topic} {request.po_number && `(${request.po_number})`}
                  {/* DONT_DELETE_YET */}
                  {/* {request.topic === 'Others' && request.other_topic ? <p className="text-xs text-gray-500">
                  {request.other_topic}
                </p> : ''} */}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  {request.ship_from?.company_name
                    ?.split(' ')
                    .slice(0, 3)
                    .join(' ') || request.ship_from?.company_name} ({request.ship_from?.country})
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  {request.ship_to?.company_name
                    ?.split(' ')
                    .slice(0, 3)
                    .join(' ') || request.ship_to?.company_name} ({request.ship_to?.country})
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">

                  <div
                    className={`${getStatusColor(request.request_status) === 'success'
                      ? 'text-green-500'
                      : getStatusColor(request.request_status) === 'warning'
                        ? 'text-yellow-500'
                        : getStatusColor(request.request_status) === 'danger'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      } px-1 py-0.5 text-xs flex items-center gap-1 rounded cursor-pointer`}
                  >
                    <span className="text-xs">
                      {getDisplayStatus(request.request_status)}
                    </span>
                  </div>


                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  {(() => {
                    if (request?.shipping_options?.toLowerCase() === 'grab_pickup') return <p className="font-medium text-xs text-blue-500">Grab Pickup</p>;
                    if (request?.shipping_options?.toLowerCase() === 'supplier_pickup') return <p className="font-medium text-xs text-blue-500">Supplier Pickup</p>;
                    const chosenRate = request.rates?.find(rate => isRateChosen(rate.chosen));
                    if (chosenRate) {
                      return (
                        <div>
                          <p className="font-medium text-xs">{chosenRate.shipper_account_description}</p>
                          <p className="text-xs text-gray-500">{chosenRate.service_name}</p>
                        </div>
                      );
                    }
                    return <p className="text-xs text-gray-400">No rate selected</p>;
                  })()}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  <p className="font-medium">
                    {(() => {
                      if (!request.created_user_name) return '';
                      const words = request.created_user_name.split(' ');
                      if (words[0].length <= 5 && words.length > 1) {
                        // First word ≤ 5 characters → show first two words
                        return words.slice(0, 2).join(' ');
                      } else {
                        // Otherwise → show first word only
                        return words[0];
                      }
                    })()}
                  </p>
                  {/* <p className="text-xs text-gray-500">{request.created_user_mail}</p> */}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  <p className="font-medium">
                    {(() => {
                      if (!request.approver_user_name) return '';
                      const words = request.approver_user_name.split(' ');
                      if (words[0].length <= 5 && words.length > 1) {
                        // First word ≤ 5 characters → show first two words
                        return words.slice(0, 2).join(' ');
                      } else {
                        // Otherwise → show first word only
                        return words[0];
                      }
                    })()}
                  </p>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700"> {formatDate(request.created_date_time)}</TableCell>
                <TableCell className="text-sm whitespace-nowrap sm:whitespace-normal break-words py-0  text-gray-700">
                  <b>{formatDate(request.pick_up_date)}</b>
                  <br />
                  {formatTime(request.pick_up_start_time)} - {formatTime(request.pick_up_end_time)}
                </TableCell>

                <TableCell>
                  {(() => {
                    if (request?.request_status?.toLowerCase() === 'cancelled') return <p className="font-medium text-xs text-red-500">Request Cancelled</p>;
                    if (request?.shipping_options?.toLowerCase() === 'grab_pickup') return <p className="font-medium text-xs text-blue-500">Grab Pickup</p>;
                    if (request?.shipping_options?.toLowerCase() === 'supplier_pickup') return <p className="font-medium text-xs text-blue-500">Supplier Pickup</p>;
                    if (request.request_status === 'approver_approved') {
                      const chosenRate = request.rates?.find(rate => isRateChosen(rate.chosen));
                      const isDHL = chosenRate?.shipper_account_description === 'DHL eCommerce Asia';
                      const labelStatusColor =
                        request.label_status === 'created'
                          ? 'text-green-500'
                          : 'text-red-500';

                      const pickupStatusText =
                        request.pick_up_created_status === 'created_success'
                          ? 'created'
                          : request.pick_up_created_status === 'created_failed'
                            ? 'failed'
                            : '-';

                      const pickupStatusColor =
                        request.pick_up_created_status === 'created_success'
                          ? 'text-green-500'
                          : request.pick_up_created_status === 'created_failed'
                            ? 'text-red-500'
                            : '';

                      return (
                        <div>
                          <p className={`font-medium text-xs`}>
                            Label:{' '}
                            <span className={labelStatusColor}>
                              {request.label_status}
                            </span>
                          </p>
                          {isDHL ? (
                            <p className="text-xs">
                              Pickup: <span className="text-blue-500">Call</span>
                            </p>
                          ) : (
                            <p className="text-xs">
                              Pickup:{' '}
                              <span className={pickupStatusColor}>
                                {pickupStatusText}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    }

                    return <p className='font-medium text-xs text-gray-500'>Waiting</p>;
                  })()}
                  {hide_column ? renderActionButtons() : null}
                </TableCell>
              </TableRow>
            ))}
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
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="bordered"
            onPress={() => setPage(Math.max(1, page - 1))}
            isDisabled={page === 1}
          >
            Previous
          </Button>

          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            size="sm"
            showControls={false}
            classNames={{
              wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
              item: "w-8 h-8 text-small rounded-none bg-transparent",
              cursor: "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
            }}
          />

          <Button
            size="sm"
            variant="bordered"
            onPress={() => setPage(Math.min(totalPages, page + 1))}
            isDisabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ShipmentTable