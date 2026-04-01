export type ProductCategory = "featured" | "extra";

export type MenuProduct = {
  id: string;
  name: string;
  description: string[];
  price: number;
  category: ProductCategory;
  badge?: string;
  imageLabel?: string;
};

export type BusinessConfig = {
  name: string;
  whatsappPhone: string;
  address: string;
  hours: string;
  deliveryNote: string;
};

export type MenuContent = {
  businessConfig: BusinessConfig;
  serviceHighlights: string[];
};

export type CartLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type MenuPriceMap = Record<string, number>;