import { describe, expect, it } from "vitest";
import { eonetSourceName } from "./eonet-sources";

describe("eonetSourceName", () => {
  it("names the agencies behind the anomaly files", () => {
    expect(eonetSourceName("EO")).toBe("Earth Observatory");
    expect(eonetSourceName("GDACS")).toBe("Global Disaster Alert and Coordination System");
    expect(eonetSourceName("NOAA_NHC")).toBe("National Hurricane Center");
  });

  it("falls back to the EONET id", () => {
    expect(eonetSourceName("UNKNOWN_AGENCY")).toBe("UNKNOWN_AGENCY");
  });
});
