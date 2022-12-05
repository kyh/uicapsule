import {
  firestore,
  useQuery,
  prepareDocForCreate,
  prepareDocForUpdate,
} from "util/db";

export const useElements = (createdBy) => {
  return useQuery(
    createdBy
      ? firestore
          .collection("elements")
          .where("createdBy", "==", createdBy)
          .orderBy("createdAt", "desc")
      : firestore
          .collection("elements")
          .where("public", "==", true)
          .orderBy("createdAt", "desc")
  );
};

export const useElement = (id) => {
  return useQuery(id && firestore.collection("elements").doc(id));
};

export const updateElement = (id, data) => {
  return firestore
    .collection("elements")
    .doc(id)
    .update(prepareDocForUpdate(data));
};

export const createElement = (data) => {
  return firestore.collection("elements").add(prepareDocForCreate(data));
};

export const deleteElement = (id) => {
  return firestore.collection("elements").doc(id).delete();
};
