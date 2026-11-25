import { Lock, ShoppingBag, ShoppingBasket, TrainFront } from "lucide-react";
import { useState } from "react";

import { Amount } from "../components/amount";
import { Button } from "../components/button";
import { Dialog } from "../components/dialog";
import { Dropzone } from "../components/dropzone";
import { ListIcon } from "../components/list";
import { ReceiptMatch } from "../components/receipt-match";
import { useToast } from "../components/toast";
import { RECEIPTS } from "../data/money";
import { formatAmount } from "../lib/format";

import "./app.css";

import "./receipts.css";

type Charge = "ask" | "locked" | "mine";

const CARD_RECENT = [
  { amount: -64.38, icon: ShoppingBasket, name: "Pinecone Grocers", when: "Yesterday, 6:12 pm" },
  { amount: -2.9, icon: TrainFront, name: "Northline Transit", when: "Yesterday, 8:04 am" },
] as const;

const plural = (count: number, word: string) => `${String(count)} ${word}${count === 1 ? "" : "s"}`;

export const ReceiptsScreen = () => {
  const toast = useToast();
  const [added, setAdded] = useState<string[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [charge, setCharge] = useState<Charge>("ask");
  const [confirm, setConfirm] = useState(false);

  const rows = RECEIPTS.map((row) =>
    row.state === "missing" && added.includes(row.merchant)
      ? { ...row, state: "matched" as const }
      : row,
  );

  const missing = rows.filter((row) => row.state === "missing");
  const ready = rows.length - missing.length;
  const unsent = ready - sentCount;
  const [nextMissing] = missing;

  const attach = (merchant: string) => setAdded((list) => [...list, merchant]);

  const reset = () => {
    setAdded([]);
    setSentCount(0);
  };

  let action = {
    label: `Send ${plural(unsent, "receipt")} to Dana`,
    run: () => setSentCount(ready),
  };

  let status = `${plural(ready, "receipt")} ready for Dana, your accountant. ${missing.length > 0 ? `${plural(missing.length, "photo")} still to take.` : "Nothing missing."}`;

  if (unsent === 0 && nextMissing) {
    action = { label: `Add ${nextMissing.merchant}`, run: () => attach(nextMissing.merchant) };
    status = `Dana has ${plural(sentCount, "receipt")}. ${nextMissing.merchant} is next: add its photo and it goes with the rest.`;
  } else if (unsent === 0) {
    action = { label: "Done", run: reset };
    status = `Dana has all ${String(rows.length)} November receipts at dana@brightledger.co.`;
  }

  return (
    <div className="cl-app cl-split cl-receipts-screen">
      <div className="cl-receipts">
        <div className="cl-app__h-row">
          <h4 className="cl-app__h">November receipts</h4>
          <span className="cl-count">
            {ready} of {rows.length} paired
          </span>
        </div>
        <ul className="cl-matches">
          {rows.map((row) => (
            <ReceiptMatch
              amount={row.amount}
              date={row.date}
              key={row.merchant}
              merchant={row.merchant}
              note={"note" in row ? row.note : undefined}
              onAdd={() => attach(row.merchant)}
              state={row.state}
            />
          ))}
        </ul>
        <Dropzone
          hint="Photos or PDFs, 10 MB each at most"
          label="Drop receipts here, or press to pick files"
          onFiles={(names) => {
            if (names.length === 0) {
              return;
            }

            if (nextMissing) {
              attach(nextMissing.merchant);
            }

            toast.show({
              description: nextMissing ? `Paired with ${nextMissing.merchant}` : undefined,
              title: `Read ${plural(names.length, "file")}`,
            });
          }}
        />
        <div className="cl-pay-row">
          <Button block onClick={() => action.run()} size="lg">
            {action.label}
          </Button>
        </div>
        <p aria-live="polite" className="cl-app__lead">
          {status}
        </p>
      </div>
      <aside aria-labelledby="cl-charge-title" className="cl-charge">
        <h4 className="cl-app__h" id="cl-charge-title">
          Do you know this charge?
        </h4>
        <p className="cl-app__lead">
          Card ··2208 paid a shop you have never used, at 3:41 am, in another country.
        </p>
        <div className="cl-charge__row">
          <ListIcon icon={ShoppingBag} tone="danger" />
          <span className="cl-row__text">
            <span className="cl-row__title">Velo Parts Co.</span>
            <span className="cl-row__desc">Rotterdam, today 3:41 am</span>
          </span>
          <Amount tone="danger" value={-212} />
        </div>
        <div aria-live="polite" className="cl-charge__foot">
          {charge === "ask" ? (
            <>
              <Button
                block
                icon={<Lock aria-hidden size={16} strokeWidth={1.75} />}
                onClick={() => setConfirm(true)}
                variant="solid"
              >
                Lock card
              </Button>
              <Button block onClick={() => setCharge("mine")} variant="secondary">
                Yes, I bought it
              </Button>
            </>
          ) : (
            <p className="cl-charge__done">
              {charge === "locked"
                ? "Card ··2208 is locked. We have asked Velo Parts Co. for the $212.00 back."
                : "Got it. Velo Parts Co. is now a shop you use."}
              <button className="cl-link" onClick={() => setCharge("ask")} type="button">
                Undo
              </button>
            </p>
          )}
        </div>
        <h5 className="cl-charge__h">Earlier on this card</h5>
        <ul className="cl-charge__recent">
          {CARD_RECENT.map((row) => (
            <li key={row.name}>
              <ListIcon icon={row.icon} />
              <span className="cl-row__text">
                <span className="cl-row__title">{row.name}</span>
                <span className="cl-row__desc">{row.when}</span>
              </span>
              <span>{formatAmount(row.amount)}</span>
            </li>
          ))}
        </ul>
      </aside>
      <Dialog
        description="Card payments stop until you unlock it under Cards. Rent and Cobalt Mobile switch to paying from Everyday meanwhile."
        footer={
          <>
            <Button onClick={() => setConfirm(false)} variant="ghost">
              Keep it on
            </Button>
            <Button
              onClick={() => {
                setCharge("locked");
                setConfirm(false);
              }}
              variant="destructive"
            >
              Lock card
            </Button>
          </>
        }
        kind="alert"
        onOpenChange={setConfirm}
        open={confirm}
        size="sm"
        title="Lock card ··2208?"
      />
    </div>
  );
};
