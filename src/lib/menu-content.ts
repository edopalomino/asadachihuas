import type { BusinessConfig, MenuContent } from "@/types/menu";

export const MENU_CONTENT_COLLECTION = "siteContent";
export const MENU_CONTENT_DOC = "menu";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeRequiredString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : fallback;
}

export function sanitizeBusinessConfigValue(
  value: unknown,
  fallback: BusinessConfig,
): BusinessConfig {
  const data = isRecord(value) ? value : {};

  return {
    name: sanitizeRequiredString(data.name, fallback.name),
    whatsappPhone: sanitizeRequiredString(data.whatsappPhone, fallback.whatsappPhone),
    address: sanitizeRequiredString(data.address, fallback.address),
    hours: sanitizeRequiredString(data.hours, fallback.hours),
    deliveryNote: sanitizeRequiredString(data.deliveryNote, fallback.deliveryNote),
  };
}

export function sanitizeServiceHighlightsValue(
  value: unknown,
  fallback: string[],
) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const highlights = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return highlights.length > 0 ? highlights : fallback;
}

export function sanitizeMenuContentDocument(
  value: unknown,
  fallbackBusinessConfig: BusinessConfig,
  fallbackHighlights: string[],
): MenuContent {
  const data = isRecord(value) ? value : {};

  return {
    businessConfig: sanitizeBusinessConfigValue(data, fallbackBusinessConfig),
    serviceHighlights: sanitizeServiceHighlightsValue(
      data.serviceHighlights,
      fallbackHighlights,
    ),
  };
}

export function normalizeBusinessConfigDraft(
  draft: BusinessConfig,
): BusinessConfig | null {
  const normalizedDraft = {
    name: draft.name.trim(),
    whatsappPhone: draft.whatsappPhone.trim(),
    address: draft.address.trim(),
    hours: draft.hours.trim(),
    deliveryNote: draft.deliveryNote.trim(),
  };

  return Object.values(normalizedDraft).every((value) => value.length > 0)
    ? normalizedDraft
    : null;
}

export function parseServiceHighlightsInput(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}