import { Text, View, Progress, Card } from "@uicapsule/components";
import Example from "./Example";

const ExampleProgress = () => (
  <Example
    title="Progress"
    text="Bar displaying progress for a task that takes a long time or consists of several steps"
    href="/content/docs/components/progress"
  >
    <View width="240px" maxWidth="100%">
      <Card padding={6}>
        <View gap={2}>
          <Text align="center">Loading...</Text>
          <Progress value={50} />
        </View>
      </Card>
    </View>
  </Example>
);

export default ExampleProgress;
