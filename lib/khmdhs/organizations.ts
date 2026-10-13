// lib/khmdhs/organizations.ts
//
// Binds the harvested ΚΗΜΔΗΣ register (data/khmdhs-organizations.json, produced by
// scripts/harvest-khmdhs-orgs.mjs) to the matching logic in matching.ts.

import registry from "@/data/khmdhs-organizations.json";
import { normalizeGreekText } from "@/lib/text";
import {
  buildRegistry,
  matchOrganization,
  type KhmdhsMatch,
  type Registry,
} from "./matching";
import { OVERRIDES_BY_NORMALIZED } from "./overrides";
import type { KhmdhsOrganization } from "./types";


let cached: Registry | null = null;

function loadRegistry(): Registry {
  cached ??= buildRegistry(registry.organizations as KhmdhsOrganization[]);
  return cached;
}

/** When the register was swept, for display alongside the data. */
export function registryHarvestedAt(): string {
  return registry.harvestedAt;
}

export function registrySize(): number {
  return registry.organizations.length;
}

/** Resolves an ΗΡΜΣ organization name to its ΚΗΜΔΗΣ entry, or null. */
export function findKhmdhsOrganization(
  organizationName: string,
): KhmdhsMatch | null {
  if (!organizationName) return null;

  const loaded = loadRegistry();

  const override = OVERRIDES_BY_NORMALIZED.get(
    normalizeGreekText(organizationName),
  );
  if (override) {
    const forced = loaded.entries.find((entry) => entry.key === override);
    if (forced) {
      return {
        organization: {
          key: forced.key,
          name: forced.name,
          actCount: forced.actCount,
        },
        confidence: "exact",
        score: 1,
      };
    }
  }

  return matchOrganization(organizationName, loaded);
}

export type { KhmdhsMatch };
