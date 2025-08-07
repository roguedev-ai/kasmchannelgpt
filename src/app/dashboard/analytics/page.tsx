'use client';

import { ReportsAnalytics } from '@/components/projects/ReportsAnalytics';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAgentStore } from '@/store/agents';

export default function AnalyticsPage() {
  const { currentAgent } = useAgentStore();
  
  if (!currentAgent) {
    return (
      <DashboardLayout currentPage="analytics-overview">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Agent Selected</h2>
            <p className="text-gray-600">Please select an agent to view analytics.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="analytics-overview">
      <ReportsAnalytics project={currentAgent} />
    </DashboardLayout>
  );
}