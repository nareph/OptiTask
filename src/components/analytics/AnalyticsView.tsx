// src/components/analytics/AnalyticsView.tsx
"use client";

import { AnalyticsQueryArgs, ProductivityTrendPoint, TimeByProjectStat } from "@/services/types";
import { fetchProductivityTrend, fetchTimeByProject } from "@/services/analyticsApi";
import { isApiError } from "@/services/common";
import { Session } from "next-auth";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import DateRangePicker from "./DateRangePicker";

interface AnalyticsViewProps {
  session: Session | null;
}

const periodOptions = [
  { value: "this_week", label: "This Week" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

export default function AnalyticsView({ session }: AnalyticsViewProps) {
  const [timeByProject, setTimeByProject] = useState<TimeByProjectStat[]>([]);
  const [productivityTrend, setProductivityTrend] = useState<ProductivityTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<AnalyticsQueryArgs>({
    period: "this_week",
  });

  const fetchAnalyticsData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [timeData, trendData] = await Promise.all([
        fetchTimeByProject(session, queryParams),
        fetchProductivityTrend(session, queryParams),
      ]);

      if (isApiError(timeData)) {
        throw new Error(timeData.message);
      }
      if (isApiError(trendData)) {
        throw new Error(trendData.message);
      }

      setTimeByProject(timeData);
      setProductivityTrend(trendData);
    } catch (err) {
      console.error("Failed to fetch analytics data:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [session, queryParams]);

  const handlePeriodChange = (period: string) => {
    setQueryParams(prev => ({
      ...prev,
      period: period as AnalyticsQueryArgs["period"],
      start_date: period === "custom" ? prev.start_date : undefined,
      end_date: period === "custom" ? prev.end_date : undefined,
    }));
  };

  const handleDateRangeChange = (dates: { startDate?: string; endDate?: string }) => {
    setQueryParams(prev => ({
      ...prev,
      start_date: dates.startDate,
      end_date: dates.endDate,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Productivity Analytics</h2>

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              id="period-select"
              value={queryParams.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {queryParams.period === "custom" && (
            <DateRangePicker 
              onDateRangeChange={handleDateRangeChange}
              initialStartDate={queryParams.start_date}
              initialEndDate={queryParams.end_date}
            />
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Time Spent by Project</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeByProject.map(item => ({
                    name: item.project_name,
                    hours: item.total_duration_seconds / 3600,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Hours', position: 'insideBottomRight', offset: -5 }} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Duration']} />
                  <Legend />
                  <Bar dataKey="hours" fill="#3b82f6" name="Duration" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Productivity Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={productivityTrend.map(item => ({
                    date: item.date_point,
                    hours: item.total_duration_seconds / 3600,
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Duration']} />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#3b82f6" name="Daily Work" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}