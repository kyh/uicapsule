import { Loader } from "@uicapsule/components";
import Example from "./Example";

const ExampleLoader = () => (
  <Example
    title="Loader"
    text="Animated element that communicates progress without telling how long the process will take"
    href="/content/docs/components/loader"
  >
    <Loader size="medium" />
  </Example>
);

export default ExampleLoader;
