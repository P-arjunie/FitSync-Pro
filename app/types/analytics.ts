export interface RevenueAnalyticsData {
  // Summary metrics
  totalRevenue: number;
  totalPricingPlans: number;
  totalClassEnrollments: number;
  averageRevenuePerDay: number;
  
  // Breakdowns
  revenueByType: Record<string, number>;
  
  // Time-based data
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    pricingPlans: number;
    classEnrollments: number;
  }>;
  
  // Optional chart data (for backward compatibility)
  labels?: string[];
  pricingPlanRevenue?: number[];
  classRevenue?: number[];
  totalRevenueArray?: number[];
  totalPricingPlanRevenue?: number;
  totalClassRevenue?: number;
  overallTotalRevenue?: number;
  pricingPlanBreakdown?: Array<{
    planName: string;
    purchases: number;
    revenue: number;
  }>;
  classBreakdown?: Array<{
    className: string;
    enrollments: number;
    revenue: number;
  }>;
  pricingPlanStatuses?: Record<string, number>;
  enrollmentStatuses?: Record<string, number>;
  comparisonToPreviousPeriod?: {
    pricingPlanRevenueChange: number;
    classRevenueChange: number;
    totalRevenueChange: number;
  };
}

export interface RevenueAnalyticsResponse {
  success: boolean;
  data?: RevenueAnalyticsData;
  error?: string;
}