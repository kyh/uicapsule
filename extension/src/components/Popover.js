import React from "react";
import { useDispatch, shallowEqual, useSelector } from "react-redux";
import styled from "styled-components";
import { toggleTheme, deactivateApp } from "../redux/app";
import { LOADING_STATE } from "../redux/selection";
import Spinner from "./Spinner";
import { SunIcon, MoonIcon, XIcon } from "./Icons";

function Popover({ demoMode }) {
  const dispatch = useDispatch();
  const { loadingState, image } = useSelector(
    (state) => state.selection,
    shallowEqual
  );

  if (loadingState === LOADING_STATE.default) {
    return null;
  }

  return (
    <Container>
      <Header>
        {loadingState === LOADING_STATE.loading ? (
          <HeaderContent>
            <Spinner loadingState={loadingState} />
            <div style={{ marginLeft: 4 }}>Saving...</div>
          </HeaderContent>
        ) : (
          <>
            <HeaderContent>Saved</HeaderContent>
            <Button
              type="button"
              ariaLabel="Close"
              onClick={() =>
                demoMode ? dispatch(deactivateApp()) : window.location.reload()
              }
            >
              <XIcon />
            </Button>
          </>
        )}
      </Header>
      {loadingState === LOADING_STATE.done && (
        <>
          <Content>
            {/* <iframe srcDoc={stringified} frameBorder="0" /> */}
            <img src={image} />
          </Content>
          <Footer>
            <a href="https://uicapsule.com" target="_blank">
              View in your Capsule
            </a>
            <ToggleThemeButton />
          </Footer>
        </>
      )}
    </Container>
  );
}

function ToggleThemeButton() {
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
}

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
  img {
    width: 100%;
    object-fit: cover;
  }
`;

export default Popover;
