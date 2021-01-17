import * as React from "react";
import { useDispatch, shallowEqual, useSelector } from "react-redux";
import { toggleTheme } from "../redux/app";
import styled from "styled-components";

function Popover() {
  const { element, loading, stringified } = useSelector(
    (state) => state.selection,
    shallowEqual
  );

  if (!element) return null;

  return (
    <Container>
      <Header>UI Capsule</Header>
      <Content>
        <iframe srcDoc={stringified} frameBorder="0" />
      </Content>
      <Footer>
        <a href="https://uicapsule.com" target="_blank">
          View in your Capsule
        </a>
        <ToggleThemeButton />
      </Footer>
    </Container>
  );
}

function ToggleThemeButton() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.app, shallowEqual);

  if (darkMode) {
    return (
      <ThemeButton
        type="button"
        ariaLabel="Toggle dark mode"
        onClick={() => dispatch(toggleTheme(darkMode))}
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Dark Mode</title>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </ThemeButton>
    );
  }

  return (
    <ThemeButton
      type="button"
      ariaLabel="Toggle light mode"
      onClick={() => dispatch(toggleTheme(darkMode))}
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Light Mode</title>
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </ThemeButton>
  );
}

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
`;

const ThemeButton = styled.button`
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
  iframe {
    width: 100%;
    height: 100px;
  }
`;

export default Popover;
