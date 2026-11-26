import { Button } from "../components/button";
import { Panel, Shell } from "../components/card";

/** No shadows: four levels drawn with surfaces, rings and the scrim. */
export const ElevationFoundation = () => (
  <>
    <div className="v-levels">
      <div className="v-level">
        <div className="v-level-stage">
          <span className="v-caption v-t2">The page</span>
        </div>
        <p className="v-caption">
          page <span className="v-t2">· a half step under paper</span>
        </p>
      </div>
      <div className="v-level">
        <div className="v-level-stage">
          <Shell className="v-level-card">
            <Panel padded>
              <span className="v-caption">A card</span>
            </Panel>
          </Shell>
        </div>
        <p className="v-caption">
          card <span className="v-t2">· shell and panel</span>
        </p>
      </div>
      <div className="v-level">
        <div className="v-level-stage">
          <div className="v-overlay v-level-pop">
            <span className="v-caption">An overlay</span>
          </div>
        </div>
        <p className="v-caption">
          overlay <span className="v-t2">· paper, ringed</span>
        </p>
      </div>
      <div className="v-level">
        <div className="v-level-stage">
          <span className="v-level-scrim" />
          <Shell className="v-level-dialog">
            <Panel padded>
              <span className="v-caption">A dialog</span>
            </Panel>
          </Shell>
        </div>
        <p className="v-caption">
          dialog <span className="v-t2">· a shell over the scrim</span>
        </p>
      </div>
    </div>
    <div className="v-stage v-cluster v-gap-20 v-pad-20">
      <div inert>
        <Button>Glass</Button>
      </div>
      <p className="v-body-sm v-t2 v-level-note">
        The only depth a control may have is drawn inside its pill: a gloss along the top, a darker
        core and a bright rim. Nothing falls outside it, and no card, header, tag or field gets it.
      </p>
    </div>
  </>
);
