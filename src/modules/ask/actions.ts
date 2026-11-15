"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCaseCatalog } from "@/modules/cases";
import { askHref, DEPTH_COOKIE, DEPTHS, parseHunch, parseStep } from "./domain/ask-state";
import { getRules } from "./domain/engine";
import { openGuided } from "./domain/guided";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const field = (form: FormData, key: string): string | undefined => {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
};

/**
 * Depth switch of the guided investigation: remembers the choice for the next visit (the POC's
 * localStorage "etd-depth") and reopens the same step with the depth in the link. The target is
 * rebuilt from validated parts, never taken from the form as a URL.
 */
export async function chooseDepth(form: FormData): Promise<void> {
  const id = field(form, "qid") ?? "";
  const depth = DEPTHS.find((candidate) => candidate === field(form, "depth"));
  if (!depth || !openGuided(getRules(), getCaseCatalog(), id)) redirect("/ask");
  (await cookies()).set(DEPTH_COOKIE, depth, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  const query = { step: field(form, "step"), h: field(form, "h") };
  redirect(askHref(id, { step: parseStep(query), depth, hunch: parseHunch(query) }));
}
