import React from "react";
import { useDispatch, shallowEqual, useSelector } from "react-redux";
import styled from "styled-components";
import { toggleTheme, deactivateApp } from "../redux/app";
import { LOADING_STATE, deleteElement } from "../redux/selection";
import Spinner from "./Spinner";
import { SunIcon, MoonIcon, XIcon } from "./Icons";

const Popover = ({ apiMode }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.app, shallowEqual);
  const { loadingState, item } = useSelector(
    (state) => state.selection,
    shallowEqual
  );

  const onClickClose = () => {
    if (apiMode) {
      dispatch(deactivateApp());
    } else {
      window.location.reload();
    }
  };

  const onClickViewInCapsule = (event) => {
    if (apiMode && apiMode.onClickViewCapsule) {
      event.stopPropagation();
      event.preventDefault();
      apiMode.onClickViewCapsule({ image: item.image, html: item.html });
    }
  };

  if (!apiMode && !user) {
    return (
      <Container>
        <Content center>
          <img
            src="https://drive.google.com/uc?id=1mmK0jKTaWBWC8gS4gMrU0lmt30YWIxMX"
            style={{ width: 230, marginBottom: 12 }}
          />
          <h4>Hi there!</h4>
          <p>
            You'll need to{" "}
            <a
              href={`${process.env.WEBPAGE}/extension-sign-in`}
              target="_blank"
            >
              sign in
            </a>{" "}
            first in order to start bookmarking
          </p>
        </Content>
      </Container>
    );
  }

  if (loadingState === LOADING_STATE.default) {
    return null;
  }

  return (
    <Container>
      <Header>
        {loadingState === LOADING_STATE.loading ||
        loadingState === LOADING_STATE.deleting ? (
          <HeaderContent>
            <Spinner />
            <div style={{ marginLeft: 4 }}>
              {loadingState === LOADING_STATE.loading
                ? "Saving..."
                : "Deleting..."}
            </div>
          </HeaderContent>
        ) : (
          <>
            <HeaderContent>Saved</HeaderContent>
            <Button type="button" ariaLabel="Close" onClick={onClickClose}>
              <XIcon />
            </Button>
          </>
        )}
      </Header>
      {loadingState === LOADING_STATE.done && (
        <>
          <Content apiMode={apiMode}>
            <iframe srcDoc={item.html} sandbox="" />
            {/* <img src={image} /> */}
          </Content>
          <Footer>
            <a
              href={`${process.env.WEBPAGE}/ui`}
              target="_blank"
              onClick={onClickViewInCapsule}
            >
              View in your Capsule
            </a>
            <Button type="button" onClick={() => dispatch(deleteElement(item))}>
              Delete
            </Button>
          </Footer>
        </>
      )}
    </Container>
  );
};

const ToggleThemeButton = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.app, shallowEqual);

  if (darkMode) {
    return (
      <Button
        type="button"
        ariaLabel="Toggle dark mode"
        onClick={() => dispatch(toggleTheme(darkMode))}
      >
        <MoonIcon />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      ariaLabel="Toggle light mode"
      onClick={() => dispatch(toggleTheme(darkMode))}
    >
      <SunIcon />
    </Button>
  );
};

const HeaderContent = styled.div`
  display: flex;
  height: 24px;
  align-items: center;
  font-weight: 500;
`;

const Container = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial,
    sans-serif, Apple Color Emoji, Segoe UI Emoji;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.text};
  background: ${({ theme }) => theme.background};
  border-radius: 5px;
  box-shadow: 0 30px 50px 0 rgba(44, 49, 59, 0.2);
  width: 310px;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
`;

const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  a {
    color: ${({ theme }) => theme.primary};
  }
  a:hover,
  a:active {
    color: ${({ theme }) => theme.primary};
    text-decoration: underline;
  }
`;

const Button = styled.button`
  opacity: 0.7;
  text-align: inherit;
  border: none;
  margin: 0;
  padding: 0;
  width: auto;
  overflow: visible;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: normal;
  -webkit-font-smoothing: inherit;
  -moz-osx-font-smoothing: inherit;
  -webkit-appearance: none;
  cursor: pointer;
`;

const Content = styled.div`
  background: ${({ theme }) => theme.contentBackground};
  padding: 12px;
  overflow-y: scroll;
  max-height: ${({ apiMode }) => (apiMode ? 300 : 500)}px;
  text-align: ${({ center }) => (center ? "center" : "left")};
  img {
    object-fit: cover;
  }
`;

export default Popover;
