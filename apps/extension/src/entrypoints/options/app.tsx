import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Logo } from "@repo/ui/components/logo";
import { Switch } from "@repo/ui/components/switch";

import { DEFAULT_SERVICE_URL, preferencesItem, serviceUrlItem } from "@/lib/storage";

const ALL_SITES = { origins: ["<all_urls>"] };

const parseServiceUrl = (value: string) => {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
};

export const App = () => {
  const [serviceUrl, setServiceUrl] = useState(DEFAULT_SERVICE_URL);
  const [saved, setSaved] = useState(false);
  const [allSites, setAllSites] = useState(false);
  const [preferences, setPreferences] = useState({ html: true, video: true });

  useEffect(() => {
    const load = async () => {
      setServiceUrl(await serviceUrlItem.getValue());
      setAllSites(await browser.permissions.contains(ALL_SITES));
      setPreferences(await preferencesItem.getValue());
    };

    void load();
  }, []);

  const save = async () => {
    const parsed = parseServiceUrl(serviceUrl);

    if (parsed === null || parsed === "") {
      return;
    }

    await serviceUrlItem.setValue(parsed);
    setServiceUrl(parsed);
    setSaved(true);
  };

  const setPreference = (key: "html" | "video", value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    void preferencesItem.setValue(next);
  };

  const toggleAllSites = async () => {
    setAllSites(
      allSites
        ? !(await browser.permissions.remove(ALL_SITES))
        : await browser.permissions.request(ALL_SITES),
    );
  };

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <header className="flex items-center gap-3">
        <Logo className="size-7" />
        <div>
          <h1 className="font-semibold">UICapsule</h1>
          <p className="text-sm text-muted-foreground">
            Click the toolbar icon, press ⌥⇧R or right-click a page to capture a component request.
          </p>
        </div>
      </header>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="service">Files requests with</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="service"
              value={serviceUrl}
              onChange={(event) => {
                setSaved(false);
                setServiceUrl(event.target.value);
              }}
            />
            <Button
              variant="outline"
              disabled={parseServiceUrl(serviceUrl) === null}
              onClick={() => {
                void save();
              }}
            >
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
          <FieldDescription>
            Use http://localhost:3000 while developing UICapsule locally.
          </FieldDescription>
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="video"
            checked={preferences.video}
            onCheckedChange={(checked) => {
              setPreference("video", checked);
            }}
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="video">Attach video</FieldLabel>
            <FieldDescription>
              When the capture is a video, attach the video file or a few seconds of it.
            </FieldDescription>
          </div>
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="html"
            checked={preferences.html}
            onCheckedChange={(checked) => {
              setPreference("html", checked);
            }}
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="html">Include HTML</FieldLabel>
            <FieldDescription>
              When you snap to an element, send its markup (scripts and inline handlers stripped).
            </FieldDescription>
          </div>
        </Field>

        <Field>
          <FieldLabel>Videos from other sites</FieldLabel>
          <div>
            <Button
              variant={allSites ? "outline" : "default"}
              onClick={() => {
                void toggleAllSites();
              }}
            >
              {allSites ? "Revoke access" : "Allow"}
            </Button>
          </div>
          <FieldDescription>
            Picked videos are often served from another domain. With access, the extension attaches
            the video file itself; without it, it records a few seconds of the video instead, or
            links it when the site doesn&apos;t allow recording.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </main>
  );
};
