import { formatCurrency } from "@/lib/whatsapp";
import type { MenuProduct } from "@/types/menu";

type ExtraItemRowProps = {
  product: MenuProduct;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onAdd: () => void;
};

export function ExtraItemRow({
  product,
  quantity,
  onDecrease,
  onIncrease,
  onAdd,
}: ExtraItemRowProps) {
  return (
    <article className="rounded-[24px] border border-stone-200 bg-white px-4 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)]">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-stone-950">{product.name}</h3>
          <p className="text-xl font-black text-[#c62828]">
            {formatCurrency(product.price)}
          </p>
        </div>
        <p className="mt-1 text-sm font-medium text-stone-600">
          {product.description.join(" • ")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          aria-label={`Quitar una unidad de ${product.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-xl font-black text-stone-900"
        >
          −
        </button>
        <span className="min-w-6 text-center text-base font-black text-stone-950">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          aria-label={`Agregar una unidad de ${product.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-950 bg-stone-950 text-xl font-black text-white"
        >
          +
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="ml-1 rounded-full bg-[#c62828] px-4 py-3 text-sm font-black text-white"
        >
          Pedir
        </button>
      </div>
    </article>
  );
}