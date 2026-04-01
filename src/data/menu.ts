import type { BusinessConfig, MenuProduct } from "@/types/menu";

export const businessConfig: BusinessConfig = {
  name: "Asada Chihuas",
  whatsappPhone: "5216141234567",
  address: "Calle Falsa 123, Colonia Centro, Chihuahua, México",
  hours: "Viernes, Sábado y Domingo de 12:00 p.m. a 9:00 p.m.",
  deliveryNote: "Pide rápido por WhatsApp y confirma disponibilidad al momento.",
};

export const featuredProducts: MenuProduct[] = [
  {
    id: "platillo-individual",
    name: "Platillo Individual",
    description: [
      "1 pieza de chuleta o costilla",
      "Salchicha",
      "Chiles y cebollitas asadas",
      "Tortillas",
    ],
    price: 110,
    category: "featured",
    badge: "Más pedido",
    imageLabel: "Plato individual al carbón",
  },
  {
    id: "paquete-aguja",
    name: "Paquete Aguja",
    description: [
      "1 kg de aguja",
      "Salchicha",
      "Chiles y cebollitas asadas",
      "Tortillas",
    ],
    price: 330,
    category: "featured",
    badge: "Para compartir",
    imageLabel: "Paquete de aguja para familia",
  },
  {
    id: "paquete-costilla",
    name: "Paquete Costilla",
    description: [
      "1 kg de costilla",
      "Salchicha",
      "Chiles y cebollitas asadas",
      "Tortillas",
    ],
    price: 295,
    category: "featured",
    badge: "Rinde más",
    imageLabel: "Costilla asada lista para servir",
  },
  {
    id: "chamorro-vapor",
    name: "Chamorro al vapor",
    description: ["Tortillas", "Salsa", "Cebollita", "Limón"],
    price: 130,
    category: "featured",
    badge: "Sabor casero",
    imageLabel: "Chamorro jugoso con tortillas",
  },
];

export const extraProducts: MenuProduct[] = [
  {
    id: "extra-salchichas",
    name: "Salchichas",
    description: ["Porción extra", "Listas para asar"],
    price: 35,
    category: "extra",
  },
  {
    id: "extra-tuetano",
    name: "Tuétano",
    description: ["Pieza individual", "Ideal para compartir"],
    price: 45,
    category: "extra",
  },
  {
    id: "extra-chiles-toreados",
    name: "Chiles toreados",
    description: ["Porción extra", "Bien doraditos"],
    price: 25,
    category: "extra",
  },
  {
    id: "extra-cebollitas",
    name: "Cebollitas",
    description: ["Porción extra", "Asadas al momento"],
    price: 25,
    category: "extra",
  },
  {
    id: "extra-quesadillas",
    name: "Quesadillas",
    description: ["Orden extra", "Dobladas en comal"],
    price: 30,
    category: "extra",
  },
];

export const menuProducts: MenuProduct[] = [
  ...featuredProducts,
  ...extraProducts,
];

export const serviceHighlights = [
  "Pedido rápido",
  "Precios claros",
  "Pago al recoger",
];