import { Receipt } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { Empty } from "../components/empty";
import { ErrorState } from "../components/error-state";
import { Skeleton } from "../components/skeleton";
import { Spinner } from "../components/spinner";
import { useToast } from "../components/toast";
import { Specimen } from "../shell";

import "./specimens.css";

export const FeedbackSpecimens = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    if (!retrying) {
      return;
    }

    const done = window.setTimeout(() => setRetrying(false), 1200);

    return () => window.clearTimeout(done);
  }, [retrying]);

  return (
    <>
      <Specimen
        name="Toast"
        note="Reports what just happened, in the past tense, and offers a single action if any. It waits while you point at it or tab into it, then leaves after five seconds, or eight with Undo."
      >
        <div className="cl-spec-row">
          <Button
            onClick={() =>
              toast.show({
                action: {
                  label: "Undo",
                  onClick: () => toast.show({ title: "Moved $50.00 back to Everyday" }),
                },
                title: "Moved $50.00 to Kyoto in April",
              })
            }
            variant="secondary"
          >
            Move $50.00
          </Button>
          <Button
            onClick={() =>
              toast.show({ description: "Sunday, 6 pm", title: "Weekly summary turned on" })
            }
            variant="outline"
          >
            Turn on summary
          </Button>
        </div>
      </Specimen>
      <Specimen
        name="Spinner"
        note="The only loop in the system. It sits inside the control that is waiting, with a label for screen readers."
      >
        <div className="cl-spec-row">
          {waiting ? <Spinner label="Checking the payee" /> : null}
          <span className="cl-note">
            {waiting ? "Checking the payee's details" : "Payee checked: Teodor Varga"}
          </span>
          <Button onClick={() => setWaiting(!waiting)} size="sm" variant="secondary">
            {waiting ? "Finish" : "Check again"}
          </Button>
        </div>
      </Specimen>
      <Specimen
        name="Skeleton"
        note="Flat paper shapes the size of what is on its way. Nothing shimmers, and an old number never stands in for a new one."
      >
        <div className="cl-spec-col">
          <div className="cl-skel-row">
            {loading ? (
              <>
                <Skeleton height={40} round width={40} />
                <span className="cl-skel-lines">
                  <Skeleton width="60%" />
                  <Skeleton height={10} width="35%" />
                </span>
                <Skeleton height={24} width={64} />
              </>
            ) : (
              <>
                <span className="cl-avatar">PG</span>
                <span className="cl-row__text">
                  <span className="cl-row__title">Pinecone Grocers</span>
                  <span className="cl-row__desc">Yesterday</span>
                </span>
                <span className="cl-row__trail">−$64.38</span>
              </>
            )}
          </div>
          <Button onClick={() => setLoading(!loading)} size="sm" variant="secondary">
            {loading ? "Finish loading" : "Load again"}
          </Button>
        </div>
      </Specimen>
      <Specimen
        name="Empty"
        note="Says what will show up here and how to get it there, with at most one action."
      >
        {receipt ? (
          <div className="cl-spec-col">
            <p className="cl-note">Quill &amp; Fold, $129.00, paired with its payment on Nov 11.</p>
            <Button onClick={() => setReceipt(false)} size="sm" variant="secondary">
              Empty it again
            </Button>
          </div>
        ) : (
          <Empty
            action={
              <Button onClick={() => setReceipt(true)} size="sm" variant="secondary">
                Add a receipt
              </Button>
            }
            icon={Receipt}
            title="No receipts for December yet"
          >
            Snap one, or forward the email to receipts@clementine.app, and it lands here beside its
            payment.
          </Empty>
        )}
      </Specimen>
      <Specimen
        name="Error state"
        note="Names what failed and what still holds, then offers the way forward. Red words sit on the red wash."
      >
        <ErrorState
          action={
            <Button onClick={() => setRetrying(true)} pending={retrying} size="sm" variant="solid">
              Try again
            </Button>
          }
          title="Harbor Credit Union is not answering"
        >
          The balance shown is from 9:40 am. No money moved while we were cut off.
        </ErrorState>
      </Specimen>
    </>
  );
};
