import type { MenuProduct, MenuProductOption, ProductCategory } from "@/types/menu";

export const MENU_PRODUCT_COLLECTION = "menuProducts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizePriceValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function sanitizeCategory(value: unknown): ProductCategory | null {
  return value === "featured" || value === "extra" ? value : null;
}

function sanitizeDescriptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function sanitizeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const seenIds = new Set<string>();
  const options = value
    .map((item, index) => {
      const option = isRecord(item) ? item : null;

      if (!option) {
        return null;
      }

      const label = sanitizeString(option.label);
      const fallbackId = `option-${index + 1}`;
      const id = sanitizeString(option.id) || fallbackId;

      if (!label || seenIds.has(id)) {
        return null;
      }

      seenIds.add(id);

      return {
        id,
        label,
      } satisfies MenuProductOption;
    })
    .filter((item): item is MenuProductOption => item !== null);

  return options.length > 0 ? options : undefined;
}

export function sanitizeMenuProductDocument(
  documentId: string,
  value: unknown,
): MenuProduct | null {
  const data = isRecord(value) ? value : {};
  const id = sanitizeString(data.id) || documentId;
  const name = sanitizeString(data.name);
  const description = sanitizeDescriptions(data.description);
  const category = sanitizeCategory(data.category);
  const price = sanitizePriceValue(data.price);

  if (!id || !name || description.length === 0 || !category || price === null) {
    return null;
  }

  const badge = sanitizeString(data.badge);
  const imageLabel = sanitizeString(data.imageLabel);
  const options = sanitizeOptions(data.options);

  return {
    id,
    name,
    description,
    price,
    category,
    ...(options ? { options } : {}),
    ...(badge ? { badge } : {}),
    ...(imageLabel ? { imageLabel } : {}),
  };
}

export function mergeMenuProducts(
  baseProducts: MenuProduct[],
  remoteProducts: MenuProduct[],
) {
  const seenIds = new Set(baseProducts.map((product) => product.id));
  const nextProducts = [...baseProducts];

  for (const product of remoteProducts) {
    if (seenIds.has(product.id)) {
      continue;
    }

    seenIds.add(product.id);
    nextProducts.push(product);
  }

  return nextProducts;
}

export function parseProductDescriptionInput(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseProductOptionsInput(value: string) {
  const seenIds = new Set<string>();

  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((label, index) => {
      const slug = slugifySegment(label) || `option-${index + 1}`;
      const id = seenIds.has(slug) ? `${slug}-${index + 1}` : slug;

      seenIds.add(id);

      return {
        id,
        label,
      } satisfies MenuProductOption;
    });
}