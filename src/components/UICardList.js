import React, { useState } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import UICard from "components/UICard";
import ConfirmDialog from "components/ConfirmDialog";
import { useAuth } from "util/auth.js";
import { updateItem, deleteItem } from "util/db.js";

// const canUseStar =
// auth.user.planIsActive &&
// (auth.user.planId === "pro" || auth.user.planId === "business");

// const handleStarItem = (item) => {
// if (canUseStar) {
//   updateItem(item.id, { featured: !item.featured });
// } else {
//   alert("You must upgrade to the pro plan to use this feature");
// }
// };

const UICardList = ({ items }) => {
  const auth = useAuth();
  const [deleteItemState, setDeleteItemState] = useState(null);

  return (
    <>
      <Box>
        {!items ||
          (items.length === 0 && (
            <>Nothing yet. Click the button to add your first item.</>
          ))}
        {items && items.length > 0 && (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid key={item.id} item xs={4}>
                <UICard
                  item={item}
                  onClickHeart={() =>
                    updateItem(item.id, { hearted: !item.hearted })
                  }
                  onClickDelete={() => setDeleteItemState(item)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {!!deleteItemState && (
        <ConfirmDialog
          onCancel={() => setDeleteItemState(null)}
          onConfirm={() => {
            deleteItem(deleteItemState.id);
            setDeleteItemState(null);
          }}
          content={
            <>
              You are about to remove <strong>{deleteItemState.title}</strong>{" "}
              from your capsule
            </>
          }
          open
        />
      )}
    </>
  );
};

export default UICardList;
