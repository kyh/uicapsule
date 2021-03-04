import React from "react";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import {
  HeartOutline,
  PencilAltOutline,
  TagOutline,
  TrashOutline,
} from "@graywolfai/react-heroicons";

function ElementCard({
  html,
  onClickHeart,
  onClickEdit,
  onClickTag,
  onClickDelete,
}) {
  return (
    <Card elevation={3}>
      <iframe srcDoc={html} frameBorder="0" />
      <CardActions>
        {onClickHeart && (
          <IconButton aria-label="heart" onClick={onClickHeart}>
            <HeartOutline width="20" />
          </IconButton>
        )}
        {onClickEdit && (
          <IconButton aria-label="update" onClick={onClickEdit}>
            <PencilAltOutline width="20" />
          </IconButton>
        )}
        {onClickTag && (
          <IconButton aria-label="tag" onClick={onClickTag}>
            <TagOutline width="20" />
          </IconButton>
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

export default ElementCard;
