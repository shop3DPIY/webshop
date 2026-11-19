import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { productText, type Product } from "@/types/product";
import { COLLECTION_CLASSNAMES } from "@/lib/config/colors";
import { Badge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/pricing/calculate";
import { ColorSetupBadge } from "./ColorSetupBadge";

/** What the download is, for the card label: "STL/3MF", "Pattern", … */
function fileKind(product: Product): "pattern" | string | null {
  if (product.productKind === "pattern") return "pattern";
  const formats = [...new Set(product.downloadFiles.map((f) => f.format))].filter(
    (f) => f === "STL" || f === "3MF",
  );
  return formats.length > 0 ? formats.join("/") : (product.bundleProductIds?.length ? null : "STL/3MF");
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  /** The first card in view loads its photo first */
  priority?: boolean;
}) {
  const tCollections = useTranslations("collections.items");
  const tProductCard = useTranslations("productCard");
  const classes = COLLECTION_CLASSNAMES[product.category];
  const cover = product.images[0];
  const text = productText(product, useLocale());
  const kind = fileKind(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group flex flex-col overflow-hidden rounded-3xl glass transition-colors ${classes.border} ${classes.wash} ${classes.washHover}`}
    >
      <div
        className={`relative aspect-square border-b ${classes.border} ${classes.wash}`}
      >
        {cover && (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
          />
        )}
        <Badge className="bg-white/90 text-night border-white absolute top-3 left-3 gap-1.5 border">
          <span className={`h-2 w-2 rounded-full ${classes.bg}`} aria-hidden />
          {tCollections(`${product.category}.name`)}
        </Badge>
        {product.isFree ? (
          <Badge className="absolute top-3 right-3 bg-white/90 text-night border border-white">
            {tProductCard("free")}
          </Badge>
        ) : (
          (product.bundleProductIds?.length ?? 0) > 0 && (
            <Badge className="absolute top-3 right-3 bg-white/90 text-night border border-white">
              {tProductCard("bundle", { count: product.bundleProductIds!.length })}
            </Badge>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-ink text-base font-semibold">
          {text.title}
        </h3>
        <p className="text-ink mt-1 line-clamp-2 text-sm">
          {text.description}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {kind && (
            <span className="border-line rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              {kind === "pattern" ? tProductCard("pattern") : kind}
            </span>
          )}
          {product.printSettings?.colorSetup && (
            <ColorSetupBadge setup={product.printSettings.colorSetup} />
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-display text-ink text-lg font-bold">
            {product.isFree
              ? tProductCard("free")
              : product.priceCents != null
                ? formatEuro(product.priceCents)
                : ""}
          </p>
          <span
            aria-hidden
            className="border-line group-hover:bg-brand-purple/45 flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
