import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import MuiLink from "@material-ui/core/Link";
import Button from "components/Button";
import UICard from "components/UICard";
import ConfirmDialog from "components/ConfirmDialog";
import { useAuth } from "actions/auth";
import { updateElement, deleteElement } from "actions/element";

// const canUseStar =
// auth.user.planIsActive &&
// (auth.user.planId === "pro" || auth.user.planId === "business");

// const handleStarItem = (item) => {
// if (canUseStar) {
//   updateElement(item.id, { featured: !item.featured });
// } else {
//   alert("You must upgrade to the pro plan to use this feature");
// }
// };

const UICardList = ({ items }) => {
  const auth = useAuth();
  const [deleteElementState, setDeleteElementState] = useState(null);
  const uid = auth.user ? auth.user.uid : undefined;

  return (
    <>
      <Box>
        {!items ||
          (items.length === 0 && (
            <Container maxWidth="xs">
              <Image src="/plan.svg" alt="No " width={500} height={350} />
              <Typography>
                Download our browser button to add components to your Capsule
                from any webpage.
              </Typography>
              <Box mt={2} textAlign="center">
                <Box mb={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    as={Link}
                    href="https://chrome.google.com/webstore/detail/ui-capsule/ggneccedeodnffmplinemfphnenjpihi"
                    target="_blank"
                  >
                    Download Browser Button
                  </Button>
                </Box>
                <Link href="/ui/new" passHref>
                  <MuiLink>or manually add components</MuiLink>
                </Link>
              </Box>
            </Container>
          ))}
        {items && items.length > 0 && (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid key={item.id} item xs={4}>
                <UICard
                  item={item}
                  onClickHeart={() =>
                    updateElement(item.id, { hearted: !item.hearted })
                  }
                  onClickDelete={
                    item.owner === uid
                      ? () => setDeleteElementState(item)
                      : null
                  }
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {!!deleteElementState && (
        <ConfirmDialog
          onCancel={() => setDeleteElementState(null)}
          onConfirm={() => {
            deleteElement(deleteElementState.id);
            setDeleteElementState(null);
          }}
          content={
            <>
              You are about to remove{" "}
              <strong>{deleteElementState.title}</strong> from your capsule
            </>
          }
          open
        />
      )}
    </>
  );
};

export default UICardList;
