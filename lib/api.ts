// lib/api.ts
import type {
  ResponseWrapper,
  FMitrooForeasDto,
  FMitrooForeasBaseDetailsDto,
  FMitrooForeasSearchDto,
  OrgmaMonadaDto,
  OrgmaMonadaTreeDto,
  OrgmaPathDto,
  OrgmaThesiDto,
  LexWithoutParentDto,
  LexWithParentDto,
} from "@/types/api";

// Use Next.js API routes to bypass CORS
const BASE_URL = "/api";

// Helper function for fetch requests
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T }> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return { data };
}

// Helper function for GET requests with query params
function buildQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return "";

  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join("&");

  return filtered ? `?${filtered}` : "";
}

// Organization Endpoints
export const organizationAPI = {
  // Search organizations
  search: (searchParams: FMitrooForeasSearchDto) =>
    fetchAPI<ResponseWrapper<FMitrooForeasDto[]>>("/organizations/search", {
      method: "POST",
      body: JSON.stringify(searchParams),
    }),

  // Get all organizations
  getAll: () =>
    fetchAPI<ResponseWrapper<FMitrooForeasBaseDetailsDto[]>>("/organizations"),

  // Get organization by code
  getByCode: (code: string) =>
    fetchAPI<ResponseWrapper<FMitrooForeasDto>>(`/organizations/${code}`),
};

// Organizational Units Endpoints
export const orgUnitsAPI = {
  // Get units list (flat)
  getUnits: (organizationCode: string) =>
    fetchAPI<ResponseWrapper<OrgmaMonadaDto[]>>(
      `/organizational-units${buildQueryString({ organizationCode })}`
    ),

  // Get organization tree (hierarchical)
  getTree: (organizationCode: string, unitCode?: string) =>
    fetchAPI<ResponseWrapper<OrgmaMonadaTreeDto>>(
      `/organization-tree${buildQueryString({ organizationCode, unitCode })}`
    ),

  // Get path to specific unit (breadcrumbs)
  getPath: (unitCode: string) =>
    fetchAPI<ResponseWrapper<OrgmaPathDto>>(`/organization-path/${unitCode}`),
};

// Positions Endpoints
export const positionsAPI = {
  // Get positions for organization/unit
  getPositions: (organizationCode?: string, unitCode?: string) =>
    fetchAPI<ResponseWrapper<OrgmaThesiDto[]>>(
      `/positions${buildQueryString({ organizationCode, unitCode })}`
    ),

  // Download job description PDF
  getJobDescriptionPDF: async (positionCode: string) => {
    const response = await fetch(
      `${BASE_URL}/positions/${positionCode}/job-description`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const blob = await response.blob();
    return { data: blob };
  },
};

// Dictionary Endpoints
export const dictionaryAPI = {
  // Unit Types
  getUnitTypes: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/UnitTypes"
    ),

  // Specialities
  getSpecialities: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/Specialities"
    ),

  // Special Positions
  getSpecialPositions: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/SpecialPositions"
    ),

  // Ranks
  getRanks: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/Ranks"
    ),

  // Profession Categories
  getProfessionCategories: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/ProfessionCategories"
    ),

  // Position Duties
  getPositionDuties: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/PositionDuties"
    ),

  // Functions
  getFunctions: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/Functions"
    ),

  // Organization Types
  getOrganizationTypes: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/OrganizationTypes"
    ),

  // Employment Types
  getEmploymentTypes: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/EmploymentTypes"
    ),

  // Employee Categories
  getEmployeeCategories: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/EmployeeCategories"
    ),

  // Education Types
  getEducationTypes: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/EducationTypes"
    ),

  // Countries
  getCountries: () =>
    fetchAPI<ResponseWrapper<LexWithoutParentDto[]>>(
      "/public/metadata/dictionary/Countries"
    ),

  // Municipalities (Dimos)
  getMunicipalities: () =>
    fetchAPI<ResponseWrapper<LexWithParentDto[]>>(
      "/public/metadata/dictionary/Dimos"
    ),
};
