import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/types/product";
import { COLLECTION_CLASSNAMES } from "@/lib/config/colors";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product }) {
  const tCollections = useTranslations("collections.items");
  const tProductCard = useTranslations("productCard");
  const classes = COLLECTION_CLASSNAMES[product.category];
  const cover = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="border-line bg-paper group flex flex-col overflow-hidden rounded-3xl border transition-shadow hover:shadow-lg"
    >
      <div className={`relative aspect-square ${classes.bgSoft}`}>
        {cover && (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, 50vw"
          />
        )}
        <Badge className="bg-paper/95 text-ink border-line absolute top-3 left-3 gap-1.5 border">
          <span className={`h-2 w-2 rounded-full ${classes.bg}`} aria-hidden />
          {tCollections(`${product.category}.name`)}
        </Badge>
        {product.isFree && (
          <Badge className="absolute top-3 right-3 bg-paper text-ink border border-line">
            {tProductCard("free")}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-brand-purple text-base font-semibold">{product.title}</h3>
        <p className="text-ink/60 mt-1 line-clamp-2 text-sm">{product.description}</p>
      </div>
    </Link>
  );
}
