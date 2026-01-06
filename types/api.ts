// types/api.ts

// Base Response Wrapper
export interface ResponseWrapper<T> {
    data: T;
  }
  
  // Organization Types
  export interface FMitrooForeasBaseDetailsDto {
    code: string;
    preferredLabel: string;
    subOrganizationOf?: string;
  }
  
  export interface AddressDto {
    fullAddress?: string;
    thoroughfare?: string;
    locatorDesignator?: string;
    postCode?: string;
    postName?: string;
    adminUnitLevel1?: string;
  }
  
  export interface FekDto {
    year?: number;
    number?: number;
    issue?: string;
  }
  
  export interface FMitrooForeasDto {
    organizationType: number;
    code: string;
    preferredLabel: string;
    alternativeLabels?: string[];
    spatial?: string;
    identifier?: string;
    classification?: number;
    purpose?: number[];
    subOrganizationOf?: string;
    telephone?: string;
    email?: string;
    hasUnit?: string[];
    foundationDate?: string;
    terminationDate?: string;
    updateDate?: string;
    organizationStructureUpdateDate?: string;
    foundationFek?: FekDto;
    mainAddress?: AddressDto;
  }
  
  export interface FMitrooForeasSearchDto {
    preferredLabel?: string;
    code?: string;
    classification?: number;
    subOrganizationOf?: string;
  }
  
  // Organizational Unit Types
  export interface Spatial {
    countryId?: number;
    dimosId?: number;
  }
  
  export interface OrgmaMonadaDto {
    code: string;
    organizationCode: string;
    supervisorUnitCode?: string;
    preferredLabel: string;
    alternativeLabels?: string[];
    purpose?: number[];
    spatial?: Spatial[];
    identifier?: string;
    unitType?: number;
    description?: string;
    email?: string;
    telephone?: string;
    url?: string;
    mainAddress?: AddressDto;
    secondaryAddresses?: AddressDto[];
  }
  
  export interface OrgmaMonadaTreeDto {
    code: string;
    preferredLabel: string;
    unitType?: number;
    children?: OrgmaMonadaTreeDto[];
  }
  
  export interface OrgmaPathDto {
    code: string;
    preferredLabel: string;
    unitType?: number;
    child?: OrgmaPathDto;
  }
  
  // Position Types
  export interface OrgmaThesiDto {
    code: string;
    organizationCode: string;
    unitCode: string;
    type?: 'Organic' | 'Temporary';
    employmentType?: number;
    employeeCategory?: number;
    educationCategory?: number;
    professionCategory?: number;
    speciality?: number;
    inProsontologio?: boolean;
    rank?: number;
    jobDescriptionCode?: string;
    jobDescriptionTitle?: string;
    jobDescriptionVersion?: number;
    jobDescriptionVersionDate?: string;
  }
  
  // Dictionary Types
  export interface LexWithoutParentDto {
    id: number;
    description: string;
  }
  
  export interface LexWithParentDto {
    id: number;
    description: string;
    parentId?: number;
  }
  
  // React Flow Types for Diagram
  export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      code: string;
      unitType?: number;
    };
  }
  
  export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    type: string;
  }