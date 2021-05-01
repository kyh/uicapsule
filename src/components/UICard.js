import React from "react";
import styled from "styled-components";
import Link from "next/link";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import {
  Heart as HeartOutline,
  Eye,
  Trash,
} from "@styled-icons/heroicons-outline";
import { Heart as HeartSolid } from "@styled-icons/heroicons-solid";
import IFrame from "components/IFrame";

const UICardContainer = styled(Card)`
  iframe {
    min-height: 280px;
  }
`;

function UICard({ item, onClickHeart, onClickDelete }) {
  return (
    <UICardContainer elevation={3}>
      <IFrame srcDoc={item.html} />
      <CardActions>
        <Link href={`/ui/${item.id}`} passHref>
          <IconButton aria-label="update" as="a" edge="end">
            <Eye width="20" />
          </IconButton>
        </Link>
        <IconButton aria-label="heart" onClick={onClickHeart} edge="end">
          {item.hearted ? (
            <HeartSolid width="20" />
          ) : (
            <HeartOutline width="20" />
          )}
        </IconButton>
        {onClickDelete && (
          <IconButton
            style={{ marginLeft: "auto" }}
            aria-label="delete"
            onClick={onClickDelete}
          >
            <Trash width="20" />
          </IconButton>
        )}
      </CardActions>
    </UICardContainer>
  );
}

export default UICard;
