// src/components/analytics/AnalyticsView.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductivityTrend, fetchTimeByProject } from "@/services/analyticsApi";
import { isApiError } from "@/services/common";
import { AnalyticsQueryArgs, ProductivityTrendPoint, TimeByProjectStat } from "@/services/types";
import { AlertCircle, BarChart3, Calendar, Clock, TrendingUp } from "lucide-react";
import { Session } from "next-auth";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

  useEffect(() => {
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

  // Calcul des statistiques de résumé
  const totalHours = timeByProject.reduce((sum, item) => sum + (item.total_duration_seconds / 3600), 0);
  const averageDailyHours = productivityTrend.length > 0
    ? productivityTrend.reduce((sum, item) => sum + (item.total_duration_seconds / 3600), 0) / productivityTrend.length
    : 0;

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Productivity Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Time Period
              </label>
              <Select value={queryParams.period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {queryParams.period === "custom" && (
              <DateRangePicker
                onDateRangeChange={handleDateRangeChange}
                initialStartDate={queryParams.start_date}
                initialEndDate={queryParams.end_date}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {loading && renderLoadingSkeleton()}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Error:</span> {error}
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
                <Badge variant="secondary" className="mt-1">
                  {timeByProject.length} projects
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Daily Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageDailyHours.toFixed(1)}</div>
                <Badge variant="secondary" className="mt-1">
                  hours/day
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Active Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productivityTrend.filter(p => p.total_duration_seconds > 0).length}
                </div>
                <Badge variant="secondary" className="mt-1">
                  of {productivityTrend.length} days
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Time Spent by Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeByProject.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={timeByProject.map(item => ({
                          name: item.project_name,
                          hours: Number((item.total_duration_seconds / 3600).toFixed(2)),
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                          type="number"
                          label={{ value: 'Hours', position: 'insideBottomRight', offset: -5 }}
                          className="text-xs"
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value) => [`${value} hours`, 'Duration']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar
                          dataKey="hours"
                          fill="hsl(var(--primary))"
                          name="Duration"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No project data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Productivity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productivityTrend.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={productivityTrend.map(item => ({
                          date: new Date(item.date_point).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }),
                          hours: Number((item.total_duration_seconds / 3600).toFixed(2)),
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                        />
                        <YAxis
                          label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value) => [`${value} hours`, 'Duration']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="hsl(var(--primary))"
                          name="Daily Work"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No trend data available for this period</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}