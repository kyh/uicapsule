import morphdom from "morphdom";

export function html([first, ...strings], ...values) {
  return values
    .reduce((acc, cur) => acc.concat(cur, strings.shift()), [first])
    .filter((x) => (x && x !== true) || x === 0)
    .join("");
}

export function createStore(reducer) {
  let state = reducer();
  const roots = new Map();

  const render = () => {
    for (const [r, component] of roots) {
      const output = component();
      morphdom(r, output, { childrenOnly: true });
    }
  };

  return {
    attach(component, r) {
      roots.set(r, component);
      render();
    },
    connect(component, selector = (state) => state) {
      return (props, ...args) =>
        component({ ...props, ...selector(state) }, ...args);
    },
    dispatch(action, ...args) {
      state = reducer(state, action, args);
      render();
    },
    getState() {
      return state;
    },
  };
}
