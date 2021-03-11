import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
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
import Tooltip from "@material-ui/core/Tooltip";
import Checkbox from "@material-ui/core/Checkbox";
import { QuestionMarkCircleOutline } from "@graywolfai/react-heroicons";
import { PageSpinner } from "components/Spinner";
import UIEditorModal from "components/UIEditorModal";
import Button from "components/Button";
import BackButton from "components/BackButton";
import IFrame from "components/IFrame";
import { useAuth } from "util/auth.js";
import { useItem, updateItem, createItem } from "util/db.js";

export const Title = styled(Typography)`
  ${({ theme }) => css`
    position: absolute;
    top: 20px;
    z-index: ${theme.zIndex.drawer + 2};
    left: 50%;
    transform: translateX(-50%);
  `}
`;

export const Form = styled.form`
  ${({ theme }) => css`
    margin-top: ${theme.spacing(4)}px;
  `}
`;

export const FormContent = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const ComponentPreview = styled(Card)`
  ${({ theme }) => css`
    position: relative;
    width: 60%;
    margin-right: ${theme.spacing(4)}px;
    height: 70vh;
  `}
`;

const EditCodeButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

export const FormInputContainer = styled.div`
  ${({ theme }) => css`
    width: 40%;
  `}
`;

export const FormInputSection = styled(FormControl)`
  ${({ theme }) => css`
    display: block;
    margin-bottom: ${theme.spacing(2)}px;
  `}
`;

export const Footer = styled.footer`
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

const InputLabel = ({ label, tooltip }) => {
  return (
    <Box display="flex">
      <span>{label}</span>
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <Box ml={0.5}>
            <QuestionMarkCircleOutline width="15" />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

const UIDetailsEditSection = (props) => {
  const [pending, setPending] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { data: itemData, status: itemStatus } = useItem(props.id);
  const { register, handleSubmit, errors, setValue, watch, reset } = useForm();

  useEffect(() => {
    reset({
      html: itemData ? itemData.html : "",
      title: itemData ? itemData.title : "",
      description: itemData ? itemData.description : "",
      tags: itemData ? itemData.tags : "",
      public: itemData ? itemData.public : false,
      featureImage: itemData ? itemData.featureImage : false,
    });
  }, [itemData]);

  const html = watch("html", "");

  const onSubmit = (data) => {
    setPending(true);

    const query = props.id
      ? updateItem(props.id, data)
      : createItem({ owner: auth.user.uid, ...data });

    query
      .then((data) => {
        router.push("/ui");
      })
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

  const openEditorModal = () => {
    setValue("html", html);
    setEditorOpen(true);
  };

  const closeEditorModal = (dirtyHtml) => {
    if (!dirtyHtml.target) setValue("html", dirtyHtml);
    setEditorOpen(false);
  };

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
            <EditCodeButton variant="contained" onClick={openEditorModal}>
              Edit Code
            </EditCodeButton>
            <IFrame srcDoc={html} />
          </ComponentPreview>
          <FormInputContainer>
            <textarea style={{ display: "none" }} name="html" ref={register} />
            <FormInputSection component="fieldset">
              <TextField
                variant="outlined"
                type="text"
                label="Title"
                name="title"
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
                label="Description"
                name="description"
                error={errors.description ? true : false}
                helperText={errors.description && errors.description.message}
                fullWidth
                multiline
                rows={8}
                inputRef={register}
              />
            </FormInputSection>
            <FormInputSection component="fieldset">
              <TextField
                variant="outlined"
                type="text"
                label="Tags"
                name="tags"
                error={errors.tags ? true : false}
                helperText={errors.tags && errors.tags.message}
                fullWidth
                inputRef={register}
              />
            </FormInputSection>
            <FormInputSection component="fieldset">
              <FormLabel component="legend">Settings</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked={itemData ? itemData.public : false}
                    />
                  }
                  name="public"
                  inputRef={register}
                  label={
                    <InputLabel
                      label="Public Component"
                      tooltip="Show this component will show up on the Discover page"
                    />
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked={itemData ? itemData.featureImage : false}
                    />
                  }
                  name="featureImage"
                  inputRef={register}
                  label={
                    <InputLabel
                      label="Feature Image"
                      tooltip="Use an image as the thumbnail rather than a code rendered component"
                    />
                  }
                />
              </FormGroup>
            </FormInputSection>
          </FormInputContainer>
        </FormContent>
        <Footer>
          <Container>
            <BackButton>Cancel</BackButton>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              loading={pending}
            >
              {props.id ? "Update" : "Publish"}
            </Button>
          </Container>
        </Footer>
      </Form>
      <UIEditorModal
        open={editorOpen}
        html={html}
        onCancel={closeEditorModal}
        onSave={closeEditorModal}
      />
    </Container>
  );
};

export default UIDetailsEditSection;
