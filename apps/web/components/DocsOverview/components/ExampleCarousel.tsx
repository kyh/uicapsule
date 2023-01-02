import { View, Carousel, Image } from "@uicapsule/components";
import Example from "./Example";

const ExampleCarousel = () => (
  <Example
    title="Carousel"
    text="Horizontal scrollable areas used for displaying grouped content"
    href="/content/docs/components/carousel"
  >
    <View width="240px" maxWidth="100%">
      <Carousel visibleItems={3}>
        <Image
          src="/img/examples/architecture-1.webp"
          height="70px"
          borderRadius="medium"
          alt=""
        />
        <Image
          src="/img/examples/architecture-2.webp"
          height="70px"
          borderRadius="medium"
          alt=""
        />
        <Image
          src="/img/examples/architecture-3.webp"
          height="70px"
          borderRadius="medium"
          alt=""
        />
        <Image
          src="/img/examples/architecture-4.webp"
          height="70px"
          borderRadius="medium"
          alt=""
        />
      </Carousel>
    </View>
  </Example>
);

export default ExampleCarousel;
