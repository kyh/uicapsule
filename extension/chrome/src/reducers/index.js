import { combineReducers } from "redux";
import appReducer from "./appReducer";
import selectionReducer from "./selectionReducer";

export default combineReducers({
  app: appReducer,
  selection: selectionReducer,
});
