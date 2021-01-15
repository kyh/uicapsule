import React, { useEffect, useState } from "react";
import PageLoader from "components/PageLoader";
import Alert from "@material-ui/lab/Alert";
import { handleRecoverEmail, handleVerifyEmail } from "util/auth.js";
import { useRouter } from "next/router";

function FirebaseActionPage(props) {
  const router = useRouter();
  const [formAlert, setFormAlert] = useState();

  useEffect(() => {
    const { mode, oobCode } = router.query;

    // Do nothing if mode param is undefined.
    // Page may have been pre-rendered by server so won't have query values
    // until it's actually run on client (as is the case if using Next.js)
    if (!mode) return;

    // Take action based on Firebase "mode" query param
    switch (mode) {
      case "resetPassword":
        // Redirect to change password page
        router.replace(`/auth/changepass?oobCode=${oobCode}`);
        break;
      case "recoverEmail":
        // Reset to original email
        handleRecoverEmail(oobCode)
          .then((originalEmail) => {
            setFormAlert({
              type: "success",
              message: `Your email has been set back to ${originalEmail}. We've also sent you a password reset email so that you can change your password if you think someone may have access to your account.`,
            });
          })
          .catch((error) => {
            setFormAlert({
              type: "error",
              message: error.message,
            });
          });
        break;
      case "verifyEmail":
        // Verify email in Firebase
        handleVerifyEmail(oobCode)
          .then(() => {
            setFormAlert({
              type: "success",
              message: `Your email has been verified. You may now close this window.`,
            });
          })
          .catch((error) => {
            setFormAlert({
              type: "error",
              message: error.message,
            });
          });
        break;
      default:
        setFormAlert({
          type: "error",
          message: "Invalid mode parameter",
        });
    }
  }, [router]);

  return (
    <PageLoader>
      {formAlert && (
        <Alert severity={formAlert.type} style={{ maxWidth: "500px" }}>
          {formAlert.message}
        </Alert>
      )}
    </PageLoader>
  );
}

export default FirebaseActionPage;
