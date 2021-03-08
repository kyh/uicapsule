import React from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import { SearchOutline } from "@graywolfai/react-heroicons";
import { PageSpinner } from "components/Spinner";
import UICardList from "components/UICardList";
import { useAuth } from "util/auth.js";
import { useItemsByOwner } from "util/db.js";

const SearchForm = styled.form`
  ${({ theme }) => css`
    position: absolute;
    top: 18px;
    z-index: ${theme.zIndex.drawer + 2};

    .MuiInputBase-input {
      font-size: 0.8rem;
      padding-left: ${theme.spacing(4)}px;
    }
    svg {
      position: absolute;
      width: 16px;
      top: 6px;
      left: 8px;
    }
  `}
`;

const DashboardSection = ({ discover }) => {
  const auth = useAuth();
  const {
    data: items,
    status: itemsStatus,
    error: itemsError,
  } = useItemsByOwner(auth.user.uid);

  return (
    <>
      <SearchForm>
        <SearchOutline width="16" />
        <InputBase type="text" placeholder="Search" name="search" />
      </SearchForm>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        py={1}
      >
        <Box>
          <Button>#tag1</Button>
          <Button>#tag2</Button>
          <Button>#tag3</Button>
        </Box>
        <Link href="/ui/new" passHref>
          <Button variant="outlined" component="a">
            Add Component
          </Button>
        </Link>
      </Box>
      {itemsError && (
        <Box mb={3}>
          <Alert severity="error">{itemsError.message}</Alert>
        </Box>
      )}
      {itemsStatus === "loading" && <PageSpinner />}
      {itemsStatus !== "loading" && <UICardList items={items} />}
    </>
  );
};

export default DashboardSection;
