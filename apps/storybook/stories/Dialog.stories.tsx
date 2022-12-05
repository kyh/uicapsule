import { useState } from "react";

export const Dialog = () => {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>Toggle Dialog</button>
      <dialog open={open}>
        <div>
          <header>
            <h3>Payment successful</h3>
          </header>
          <p>
            Your payment has been successfully submitted. We’ve sent you an
            email with all of the details of your order.
          </p>
          <footer>
            <button type="button" onClick={() => setOpen(false)}>
              Got it, thanks!
            </button>
          </footer>
        </div>
      </dialog>
    </section>
  );
};

export default {
  title: "Components/Dialog",
};
