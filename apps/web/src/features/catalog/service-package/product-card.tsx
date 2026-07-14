import {
  Crown,
  Dumbbell,
  Gift,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Product, ProductStatus, ProductType } from "./service-catalog-data";

const typeStyle: Record<ProductType, { icon: LucideIcon; chip: string }> = {
  Membership: { icon: Crown, chip: "bg-indigo-100 text-indigo-700" },
  "Class Pack": { icon: Layers, chip: "bg-green-100 text-green-700" },
  "Trial Offer": { icon: Sparkles, chip: "bg-amber-100 text-amber-800" },
  Service: { icon: Dumbbell, chip: "bg-blue-100 text-blue-700" },
  Bundle: { icon: Gift, chip: "bg-orange-100 text-orange-700" },
};

const statusTone: Record<ProductStatus, "success" | "warning" | "neutral"> = {
  Active: "success",
  Draft: "warning",
  Archived: "neutral",
};

export function ProductCard({ product }: { product: Product }) {
  const style = typeStyle[product.type];
  const Icon = style.icon;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md",
        product.bestSeller && "border-accent-gold",
      )}
    >
      {product.bestSeller ? (
        <span className="absolute -left-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-accent-gold text-stone-950 shadow">
          <Crown aria-hidden="true" className="size-3.5" />
        </span>
      ) : null}

      <header className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", style.chip)}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-semibold leading-5 text-foreground">{product.name}</p>
            <p className="text-xs text-foreground-muted">{product.type}</p>
          </div>
        </div>
      </header>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {product.price}
        </span>
        <span className="text-xs text-foreground-muted">/ {product.unit}</span>
      </div>

      <p className="mt-2 min-h-9 text-sm leading-5 text-foreground-muted">
        {product.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
        <div>
          <p className="text-base font-semibold text-foreground">{product.soldMtd}</p>
          <p className="text-[11px] text-foreground-muted">Terjual (MTD)</p>
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{product.revenue}</p>
          <p className="text-[11px] text-foreground-muted">Revenue</p>
        </div>
      </div>

      <div className="mt-3">
        <Badge tone={statusTone[product.status]}>{product.status}</Badge>
      </div>
    </article>
  );
}
