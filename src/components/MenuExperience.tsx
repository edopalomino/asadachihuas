'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import { CartSummary } from "@/components/CartSummary";
import { ExtraItemRow } from "@/components/ExtraItemRow";
import { ProductCard } from "@/components/ProductCard";
import { StickyOrderBar } from "@/components/StickyOrderBar";
import { buildWhatsAppOrder, formatCurrency } from "@/lib/whatsapp";
import type { BusinessConfig, CartLineItem, MenuProduct } from "@/types/menu";

type MenuExperienceProps = {
  featuredProducts: MenuProduct[];
  extraProducts: MenuProduct[];
  menuProducts: MenuProduct[];
  businessConfig: BusinessConfig;
  serviceHighlights: string[];
};

type QuantityState = Record<string, number>;
type SelectionState = Record<string, string>;

const STORAGE_KEY = "steakshop-cart-v1";
const CART_KEY_SEPARATOR = "::";

function clampQuantity(value: number) {
  return Math.max(0, Math.min(99, value));
}

function buildCartKey(productId: string, optionId?: string) {
  if (!optionId) {
    return productId;
  }

  return `${productId}${CART_KEY_SEPARATOR}${optionId}`;
}

function parseCartKey(cartKey: string) {
  const [productId, optionId] = cartKey.split(CART_KEY_SEPARATOR);

  return {
    productId,
    optionId,
  };
}

function getDefaultOptionId(product: MenuProduct) {
  return product.options?.[0]?.id;
}

function buildDefaultSelections(products: MenuProduct[]) {
  return Object.fromEntries(
    products
      .filter((product) => Boolean(getDefaultOptionId(product)))
      .map((product) => [product.id, getDefaultOptionId(product)!]),
  ) as SelectionState;
}

