import { formatCurrency } from "@/lib/whatsapp";
import type { CartLineItem } from "@/types/menu";

type CartSummaryProps = {
  items: CartLineItem[];
  onDecrease: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
};

export function CartSummary({
  items,
  onDecrease,
  onIncrease,
  onRemove,
  onClear,
}: CartSummaryProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-[28px] border border-dashed border-stone-300 bg-white/80 p-5 text-stone-600 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
          Tu pedido
        </p>
        <p className="mt-2 text-base font-semibold leading-7">
          Agrega carne, paquetes o extras y tu mensaje de WhatsApp se prepara solo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] bg-stone-950 p-5 text-white shadow-[0_24px_60px_rgba(28,25,23,0.24)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-200">
            Tu pedido
          </p>
          <h2 className="mt-1 text-2xl font-black">Listo para WhatsApp</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/10"
        >
          Vaciar
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[22px] bg-white/8 px-4 py-4 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black leading-tight">{item.name}</p>
                {item.optionLabel ? (
                  <p className="mt-1 text-sm font-semibold text-orange-200">
                    {item.optionLabel}
                  </p>
                ) : null}
                <p className="mt-1 text-sm font-medium text-stone-300">
                  {formatCurrency(item.unitPrice)} c/u
                </p>
              </div>
              <p className="text-lg font-black text-orange-200">
                {formatCurrency(item.totalPrice)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center rounded-full border border-white/12 bg-black/15 px-2 py-1">
                <button
                  type="button"
                  onClick={() => onDecrease(item.id)}
                  aria-label={`Quitar una unidad de ${item.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-black text-white transition hover:bg-white/10"
                >
                  −
                </button>
                <span className="min-w-8 text-center text-base font-black">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrease(item.id)}
                  aria-label={`Agregar una unidad de ${item.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-black text-stone-950 transition hover:bg-orange-100"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="text-sm font-black uppercase tracking-[0.14em] text-rose-200 transition hover:text-white"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}