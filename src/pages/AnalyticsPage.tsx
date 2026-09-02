import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { MetricSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import { WeeklyChart } from '../components/analytics/WeeklyChart';
import { MonthlyTrendChart } from '../components/analytics/MonthlyTrendChart';
import { PriorityBreakdownChart } from '../components/analytics/PriorityBreakdownChart';
import { analyticsApi } from '../api/analytics.api';
import { WeeklyAnalyticsResponse, MonthlyAnalyticsResponse } from '../types';
import { useToast } from '../context/ToastContext';
import { TrendingUp, TrendingDown, Award, Calendar, BarChart2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalyticsResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'weekly') {
        const res = await analyticsApi.getWeeklyAnalytics();
        setWeeklyData(res);
      } else {
        const res = await analyticsApi.getMonthlyAnalytics();
        setMonthlyData(res);
      }
    } catch (e: any) {
      toast.error('Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <Layout>
      <Header
        title="Productivity Analytics 📊"
        subtitle="Review your completion trends, percentage point comparisons, and performance insights."
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'weekly'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200'
              : 'glass-card text-slate-600 hover:text-slate-900'
          }`}
        >
          Weekly Analysis
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'monthly'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200'
              : 'glass-card text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Analysis
        </button>
      </div>

      {activeTab === 'weekly' ? (
        /* Weekly Section */
        <div className="space-y-8">
          {/* Comparison Message Banner */}
          {weeklyData && (
            <GlassCard className="bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 border-rose-200/80">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 ${
                    weeklyData.completionRateDifference >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {weeklyData.completionRateDifference >= 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Weekly Performance Comparison</h4>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{weeklyData.comparisonMessage}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluated for week ({weeklyData.startDate} to {weeklyData.endDate})
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </>
            ) : (
              <>
                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Completion Rate</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">{weeklyData?.completionRate || 0}%</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Prior week: {weeklyData?.previousWeekCompletionRate || 0}%
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">{weeklyData?.totalTasks || 0}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {weeklyData?.completedTasks || 0} completed
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Most Productive Day</span>
                  <p className="text-base font-bold text-slate-800 mt-2 truncate">
                    {weeklyData?.mostProductiveDay || 'N/A'}
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Least Productive Day</span>
                  <p className="text-base font-bold text-slate-800 mt-2 truncate">
                    {weeklyData?.leastProductiveDay || 'N/A'}
                  </p>
                </GlassCard>
              </>
            )}
          </div>

          {/* Weekly Chart */}
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tasks Completed Each Day</h3>
                  <p className="text-xs text-slate-500">Daily breakdown for previous completed week</p>
                </div>
                <BarChart2 className="w-5 h-5 text-rose-500" />
              </div>
              <WeeklyChart dailyMap={weeklyData?.dailyCompletedMap || {}} />
            </GlassCard>
          )}
        </div>
      ) : (
        /* Monthly Section */
        <div className="space-y-8">
          {/* Comparison Banner */}
          {monthlyData && (
            <GlassCard className="bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-amber-500/10 border-purple-200/80">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 ${
                    monthlyData.completionRateDifference >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {monthlyData.completionRateDifference >= 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Monthly Performance ({monthlyData.monthName})</h4>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{monthlyData.comparisonMessage}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Monthly Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </>
            ) : (
              <>
                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Monthly Completion Rate</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">{monthlyData?.completionRate || 0}%</p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">{monthlyData?.totalTasks || 0}</p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Best Week</span>
                  <p className="text-base font-bold text-slate-800 mt-2 truncate">
                    {monthlyData?.bestWeek || 'N/A'}
                  </p>
                </GlassCard>

                <GlassCard>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Most Productive Day</span>
                  <p className="text-base font-bold text-slate-800 mt-2 truncate">
                    {monthlyData?.mostProductiveDay || 'N/A'}
                  </p>
                </GlassCard>
              </>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Completion Trend</h3>
              <MonthlyTrendChart dailyMap={monthlyData?.dailyCompletedMap || {}} />
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Priority Distribution</h3>
              <PriorityBreakdownChart
                highCompleted={monthlyData?.highPriorityCompleted || 0}
                highPending={monthlyData?.highPriorityPending || 0}
                mediumCompleted={monthlyData?.mediumPriorityCompleted || 0}
                mediumPending={monthlyData?.mediumPriorityPending || 0}
                lowCompleted={monthlyData?.lowPriorityCompleted || 0}
                lowPending={monthlyData?.lowPriorityPending || 0}
              />
            </GlassCard>
          </div>
        </div>
      )}
    </Layout>
  );
};
