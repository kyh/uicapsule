import React from "react";
import Link from "next/link";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import {
  HeartOutline,
  PencilAltOutline,
  TrashOutline,
} from "@graywolfai/react-heroicons";

function UICard({ item, onClickHeart, onClickDelete, showEdit }) {
  return (
    <Card elevation={3}>
      <Link href={`/ui/${item}`}>
        <iframe srcDoc={item.html} frameBorder="0" />
      </Link>
      <CardActions>
        {onClickHeart && (
          <IconButton aria-label="heart" onClick={onClickHeart}>
            <HeartOutline width="20" />
          </IconButton>
        )}
        {showEdit && (
          <Link href={`/ui/${item}?edit=true`} passHref>
            <IconButton aria-label="update" onClick={showEdit} as="a">
              <PencilAltOutline width="20" />
            </IconButton>
          </Link>
        )}
        {onClickDelete && (
          <IconButton
            style={{ marginLeft: "auto" }}
            aria-label="delete"
            onClick={onClickDelete}
          >
            <TrashOutline width="20" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}

export default UICard;
