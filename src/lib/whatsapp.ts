import type { BusinessConfig, CartLineItem } from "@/types/menu";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function buildWhatsAppOrder(
  config: BusinessConfig,
  items: CartLineItem[],
) {
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const message = [
    "Hola, quiero pedir:",
    "",
    ...items.map(
      (item) =>
        `${item.quantity} x ${item.name}`,
    ),
    "",
    "¿Está disponible?",
  ].join("\n");

  const messageTest = [
    "Hola, quiero pedir:",
    "",
    ...items.map(
      (item) =>
        `${item.quantity} x ${item.name} - ${formatCurrency(item.totalPrice)} (${formatCurrency(item.unitPrice)} c/u)`,
    ),
    "",
    `Total aproximado: ${formatCurrency(total)}`,
    "¿Está disponible?",
  ].join("\n");

  return {
    message,
    total,
    url: `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(message)}`,
  };
}