function sanitizeStoredCart(value: unknown, products: MenuProduct[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const nextCart: QuantityState = {};

  for (const [cartKey, rawQuantity] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (typeof rawQuantity !== "number" || !Number.isFinite(rawQuantity)) {
      continue;
    }

    const quantity = clampQuantity(Math.round(rawQuantity));

    if (quantity < 1) {
      continue;
    }

    const { productId, optionId } = parseCartKey(cartKey);
    const product = productMap.get(productId);

    if (!product) {
      continue;
    }

    let normalizedCartKey = cartKey;

    if (product.options?.length) {
      const normalizedOptionId = product.options.some(
        (option) => option.id === optionId,
      )
        ? optionId
        : getDefaultOptionId(product);

      if (!normalizedOptionId) {
        continue;
      }

      normalizedCartKey = buildCartKey(product.id, normalizedOptionId);
    }

    nextCart[normalizedCartKey] = clampQuantity(
      (nextCart[normalizedCartKey] ?? 0) + quantity,
    );
  }

  return nextCart;
}

function deriveSelectionsFromCart(cart: QuantityState, products: MenuProduct[]) {
  const nextSelections = buildDefaultSelections(products);

  for (const cartKey of Object.keys(cart)) {
    const { productId, optionId } = parseCartKey(cartKey);

    if (!optionId) {
      continue;
    }

    nextSelections[productId] = optionId;
  }

  return nextSelections;
}

export function MenuExperience({
  featuredProducts,
  extraProducts,
  menuProducts,
  businessConfig,
  serviceHighlights,
}: MenuExperienceProps) {
  const [cart, setCart] = useState<QuantityState>({});
  const [selectedOptions, setSelectedOptions] = useState<SelectionState>(() =>
    buildDefaultSelections(menuProducts),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [orderBarPulseToken, setOrderBarPulseToken] = useState(0);
  const hasObservedHydratedCart = useRef(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(STORAGE_KEY);

      if (storedCart) {
        const nextCart = sanitizeStoredCart(JSON.parse(storedCart), menuProducts);

        setCart(nextCart);
        setSelectedOptions(deriveSelectionsFromCart(nextCart, menuProducts));
      } else {
        setSelectedOptions(buildDefaultSelections(menuProducts));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      setSelectedOptions(buildDefaultSelections(menuProducts));
    } finally {
      setIsHydrated(true);
    }
  }, [menuProducts]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!lastAddedId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLastAddedId(null);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [lastAddedId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!hasObservedHydratedCart.current) {
      hasObservedHydratedCart.current = true;
      return;
    }

    setOrderBarPulseToken((current) => current + 1);
  }, [cart, isHydrated]);

  const productMap = useMemo(
    () => new Map(menuProducts.map((product) => [product.id, product])),
    [menuProducts],
  );

  const cartItems = useMemo<CartLineItem[]>(() => {
    return Object.entries(cart)
      .map<CartLineItem | null>(([cartKey, quantity]) => {
        const { productId, optionId } = parseCartKey(cartKey);
        const product = productMap.get(productId);

        if (!product || quantity < 1) {
          return null;
        }

        const option = product.options?.find(
          (productOption) => productOption.id === optionId,
        );

        if (product.options?.length && !option) {
          return null;
        }

        return {
          id: cartKey,
          productId: product.id,
          name: product.name,
          ...(option ? { optionLabel: option.label } : {}),
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
        };
      })
      .filter((item): item is CartLineItem => item !== null)
      .sort(
        (left, right) =>
          menuProducts.findIndex((product) => product.id === left.productId) -
          menuProducts.findIndex((product) => product.id === right.productId),
      );
  }, [cart, menuProducts, productMap]);

  const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const { url: whatsappUrl } = buildWhatsAppOrder(businessConfig, cartItems);

  function getSelectedCartKey(product: MenuProduct) {
    return buildCartKey(product.id, selectedOptions[product.id] ?? getDefaultOptionId(product));
  }

  function getProductQuantity(product: MenuProduct) {
    if (!product.options?.length) {
      return cart[product.id] ?? 0;
    }

    return product.options.reduce(
      (sum, option) => sum + (cart[buildCartKey(product.id, option.id)] ?? 0),
      0,
    );
  }

  function changeCartItem(cartKey: string, delta: number) {
    setCart((current) => {
      const currentQuantity = current[cartKey] ?? 0;
      const nextQuantity = clampQuantity(currentQuantity + delta);

      if (nextQuantity === currentQuantity) {
        return current;
      }

      if (nextQuantity <= 0) {
        const { [cartKey]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [cartKey]: nextQuantity,
      };
    });
  }

  function increaseProductQuantity(productId: string) {
    const product = productMap.get(productId);

    if (!product) {
      return;
    }

    changeCartItem(getSelectedCartKey(product), 1);
    setLastAddedId(productId);
  }

  function decreaseProductQuantity(productId: string) {
    const product = productMap.get(productId);

    if (!product) {
      return;
    }

    changeCartItem(getSelectedCartKey(product), -1);
  }

  function increaseCartItem(cartKey: string) {
    changeCartItem(cartKey, 1);
  }

  function decreaseCartItem(cartKey: string) {
    changeCartItem(cartKey, -1);
  }

  function removeCartItem(cartKey: string) {
    setCart((current) => {
      const { [cartKey]: _removed, ...rest } = current;
      return rest;
    });
  }

  function clearCart() {
    setCart({});
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(255,222,188,0.92),rgba(255,246,239,0.95)_45%,rgba(255,255,255,0.98)_100%)] px-5 pb-8 pt-6 shadow-[0_30px_90px_rgba(124,45,18,0.15)] sm:px-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-orange-200/70 blur-3xl" />
        <div className="absolute -left-8 top-24 h-28 w-28 rounded-full bg-rose-200/60 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b71c1c]">
                Menú digital
              </p>
              <h1 className="mt-2 max-w-[11ch] text-5xl font-black uppercase leading-[0.88] text-stone-950 sm:text-6xl">
                {businessConfig.name}
              </h1>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/90 px-4 py-3 text-right shadow-[0_15px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                Abierto
              </p>
              <p className="mt-1 text-sm font-black leading-5 text-stone-950">
                Vie, Sáb y Dom
              </p>
              <p className="text-sm font-semibold text-stone-600">
                12:00 p.m. a 9:00 p.m.
              </p>
            </div>
          </div>

          <p className="max-w-xl text-lg font-semibold leading-8 text-stone-700">
            Carne asada clara, rápida y lista para pedir en WhatsApp en menos de tres toques.
          </p>

          <div className="flex flex-wrap gap-2">
            {serviceHighlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
              >
                {highlight}
              </span>
            ))}
          </div>

          <div className="rounded-[26px] bg-stone-950 p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-200">
              Horario
            </p>
            <p className="mt-2 text-base font-semibold leading-7 text-stone-200">
              {businessConfig.hours}
            </p>
            <p className="mt-2 text-sm font-medium text-stone-400">
              {businessConfig.deliveryNote}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b71c1c]">
              Platillos fuertes
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase text-stone-950">
              Elige tu antojo
            </h2>
          </div>
          {lastAddedId ? (
            <p className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              Agregado al pedido
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-[rise-in_400ms_ease-out_both]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ProductCard
                product={product}
                quantity={cart[getSelectedCartKey(product)] ?? 0}
                totalQuantity={getProductQuantity(product)}
                selectedOptionId={selectedOptions[product.id]}
                onDecrease={() => decreaseProductQuantity(product.id)}
                onIncrease={() => increaseProductQuantity(product.id)}
                onSelectOption={(optionId) => {
                  setSelectedOptions((current) => ({
                    ...current,
                    [product.id]: optionId,
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b71c1c]">
              Complementos
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase text-stone-950">
              Sube el pedido
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {extraProducts.map((product) => (
            <ExtraItemRow
              key={product.id}
              product={product}
              quantity={cart[product.id] ?? 0}
              onDecrease={() => decreaseProductQuantity(product.id)}
              onIncrease={() => increaseProductQuantity(product.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        <CartSummary
          items={cartItems}
          onDecrease={decreaseCartItem}
          onIncrease={increaseCartItem}
          onRemove={removeCartItem}
          onClear={clearCart}
        />

        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b71c1c]">
            Ubicación
          </p>
          <div className="mt-3 flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-xl text-[#c62828]">
              📍
            </div>
            <div>
              <p className="text-xl font-black text-stone-950">Pasa por tu orden</p>
              <p className="mt-1 text-base font-semibold leading-7 text-stone-700">
                {businessConfig.address}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-gradient-to-r from-white via-orange-50 to-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
                Total actual
              </p>
              <p className="mt-2 text-4xl font-black text-stone-950">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="rounded-[22px] bg-stone-950 px-4 py-3 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                Estado
              </p>
              <p className="mt-1 text-base font-black">
                {itemCount > 0 ? "Listo para pedir" : "Sin productos"}
              </p>
            </div>
          </div>

          {!isHydrated ? (
            <p className="mt-3 text-sm font-semibold text-stone-500">
              Recuperando tu pedido guardado...
            </p>
          ) : null}
        </div>
      </section>

      <StickyOrderBar
        total={total}
        itemCount={itemCount}
        whatsappUrl={whatsappUrl}
        disabled={cartItems.length === 0}
        pulseToken={orderBarPulseToken}
      />
    </>
  );
}