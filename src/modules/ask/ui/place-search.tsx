"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { withBasePath } from "@/shared/lib/base-path";
import { Icon } from "@/shared/ui/icon";
import { TextInput } from "@/shared/ui/field";
import { foundName, MIN_QUERY, type FoundPlace, type PlacePoint } from "../domain/place";

/*
 * "My own place" in the builder (POC askBindBuilder #buildPlaceForm): the reader types a city, the
 * site lists the places it matches (Open-Meteo, through /place/search), and picking one writes its
 * point into the builder's form, which submits. The URL then holds lat, lon and name, and "Your
 * question" can open the place's page. The text typed is not a form field: only a found place is.
 */

type Labels = {
  label: string;
  placeholder: string;
  searching: string;
  /** "{q}" stands for what was typed. */
  notFound: string;
  note: string;
};

type PlaceSearchProps = { point: PlacePoint | undefined; labels: Labels };

type Search =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; places: FoundPlace[] }
  | { status: "none"; query: string };

const DEBOUNCE_MS = 280;

const OPTION = [
  "flex w-full min-h-touch-min items-center gap-3 rounded-[14px] px-3 py-2 text-start",
  "text-body-m text-text-primary transition-colors duration-fast hover:bg-bg-hover",
  "focus-visible:focus-ring focus-visible:outline-focus-ring",
].join(" ");

export function PlaceSearch({ point, labels }: PlaceSearchProps) {
  const id = useId();
  const [query, setQuery] = useState(point?.name ?? "");
  const [search, setSearch] = useState<Search>({ status: "idle" });
  const fields = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();
  // The place already in the URL needs no search until the reader types something else.
  const isPointName = Boolean(point?.name) && typed === point?.name;

  useEffect(() => {
    if (typed.length < MIN_QUERY || isPointName) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearch({ status: "searching" });
      try {
        const response = await fetch(withBasePath(`/place/search?q=${encodeURIComponent(typed)}`), {
          signal: controller.signal,
        });
        const body = (await response.json()) as { places?: FoundPlace[] };
        const places = body.places ?? [];
        setSearch(places.length ? { status: "found", places } : { status: "none", query: typed });
      } catch {
        if (!controller.signal.aborted) setSearch({ status: "none", query: typed });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [typed, isPointName]);

  /** Writes the place into the builder's hidden fields and submits the form (the URL keeps it). */
  function choose(place: FoundPlace) {
    const holder = fields.current;
    const form = input.current?.form;
    if (!holder || !form) return;
    const values = { lat: place.lat.toFixed(2), lon: place.lon.toFixed(2), name: foundName(place) };
    for (const [name, value] of Object.entries(values)) {
      const field = holder.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (field) field.value = value;
    }
    setQuery(values.name);
    setSearch({ status: "idle" });
    form.requestSubmit();
  }

  // Enter picks the first match instead of submitting the half-typed name.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (search.status === "found" && search.places[0]) choose(search.places[0]);
  }

  const showsList = !isPointName && typed.length >= MIN_QUERY;

  return (
    <div className="flex flex-col gap-2.5">
      <div ref={fields} hidden>
        <input type="hidden" name="lat" defaultValue={point?.lat.toFixed(2) ?? ""} />
        <input type="hidden" name="lon" defaultValue={point?.lon.toFixed(2) ?? ""} />
        <input type="hidden" name="name" defaultValue={point?.name ?? ""} />
      </div>
      <label className="text-label-m text-text-secondary grid gap-1.5 font-semibold">
        {labels.label}
        <TextInput
          ref={input}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-describedby={`${id}-status ${id}-note`}
        />
      </label>
      <div id={`${id}-status`} aria-live="polite" className="empty:hidden">
        {showsList && search.status === "searching" ? (
          <p className="text-body-s text-text-secondary m-0">{labels.searching}</p>
        ) : null}
        {showsList && search.status === "none" ? (
          <p className="text-body-s text-text-secondary m-0">
            {labels.notFound.replace("{q}", search.query)}
          </p>
        ) : null}
      </div>
      {showsList && search.status === "found" ? (
        <ul className="rounded-card bg-bg-surface shadow-card m-0 flex list-none flex-col gap-0.5 p-1.5">
          {search.places.map((place) => (
            <li key={`${place.lat},${place.lon}`}>
              <button type="button" className={OPTION} onClick={() => choose(place)}>
                <span className="text-icon-secondary flex-none">
                  <Icon name="map-pin" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{place.name}</span>
                  {place.admin ? (
                    <span className="text-body-s text-text-secondary">{place.admin}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p id={`${id}-note`} className="text-body-s text-text-secondary m-0">
        {labels.note}
      </p>
    </div>
  );
}
