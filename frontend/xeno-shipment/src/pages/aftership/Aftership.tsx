import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Input,
  Chip,
  Modal,
  ModalBody,
  ModalContent
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'

interface AftershipLabel {
  id: string
  tracking_numbers: string[]
  status: string
  created_at: string
  updated_at: string
  ship_date: string
  shipper_account: {
    id: string
    slug: string
  }
  service_type: string
  rate?: {
    shipper_account?: {
      id: string
      slug: string
      description: string
    }
    service_name?: string
    charge_weight: {
      value: number
      unit: string
    }
    total_charge: {
      amount: number
      currency: string
    }
  }
  files?: {
    label?: {
      paper_size: string
      url: string
      file_type: string
    }
    invoice?: {
      paper_size: string
      url: string
      file_type: string
    }
    packing_slip?: {
      paper_size: string
      url: string
      file_type: string
    }
  }
}

interface LabelCounts {
  total: number
  created: number
  failed: number
  cancelled: number
}

const Aftership = () => {
  const navigate = useNavigate()
  const [labels, setLabels] = useState<AftershipLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, msLoginUser } = useAuth();
  const [counts, setCounts] = useState<LabelCounts>({
    total: 0,
    created: 0,
    failed: 0,
    cancelled: 0
  })
  const [statusFilter, setStatusFilter] = useState<'all' | 'created' | 'failed' | 'cancelled'>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc') // Default: desc (latest at top)

  // Date range state - default to last 7 days
  const getDefaultDateRange = () => {
    const now = new Date()
    const lastweek = new Date(now)
    lastweek.setDate(lastweek.getDate() - 7)

    return {
      from: lastweek.toISOString().slice(0, 10), // Format: YYYY-MM-DD
      to: now.toISOString().slice(0, 10)
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  useEffect(() => {
    fetchLabels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLabels = async () => {
    try {
      setLoading(true)
      setError(null)

      // Create dates with specific times: 00:00:00 for from, 23:59:59 for to
      const fromDate = new Date(dateRange.from + 'T00:00:00')
      const toDate = new Date(dateRange.to + 'T23:59:59')

      // Validate date range
      if (toDate <= fromDate) {
        setError('End date must be after start date')
        setLoading(false)
        return
      }

      // Check if date range exceeds 90 days
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 90) {
        setError('Date range cannot exceed 90 days')
        setLoading(false)
        return
      }

      // Format dates without milliseconds: YYYY-MM-DDThh:mm:ss+00:00
      const formatDateForAPI = (date: Date): string => {
        // Get ISO string and remove milliseconds
        const isoString = date.toISOString()
        // Remove .000Z and replace with +00:00
        return isoString.replace(/\.\d{3}Z$/, '+00:00')
      }

      const params: Record<string, string> = {
        created_at_min: formatDateForAPI(fromDate),
        created_at_max: formatDateForAPI(toDate)
      }

      const response = await axios.get(import.meta.env.VITE_APP_AFTERSHIP_GET_LABELS, {
        params
      })

      if (response.data && response.data.data) {
        // Backend now returns all labels (handles pagination automatically)
        setLabels(response.data.data.labels || [])

        // Set counts from the response
        setCounts({
          total: response.data.total_request_count || 0,
          created: response.data.created_request_count || 0,
          failed: response.data.failed_request_count || 0,
          cancelled: response.data.cancelled_request_count || 0
        })
      }
    } catch (err) {
      console.error('Error fetching labels:', err)
      const errorMessage = (err as any)?.response?.data?.error || (err as Error).message || 'Failed to fetch labels'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeApply = () => {
    fetchLabels()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const filteredLabels = useMemo(() => {
    // First, filter by status and search
    const filtered = labels.filter(label => {
      // Filter by status
      if (statusFilter !== 'all' && label.status !== statusFilter) {
        return false
      }

      // Filter by search query
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        label.id.toLowerCase().includes(query) ||
        label.tracking_numbers?.some(tn => tn.toLowerCase().includes(query)) ||
        label.status.toLowerCase().includes(query) ||
        label.shipper_account?.slug.toLowerCase().includes(query) ||
        label.rate?.shipper_account?.slug.toLowerCase().includes(query)
      )
    })

    // Then, sort by created_at date
    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()

      return sortDirection === 'desc' ? bDate - aDate : aDate - bDate
    })

    return sorted
  }, [labels, statusFilter, searchQuery, sortDirection])

  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null) // Label to confirm
  const cancelLabel = async (labelId: string) => {
    try {
      setCancellingId(labelId)
      const response = await axios.post(import.meta.env.VITE_APP_AFTERSHIP_CANCEL_LABEL, {
        label: { id: labelId },
        user_id :  user?.userID ?? '0', 
        user_role : '-', 
        user_name : msLoginUser?.name ?? 'Admin'
      })

      if (response.data?.meta?.code !== 200) {
        const message = response.data?.meta?.message || 'Failed to cancel label'
        const details_info = response.data?.meta?.details?.[0]?.info || ''
        alert(`Failed to cancel label: ${message} ${details_info}`)
      } else {
        await fetchLabels()
      }
    } catch (err) {
      console.error('Error cancelling label:', err)
      alert('Failed to cancel label. Please try again.')
    } finally {
      setCancellingId(null)
      setConfirmCancelId(null)
    }
  }

  return (
    <div>
      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!confirmCancelId}
        hideCloseButton
        isDismissable={false}
        size="sm"
        backdrop="blur"
      >
        <ModalContent>
          <ModalBody className="flex flex-col items-center justify-center py-8 space-y-4">
            {cancellingId === confirmCancelId ? (
              <>
                <Spinner
                  size="lg"
                  color="danger"
                  label="Cancelling label..."
                  labelColor="danger"
                />
                <p className="text-sm text-gray-600 text-center">
                  Please wait while we cancel this label...
                </p>
              </>
            ) : (
              <>
                <p className="text-center text-sm font-medium">
                  Are you sure you want to cancel this label?
                </p>
                <div className="flex gap-3">
                  <Button color="danger" onPress={() => cancelLabel(confirmCancelId!)}>
                    Yes, Cancel
                  </Button>
                  <Button color="default" onPress={() => setConfirmCancelId(null)}>
                    No, Keep
                  </Button>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">Aftership Labels</h1>              
            </div>
            {/* Date Range and Search Row */}
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex gap-1 items-end">
                <Input
                  type="date"
                  label="From"
                  labelPlacement="outside-left"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-fit"
                  size="sm"
                />               
                <Input
                  type="date"
                  label="To"
                  labelPlacement="outside-left"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-fit"
                  size="sm"
                />
                <Button
                  color="primary"
                  onPress={handleDateRangeApply}
                  isLoading={loading}
                  size="sm"
                  className="!px-2 !py-1 !text-xs"
                >
                  Apply
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => {
                    setDateRange(getDefaultDateRange())
                  }}
                  size="sm"
                  className="!px-2 !py-1 !text-xs"
                >
                  Reset
                </Button>
              </div>

              <div className="flex-1 min-w-[300px]">
                <Input
                  placeholder="Search by ID, tracking number, status, or carrier..."
                  startContent={<Icon icon="solar:magnifer-linear" />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  isClearable
                  onClear={() => setSearchQuery('')}
                  size="sm"
                />
              </div>

              <Button
                color="primary"
                startContent={<Icon icon="solar:refresh-linear" />}
                onPress={() => handleDateRangeApply()}
                isLoading={loading}
                size="sm"
              >
                Refresh
              </Button>
            </div>

            {/* Counts Summary */}
            <div className="flex gap-3 flex-wrap">
              <Chip
                variant={statusFilter === 'all' ? 'solid' : 'flat'}
                color="default"
                size="sm"
                startContent={<Icon icon="solar:box-bold" width={18} />}
                className="cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                <span className="font-semibold">Total: {counts.total}</span>
              </Chip>
              <Chip
                variant={statusFilter === 'created' ? 'solid' : 'flat'}
                color="success"
                size="sm"
                startContent={<Icon icon="solar:check-circle-bold" width={18} />}
                className="cursor-pointer"
                onClick={() => setStatusFilter('created')}
              >
                <span className="font-semibold">Created: {counts.created}</span>
              </Chip>
              <Chip
                variant={statusFilter === 'failed' ? 'solid' : 'flat'}
                color="danger"
                size="sm"
                startContent={<Icon icon="solar:close-circle-bold" width={18} />}
                className="cursor-pointer"
                onClick={() => setStatusFilter('failed')}
              >
                <span className="font-semibold">Failed: {counts.failed}</span>
              </Chip>
              <Chip
                variant={statusFilter === 'cancelled' ? 'solid' : 'flat'}
                color="warning"
                size="sm"
                startContent={<Icon icon="solar:slash-circle-bold" width={18} />}
                className="cursor-pointer"
                onClick={() => setStatusFilter('cancelled')}
              >
                <span className="font-semibold">Cancelled: {counts.cancelled}</span>
              </Chip>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-visible p-4">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="text-center py-10">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button color="primary" onPress={() => fetchLabels()}>
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && (
            <Table
              aria-label="Aftership labels table"
              classNames={{
                wrapper: 'min-h-[400px]'
              }}
            >
              <TableHeader>
                <TableColumn>
                  <div className="flex items-center gap-1">
                    <span>No.</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={toggleSort}
                      className="min-w-unit-6 w-6 h-6"
                    >
                      <Icon
                        icon={sortDirection === 'desc' ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-up-bold'}
                        width={16}
                      />
                    </Button>
                  </div>
                </TableColumn>
                <TableColumn>ID</TableColumn>
                <TableColumn>TRACKING NUMBERS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>CREATED DATE</TableColumn>
                <TableColumn>SHIP DATE</TableColumn>
                <TableColumn>SHIPPER ACCOUNT</TableColumn>
                <TableColumn>SERVICE NAME</TableColumn>
                <TableColumn>CHARGE WEIGHT</TableColumn>
                <TableColumn>TOTAL CHARGE</TableColumn>
                <TableColumn>ACTION</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No labels found">
                {filteredLabels.map((label, index) => (
                  <TableRow
                    key={label.id}
                    className="cursor-pointer hover:bg-default-100"
                    onClick={() => navigate(`/aftership/${label.id}`)}
                  >
                    <TableCell>
                      <span className="text-xs font-mono">{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{label.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {label.tracking_numbers?.slice(0, 2).map((tn, idx) => (
                          <span key={idx} className="text-xs font-mono">
                            {tn}
                          </span>
                        ))}
                        {label.tracking_numbers?.length > 2 && (
                          <span className="text-xs text-default-400">
                            +{label.tracking_numbers.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase">{label.status || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{formatDate(label.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{formatDate(label.ship_date)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">
                          {label.rate?.shipper_account?.description || label.shipper_account?.slug || '-'}
                        </span>
                        <span className="text-xs text-default-400">
                          {label.rate?.shipper_account?.slug || label.shipper_account?.slug || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{label.rate?.service_name || label.service_type || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {label.rate?.charge_weight
                          ? `${label.rate.charge_weight.value} ${label.rate.charge_weight.unit}`
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold">
                        {label.rate?.total_charge
                          ? `${label.rate.total_charge.currency} ${label.rate.total_charge.amount}`
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div
                        onClick={(e) => e.stopPropagation()}
                      >
                        {
                          label.status === "created" &&
                          <Button
                            color="danger"
                            size="sm"
                            variant="flat"
                            startContent={<Icon icon="solar:trash-bin-minimalistic-bold" />}
                            isLoading={cancellingId === label.id}
                            // onPress={() => cancelLabel(label.id)}
                            onPress={() => setConfirmCancelId(label.id)} // Open modal
                          >
                            Cancel
                          </Button>
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Showing results info */}
          {!loading && !error && labels.length > 0 && (
            <p className="text-xs text-center text-default-400 mt-2">
              Showing {filteredLabels.length} of {labels.length} labels
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default Aftership
