import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { createGlobalStyle } from "styled-components";
import {
  highlightAttr,
  selectedAttr,
  selectElement,
  resetSelectedElement,
  removeAttributes,
} from "../redux/selection";

const GlobalStyle = createGlobalStyle`
  [data-ui-capsule] {
    position: fixed !important;
    top: 12px !important;
    right: 12px !important;
    z-index: 2147483647 !important;
    border-width: initial !important;
    border-style: none !important;
    border-color: initial !important;
    border-image: initial !important;
  }

  [${highlightAttr}] {
    outline: ${({ theme }) => theme.primary} dashed 1.5px !important;
    outline-offset: -3px !important;
  }
`;

let lastElement = null;

function ElementHandler({ container }) {
  const dispatch = useDispatch();

  const handleMousemove = (event) => {
    if (lastElement === event.target) return;
    if (lastElement) {
      lastElement.removeAttribute(highlightAttr);
      lastElement.removeEventListener("click", handleClick);
    }
    lastElement = event.target;
    lastElement.setAttribute(highlightAttr, "");
    lastElement.addEventListener("click", handleClick);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    dispatch(selectElement(event.target));
  };

  useEffect(() => {
    container.addEventListener("mousemove", handleMousemove);
    return () => {
      container.removeEventListener("mousemove", handleMousemove);
      container
        .querySelectorAll(`[${highlightAttr}], [${selectedAttr}]`)
        .forEach(removeAttributes);
      dispatch(resetSelectedElement());
    };
  }, []);

  return <GlobalStyle />;
}

export default ElementHandler;
