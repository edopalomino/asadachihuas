"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { MenuExperience } from "@/components/MenuExperience";
import {
  applyMenuPriceOverrides,
  MENU_PRICE_COLLECTION,
  sanitizePriceValue,
} from "@/lib/menu-pricing";
import { db } from "@/lib/firebase";
import type { BusinessConfig, MenuPriceMap, MenuProduct } from "@/types/menu";

type LiveMenuExperienceProps = {
  featuredProducts: MenuProduct[];
  extraProducts: MenuProduct[];
  businessConfig: BusinessConfig;
  serviceHighlights: string[];
};

export default function LiveMenuExperience({
  featuredProducts,
  extraProducts,
  businessConfig,
  serviceHighlights,
}: LiveMenuExperienceProps) {
  const [priceOverrides, setPriceOverrides] = useState<MenuPriceMap>({});
  const [priceSyncError, setPriceSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, MENU_PRICE_COLLECTION),
      (snapshot) => {
        const nextOverrides: MenuPriceMap = {};

        snapshot.forEach((documentSnapshot) => {
          const nextPrice = sanitizePriceValue(documentSnapshot.data().price);

          if (nextPrice === null) {
            return;
          }

          nextOverrides[documentSnapshot.id] = nextPrice;
        });

        setPriceOverrides(nextOverrides);
        setPriceSyncError(null);
      },
      () => {
        setPriceSyncError("No se pudieron sincronizar los precios en vivo.");
      },
    );

    return () => unsubscribe();
  }, []);

  const liveFeaturedProducts = useMemo(
    () => applyMenuPriceOverrides(featuredProducts, priceOverrides),
    [featuredProducts, priceOverrides],
  );

  const liveExtraProducts = useMemo(
    () => applyMenuPriceOverrides(extraProducts, priceOverrides),
    [extraProducts, priceOverrides],
  );

  const liveMenuProducts = useMemo(
    () => [...liveFeaturedProducts, ...liveExtraProducts],
    [liveExtraProducts, liveFeaturedProducts],
  );

  return (
    <>
      {priceSyncError ? (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {priceSyncError} Se muestran los precios base del menú.
        </div>
      ) : null}

      <MenuExperience
        featuredProducts={liveFeaturedProducts}
        extraProducts={liveExtraProducts}
        menuProducts={liveMenuProducts}
        businessConfig={businessConfig}
        serviceHighlights={serviceHighlights}
      />
    </>
  );
}