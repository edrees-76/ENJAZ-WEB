import { getDB } from '../lib/db';

/**
 * Resolves temporary IDs in the operation payload using the persistent idMappings table.
 */
export async function resolveRelations(payload: any, relations?: { fieldPath: string; tempId: number }[]) {
  if (!relations || relations.length === 0 || !payload) return payload;

  const db = await getDB();
  const updatedPayload = { ...payload };

  for (const rel of relations) {
    const mapping = await db.get('idMappings', rel.tempId);
    if (mapping) {
      console.log(`[Sync Resolver] Mapping found: ${rel.tempId} -> ${mapping.realId} for field ${rel.fieldPath}`);
      setDeepValue(updatedPayload, rel.fieldPath, mapping.realId);
    } else {
      console.warn(`[Sync Resolver] No mapping found for tempId: ${rel.tempId}`);
    }
  }

  return updatedPayload;
}

/**
 * Helper to set value in a deep object path (e.g. "samples.0.sampleId")
 */
function setDeepValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
