// WEBSITE — herdflow-web/src/lib/tenant-lookups.ts
//
// Shared ownership-scoped lookups for child-record routes that accept a
// reference to another entity (an animalId, a campId) from the client.
// Without this check, a route could create a record whose farmerId is the
// caller's own but whose animalId/campId points at a different farm's
// record -- that record is invisible to the other farm (RLS still filters
// by its own farmerId), but it's a real "orphan write" / latent IDOR
// precursor if anything ever reads these child tables by animalId/campId
// alone.
//
// The mobile app generates its own local UUID as a record's primary key,
// then the backend generates a different id (cuid) when the create syncs.
// The mobile app has no way to learn that server id back — every later
// request still addresses the record by its own local id. So: look up by
// the real `id` first, and if nothing matches, fall back to matching on
// `localId`.
import type { Prisma } from "@prisma/client";

export async function getAnimalForFarmer(
  tx: Prisma.TransactionClient,
  id: string,
  farmerId: string,
) {
  const byId = await tx.farmerAnimal.findFirst({ where: { id, farmerId, isDeleted: false } });
  if (byId) return byId;
  return tx.farmerAnimal.findFirst({ where: { localId: id, farmerId, isDeleted: false } });
}

export async function getCampForFarmer(
  tx: Prisma.TransactionClient,
  id: string,
  farmerId: string,
) {
  const byId = await tx.farmerCamp.findFirst({ where: { id, farmerId, isDeleted: false } });
  if (byId) return byId;
  return tx.farmerCamp.findFirst({ where: { localId: id, farmerId, isDeleted: false } });
}
