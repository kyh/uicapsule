import Link from "next/link";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import { PageSpinner } from "components/Spinner";
import Button from "components/Button";
import BackButton from "components/BackButton";
import IFrame from "components/IFrame";
import { useElement } from "actions/element";
import { useAuth } from "actions/auth";
import { constructSnippet } from "util/playground";
import {
  Title,
  Form,
  FormContent,
  ComponentPreview,
  FormInputContainer,
  FormInputSection,
  Footer,
} from "./UIDetailsEditSection";

const UIDetailsSection = (props) => {
  const auth = useAuth();
  const { data: itemData, status: itemStatus } = useElement(props.id);
  const uid = auth.user ? auth.user.uid : undefined;

  if (props.id && itemStatus !== "success") {
    return (
      <Container maxWidth="md">
        <Form>
          <PageSpinner />
        </Form>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Form as="div">
        <FormContent>
          <ComponentPreview elevation={3}>
            <IFrame srcDoc={constructSnippet(itemData.iSnippet)} />
          </ComponentPreview>
          <FormInputContainer>
            <FormInputSection component="div">
              <Typography variant="h5">{itemData.title}</Typography>
            </FormInputSection>
            <FormInputSection component="div">
              <Typography>{itemData.description}</Typography>
            </FormInputSection>
            <FormInputSection component="div">
              <Typography>{itemData.tags}</Typography>
            </FormInputSection>
          </FormInputContainer>
        </FormContent>
        <Footer>
          <Container>
            <BackButton>Back</BackButton>
            {itemData.owner === uid && (
              <Link href={`/ui/${itemData.id}/edit`} passHref>
                <Button variant="contained" component="a">
                  Edit Component
                </Button>
              </Link>
            )}
          </Container>
        </Footer>
      </Form>
    </Container>
  );
};

export default UIDetailsSection;
