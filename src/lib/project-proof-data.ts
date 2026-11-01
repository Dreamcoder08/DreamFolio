// Read side of the committed proof snapshot (src/data/project-proof.json),
// refreshed by `pnpm run sync:proof`. Kept apart from project-proof.ts so the
// sync script can import the pure rules without importing the JSON it writes.
import snapshot from "../data/project-proof.json";
import type { ProjectProof, ProofSnapshot } from "./project-proof";

const proof = snapshot as ProofSnapshot;

export const proofCheckedAt: string = proof.checkedAt;

export function getProjectProof(projectId: string): ProjectProof | undefined {
  return proof.projects[projectId];
}
