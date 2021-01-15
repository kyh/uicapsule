import React, { useEffect, useState } from "react";
import PageLoader from "components/PageLoader";
import { useAuth } from "util/auth.js";
import { useRouter } from "next/router";
import { redirectToBilling } from "util/stripe.js";

function SettingsBilling(props) {
  const router = useRouter();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.user.planIsActive) {
      // If user has an active plan then
      // take them to Stripe billing
      redirectToBilling().catch((error) => {
        setLoading(false);
        props.onStatus({
          type: "error",
          message: error.message,
        });
      });
    } else {
      // Otherwise go to pricing so they can
      // purchase a plan
      router.replace("/pricing");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{loading && <PageLoader height={50} />}</>;
}

export default SettingsBilling;
