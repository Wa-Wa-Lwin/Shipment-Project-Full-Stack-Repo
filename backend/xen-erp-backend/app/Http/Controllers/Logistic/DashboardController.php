<?php

namespace App\Http\Controllers\Logistic;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DashboardController
{
    private const TABLE = 'Logistics.dbo.Shipment_Request';

    public function __construct() {}

    /**
     * Main dashboard overview with key metrics
     */
    public function action_get_dashboard_overview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'nullable|integer',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month');

        $baseQuery = DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year);
        if ($month) {
            $baseQuery->whereMonth('created_date_time', $month);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => [
                    'year' => $year,
                    'month' => $month,
                ],
                'summary' => $this->getSummaryMetrics(clone $baseQuery),
                'status_breakdown' => $this->getStatusBreakdown(clone $baseQuery),
                'scope_breakdown' => $this->getScopeBreakdown(clone $baseQuery),
                'label_performance' => $this->getLabelPerformance(clone $baseQuery),
                'priority_breakdown' => $this->getPriorityBreakdown(clone $baseQuery),
                'approval_metrics' => $this->getApprovalMetrics(clone $baseQuery),
                'available_years' => $this->getAvailableYears(),
            ],
        ]);
    }

    /**
     * Detailed analytics with trends and comparisons
     */
    public function action_get_analytics(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $year = $request->input('year', Carbon::now()->year);

        return response()->json([
            'status' => 'success',
            'data' => [
                'year' => $year,
                'monthly_trends' => $this->getMonthlyTrends($year),
                'scope_trends' => $this->getScopeTrends($year),
                'top_requestors' => $this->getTopRequestors($year),
                'top_topics' => $this->getTopTopics($year),
                'shipping_options_breakdown' => $this->getShippingOptionsBreakdown($year),
                'error_analysis' => $this->getErrorAnalysis($year),
                'available_years' => $this->getAvailableYears(),
            ],
        ]);
    }

    /**
     * Get pending requests that need action
     */
    public function action_get_pending_actions()
    {
        $pendingApproval = DB::table(self::TABLE)
            ->where('testing', 0)
            ->where('request_status', 'requestor_requested')
            ->where('active', 1)
            ->count();

        $pendingLabelCreation = DB::table(self::TABLE)
            ->where('testing', 0)
            ->where('request_status', 'approver_approved')
            ->where('label_status', 'scheduled')
            ->where('active', 1)
            ->count();

        $failedLabels = DB::table(self::TABLE)
            ->where('testing', 0)
            ->where('label_status', 'failed')
            ->where('active', 1)
            ->count();

        $urgentPending = DB::table(self::TABLE)
            ->where('testing', 0)
            ->where('request_status', 'requestor_requested')
            ->where('service_options', 'Urgent')
            ->where('active', 1)
            ->count();

        $overduePending = DB::table(self::TABLE)
            ->where('testing', 0)
            ->where('request_status', 'requestor_requested')
            ->where('due_date', '<', Carbon::now()->toDateString())
            ->where('active', 1)
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'pending_approval' => $pendingApproval,
                'pending_label_creation' => $pendingLabelCreation,
                'failed_labels' => $failedLabels,
                'urgent_pending' => $urgentPending,
                'overdue_pending' => $overduePending,
                'total_action_required' => $pendingApproval + $failedLabels,
            ],
        ]);
    }

    /**
     * Year-over-year comparison
     */
    public function action_get_year_comparison(Request $request)
    {
        $currentYear = $request->input('year', Carbon::now()->year);
        $previousYear = $currentYear - 1;

        $currentYearData = $this->getYearSummary($currentYear);
        $previousYearData = $this->getYearSummary($previousYear);

        $calculateChange = function ($current, $previous) {
            if ($previous == 0) {
                return $current > 0 ? 100 : 0;
            }

            return round((($current - $previous) / $previous) * 100, 2);
        };

        return response()->json([
            'status' => 'success',
            'data' => [
                'current_year' => [
                    'year' => $currentYear,
                    'metrics' => $currentYearData,
                ],
                'previous_year' => [
                    'year' => $previousYear,
                    'metrics' => $previousYearData,
                ],
                'changes' => [
                    'total_requests' => $calculateChange($currentYearData['total'], $previousYearData['total']),
                    'approved' => $calculateChange($currentYearData['approved'], $previousYearData['approved']),
                    'rejected' => $calculateChange($currentYearData['rejected'], $previousYearData['rejected']),
                    'approval_rate' => round($currentYearData['approval_rate'] - $previousYearData['approval_rate'], 2),
                ],
            ],
        ]);
    }

    // ========== Private Helper Methods ==========

    private function getSummaryMetrics($query)
    {
        $total = (clone $query)->count();
        $approved = (clone $query)->where('request_status', 'approver_approved')->count();
        $rejected = (clone $query)->where('request_status', 'approver_rejected')->count();
        $pending = (clone $query)->where('request_status', 'requestor_requested')->count();
        $cancelled = (clone $query)->where('request_status', 'cancelled')->count();

        $completedTotal = $approved + $rejected;
        $approvalRate = $completedTotal > 0 ? round(($approved / $completedTotal) * 100, 2) : 0;

        return [
            'total_requests' => $total,
            'approved' => $approved,
            'rejected' => $rejected,
            'pending' => $pending,
            'cancelled' => $cancelled,
            'approval_rate' => $approvalRate,
            'completion_rate' => $total > 0 ? round((($approved + $rejected) / $total) * 100, 2) : 0,
        ];
    }

    private function getStatusBreakdown($query)
    {
        return (clone $query)
            ->select('request_status', DB::raw('COUNT(*) as count'))
            ->groupBy('request_status')
            ->orderBy('count', 'desc')
            ->get()
            ->keyBy('request_status')
            ->map(fn ($item) => $item->count)
            ->toArray();
    }

    private function getScopeBreakdown($query)
    {
        $scopeData = (clone $query)
            ->select('shipment_scope_type', DB::raw('COUNT(*) as count'))
            ->groupBy('shipment_scope_type')
            ->orderBy('count', 'desc')
            ->get();

        $domestic = 0;
        $international = 0;
        $breakdown = [];

        foreach ($scopeData as $item) {
            $breakdown[$item->shipment_scope_type ?? 'unknown'] = $item->count;
            if (str_starts_with($item->shipment_scope_type ?? '', 'domestic')) {
                $domestic += $item->count;
            } elseif (str_starts_with($item->shipment_scope_type ?? '', 'international')) {
                $international += $item->count;
            }
        }

        return [
            'domestic_total' => $domestic,
            'international_total' => $international,
            'detailed' => $breakdown,
        ];
    }

    private function getLabelPerformance($query)
    {
        $labelData = (clone $query)
            ->whereNotNull('label_status')
            ->select('label_status', DB::raw('COUNT(*) as count'))
            ->groupBy('label_status')
            ->get()
            ->keyBy('label_status')
            ->map(fn ($item) => $item->count)
            ->toArray();

        $created = $labelData['created'] ?? 0;
        $failed = $labelData['failed'] ?? 0;
        $total = $created + $failed;

        return [
            'breakdown' => $labelData,
            'success_rate' => $total > 0 ? round(($created / $total) * 100, 2) : 0,
            'total_created' => $created,
            'total_failed' => $failed,
        ];
    }

    private function getPriorityBreakdown($query)
    {
        return (clone $query)
            ->select('service_options', DB::raw('COUNT(*) as count'))
            ->groupBy('service_options')
            ->get()
            ->keyBy('service_options')
            ->map(fn ($item) => $item->count)
            ->toArray();
    }

    private function getApprovalMetrics($query)
    {
        $avgApprovalTime = (clone $query)
            ->whereNotNull('approver_approved_date_time')
            ->selectRaw('AVG(DATEDIFF(HOUR, created_date_time, approver_approved_date_time)) as avg_hours')
            ->first();

        $sameDay = (clone $query)
            ->whereNotNull('approver_approved_date_time')
            ->whereRaw('CAST(created_date_time AS DATE) = CAST(approver_approved_date_time AS DATE)')
            ->count();

        $totalApproved = (clone $query)->where('request_status', 'approver_approved')->count();

        return [
            'avg_approval_hours' => round($avgApprovalTime->avg_hours ?? 0, 2),
            'same_day_approval_count' => $sameDay,
            'same_day_approval_rate' => $totalApproved > 0 ? round(($sameDay / $totalApproved) * 100, 2) : 0,
        ];
    }

    private function getMonthlyTrends($year)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->select(
                DB::raw('MONTH(created_date_time) as month'),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN request_status = 'approver_approved' THEN 1 ELSE 0 END) as approved"),
                DB::raw("SUM(CASE WHEN request_status = 'approver_rejected' THEN 1 ELSE 0 END) as rejected"),
                DB::raw("SUM(CASE WHEN request_status = 'requestor_requested' THEN 1 ELSE 0 END) as pending"),
                DB::raw("SUM(CASE WHEN request_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled"),
                DB::raw("SUM(CASE WHEN service_options = 'Urgent' THEN 1 ELSE 0 END) as urgent"),
                DB::raw("SUM(CASE WHEN label_status = 'created' THEN 1 ELSE 0 END) as labels_created"),
                DB::raw("SUM(CASE WHEN label_status = 'failed' THEN 1 ELSE 0 END) as labels_failed")
            )
            ->groupBy(DB::raw('MONTH(created_date_time)'))
            ->orderBy(DB::raw('MONTH(created_date_time)'))
            ->get();
    }

    private function getScopeTrends($year)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->select(
                DB::raw('MONTH(created_date_time) as month'),
                'shipment_scope_type',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw('MONTH(created_date_time)'), 'shipment_scope_type')
            ->orderBy(DB::raw('MONTH(created_date_time)'))
            ->get()
            ->groupBy('month')
            ->map(fn ($items) => $items->pluck('count', 'shipment_scope_type'));
    }

    private function getTopRequestors($year, $limit = 10)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->select(
                'created_user_id',
                'created_user_name',
                DB::raw('COUNT(*) as total_requests'),
                DB::raw("SUM(CASE WHEN request_status = 'approver_approved' THEN 1 ELSE 0 END) as approved"),
                DB::raw("SUM(CASE WHEN request_status = 'approver_rejected' THEN 1 ELSE 0 END) as rejected")
            )
            ->groupBy('created_user_id', 'created_user_name')
            ->orderBy('total_requests', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getTopTopics($year, $limit = 10)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->whereNotNull('topic')
            ->select('topic', DB::raw('COUNT(*) as count'))
            ->groupBy('topic')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getShippingOptionsBreakdown($year)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->select(
                'shipping_options',
                DB::raw('COUNT(*) as count'),
                DB::raw("SUM(CASE WHEN label_status = 'created' THEN 1 ELSE 0 END) as success"),
                DB::raw("SUM(CASE WHEN label_status = 'failed' THEN 1 ELSE 0 END) as failed")
            )
            ->groupBy('shipping_options')
            ->get();
    }

    private function getErrorAnalysis($year, $limit = 10)
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->where('label_status', 'failed')
            ->whereNotNull('error_msg')
            ->select('error_msg', DB::raw('COUNT(*) as count'))
            ->groupBy('error_msg')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get();
    }

    private function getYearSummary($year)
    {
        $data = DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereYear('created_date_time', $year)
            ->select(
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN request_status = 'approver_approved' THEN 1 ELSE 0 END) as approved"),
                DB::raw("SUM(CASE WHEN request_status = 'approver_rejected' THEN 1 ELSE 0 END) as rejected"),
                DB::raw("SUM(CASE WHEN request_status = 'requestor_requested' THEN 1 ELSE 0 END) as pending")
            )
            ->first();

        $completed = $data->approved + $data->rejected;

        return [
            'total' => $data->total,
            'approved' => $data->approved,
            'rejected' => $data->rejected,
            'pending' => $data->pending,
            'approval_rate' => $completed > 0 ? round(($data->approved / $completed) * 100, 2) : 0,
        ];
    }

    private function getAvailableYears()
    {
        return DB::table(self::TABLE)
            ->where('testing', 0)
            ->selectRaw('DISTINCT YEAR(created_date_time) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();
    }

    // ========== Legacy Methods (kept for backward compatibility) ==========

    /**
     * @deprecated Use action_get_dashboard_overview instead
     */
    public function action_get_requests_per_month(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'month' => 'nullable|integer',
            'year' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $baseQuery = DB::table(self::TABLE)
            ->where('testing', 0)
            ->whereMonth('created_date_time', $month)
            ->whereYear('created_date_time', $year);

        $counts = $this->getStatusAndScopeCounts($baseQuery);
        $counts['month'] = $month;
        $counts['year'] = $year;

        return response()->json($counts);
    }

    /**
     * @deprecated Use action_get_analytics instead
     */
    public function action_get_requests_per_year(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $year = $request->input('year', Carbon::now()->year);

        $scopes = ['domestic%', 'international_export', 'international_import', null];
        $result = [];

        foreach ($scopes as $scope) {
            $query = DB::table(self::TABLE)
                ->where('testing', 0)
                ->whereYear('created_date_time', $year);

            if ($scope !== null) {
                $query->where('shipment_scope_type', 'like', $scope);
            }

            $yearly = (clone $query)
                ->select(
                    DB::raw('COUNT(*) as all_status_count'),
                    DB::raw("SUM(CASE WHEN request_status='approver_approved' THEN 1 ELSE 0 END) as approver_approved_count"),
                    DB::raw("SUM(CASE WHEN request_status='approver_rejected' THEN 1 ELSE 0 END) as approver_rejected_count"),
                    DB::raw("SUM(CASE WHEN request_status='requestor_requested' THEN 1 ELSE 0 END) as requestor_requested_count")
                )
                ->first();

            $monthly = (clone $query)
                ->select(
                    DB::raw('MONTH(created_date_time) as month'),
                    DB::raw('COUNT(*) as all_status_count'),
                    DB::raw("SUM(CASE WHEN request_status='approver_approved' THEN 1 ELSE 0 END) as approver_approved_count"),
                    DB::raw("SUM(CASE WHEN request_status='approver_rejected' THEN 1 ELSE 0 END) as approver_rejected_count"),
                    DB::raw("SUM(CASE WHEN request_status='requestor_requested' THEN 1 ELSE 0 END) as requestor_requested_count")
                )
                ->groupBy(DB::raw('MONTH(created_date_time)'))
                ->orderBy(DB::raw('MONTH(created_date_time)'))
                ->get();

            $key = $scope ?? 'all';
            $result[$key] = ['yearly' => $yearly, 'monthly' => $monthly];
        }

        return response()->json([
            'year' => $year,
            'data' => $result,
            'year_list' => $this->getAvailableYears(),
        ]);
    }

    private function getStatusAndScopeCounts($baseQuery)
    {
        $statuses = ['approver_approved', 'approver_rejected', 'requestor_requested'];
        $scopes = [
            'domestic' => 'domestic%',
            'export' => 'international_export',
            'import' => 'international_import',
        ];

        $counts = [
            'all_status_count' => (clone $baseQuery)->count(),
        ];

        foreach ($statuses as $status) {
            $key = "{$status}_count";
            $counts[$key] = (clone $baseQuery)->where('request_status', $status)->count();
        }

        foreach ($scopes as $name => $pattern) {
            $scopeQuery = (clone $baseQuery)->where('shipment_scope_type', 'like', $pattern);
            $counts["{$name}_all_status_count"] = (clone $scopeQuery)->count();

            foreach ($statuses as $status) {
                $counts["{$name}_{$status}_count"] = (clone $scopeQuery)->where('request_status', $status)->count();
            }
        }

        return $counts;
    }
}
