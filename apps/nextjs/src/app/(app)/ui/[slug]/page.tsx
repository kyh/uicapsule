import { BoxIcon, TruckIcon } from "lucide-react";

import { ComponentItem } from "@/components/component-item";
import {
  getComponentMetadata,
  getComponentSourceCode,
  getPreviewComponent,
  getPreviewSourceCode,
} from "@/lib/files";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;

  const componentMeta = await getComponentMetadata(slug);
  const sourceCode = await getComponentSourceCode(slug);

  const previewCode = await getPreviewSourceCode(slug);
  const PreviewComponent = await getPreviewComponent(slug);

  return (
    <>
      <div className="grid border-b xl:grid-cols-2">
        <div className="border-b xl:border-r xl:border-b-0">
          <div className="sticky top-16 mx-auto w-3/5 py-20 md:py-10 xl:w-2/3">
            <PreviewComponent />
          </div>
        </div>

        <div>
          <div className="p-7 text-base md:p-12">
            <div className="flex flex-col gap-4 leading-loose">
              <h1 className="text-xl font-medium md:text-3xl">
                {componentMeta.name}
              </h1>
              <p className="text-base md:text-2xl">$179</p>
            </div>

            <p className="text-primary mt-3 mb-4 text-lg font-medium">
              In stock
            </p>

            <p className="leading-loose">
              TX–6 is our powerful 6 channel stereo mixer with built-in
              equalizer, filters, compressor, aux send, cue and digital effects.
              this ultra-portable mixer can also be used as a multi-channel
              usb-c audio interface. constructed in anodized aluminum with pu
              leather backing.
            </p>

            <ul className="mt-8 leading-loose">
              <ListItem>3.5 mm mini jack to 6.3 mm jack adapter</ListItem>
              <ListItem>compatible with iOS devices (MFi)</ListItem>
              <ListItem>rechargeable battery</ListItem>
              <ListItem>casing: Aluminum 6063 with PU leather back</ListItem>
              <ListItem>
                multichannel for Mac OS, currently only 2 channels for Windows
              </ListItem>
              <ListItem>built-in table stand</ListItem>
            </ul>

            <button className="bg-primary mt-8 h-16 w-full rounded-full p-3 text-lg leading-none font-medium text-white">
              Buy Now
            </button>
          </div>

          <div className="border-border flex gap-3 border-t p-6">
            <TruckIcon />
            <p>Free 30-day return policy</p>
          </div>

          <div className="border-border flex gap-3 border-t p-6">
            <BoxIcon />
            <p>Free shipping on all orders!</p>
          </div>
        </div>
      </div>
      {/* <div className="bg-border grid gap-px md:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product, key) => (
          <ComponentItem {...product} key={key} />
        ))}
      </div> */}
    </>
  );
};

export default Page;

type ListItemProps = {
  children: React.ReactNode;
};

const ListItem = ({ children }: ListItemProps) => {
  return (
    <li className="flex items-center gap-3">
      <div className="h-1 w-1 rounded-full bg-black" />
      {children}
    </li>
  );
};
