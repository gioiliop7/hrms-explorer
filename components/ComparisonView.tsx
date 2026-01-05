// components/ComparisonView.tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Building2, Users, Briefcase, X, Plus } from "lucide-react";
import { organizationAPI, orgUnitsAPI } from "@/lib/api";
import type {
  FMitrooForeasDto,
  OrgmaMonadaDto,
  OrgmaThesiDto,
} from "@/types/api";

interface OrganizationStats {
  code: string;
  name: string;
  totalUnits: number;
  unitsByType: Record<number, number>;
}

interface ComparisonViewProps {
  initialOrganization?: FMitrooForeasDto;
  onClose: () => void;
}

export default function ComparisonView({
  initialOrganization,
  onClose,
}: ComparisonViewProps) {
  const [organizations, setOrganizations] = useState<FMitrooForeasDto[]>(
    initialOrganization ? [initialOrganization] : []
  );
  const [stats, setStats] = useState<OrganizationStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FMitrooForeasDto[]>([]);

  // Load stats for organizations
  useEffect(() => {
    if (organizations.length === 0) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const statsPromises = organizations.map(async (org) => {
          const [unitsRes] = await Promise.all([
            orgUnitsAPI.getUnits(org.code),
          ]);

          const units = unitsRes.data.data || [];

          // Calculate stats
          const unitsByType: Record<number, number> = {};
          units.forEach((u) => {
            if (u.unitType) {
              unitsByType[u.unitType] = (unitsByType[u.unitType] || 0) + 1;
            }
          });


          return {
            code: org.code,
            name: org.preferredLabel,
            totalUnits: units.length,
            unitsByType,
          };
        });

        const loadedStats = await Promise.all(statsPromises);
        setStats(loadedStats);
      } catch (error) {
        console.error("Error loading comparison stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [organizations]);

  // Search organizations
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await organizationAPI.search({ preferredLabel: query });
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const addOrganization = (org: FMitrooForeasDto) => {
    if (organizations.length >= 3) {
      alert("Μπορείτε να συγκρίνετε μέχρι 3 φορείς!");
      return;
    }
    if (organizations.some((o) => o.code === org.code)) {
      alert("Ο φορέας υπάρχει ήδη στη σύγκριση!");
      return;
    }
    setOrganizations([...organizations, org]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeOrganization = (code: string) => {
    setOrganizations(organizations.filter((o) => o.code !== code));
    setStats(stats.filter((s) => s.code !== code));
  };

  // Prepare comparison data
  const comparisonData = [
    {
      metric: "Μονάδες",
      ...Object.fromEntries(stats.map((s) => [s.name, s.totalUnits])),
    }
  ];

  // Radar chart data (normalized to 0-100 scale)
  const radarData =
    stats.length > 0
      ? [
          {
            metric: "Μονάδες",
            ...Object.fromEntries(
              stats.map((s) => [
                s.name,
                normalizeValue(
                  s.totalUnits,
                  Math.max(...stats.map((st) => st.totalUnits))
                ),
              ])
            ),
          },
        ]
      : [];

  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Σύγκριση Φορέων</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Organization Search */}
          {organizations.length < 3 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Προσθήκη Φορέα για Σύγκριση
                </h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Αναζήτηση φορέα..."
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    {searchResults.map((org) => (
                      <button
                        key={org.code}
                        onClick={() => addOrganization(org)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {org.preferredLabel}
                        </div>
                        <div className="text-sm text-gray-500">{org.code}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Organizations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org, index) => {
              const orgStats = stats.find((s) => s.code === org.code);
              return (
                <div
                  key={org.code}
                  className="bg-white border-2 rounded-lg p-4"
                  style={{ borderColor: COLORS[index] }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {org.preferredLabel}
                      </h3>
                      <p className="text-xs text-gray-500">{org.code}</p>
                    </div>
                    <button
                      onClick={() => removeOrganization(org.code)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>

                  {loading && !orgStats ? (
                    <div className="text-sm text-gray-500">Φόρτωση...</div>
                  ) : orgStats ? (
                    <div className="space-y-2">
                      <StatRow
                        icon={Building2}
                        label="Μονάδες"
                        value={orgStats.totalUnits}
                        color={COLORS[index]}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Charts */}
          {stats.length >= 2 && (
            <>
              {/* Bar Chart Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Σύγκριση Μετρικών
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {stats.map((stat, index) => (
                      <Bar
                        key={stat.code}
                        dataKey={stat.name}
                        fill={COLORS[index]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Συγκριτική Ανάλυση (Κανονικοποιημένη)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {stats.map((stat, index) => (
                      <Radar
                        key={stat.code}
                        name={stat.name}
                        dataKey={stat.name}
                        stroke={COLORS[index]}
                        fill={COLORS[index]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {organizations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Προσθέστε φορείς για να ξεκινήσετε τη σύγκριση
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function normalizeValue(value: number, max: number): number {
  return max > 0 ? Math.round((value / max) * 100) : 0;
}
