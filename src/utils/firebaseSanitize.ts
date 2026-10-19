/**
 * Recursively removes any undefined properties from objects and arrays.
 * Firebase Realtime Database set() and update() throw fatal runtime errors if any property is undefined.
 */
export function sanitizeForFirebase<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirebase(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirebase(value);
      }
    }
    return clean as any;
  }
  return data;
}
