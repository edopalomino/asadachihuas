import { formatCurrency } from "@/lib/whatsapp";

type StickyOrderBarProps = {
  total: number;
  itemCount: number;
  whatsappUrl: string;
  disabled: boolean;
};

export function StickyOrderBar({
  total,
  itemCount,
  whatsappUrl,
  disabled,
}: StickyOrderBarProps) {
  const content = (
    <>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100/80">
          Total acumulado
        </p>
        <p className="mt-1 text-2xl font-black text-white">
          {formatCurrency(total)}
        </p>
        <p className="text-sm font-semibold text-emerald-100/80">
          {itemCount} producto{itemCount === 1 ? "" : "s"} en tu pedido
        </p>
      </div>

      <div className="flex min-w-[172px] items-center justify-center rounded-full bg-white px-5 py-4 text-center text-base font-black text-emerald-700 shadow-[0_18px_40px_rgba(255,255,255,0.18)]">
        Ordenar por WhatsApp
      </div>
    </>
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[30px] bg-[linear-gradient(135deg,#13833a,#1faa59)] p-3 shadow-[0_24px_80px_rgba(18,99,49,0.42)] ring-1 ring-white/20">
        {disabled ? (
          <div className="pointer-events-auto flex flex-col gap-4 rounded-[24px] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100/80">
                Tu pedido está vacío
              </p>
              <p className="mt-1 text-lg font-black text-white">
                Agrega algo y ordena en un toque.
              </p>
            </div>
            <div className="flex min-w-[172px] items-center justify-center rounded-full bg-white/18 px-5 py-4 text-center text-base font-black text-white/70">
              Ordenar por WhatsApp
            </div>
          </div>
        ) : (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex flex-col gap-4 rounded-[24px] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            {content}
          </a>
        )}
      </div>
    </div>
  );
}