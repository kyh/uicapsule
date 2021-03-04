import React, { useState } from "react";
import dynamic from "next/dynamic";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Box from "@material-ui/core/Box";
import Alert from "@material-ui/lab/Alert";
import Button from "components/Button";
import { useAuth } from "util/auth.js";
import { useItem, updateItem, createItem } from "util/db.js";

const Editor = dynamic(
  async () => {
    const ace = await import("react-ace");
    require("ace-builds/src-min-noconflict/theme-monokai");
    require("ace-builds/src-min-noconflict/mode-html");
    require("ace-builds/src-min-noconflict/snippets/html");
    require("ace-builds/src-min-noconflict/ext-language_tools");
    return ace;
  },
  {
    loading: () => <>Loading...</>,
    ssr: false,
  }
);

const EditItemModal = (props) => {
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [formAlert, setFormAlert] = useState(null);

  // This will fetch item if props.id is defined
  // Otherwise query does nothing and we assume
  // we are creating a new item.
  const { data: itemData, status: itemStatus } = useItem(props.id);

  // If we are updating an existing item
  // don't show modal until item data is fetched.
  if (props.id && itemStatus !== "success") return null;

  const onSubmit = (data) => {
    setPending(true);

    const query = props.id
      ? updateItem(props.id, data)
      : createItem({ owner: auth.user.uid, ...data });

    query
      .then(() => {
        // Let parent know we're done so they can hide modal
        props.onDone();
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

  console.log(itemData);

  return (
    <Dialog open onClose={props.onDone}>
      <DialogTitle>{props.id ? <>Update</> : <>Create</>}</DialogTitle>
      <DialogContent>
        {formAlert && (
          <Box mb={4}>
            <Alert severity={formAlert.type}>{formAlert.message}</Alert>
          </Box>
        )}
        <form onSubmit={onSubmit}>
          <Editor
            placeholder="Hello world"
            mode="html"
            theme="monokai"
            fontSize={14}
            showPrintMargin
            showGutter
            highlightActiveLine
            enableBasicAutocompletion
            enableLiveAutocompletion
            enableSnippets
            value={itemData ? itemData.html : `<div>Hello world</div>`}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            loading={pending}
          >
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemModal;
