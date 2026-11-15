import { describe, expect, it } from "vitest";
import { localize, memberInitials, safeLink, teamMembers, type TeamMemberRecord } from "./team";

describe("localize", () => {
  it("reads plain strings and localized objects, falling back to English", () => {
    expect(localize("Jorge Ramos", "es")).toBe("Jorge Ramos");
    expect(localize({ en: "Team lead", es: "Líder" }, "es")).toBe("Líder");
    expect(localize({ en: "Team lead" }, "es")).toBe("Team lead");
    expect(localize(undefined, "en")).toBe("");
  });
});

describe("memberInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(memberInitials("Jorge Ramos")).toBe("JR");
    expect(memberInitials("ana maría de la cruz")).toBe("AM");
    expect(memberInitials("  Teammate   2 ")).toBe("T2");
  });
});

describe("safeLink", () => {
  it("keeps https links and valid email addresses only", () => {
    expect(safeLink({ type: "linkedin", url: "https://www.linkedin.com/in/x" })).toEqual({
      type: "linkedin",
      href: "https://www.linkedin.com/in/x",
    });
    expect(safeLink({ type: "email", url: "a@b.org" })).toEqual({
      type: "email",
      href: "mailto:a@b.org",
    });
    expect(safeLink({ type: "web", url: "http://insecure.example" })).toBeNull();
    expect(safeLink({ type: "web", url: "javascript:alert(1)" })).toBeNull();
    expect(safeLink({ type: "email", url: "not an address" })).toBeNull();
    expect(safeLink({ type: "fax", url: "https://example.org" })).toBeNull();
  });
});

describe("teamMembers", () => {
  const records: TeamMemberRecord[] = [
    { name: { en: "Teammate", es: "Integrante" }, placeholder: true, role: "Role" },
    {
      name: "Lead Person",
      lead: true,
      roles: [{ en: "Designer", es: "Diseñadora" }],
      bio: { en: "Built it.", es: "Lo construyó." },
      affiliation: "Lab",
      location: "Lima",
      link: "https://example.org",
    },
  ];

  it("puts the lead first and localizes every field", () => {
    const [lead, mate] = teamMembers("es", records);
    expect(lead).toMatchObject({
      name: "Lead Person",
      initials: "LP",
      isLead: true,
      roles: ["Diseñadora"],
      bio: "Lo construyó.",
      meta: "Lab · Lima",
      links: [{ type: "web", href: "https://example.org" }],
    });
    expect(mate).toMatchObject({ name: "Integrante", isPlaceholder: true, roles: ["Role"] });
  });

  it("reads the shipped team.json with its lead first", () => {
    const members = teamMembers("en");
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]?.isLead).toBe(true);
    expect(members.filter((member) => member.isLead)).toHaveLength(1);
  });
});
