import React, { useState } from "react";
import styled, { css } from "styled-components";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import Alert from "@material-ui/lab/Alert";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Spinner from "components/Spinner";
import UIEditorModal from "components/UIEditorModal";
import Button from "components/Button";
import { useAuth } from "util/auth.js";
import { useItem, updateItem, createItem } from "util/db.js";

const Title = styled(Typography)`
  ${({ theme }) => css`
    position: absolute;
    top: 20px;
    z-index: ${theme.zIndex.drawer + 2};
    left: 50%;
    transform: translateX(-50%);
  `}
`;

const Form = styled.form`
  ${({ theme }) => css`
    margin-top: ${theme.spacing(4)}px;
  `}
`;

const FormContent = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ComponentPreview = styled(Card)`
  ${({ theme }) => css`
    position: relative;
    width: 60%;
    margin-right: ${theme.spacing(4)}px;
    height: 70vh;

    iframe {
      width: 100%;
      height: 100%;
    }
  `}
`;

const EditCodeButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const FormInputContainer = styled.div`
  ${({ theme }) => css`
    width: 40%;
  `}
`;

const FormInputSection = styled(FormControl)`
  ${({ theme }) => css`
    display: block;
    margin-bottom: ${theme.spacing(2)}px;
  `}
`;

const PublishFooter = styled.footer`
  ${({ theme }) => css`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: ${theme.spacing(1)}px;
    background: ${theme.palette.background.default};
    border-top: 1px solid ${theme.palette.divider};

    .MuiContainer-root {
      display: flex;
      justify-content: space-between;
    }
  `}
`;

function UIDetailsSection(props) {
  const [pending, setPending] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { data: itemData, status: itemStatus } = useItem(props.id);
  const { register, handleSubmit, errors, setValue, getValues } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    setPending(true);

    const query = props.id
      ? updateItem(props.id, data)
      : createItem({ owner: auth.user.uid, ...data });

    query
      .then(() => router.push("/ui"))
      .catch((error) => {
        // Hide pending indicator
        setPending(false);
        // Show error alert message
        setFormAlert({
          type: "error",
          message: error.message,
        });
      });
  };

  if (props.id && itemStatus !== "success") {
    return (
      <Box py={5} px={3} align="center">
        <Spinner size={32} />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Title variant="h5">
        {props.id ? "Update Component" : "Save new Component"}
      </Title>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {formAlert && (
          <Box mb={4}>
            <Alert severity={formAlert.type}>{formAlert.message}</Alert>
          </Box>
        )}
        <FormContent>
          <ComponentPreview elevation={3}>
            <EditCodeButton onClick={() => setEditorOpen(true)}>
              Edit Code
            </EditCodeButton>
            <iframe srcDoc={getValues("html")} frameBorder="0" />
          </ComponentPreview>
          <FormInputContainer>
            <textarea
              style={{ display: "none" }}
              name="html"
              defaultValue={itemData ? itemData.html : ""}
              ref={register}
            />
            <FormInputSection component="fieldset">
              <TextField
                variant="outlined"
                type="text"
                label="Title"
                name="title"
                defaultValue={itemData && itemData.title}
                error={errors.title ? true : false}
                helperText={errors.title && errors.title.message}
                fullWidth
                autoFocus
                inputRef={register({
                  required: "Please enter a title",
                })}
              />
            </FormInputSection>
            <FormInputSection component="fieldset">
              <TextField
                variant="outlined"
                type="text"
                label="Tags"
                name="tags"
                defaultValue={itemData && itemData.tags}
                error={errors.tags ? true : false}
                helperText={errors.tags && errors.tags.message}
                fullWidth
                inputRef={register()}
              />
            </FormInputSection>
            <FormInputSection component="fieldset">
              <FormLabel component="legend">Settings</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox name="public" inputRef={register()} />}
                  label="Public Component"
                />
              </FormGroup>
            </FormInputSection>
          </FormInputContainer>
        </FormContent>
        <PublishFooter>
          <Container>
            <Link href="/ui" passHref>
              <Button color="inherit" component="a">
                Cancel
              </Button>
            </Link>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              loading={pending}
            >
              Publish
            </Button>
          </Container>
        </PublishFooter>
      </Form>
      <UIEditorModal
        open={editorOpen}
        html={getValues("html")}
        onCancel={() => setEditorOpen(false)}
        onSave={(code) => {
          setValue("html", code);
          setEditorOpen(false);
        }}
      />
    </Container>
  );
}

export default UIDetailsSection;
