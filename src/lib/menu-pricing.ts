import type { MenuPriceMap, MenuProduct } from "@/types/menu";

export const MENU_PRICE_COLLECTION = "menuPrices";

export function sanitizePriceValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

export function parsePriceInput(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
}

export function applyMenuPriceOverrides(
  products: MenuProduct[],
  priceOverrides: MenuPriceMap,
) {
  return products.map((product) => {
    const nextPrice = priceOverrides[product.id];

    if (typeof nextPrice !== "number") {
      return product;
    }

    return {
      ...product,
      price: nextPrice,
    };
  });
}

export function buildPriceDrafts(
  products: MenuProduct[],
  priceOverrides: MenuPriceMap,
) {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      String(priceOverrides[product.id] ?? product.price),
    ]),
  ) as Record<string, string>;
}