const firebaseAdmin = require("./_firebase.js");
const requireAuth = require("./_require-auth.js");

export default requireAuth(async (req, res) => {
  const user = req.user;
  try {
    const token = await firebaseAdmin.auth().createCustomToken(user.uid);
    res.send({ status: "success", data: token });
  } catch (error) {
    console.log("firebase-cutom-token", error);
    // Return error response
    res.send({ status: "error", code: error.code, message: error.message });
  }
});
