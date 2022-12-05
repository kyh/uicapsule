export const Login = () => {
  return (
    <form className="form">
      <div className="center">
        <hgroup>
          <h1>Log into your account</h1>
          <h2>Authentication generated with FX</h2>
        </hgroup>
      </div>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" placeholder="Email" />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="Password"
      />
      <button type="button" className="full">
        Login
      </button>
    </form>
  );
};

export default {
  title: "Pages/Login",
};
