import { createStore } from "../lib/render";
import withLogger from "../lib/logger";
import combineReducers from "../lib/combineReducers";

import appReducer from "./appReducer";
import selectionReducer from "./selectionReducer";

const reducer = combineReducers({
  app: appReducer,
  selection: selectionReducer,
});

const store = createStore(withLogger(reducer));

export default store;
