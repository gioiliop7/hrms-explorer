import { FMitrooForeasDto } from "./api";

export interface ExtendedOrganization extends FMitrooForeasDto {
  elstat?: any;
  gsis?: any;
  diavgeia?: any;
  mitos?: null | {
    total: number;
    procedures: any[];
  };
  opengov?: null | {
    id: number;
    title: string;
    link: string;
    publishDate: string;
    expiryDate: string | null;
    status: "open" | "closed" | "pending" | "unknown";
    statusLabel: string;
  }[];
}
