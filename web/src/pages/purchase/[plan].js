import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SEO from "components/SEO";
import Alert from "@material-ui/lab/Alert";
import PageLoader from "components/PageLoader";
import { useAuth, requireAuth } from "actions/auth";
import { redirectToCheckout } from "util/stripe";

const PurchasePage = (props) => {
  const router = useRouter();
  const auth = useAuth();
  const [formAlert, setFormAlert] = useState();

  useEffect(() => {
    if (auth.user.planIsActive) {
      // If user already has an active plan
      // then take them to Stripe billing
      router.push("/settings/billing");
    } else {
      // Otherwise go to checkout
      redirectToCheckout(router.query.plan).catch((error) => {
        setFormAlert({
          type: "error",
          message: error.message,
        });
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SEO title="Purchase" />
      <PageLoader>
        {formAlert && (
          <Alert severity={formAlert.type} style={{ maxWidth: "500px" }}>
            {formAlert.message}
          </Alert>
        )}
      </PageLoader>
    </>
  );
};

export default requireAuth(PurchasePage);
