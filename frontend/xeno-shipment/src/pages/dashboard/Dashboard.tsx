import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardBody, Spinner } from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface MonthlyData {
  month: string
  all_status_count: string
  approver_approved_count: string
  approver_rejected_count: string
  logistic_updated_count: string
  requestor_requested_count: string
}

interface YearlyData {
  all_status_count: string
  approver_approved_count: string
  approver_rejected_count: string
  logistic_updated_count: string
  requestor_requested_count: string
}

interface CategoryData {
  yearly: YearlyData
  monthly: MonthlyData[]
}

interface ApiResponse {
  year: number
  data: {
    domestic: CategoryData
    export: CategoryData
    import: CategoryData
    international: CategoryData
    all: CategoryData
  }
  year_list: { year: string }[]
}

const Dashboard: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString())
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  const fetchData = async (year: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(import.meta.env.VITE_APP_GET_REQUESTS_PER_YEAR, {
        year: year
      })
      setData(response.data)
    } catch (err) {
      setError('Failed to fetch data')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(parseInt(selectedYear))
  }, [selectedYear])

  // Update selectedYear when data is loaded to ensure it matches available years
  useEffect(() => {
    if (data?.year_list && data.year_list.length > 0) {
      const availableYears = data.year_list.map(item => parseInt(item.year)).sort((a, b) => b - a)
      if (!availableYears.includes(parseInt(selectedYear))) {
        setSelectedYear(availableYears[0].toString())
      }
    }
  }, [data?.year_list, selectedYear])

  // Use years from API response
  const availableYears = useMemo(() => {
    if (!data?.year_list) return [currentYear]
    return data.year_list.map(item => parseInt(item.year)).sort((a, b) => b - a)
  }, [data?.year_list, currentYear])

  // Calculate percentages for domestic/export/import
  const stats = useMemo(() => {
    if (!data) return null

    const domesticTotal = parseInt(data.data.domestic.yearly.all_status_count)
    const exportTotal = parseInt(data.data.export.yearly.all_status_count)
    const importTotal = parseInt(data.data.import.yearly.all_status_count)
    const internationalTotal = parseInt(data.data.international.yearly.all_status_count)
    const total = domesticTotal + exportTotal + importTotal + internationalTotal

    // Calculate approved/waiting/rejected counts
    const domesticApproved = parseInt(data.data.domestic.yearly.approver_approved_count)
    const domesticLogisticUpdated = parseInt(data.data.domestic.yearly.logistic_updated_count)
    const domesticRequested = parseInt(data.data.domestic.yearly.requestor_requested_count)
    const domesticRejected = parseInt(data.data.domestic.yearly.approver_rejected_count)
    const domesticWaiting = domesticRequested + domesticLogisticUpdated

    const exportApproved = parseInt(data.data.export.yearly.approver_approved_count)
    const exportLogisticUpdated = parseInt(data.data.export.yearly.logistic_updated_count)
    const exportRequested = parseInt(data.data.export.yearly.requestor_requested_count)
    const exportRejected = parseInt(data.data.export.yearly.approver_rejected_count)
    const exportWaiting = exportRequested + exportLogisticUpdated

    const importApproved = parseInt(data.data.import.yearly.approver_approved_count)
    const importLogisticUpdated = parseInt(data.data.import.yearly.logistic_updated_count)
    const importRequested = parseInt(data.data.import.yearly.requestor_requested_count)
    const importRejected = parseInt(data.data.import.yearly.approver_rejected_count)
    const importWaiting = importRequested + importLogisticUpdated

    const internationalApproved = parseInt(data.data.international.yearly.approver_approved_count)
    const internationalLogisticUpdated = parseInt(data.data.international.yearly.logistic_updated_count)
    const internationalRequested = parseInt(data.data.international.yearly.requestor_requested_count)
    const internationalRejected = parseInt(data.data.international.yearly.approver_rejected_count)
    const internationalWaiting = internationalRequested + internationalLogisticUpdated

    const overallApproved = parseInt(data.data.all.yearly.approver_approved_count)
    const overallLogisticUpdated = parseInt(data.data.all.yearly.logistic_updated_count)
    const overallRequested = parseInt(data.data.all.yearly.requestor_requested_count)
    const overallRejected = parseInt(data.data.all.yearly.approver_rejected_count)
    const overallWaiting = overallRequested + overallLogisticUpdated
    const overallTotal = parseInt(data.data.all.yearly.all_status_count)

    return {
      domestic: {
        count: domesticTotal,
        percentage: total > 0 ? (domesticTotal / total) * 100 : 0,
        approved: domesticApproved,
        waiting: domesticWaiting,
        rejected: domesticRejected
      },
      export: {
        count: exportTotal,
        percentage: total > 0 ? (exportTotal / total) * 100 : 0,
        approved: exportApproved,
        waiting: exportWaiting,
        rejected: exportRejected
      },
      import: {
        count: importTotal,
        percentage: total > 0 ? (importTotal / total) * 100 : 0,
        approved: importApproved,
        waiting: importWaiting,
        rejected: importRejected
      },
      international: {
        count: internationalTotal,
        percentage: total > 0 ? (internationalTotal / total) * 100 : 0,
        approved: internationalApproved,
        waiting: internationalWaiting,
        rejected: internationalRejected
      },
      overall: {
        total: overallTotal,
        approved: overallApproved,
        waiting: overallWaiting,
        rejected: overallRejected
      }
    }
  }, [data])

  // Process real monthly data from API
  const monthlyData = useMemo(() => {
    if (!data) return []

    // Create array for all 12 months initialized with zeros
    const yearData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      domestic: 0,
      export: 0,
      import: 0,
      international: 0
    }))

    // Fill in domestic monthly data
    data.data.domestic.monthly.forEach(monthData => {
      const monthIndex = parseInt(monthData.month) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        yearData[monthIndex].domestic = parseInt(monthData.all_status_count)
      }
    })

    // Fill in export monthly data
    data.data.export.monthly.forEach(monthData => {
      const monthIndex = parseInt(monthData.month) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        yearData[monthIndex].export = parseInt(monthData.all_status_count)
      }
    })

    // Fill in import monthly data
    data.data.import.monthly.forEach(monthData => {
      const monthIndex = parseInt(monthData.month) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        yearData[monthIndex].import = parseInt(monthData.all_status_count)
      }
    })

    // Fill in import monthly data
    data.data.international.monthly.forEach(monthData => {
      const monthIndex = parseInt(monthData.month) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        yearData[monthIndex].international = parseInt(monthData.all_status_count)
      }
    })

    return yearData
  }, [data])

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Calculate max value for chart scaling
  const maxValue = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return 100
    return Math.max(
      ...monthlyData.flatMap(month => [month.domestic, month.export, month.import, month.international])
    )
  }, [monthlyData])

  // SVG Circle Chart Component
  const CircleChart: React.FC<{ percentage: number; color: string; label: string; value: number }> = ({
    percentage, color, label, value
  }) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          <svg width="100" height="100" className="transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
          <div className="text-sm font-medium">{value.toLocaleString()}</div>
        </div>
      </div>
    )
  }

  // SVG Pie Chart Component
  const PieChart: React.FC<{
    data: { label: string; value: number; color: string }[]
    size?: number
  }> = ({ data, size = 120 }) => {
    const radius = size / 2 - 10
    const centerX = size / 2
    const centerY = size / 2

    const total = data.reduce((sum, item) => sum + item.value, 0)

    if (total === 0) {
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>
            <p className="text-xs text-gray-500">No data</p>
          </div>
        </div>
      )
    }

    let cumulativeAngle = 0
    const paths = data.map((item, index) => {
      const angle = (item.value / total) * 360
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle

      cumulativeAngle += angle

      // Convert angles to radians
      const startAngleRad = (startAngle * Math.PI) / 180
      const endAngleRad = (endAngle * Math.PI) / 180

      // Calculate start and end points
      const x1 = centerX + radius * Math.cos(startAngleRad)
      const y1 = centerY + radius * Math.sin(startAngleRad)
      const x2 = centerX + radius * Math.cos(endAngleRad)
      const y2 = centerY + radius * Math.sin(endAngleRad)

      // Large arc flag
      const largeArcFlag = angle > 180 ? 1 : 0

      // Create path
      const pathData = [
        `M ${centerX} ${centerY}`, // Move to center
        `L ${x1} ${y1}`, // Line to start point
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc
        'Z' // Close path
      ].join(' ')

      return (
        <path
          key={index}
          d={pathData}
          fill={item.color}
          className="transition-all duration-500 hover:opacity-80"
        />
      )
    })

    return (
      <div className="flex items-center gap-4">
        <svg width={size} height={size} className="transform -rotate-90">
          {paths}
        </svg>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-600">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // SVG Line Chart Component
  const LineChart: React.FC = () => {
    const yearData = monthlyData || []
    const chartWidth = 1200
    const chartHeight = 300
    const padding = 40

    const createPath = (data: number[]) => {
      if (data.length === 0) return ''

      const points = data.map((value, index) => {
        const x = padding + (index * (chartWidth - 2 * padding)) / (data.length - 1)
        const y = chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding))
        return `${x},${y}`
      }).join(' L ')

      return `M ${points}`
    }

    const domesticData = yearData.map(d => d.domestic)
    const exportData = yearData.map(d => d.export)
    const importData = yearData.map(d => d.import)
    const internationalData = yearData.map(d => d.international)

    return (
      <div className="w-full overflow-x-auto">
        <svg width="100%" height={chartHeight} viewBox="0 0 1200 300" preserveAspectRatio="none" className="w-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (i * (chartHeight - 2 * padding)) / 4
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            )
          })}

          {/* X-axis labels */}
          {yearData.map((_, index) => {
            const x = padding + (index * (chartWidth - 2 * padding)) / (yearData.length - 1)
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {monthNames[index]}
              </text>
            )
          })}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = (maxValue * (4 - i)) / 4
            const y = padding + (i * (chartHeight - 2 * padding)) / 4
            return (
              <text
                key={i}
                x={30}
                y={y + 4}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {Math.round(value)}
              </text>
            )
          })}

          {/* Lines */}
          <path
            d={createPath(domesticData)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={createPath(exportData)}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={createPath(importData)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={createPath(internationalData)}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {yearData.map((data, index) => {
            const x = padding + (index * (chartWidth - 2 * padding)) / (yearData.length - 1)
            const domesticY = chartHeight - padding - ((data.domestic / maxValue) * (chartHeight - 2 * padding))
            const exportY = chartHeight - padding - ((data.export / maxValue) * (chartHeight - 2 * padding))
            const importY = chartHeight - padding - ((data.import / maxValue) * (chartHeight - 2 * padding))
            const internationalY = chartHeight - padding - ((data.international / maxValue) * (chartHeight - 2 * padding))

            return (
              <g key={index}>
                <circle cx={x} cy={domesticY} r="4" fill="#3b82f6" />
                <circle cx={x} cy={exportY} r="4" fill="#10b981" />
                <circle cx={x} cy={importY} r="4" fill="#f59e0b" />
                <circle cx={x} cy={internationalY} r="4" fill="#8b5cf6" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <Icon icon="solar:danger-circle-bold" className="text-red-500 text-6xl mb-4" />
          <p className="text-red-600 text-lg mb-2">Failed to load dashboard data</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchData(parseInt(selectedYear))}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shipment Dashboard</h1>
        <div className="flex flex-row gap-1 items-center">
          <label htmlFor="year-select" className="text-md text-gray-600 font-medium">
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all"
          >
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Circle Charts */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="solar:pie-chart-bold" className="text-blue-500" />
              Shipment Distribution for {selectedYear}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex justify-around items-center py-4">
              <CircleChart
                percentage={stats.domestic.percentage}
                color="#3b82f6"
                label="Domestic"
                value={stats.domestic.count}
              />
              <CircleChart
                percentage={stats.export.percentage}
                color="#10b981"
                label="Export"
                value={stats.export.count}
              />
              <CircleChart
                percentage={stats.import.percentage}
                color="#f59e0b"
                label="Import"
                value={stats.import.count}
              />
              <CircleChart
                percentage={stats.international.percentage}
                color="#8b5cf6"
                label="International"
                value={stats.international.count}
              />
            </div>
          </CardBody>
        </Card>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-green-600">Approved</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="text-2xl font-bold text-green-600 text-center">{stats.overall.approved.toLocaleString()}</div>
                <PieChart
                  data={[
                    { label: 'Domestic', value: stats.domestic.approved, color: '#3b82f6' },
                    { label: 'Export', value: stats.export.approved, color: '#10b981' },
                    { label: 'Import', value: stats.import.approved, color: '#f59e0b' },
                    { label: 'International', value: stats.international.approved, color: '#8b5cf6' }
                  ]}
                  size={140}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-yellow-600">Waiting</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-600">{stats.overall.waiting.toLocaleString()}</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Domestic:</span>
                    <span>{stats.domestic.waiting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Export:</span>
                    <span>{stats.export.waiting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Import:</span>
                    <span>{stats.import.waiting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>International:</span>
                    <span>{stats.international.waiting}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-red-600">Rejected</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-600">{stats.overall.rejected.toLocaleString()}</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Domestic:</span>
                    <span>{stats.domestic.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Export:</span>
                    <span>{stats.export.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Import:</span>
                    <span>{stats.import.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>International:</span>
                    <span>{stats.international.rejected}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

      </div>



      {/* Line Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="solar:graph-up-bold" className="text-green-500" />
              Monthly Requests Trend for {selectedYear}
            </h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Domestic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Export</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Import</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>International</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <LineChart />
          <p className="text-xs text-gray-500 mt-2">
            * Monthly data shows actual shipment requests by category
          </p>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.domestic.count.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Domestic Shipments</div>
            <div className="text-xs text-gray-500 mt-1">{stats.domestic.percentage.toFixed(1)}% of all requests</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.export.count.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Export Shipments</div>
            <div className="text-xs text-gray-500 mt-1">{stats.export.percentage.toFixed(1)}% of all requests</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.import.count.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Import Shipments</div>
            <div className="text-xs text-gray-500 mt-1">{stats.import.percentage.toFixed(1)}% of all requests</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.international.count.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total International Shipments</div>
            <div className="text-xs text-gray-500 mt-1">{stats.international.percentage.toFixed(1)}% of all requests</div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard