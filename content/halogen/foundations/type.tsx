import { TYPE_ROLES } from "./tokens";

/** The real type scale, each role set in itself. */
export const TypeScale = () => (
  <div className="hx-frame">
    <div className="hx-table-wrap">
      <table className="hx-table hx-ftable">
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Sample</th>
            <th scope="col">Size/line · tracking</th>
            <th scope="col">Use for</th>
          </tr>
        </thead>
        <tbody>
          {TYPE_ROLES.map((role) => (
            <tr key={role.cls}>
              <td data-label="Role" data-nowrap>
                .{role.cls}
              </td>
              <td className="hx-type-cell" data-label="Sample">
                <span className={`${role.cls} hx-type-sample`}>{role.sample}</span>
              </td>
              <td data-dim data-label="Size" data-nowrap>
                {role.spec}
              </td>
              <td data-dim data-label="Use for" data-sans>
                {role.use}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="hx-foot hx-ink-2 hx-caption hx-between">
      <span>
        Words to read use Inter Display where it is installed, else the system sans. Words to scan
        use Commit Mono where installed, else the system mono. Both at 400, always.
      </span>
      <span className="hx-code-sm">Mono inside a sentence sets at 0.86em</span>
    </div>
  </div>
);

/** The three voices on one line of real interface. */
export const Voices = () => (
  <div className="hx-dodont hx-voices hx-frame">
    <div>
      <span className="hx-label-sm hx-ink-3">Capitals: a control or a heading</span>
      <span className="hx-label">Queue depth</span>
      <p className="hx-caption hx-ink-2">
        Buttons, tabs, column heads, strip labels. Typed in sentence case; the role raises it.
      </p>
    </div>
    <div>
      <span className="hx-label-sm hx-ink-3">Mono, untouched: a value</span>
      <span className="hx-code">wh-ledger-prod · 412 GB spilled</span>
      <p className="hx-caption hx-ink-2">
        Identifiers, paths, counts and times keep the exact case they were stored in.
      </p>
    </div>
    <div>
      <span className="hx-label-sm hx-ink-3">Sans: a sentence</span>
      <span className="hx-body">
        Column <code>phone</code> became <code>phone_e164</code> at 06:20.
      </span>
      <p className="hx-caption hx-ink-2">
        Explanations and headlines, in sentence case and one weight.
      </p>
    </div>
  </div>
);
