import { useReducer, useEffect, useRef } from "react";
import firebase from "./firebase";

const firestore = firebase.firestore();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

/**** USERS ****/

// Fetch user data (hook)
// This is called automatically by auth.js and merged into auth.user
export const useUser = (uid) =>
  useQuery(uid && firestore.collection("users").doc(uid));

// Update an existing user
export const updateUser = (uid, data) =>
  firestore.collection("users").doc(uid).update(data);

// Create a new user
export const createUser = (uid, data) =>
  firestore
    .collection("users")
    .doc(uid)
    .set({ uid, ...data }, { merge: true });

/**** ITEMS ****/
/* Example query functions (modify to your needs) */

// Fetch all items by owner (hook)
export const useItems = (owner) =>
  useQuery(
    owner
      ? firestore
          .collection("items")
          .where("owner", "==", owner)
          .orderBy("createdAt", "desc")
      : firestore
          .collection("items")
          .where("public", "==", true)
          .orderBy("createdAt", "desc")
  );

// Fetch item data
export const useItem = (id) =>
  useQuery(id && firestore.collection("items").doc(id));

// Update an item
export const updateItem = (id, data) =>
  firestore.collection("items").doc(id).update(data);

// Create a new item
export const createItem = (data) => {
  const user = firebase.auth().currentUser;
  return firestore.collection("items").add({
    ...data,
    owner: user.uid,
    createdAt: serverTimestamp(),
  });
};

// Delete an item
export const deleteItem = (id) =>
  firestore.collection("items").doc(id).delete();

/**** HELPERS ****/

// Reducer for useQuery hook state and actions
const reducer = (state, action) => {
  switch (action.type) {
    case "idle":
      return { status: "idle", data: undefined, error: undefined };
    case "loading":
      return { status: "loading", data: undefined, error: undefined };
    case "success":
      return { status: "success", data: action.payload, error: undefined };
    case "error":
      return { status: "error", data: undefined, error: action.payload };
    case "update":
      return {
        ...state,
        data: state.data
          ? { ...state.data, ...action.payload }
          : action.payload,
      };
    default:
      throw new Error("invalid action");
  }
};

const useQuery = (query) => {
  // Our initial state
  // Start with an "idle" status if query is falsy, as that means hook consumer is
  // waiting on required data before creating the query object.
  // Example: useQuery(uid && firestore.collection("profiles").doc(uid))
  const initialState = {
    status: query ? "loading" : "idle",
    data: undefined,
    error: undefined,
  };

  // Setup our state and actions
  const [state, dispatch] = useReducer(reducer, initialState);

  // Gives us previous query object if query is the same, ensuring
  // we don't trigger useEffect on every render due to query technically
  // being a new object reference on every render.
  const queryCached = useMemoCompare(query, (prevQuery) => {
    // Use built-in Firestore isEqual method to determine if "equal"
    return prevQuery && query && query.isEqual(prevQuery);
  });

  useEffect(() => {
    // Return early if query is falsy and reset to "idle" status in case
    // we're coming from "success" or "error" status due to query change.
    if (!queryCached) {
      dispatch({ type: "idle" });
      return;
    }

    dispatch({ type: "loading" });

    // Subscribe to query with onSnapshot
    // Will unsubscribe on cleanup since this returns an unsubscribe function
    return queryCached.onSnapshot(
      (response) => {
        // Get data for collection or doc
        const data = response.docs
          ? getCollectionData(response)
          : getDocData(response);

        dispatch({ type: "success", payload: data });
      },
      (error) => {
        dispatch({ type: "error", payload: error });
      }
    );
  }, [queryCached]); // Only run effect if queryCached changes

  return { ...state, dispatch };
};

const getDocData = (doc) =>
  doc.exists === true ? { id: doc.id, ...doc.data() } : null;
const getCollectionData = (collection) => collection.docs.map(getDocData);

const useMemoCompare = (next, compare) => {
  // Ref for storing previous value
  const previousRef = useRef();
  const previous = previousRef.current;

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, next);

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  // Finally, if equal then return the previous value
  return isEqual ? previous : next;
};
