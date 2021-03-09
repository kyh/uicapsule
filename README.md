## 👉 Get Started

Install dependencies

```
npm install
```

Update your `.env` file with values for each environment variable

```
API_KEY=AIzaSyBkkFF0XhNZeWuDmOfEhsgdfX1VBG7WTas
etc ...
```

Run the development server

```
npm run dev
```

When the above command completes you'll be able to view your website at `http://localhost:3000`

## 🥞 Stack

This project uses the following libraries and services:

- Framework - [Next.js](https://nextjs.org)
- UI Kit - [Material UI](https://material-ui.com)
- Authentication - [Firebase Auth](https://firebase.google.com/products/auth)
- Database - [Cloud Firestore](https://firebase.google.com/products/firestore)
- Payments - [Stripe](https://stripe.com)
- Contact Form - [Google Sheets](https://www.google.com/sheets/about/)
- Analytics - [Google Analytics](https://googleanalytics.com)
- Hosting - [Vercel](https://vercel.com)

## 📚 Guide

<details>
<summary><b>Routing</b></summary>
<p>
  This project uses the built-in Next.js router and its convenient <code>useRouter</code> hook. Learn more in the <a target="_blank" href="https://github.com/zeit/next.js/#routing">Next.js docs</a>.

```js
import Link from "next/link";
import { useRouter } from "next/router";

function MyComponent() {
  // Get the router object
  const router = useRouter();

  // Get value from query string (?postId=123) or route param (/:postId)
  console.log(router.query.postId);

  // Get current pathname
  console.log(router.pathname);

  // Navigate with the <Link> component or with router.push()
  return (
    <div>
      <Link href="/about">
        <a>About</a>
      </Link>
      <button onClick={(e) => router.push("/about")}>About</button>
    </div>
  );
}
```

</p>
</details>

<details>
<summary><b>Authentication</b></summary>
<p>
  This project uses <a href="https://firebase.google.com">Firebase Auth</a> and includes a convenient <code>useAuth</code> hook (located in <code><a href="src/util/auth.js">src/util/auth.js</a></code>) that wraps Firebase and gives you common authentication methods. Depending on your needs you may want to edit this file and expose more Firebase functionality.

```js
import { useAuth } from "./../util/auth.js";

function MyComponent() {
  // Get the auth object in any component
  const auth = useAuth();

  // Depending on auth state show signin or signout button
  // auth.user will either be an object, null when loading, or false if signed out
  return (
    <div>
      {auth.user ? (
        <button onClick={(e) => auth.signout()}>Signout</button>
      ) : (
        <button onClick={(e) => auth.signin("hello@divjoy.com", "yolo")}>
          Signin
        </button>
      )}
    </div>
  );
}
```

</p>
</details>

<details>
<summary><b>Database</b></summary>
<p>
  This project uses <a href="https://firebase.google.com/products/firestore">Cloud Firestore</a> and includes some data fetching hooks to get you started (located in <code><a href="src/util/db.js">src/util/db.js</a></code>). You'll want to edit that file and add any additional query hooks you need for your project.

```js
import { useAuth } from './../util/auth.js';
import { useItems } from './../util/db.js';
import ItemsList from './ItemsList.js';

function ItemsPage(){
  const auth = useAuth();

  // Fetch items by owner
  // Returned status value will be "idle" if we're waiting on
  // the uid value or "loading" if the query is executing.
  const uid = auth.user ? auth.user.uid : undefined;
  const { data: items, status } = useItems(uid);

  // Once we have items data render ItemsList component
  return (
    <div>
      {(status === "idle" || status === "loading") ? (
        <span>One moment please</span>
      ) : (
        <ItemsList data={items}>
      )}
    </div>
  );
}
```

</p>
</details>

<details>
<summary><b>Deployment</b></summary>
<p>
Install the Vercel CLI

```
npm install -g vercel
```

Add each variable from `.env` to your Vercel project with the following command. You'll be prompted to enter its value and then choose one or more environments (development, preview, or production).
<a target="_blank" href="https://vercel.com/docs/v2/build-step#environment-variables">Learn more here</a>.

```
vercel env add VARIABLE_NAME
```

Run this command to deploy a preview (for testing a live deployment)

```
vercel
```

Run this command to deploy to production

```
vercel --prod
```

See the <a target="_blank" href="https://vercel.com/docs/v2/platform/deployments">Vercel docs</a> for more details.

</p>
</details>

<details>
<summary><b>Other</b></summary>
<p>
  The <a href="https://github.com/zeit/next.js">Next.js documentation</a> covers many other topics.
  This project was initially created using <a href="https://divjoy.com?ref=readme_other">Divjoy</a>, a React codebase generator. Feel free to ask questions in the <a href="https://spectrum.chat/divjoy">Divjoy forum</a> and we'll do our best to help you out.
</p>
</details>
