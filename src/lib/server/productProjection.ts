/**
 * Public (storefront) product shape. Paid-download links (`downloadUrl`) and
 * private repo bindings (`repoUrl`) are deliberately excluded — they are only
 * returned to admins or to a customer whose license grants access.
 */
const PUBLIC_PRODUCT_KEYS = [
  "id",
  "name",
  "description",
  "longDescription",
  "descriptionType",
  "price",
  "imageUrl",
  "images",
  "features",
  "category",
  "demoUrl",
  "version",
  "documentationUrl",
  "purchases",
  "createdAt",
  "status",
  "github",
] as const;

export function toPublicProduct<T extends Record<string, unknown>>(product: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_PRODUCT_KEYS) {
    if (product[key] !== undefined) out[key] = product[key];
  }
  return out;
}
