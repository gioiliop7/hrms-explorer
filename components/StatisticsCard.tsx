// components/StatisticsCard.tsx
"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Building2 } from "lucide-react";
import type { OrgmaMonadaDto, OrgmaThesiDto } from "@/types/api";
import { getUnitTypeLabel } from "@/lib/utils";

interface StatisticsCardProps {
  units: OrgmaMonadaDto[];
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
];

export default function StatisticsCard({ units }: StatisticsCardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    // Unit type breakdown
    const unitTypeCounts: Record<number, number> = {};
    units.forEach((u) => {
      if (u.unitType) {
        unitTypeCounts[u.unitType] = (unitTypeCounts[u.unitType] || 0) + 1;
      }
    });

    return {
      totalUnits: units.length,
      unitTypeCounts,
    };
  }, [units]);

  // Prepare data for Unit Type Bar Chart
  const unitTypeData = Object.entries(stats.unitTypeCounts)
    .map(([type, count]) => ({
      name: getUnitTypeLabel(parseInt(type)),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 unit types

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div>
        <StatCard
          icon={Building2}
          label="Σύνολο Μονάδων"
          value={stats.totalUnits}
          color={COLORS.primary}
        />
      </div>

      {/* Charts */}
      <div>
        {/* Unit Type Bar Chart */}
        {unitTypeData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top 5 Τύποι Μονάδων
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={unitTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// Helper functions for labels
