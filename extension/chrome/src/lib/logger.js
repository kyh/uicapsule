export default function logger(reducer) {
  return function (prevState, action, args) {
    console.group(action);
    console.log("Previous State", prevState);
    console.log("Action Arguments", args);
    const next_state = reducer(prevState, action, args);
    console.log("Next State", next_state);
    console.groupEnd();
    return next_state;
  };
}
