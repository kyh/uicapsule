"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { FilterChip, ValueChip } from "../components/chip";
import { Field, Textarea } from "../components/field";
import { Specimen } from "../chrome";

const FILTERS = [
  { count: 12, label: "Failing" },
  { count: 4, label: "Flaky" },
  { count: 31, label: "Passing" },
] as const;

/** Fields, a textarea and chips. */
export const Inputs = () => {
  const [email, setEmail] = useState("oncall@northfield");

  const [note, setNote] = useState(
    "Answer in two sentences. Link the help article you used. Never promise a ship date.",
  );

  const [filters, setFilters] = useState<readonly string[]>(["Failing"]);

  const [people, setPeople] = useState<readonly string[]>([
    "Ines Duarte",
    "Platform team",
    "#incidents",
  ]);

  const invalid = email.length > 0 && !/^\S+@\S+\.\S+$/u.test(email);

  return (
    <>
      <Specimen name="Field" note="a pill; focus darkens the line, never a ring">
        <div className="v-fill v-stack">
          <Field
            icon={<Search aria-hidden />}
            label="Search runs"
            hideLabel
            placeholder="Search runs, prompts and traces"
          />
          <Field
            error={invalid ? "Add the part after the dot, such as .app" : undefined}
            hint="The agent pages this address when a run fails twice."
            label="Escalation email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </div>
      </Specimen>
      <Specimen name="Textarea" note="lines of text take the 10px overlay corner">
        <div className="v-fill">
          <Textarea
            hint={`${note.length} of 280 characters`}
            label="System prompt for the support agent"
            maxLength={280}
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
        </div>
      </Specimen>
      <Specimen
        name="Chip"
        note="filters toggle with a count; values remove with their own button"
        span={2}
      >
        <div className="v-stack v-text-center">
          <fieldset className="v-cluster v-center v-bare">
            <legend className="v-sr">Show eval cases</legend>
            {FILTERS.map((filter) => (
              <FilterChip
                count={filter.count}
                key={filter.label}
                onPressedChange={(on) =>
                  setFilters((list) =>
                    on ? [...list, filter.label] : list.filter((item) => item !== filter.label),
                  )
                }
                pressed={filters.includes(filter.label)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </fieldset>
          <fieldset className="v-cluster v-center v-bare">
            <legend className="v-sr">Notify</legend>
            {people.map((person) => (
              <ValueChip
                key={person}
                onRemove={() => setPeople((list) => list.filter((item) => item !== person))}
              >
                {person}
              </ValueChip>
            ))}
            {people.length === 0 ? (
              <span className="v-caption v-t2">Nobody is notified</span>
            ) : null}
          </fieldset>
        </div>
      </Specimen>
    </>
  );
};
