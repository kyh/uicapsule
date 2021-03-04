import React, { useState } from "react";
import Box from "@material-ui/core/Box";
import Alert from "@material-ui/lab/Alert";
import Grid from "@material-ui/core/Grid";
import Spinner from "components/Spinner";
import EditItemModal from "components/EditItemModal";
import ElementCard from "components/ElementCard";
import { useAuth } from "util/auth.js";
import { updateItem, deleteItem, useItemsByOwner } from "util/db.js";

const DashboardItems = () => {
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const auth = useAuth();
  const {
    data: items,
    status: itemsStatus,
    error: itemsError,
  } = useItemsByOwner(auth.user.uid);

  const itemsAreEmpty = !items || items.length === 0;
  const canUseStar =
    auth.user.planIsActive &&
    (auth.user.planId === "pro" || auth.user.planId === "business");

  const handleStarItem = (item) => {
    if (canUseStar) {
      updateItem(item.id, { featured: !item.featured });
    } else {
      alert("You must upgrade to the pro plan to use this feature");
    }
  };

  return (
    <>
      {itemsError && (
        <Box mb={3}>
          <Alert severity="error">{itemsError.message}</Alert>
        </Box>
      )}
      <Box>
        {(itemsStatus === "loading" || itemsAreEmpty) && (
          <Box py={5} px={3} align="center">
            {itemsStatus === "loading" && <Spinner size={32} />}
            {itemsStatus !== "loading" && itemsAreEmpty && (
              <>Nothing yet. Click the button to add your first item.</>
            )}
          </Box>
        )}
        {itemsStatus !== "loading" && items && items.length > 0 && (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid key={item.id} item xs>
                <ElementCard
                  html={item.html}
                  onClickHeart={() => handleStarItem(item)}
                  onClickEdit={() => setUpdatingItemId(item.id)}
                  onClickTag={() => {}}
                  onClickDelete={() => deleteItem(item.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {updatingItemId && (
        <EditItemModal
          id={updatingItemId}
          onDone={() => setUpdatingItemId(null)}
        />
      )}
    </>
  );
};

export default DashboardItems;
