import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "./util";
import { getStripePriceId } from "./prices";

let stripe;
// Load the Stripe script
loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
  apiVersion: process.env.NEXT_PUBLIC_STRIPE_API_VERSION,
}).then((stripeInstance) => {
  // Set stripe so all functions below have it in scope
  stripe = stripeInstance;
});

export async function redirectToCheckout(planId) {
  // Create a checkout session
  const session = await apiRequest("stripe-create-checkout-session", "POST", {
    priceId: getStripePriceId(planId),
  });

  // Ensure if user clicks browser back button from checkout they go to /pricing
  // instead of this page or they'll redirect right back to checkout.
  window.history.replaceState({}, "", "/pricing");

  // Redirect to checkout
  return stripe.redirectToCheckout({
    sessionId: session.id,
  });
}

export async function redirectToBilling() {
  // Create a billing session
  const session = await apiRequest("stripe-create-billing-session", "POST");

  // Ensure if user clicks browser back button from billing they go to /settings/general
  // instead of this page or they'll redirect right back to billing.
  window.history.replaceState({}, "", "/settings/general");

  // Redirect to billing session url
  window.location.href = session.url;
}
