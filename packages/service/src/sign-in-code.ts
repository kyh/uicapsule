import { auth } from "./auth/auth";

const [email = "dev@uicapsule.local"] = process.argv.slice(2);

try {
  console.log(await auth.api.createVerificationOTP({ body: { email, type: "sign-in" } }));
  process.exit(0);
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
