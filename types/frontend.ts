import { FMitrooForeasDto } from "./api";

export interface ExtendedOrganization extends FMitrooForeasDto {
  elstat?: any;
  gsis?: any;
  diavgeia?: any;
  mitos?: null | {
    total: number;
    procedures: any[];
  };
}
