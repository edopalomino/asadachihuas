"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";

import { MenuExperience } from "@/components/MenuExperience";
import {
  MENU_CONTENT_COLLECTION,
  MENU_CONTENT_DOC,
  sanitizeMenuContentDocument,
} from "@/lib/menu-content";
import {
  MENU_PRODUCT_COLLECTION,
  mergeMenuProducts,
  sanitizeMenuProductDocument,
} from "@/lib/menu-products";
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
  const [remoteProducts, setRemoteProducts] = useState<MenuProduct[]>([]);
  const [priceSyncError, setPriceSyncError] = useState<string | null>(null);
  const [liveBusinessConfig, setLiveBusinessConfig] =
    useState<BusinessConfig>(businessConfig);
  const [liveServiceHighlights, setLiveServiceHighlights] =
    useState<string[]>(serviceHighlights);
  const [contentSyncError, setContentSyncError] = useState<string | null>(null);
  const [productSyncError, setProductSyncError] = useState<string | null>(null);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, MENU_PRODUCT_COLLECTION),
      (snapshot) => {
        const nextProducts = snapshot.docs
          .map((documentSnapshot) =>
            sanitizeMenuProductDocument(documentSnapshot.id, documentSnapshot.data()),
          )
          .filter((product): product is MenuProduct => product !== null);

        setRemoteProducts(nextProducts);
        setProductSyncError(null);
      },
      () => {
        setRemoteProducts([]);
        setProductSyncError("No se pudieron sincronizar los productos personalizados.");
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, MENU_CONTENT_COLLECTION, MENU_CONTENT_DOC),
      (snapshot) => {
        if (!snapshot.exists()) {
          setLiveBusinessConfig(businessConfig);
          setLiveServiceHighlights(serviceHighlights);
          setContentSyncError(null);
          return;
        }

        const nextContent = sanitizeMenuContentDocument(
          snapshot.data(),
          businessConfig,
          serviceHighlights,
        );

        setLiveBusinessConfig(nextContent.businessConfig);
        setLiveServiceHighlights(nextContent.serviceHighlights);
        setContentSyncError(null);
      },
      () => {
        setLiveBusinessConfig(businessConfig);
        setLiveServiceHighlights(serviceHighlights);
        setContentSyncError("No se pudieron sincronizar los datos del negocio.");
      },
    );

    return () => unsubscribe();
  }, [businessConfig, serviceHighlights]);

  const mergedMenuProducts = useMemo(
    () => mergeMenuProducts([...featuredProducts, ...extraProducts], remoteProducts),
    [extraProducts, featuredProducts, remoteProducts],
  );

  const liveMenuProducts = useMemo(
    () => applyMenuPriceOverrides(mergedMenuProducts, priceOverrides),
    [mergedMenuProducts, priceOverrides],
  );

  const liveFeaturedProducts = useMemo(
    () => liveMenuProducts.filter((product) => product.category === "featured"),
    [liveMenuProducts],
  );

  const liveExtraProducts = useMemo(
    () => liveMenuProducts.filter((product) => product.category === "extra"),
    [liveMenuProducts],
  );

  const syncMessages = [priceSyncError, contentSyncError, productSyncError].filter(
    (message): message is string => Boolean(message),
  );

  return (
    <>
      {syncMessages.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {syncMessages.join(" ")} Se muestran los datos base del menú.
        </div>
      ) : null}

      <MenuExperience
        featuredProducts={liveFeaturedProducts}
        extraProducts={liveExtraProducts}
        menuProducts={liveMenuProducts}
        businessConfig={liveBusinessConfig}
        serviceHighlights={liveServiceHighlights}
      />
    </>
  );
}