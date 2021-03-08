import React from "react";
import styled from "styled-components";
import Link from "next/link";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import {
  HeartOutline,
  PencilAltOutline,
  TrashOutline,
} from "@graywolfai/react-heroicons";

const UICardContainer = styled(Card)`
  iframe {
    width: 100%;
    height: 100%;
  }
`;

function UICard({ item, onClickHeart, onClickDelete, showEdit }) {
  return (
    <UICardContainer elevation={3}>
      <Link href={`/ui/${item.id}`}>
        <iframe srcDoc={item.html} frameBorder="0" />
      </Link>
      <CardActions>
        {onClickHeart && (
          <IconButton aria-label="heart" onClick={onClickHeart}>
            <HeartOutline width="20" />
          </IconButton>
        )}
        {showEdit && (
          <Link href={`/ui/${item.id}`} passHref>
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
    </UICardContainer>
  );
}

export default UICard;
