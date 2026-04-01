"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import {
  businessConfig as defaultBusinessConfig,
  menuProducts,
  serviceHighlights as defaultServiceHighlights,
} from "@/data/menu";
import { app, db } from "@/lib/firebase";
import {
  MENU_CONTENT_COLLECTION,
  MENU_CONTENT_DOC,
  normalizeBusinessConfigDraft,
  parseServiceHighlightsInput,
  sanitizeMenuContentDocument,
} from "@/lib/menu-content";
import {
  buildPriceDrafts,
  MENU_PRICE_COLLECTION,
  parsePriceInput,
  sanitizePriceValue,
} from "@/lib/menu-pricing";
import { formatCurrency } from "@/lib/whatsapp";
import type { MenuPriceMap } from "@/types/menu";

const auth = getAuth(app);

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [businessDraft, setBusinessDraft] = useState(() => defaultBusinessConfig);
  const [serviceHighlightsDraft, setServiceHighlightsDraft] = useState(
    () => defaultServiceHighlights.join("\n"),
  );
  const [hasBusinessOverride, setHasBusinessOverride] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [businessBusy, setBusinessBusy] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>(() =>
    buildPriceDrafts(menuProducts, {}),
  );
  const [remotePrices, setRemotePrices] = useState<MenuPriceMap>({});
  const [overrideIds, setOverrideIds] = useState<string[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSuccess(`Autenticado como ${currentUser.email}`);
      } else {
        setSuccess(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRemotePrices({});
      setOverrideIds([]);
      setPriceDrafts(buildPriceDrafts(menuProducts, {}));
      setPricesLoading(false);
      return;
    }

    setPricesLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, MENU_PRICE_COLLECTION),
      (snapshot) => {
        const nextRemotePrices: MenuPriceMap = {};
        const nextOverrideIds: string[] = [];

        snapshot.forEach((documentSnapshot) => {
          const nextPrice = sanitizePriceValue(documentSnapshot.data().price);

          if (nextPrice === null) {
            return;
          }

          nextRemotePrices[documentSnapshot.id] = nextPrice;
          nextOverrideIds.push(documentSnapshot.id);
        });

        setRemotePrices(nextRemotePrices);
        setOverrideIds(nextOverrideIds);
        setPriceDrafts(buildPriceDrafts(menuProducts, nextRemotePrices));
        setPricesLoading(false);
      },
      (snapshotError) => {
        setPricesLoading(false);
        setError(snapshotError.message || "No se pudieron cargar los precios de Firestore");
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBusinessDraft(defaultBusinessConfig);
      setServiceHighlightsDraft(defaultServiceHighlights.join("\n"));
      setHasBusinessOverride(false);
      setContentLoading(false);
      return;
    }

    setContentLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, MENU_CONTENT_COLLECTION, MENU_CONTENT_DOC),
      (snapshot) => {
        if (!snapshot.exists()) {
          setBusinessDraft(defaultBusinessConfig);
          setServiceHighlightsDraft(defaultServiceHighlights.join("\n"));
          setHasBusinessOverride(false);
          setContentLoading(false);
          return;
        }

        const nextContent = sanitizeMenuContentDocument(
          snapshot.data(),
          defaultBusinessConfig,
          defaultServiceHighlights,
        );

        setBusinessDraft(nextContent.businessConfig);
        setServiceHighlightsDraft(nextContent.serviceHighlights.join("\n"));
        setHasBusinessOverride(true);
        setContentLoading(false);
      },
      (snapshotError) => {
        setContentLoading(false);
        setError(
          snapshotError.message ||
            "No se pudo cargar la información del negocio desde Firestore",
        );
      },
    );

    return () => unsubscribe();
  }, [user]);

  const productRows = useMemo(
    () =>
      menuProducts.map((product) => ({
        ...product,
        livePrice: remotePrices[product.id] ?? product.price,
        hasOverride: overrideIds.includes(product.id),
      })),
    [overrideIds, remotePrices],
  );

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setUser(credential.user);
      setSuccess(`Ingreso exitoso como ${credential.user.email}`);
      setEmail("");
      setPassword("");
    } catch (err) {
      const message = (err as Error).message || "Error al iniciar sesión";
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function onLogout() {
    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await signOut(auth);
      setUser(null);
      setSuccess("Sesión cerrada correctamente");
    } catch (err) {
      const message = (err as Error).message || "Error al cerrar sesión";
      setError(message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveBusinessContent() {
    if (!user) {
      setError("Inicia sesión para guardar cambios.");
      return;
    }

    const normalizedBusinessConfig = normalizeBusinessConfigDraft(businessDraft);
    const nextServiceHighlights = parseServiceHighlightsInput(serviceHighlightsDraft);

    if (!normalizedBusinessConfig) {
      setError("Completa nombre, WhatsApp, dirección, horario y nota de servicio.");
      setSuccess(null);
      return;
    }

    if (nextServiceHighlights.length === 0) {
      setError("Agrega al menos un highlight de servicio.");
      setSuccess(null);
      return;
    }

    setBusinessBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await setDoc(
        doc(db, MENU_CONTENT_COLLECTION, MENU_CONTENT_DOC),
        {
          ...normalizedBusinessConfig,
          serviceHighlights: nextServiceHighlights,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true },
      );

      setSuccess("Información del negocio actualizada.");
    } catch (err) {
      const message =
        (err as Error).message || "No se pudo guardar la información del negocio";
      setError(message);
    } finally {
      setBusinessBusy(false);
    }
  }

  async function resetBusinessContent() {
    if (!user) {
      setError("Inicia sesión para restaurar cambios.");
      return;
    }

    setBusinessBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteDoc(doc(db, MENU_CONTENT_COLLECTION, MENU_CONTENT_DOC));
      setSuccess("Se restauró la información base del negocio.");
    } catch (err) {
      const message =
        (err as Error).message || "No se pudo restaurar la información del negocio";
      setError(message);
    } finally {
      setBusinessBusy(false);
    }
  }

  async function savePrice(productId: string, productName: string) {
    if (!user) {
      setError("Inicia sesión para guardar cambios.");
      return;
    }

    const parsedPrice = parsePriceInput(priceDrafts[productId] ?? "");

    if (parsedPrice === null) {
      setError("Captura un precio válido en pesos.");
      setSuccess(null);
      return;
    }

    setActiveProductId(productId);
    setError(null);
    setSuccess(null);

    try {
      await setDoc(
        doc(db, MENU_PRICE_COLLECTION, productId),
        {
          price: parsedPrice,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true },
      );

      setSuccess(`Precio actualizado para ${productName}.`);
    } catch (err) {
      const message = (err as Error).message || "No se pudo guardar el precio";
      setError(message);
    } finally {
      setActiveProductId(null);
    }
  }

  async function resetPrice(productId: string, productName: string) {
    if (!user) {
      setError("Inicia sesión para restaurar precios.");
      return;
    }

    setActiveProductId(productId);
    setError(null);
    setSuccess(null);

    try {
      await deleteDoc(doc(db, MENU_PRICE_COLLECTION, productId));
      setSuccess(`Precio base restaurado para ${productName}.`);
    } catch (err) {
      const message = (err as Error).message || "No se pudo restaurar el precio base";
      setError(message);
    } finally {
      setActiveProductId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-6 shadow-md sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Admin Login</h1>
        <p className="mb-4 text-sm text-slate-600">
          Edita precios y datos del negocio en Firestore sin tocar el menú base.
        </p>

        {error && <div className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-700">{success}</div>}

        {user ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Datos del negocio</p>
                  <p className="text-slate-600">
                    Documento en Firestore: {MENU_CONTENT_COLLECTION}/{MENU_CONTENT_DOC}
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {contentLoading
                    ? "Sincronizando"
                    : hasBusinessOverride
                      ? "Override activo"
                      : "Usando base local"}
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nombre del negocio
                  </span>
                  <input
                    type="text"
                    value={businessDraft.name}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    WhatsApp
                  </span>
                  <input
                    type="text"
                    value={businessDraft.whatsappPhone}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        whatsappPhone: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Dirección
                  </span>
                  <input
                    type="text"
                    value={businessDraft.address}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Horario
                  </span>
                  <input
                    type="text"
                    value={businessDraft.hours}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        hours: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Nota de servicio
                  </span>
                  <textarea
                    rows={3}
                    value={businessDraft.deliveryNote}
                    onChange={(event) =>
                      setBusinessDraft((current) => ({
                        ...current,
                        deliveryNote: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Highlights de servicio
                  </span>
                  <textarea
                    rows={4}
                    value={serviceHighlightsDraft}
                    onChange={(event) => setServiceHighlightsDraft(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Escribe un highlight por línea.
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={businessBusy}
                  onClick={saveBusinessContent}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {businessBusy ? "Guardando..." : "Guardar negocio"}
                </button>

                <button
                  type="button"
                  disabled={businessBusy || !hasBusinessOverride}
                  onClick={resetBusinessContent}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Restaurar negocio
                </button>
              </div>
            </section>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">
                Usuario activo: <strong>{user.email}</strong>
              </p>
              <button
                disabled={authLoading}
                onClick={onLogout}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {authLoading ? "Cerrando sesión..." : "Cerrar sesión"}
              </button>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Precios en vivo</p>
                  <p className="text-slate-600">
                    Cada documento en Firestore usa el id del producto como llave en la colección {MENU_PRICE_COLLECTION}.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {pricesLoading ? "Sincronizando" : `${productRows.length} productos`}
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                {productRows.map((product) => (
                  <article
                    key={product.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_130px_120px_120px] md:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {product.category}
                        </span>
                        {product.hasOverride ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            Override activo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Base: {formatCurrency(product.price)} · En vivo: {formatCurrency(product.livePrice)}
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Nuevo precio
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={priceDrafts[product.id] ?? ""}
                        onChange={(event) =>
                          setPriceDrafts((current) => ({
                            ...current,
                            [product.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-400 focus:ring-slate-200"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={activeProductId === product.id}
                      onClick={() => savePrice(product.id, product.name)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {activeProductId === product.id ? "Guardando..." : "Guardar"}
                    </button>

                    <button
                      type="button"
                      disabled={activeProductId === product.id || !product.hasOverride}
                      onClick={() => resetPrice(product.id, product.name)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      Restaurar
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded border p-2 text-slate-800 outline-none ring-2 ring-transparent transition focus:ring-indigo-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded border p-2 text-slate-800 outline-none ring-2 ring-transparent transition focus:ring-indigo-300"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {authLoading ? "Autenticando..." : "Iniciar sesión"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
