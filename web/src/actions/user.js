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
