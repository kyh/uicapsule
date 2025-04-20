import React from "react";
import content from "@kyh/content";

type PageProps = {
  params: {
    slug: string;
  };
};

const Page = ({ params }: PageProps) => {
  const { slug } = params;

  const Component = content[slug as keyof typeof content] as unknown as
    | React.ElementType
    | undefined;

  if (!Component) {
    return (
      <div className="grid h-dvh w-dvw place-content-center">
        Component not found for slug: {slug}
      </div>
    );
  }

  return (
    <div className="grid h-dvh w-dvw place-content-center">
      <Component />
    </div>
  );
};

export default Page;
