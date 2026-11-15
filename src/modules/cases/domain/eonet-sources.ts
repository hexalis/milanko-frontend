/*
 * Names of the agencies that report events to NASA EONET, as the POC read them from its
 * events.json (`sources`). Proper names: they are not translated.
 */
const EONET_SOURCES: Readonly<Record<string, string>> = {
  AVO: "Alaska Volcano Observatory",
  ABFIRE: "Alberta Wildfire",
  AU_BOM: "Australia Bureau of Meteorology",
  BYU_ICE: "Brigham Young University Antarctic Iceberg Tracking Database",
  BCWILDFIRE: "British Columbia Wildfire Service",
  CALFIRE: "California Department of Forestry and Fire Protection",
  CEMS: "Copernicus Emergency Management Service",
  EO: "Earth Observatory",
  Earthdata: "Earthdata",
  FEMA: "Federal Emergency Management Agency (FEMA)",
  FloodList: "FloodList",
  GDACS: "Global Disaster Alert and Coordination System",
  GLIDE: "GLobal IDEntifier Number (GLIDE)",
  InciWeb: "InciWeb",
  IRWIN: "Integrated Reporting of Wildfire Information (IRWIN) Observer",
  IDC: "International Charter on Space and Major Disasters",
  JTWC: "Joint Typhoon Warning Center",
  MRR: "LANCE Rapid Response",
  MBFIRE: "Manitoba Wildfire Program",
  NASA_DISP: "NASA Earth Science Disasters Program",
  NOAA_NHC: "National Hurricane Center",
  NOAA_CPC: "NOAA Center for Weather and Climate Prediction",
  PDC: "Pacific Disaster Center",
  ReliefWeb: "ReliefWeb",
  SIVolcano: "Smithsonian Institution Global Volcanism Program",
  NATICE: "U.S. National Ice Center",
  UNISYS: "Unisys Weather",
  USGS_EHP: "USGS Earthquake Hazards Program",
  HDDS: "USGS Hazards Data Distribution System",
  DFES_WA: "Western Australia Department of Fire and Emergency Services",
};

/** Full agency name, or the EONET id when the agency is not in the list. */
export function eonetSourceName(id: string): string {
  return EONET_SOURCES[id] ?? id;
}
