import React from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardMedia from "@material-ui/core/CardMedia";
import IconButton from "@material-ui/core/IconButton";
import {
  HeartOutline,
  PencilAltOutline,
  TagOutline,
  TrashOutline,
} from "@graywolfai/react-heroicons";

function ElementCard({ onClickHeart, onClickEdit, onClickTag, onClickDelete }) {
  return (
    <Card>
      <CardActionArea>
        <CardMedia
          component="img"
          alt="Contemplative Reptile"
          height="200"
          image="https://material-ui.com/static/images/cards/contemplative-reptile.jpg"
          title="Contemplative Reptile"
        />
      </CardActionArea>
      <CardActions>
        {onClickHeart && (
          <IconButton
            edge="end"
            aria-label="heart"
            onClick={() => onClickHeart(item)}
          >
            <HeartOutline width="20" />
          </IconButton>
        )}
        {onClickEdit && (
          <IconButton
            edge="end"
            aria-label="update"
            onClick={() => onClickEdit(item)}
          >
            <PencilAltOutline width="20" />
          </IconButton>
        )}
        {onClickTag && (
          <IconButton
            edge="end"
            aria-label="tag"
            onClick={() => onClickTag(item)}
          >
            <TagOutline width="20" />
          </IconButton>
        )}
        {onClickDelete && (
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onClickDelete(item)}
          >
            <TrashOutline width="20" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}

export default ElementCard;
