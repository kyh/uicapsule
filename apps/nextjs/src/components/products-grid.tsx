import Image from "next/image";
import Link from "next/link";
import { cn } from "@kyh/ui/utils";
import { ArrowRight } from "lucide-react";

import { productsGridData } from "./products-grid-data";

export type Product = {
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: boolean;
  category: Category;
};

type Category = {
  name: string;
};

export const ProductItem = ({ slug, name, price, image, stock }: Product) => {
  return (
    <Link
      className="group bg-background flex flex-col justify-between p-6 text-lg"
      href={`/ui/${slug}`}
    >
      <div className="flex justify-between">
        <p className={stock ? "text-primary" : "text-[#5f8ea9]"}>
          {stock ? "In Stock" : "Out of Stock"}
        </p>
        <p>${price}</p>
      </div>
      <div className="relative aspect-square h-1/2 w-full overflow-hidden duration-500 ease-out group-hover:scale-110">
        <Image src={image} fill alt="" className="object-contain" />
      </div>
      <div className="flex justify-between">
        <p className="group-hover:underline">{name}</p>
        <ArrowRight
          size={24}
          className="-translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </div>
    </Link>
  );
};

export const ProductsGrid = ({ products = productsGridData }) => {
  return (
    <>
      <div
        className={cn(
          // Common
          "bg-border grid gap-px md:grid-cols-2 lg:h-auto lg:grid-cols-10 lg:grid-rows-2 lg:*:col-span-2",
          // First child
          "md:[&>*:first-child]:col-span-2 md:[&>*:first-child]:h-auto lg:[&>*:first-child]:col-span-4 lg:[&>*:first-child]:row-span-2 lg:[&>*:first-child]:h-auto",
        )}
      >
        {products.slice(0, 7).map((product, key) => (
          <ProductItem {...product} key={key} />
        ))}
      </div>
      <div className="bg-border grid gap-px border-t md:grid-cols-2 lg:grid-cols-3 lg:*:h-auto">
        {products.slice(7).map((product, key) => (
          <ProductItem {...product} key={key} />
        ))}
      </div>
    </>
  );
};

export const RelatedProducts = ({ products = productsGridData }) => {
  return (
    <div className="bg-border grid gap-px md:grid-cols-2 2xl:grid-cols-4 2xl:*:h-96">
      {products.slice(0, 4).map((product, key) => (
        <ProductItem {...product} key={key} />
      ))}
    </div>
  );
};
