import { formatCurrency } from "@/lib/whatsapp";
import type { MenuProduct } from "@/types/menu";

type ProductCardProps = {
  product: MenuProduct;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onAdd: () => void;
};

export function ProductCard({
  product,
  quantity,
  onDecrease,
  onIncrease,
  onAdd,
}: ProductCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_55px_rgba(109,27,17,0.09)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />

      <div className="flex items-start justify-between gap-3">
        <div>
          {product.badge ? (
            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-rose-700">
              {product.badge}
            </span>
          ) : null}
          <h3 className="mt-3 text-3xl font-black uppercase leading-none tracking-[0.03em] text-stone-950">
            {product.name}
          </h3>
        </div>

        <div className="rounded-[22px] bg-stone-950 px-4 py-3 text-right text-white shadow-lg">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-300">
            Desde
          </p>
          <p className="text-3xl font-black leading-none">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,rgba(255,237,213,0.9),rgba(255,255,255,0.95))] p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
          Incluye
        </p>
        <ul className="mt-3 grid gap-2">
          {product.description.map((detail) => (
            <li
              key={detail}
              className="flex items-center gap-2 text-sm font-semibold text-stone-700"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                ✓
              </span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-13 items-center rounded-full border border-stone-200 bg-stone-50 px-2 shadow-inner">
          <button
            type="button"
            onClick={onDecrease}
            aria-label={`Quitar una unidad de ${product.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl font-black text-stone-900 transition hover:bg-white"
          >
            −
          </button>
          <span className="min-w-10 text-center text-lg font-black text-stone-950">
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            aria-label={`Agregar una unidad de ${product.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-2xl font-black text-white transition hover:bg-stone-800"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="flex h-13 flex-1 items-center justify-center rounded-full bg-[#c62828] px-5 text-base font-black text-white shadow-[0_16px_32px_rgba(198,40,40,0.28)] transition hover:bg-[#b71c1c]"
        >
          Pedir
        </button>
      </div>
    </article>
  );
}