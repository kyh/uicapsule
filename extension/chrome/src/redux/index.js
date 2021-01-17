import { combineReducers } from "redux";
import appReducer from "./app";
import selectionReducer from "./selection";

export default combineReducers({
  app: appReducer,
  selection: selectionReducer,
});
