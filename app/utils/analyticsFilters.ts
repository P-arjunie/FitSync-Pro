// utils/analyticsFilters.ts
import { ILoginHistory } from '@/models/LoginHistory';

export interface FilterOptions {
    startDate: Date;
    endDate: Date;
    status: 'all' | 'success' | 'failure';
    userType: 'all' | 'new' | 'returning';
    ipAddress?: string;
    userAgent?: string;
    reason?: 'invalid_credentials' | 'suspended_account';
    groupBy: 'day' | 'week' | 'month' | 'hour';
}

export interface ProcessedAnalyticsData {
    labels: string[];
    loginCounts: number[];
    successRate: number;
    failureRate: number;
    peakHours: { hour: number; count: number }[];
    topFailureReasons: { reason: string; count: number }[];
    geographicData: { country: string; count: number }[];
    deviceData: { device: string; count: number }[];
    trendData: { date: string; success: number; failure: number }[];
}

export class AnalyticsFilterProcessor {
    /**
     * Apply filters to login history data
     */
    static applyFilters(data: ILoginHistory[], filters: FilterOptions): ILoginHistory[] {
        let filteredData = data;

        // Date range filter
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= filters.startDate && itemDate <= filters.endDate;
        });

        // Status filter
        if (filters.status !== 'all') {
            filteredData = filteredData.filter(item => item.status === filters.status);
        }

        // IP Address filter
        if (filters.ipAddress) {
            filteredData = filteredData.filter(item => 
                item.ipAddress?.includes(filters.ipAddress!)
            );
        }

        // User Agent filter
        if (filters.userAgent) {
            filteredData = filteredData.filter(item => 
                item.userAgent?.toLowerCase().includes(filters.userAgent!.toLowerCase())
            );
        }

        // Failure reason filter
        if (filters.reason) {
            filteredData = filteredData.filter(item => item.reason === filters.reason);
        }

        return filteredData;
    }

    /**
     * Group data by time period
     */
    static groupByTimePeriod(data: ILoginHistory[], groupBy: string): Map<string, ILoginHistory[]> {
        const grouped = new Map<string, ILoginHistory[]>();

        data.forEach(item => {
            const date = new Date(item.timestamp);
            let key: string;

            switch (groupBy) {
                case 'hour':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay() + 1);
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'day':
                default:
                    key = date.toISOString().split('T')[0];
                    break;
            }

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(item);
        });

        return grouped;
    }

    /**
     * Calculate peak hours from login data
     */
    static calculatePeakHours(data: ILoginHistory[]): { hour: number; count: number }[] {
        const hourCounts = new Map<number, number>();

        data.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });

        return Array.from(hourCounts.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Get top failure reasons
     */
    static getTopFailureReasons(data: ILoginHistory[]): { reason: string; count: number }[] {
        const failureData = data.filter(item => item.status === 'failure' && item.reason);
        const reasonCounts = new Map<string, number>();

        failureData.forEach(item => {
            if (item.reason) {
                reasonCounts.set(item.reason, (reasonCounts.get(item.reason) || 0) + 1);
            }
        });

        return Array.from(reasonCounts.entries())
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Extract device information from user agent
     */
    static extractDeviceInfo(userAgent: string): string {
        if (!userAgent) return 'Unknown';

        const ua = userAgent.toLowerCase();
        
        if (ua.includes('mobile') || ua.includes('android')) return 'Mobile';
        if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
        if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'Desktop';
        
        return 'Unknown';
    }

    /**
     * Get device breakdown
     */
    static getDeviceBreakdown(data: ILoginHistory[]): { device: string; count: number }[] {
        const deviceCounts = new Map<string, number>();

        data.forEach(item => {
            const device = this.extractDeviceInfo(item.userAgent || '');
            deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
        });

        return Array.from(deviceCounts.entries())
            .map(([device, count]) => ({ device, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Calculate success and failure rates
     */
    static calculateRates(data: ILoginHistory[]): { successRate: number; failureRate: number } {
        const total = data.length;
        if (total === 0) return { successRate: 0, failureRate: 0 };

        const successCount = data.filter(item => item.status === 'success').length;
        const failureCount = data.filter(item => item.status === 'failure').length;

        return {
            successRate: (successCount / total) * 100,
            failureRate: (failureCount / total) * 100
        };
    }

    /**
     * Generate trend data for charts
     */
    static generateTrendData(data: ILoginHistory[], groupBy: string): { date: string; success: number; failure: number }[] {
        const grouped = this.groupByTimePeriod(data, groupBy);
        const trendData: { date: string; success: number; failure: number }[] = [];

        Array.from(grouped.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([date, items]) => {
                const success = items.filter(item => item.status === 'success').length;
                const failure = items.filter(item => item.status === 'failure').length;
                
                trendData.push({
                    date: this.formatDateLabel(date, groupBy),
                    success,
                    failure
                });
            });

        return trendData;
    }

    /**
     * Format date labels for display
     */
    static formatDateLabel(date: string, groupBy: string): string {
        const dateObj = new Date(date);
        
        switch (groupBy) {
            case 'hour':
                return dateObj.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric',
                    hour12: true
                });
            case 'week':
                return `Week of ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            case 'month':
                return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            case 'day':
            default:
                return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * Get geographic data from IP addresses (simplified version)
     */
    static getGeographicData(data: ILoginHistory[]): { country: string; count: number }[] {
        const countryCounts = new Map<string, number>();

        data.forEach(item => {
            // This is a simplified version - in production you'd use a proper IP geolocation service
            const country = this.getCountryFromIP(item.ipAddress || '');
            countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
        });

        return Array.from(countryCounts.entries())
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Simple IP to country mapping (placeholder - use proper geolocation service)
     */
    private static getCountryFromIP(ipAddress: string): string {
        // This is a placeholder - in production, use a service like MaxMind or IP2Location
        if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
            return 'Local Network';
        }
        
        // Simplified mapping - replace with actual geolocation service
        return 'Unknown';
    }

    /**
     * Process all analytics data with filters
     */
    static processAnalyticsData(data: ILoginHistory[], filters: FilterOptions): ProcessedAnalyticsData {
        const filteredData = this.applyFilters(data, filters);
        const grouped = this.groupByTimePeriod(filteredData, filters.groupBy);
        const rates = this.calculateRates(filteredData);

        const sortedEntries = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        return {
            labels: sortedEntries.map(([date]) => this.formatDateLabel(date, filters.groupBy)),
            loginCounts: sortedEntries.map(([, items]) => items.length),
            successRate: rates.successRate,
            failureRate: rates.failureRate,
            peakHours: this.calculatePeakHours(filteredData),
            topFailureReasons: this.getTopFailureReasons(filteredData),
            geographicData: this.getGeographicData(filteredData),
            deviceData: this.getDeviceBreakdown(filteredData),
            trendData: this.generateTrendData(filteredData, filters.groupBy)
        };
    }
}