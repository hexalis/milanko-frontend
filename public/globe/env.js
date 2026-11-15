/* Runtime configuration for the static portal.
   This checked-in copy is the local default; deploy-vps.yml and pages.yml overwrite it in
   the generated _site/ with the environment-specific values.
   Local default: same-origin API (the portal falls back to the snapshots if it is down). */
window.ETD_CONFIG = window.ETD_CONFIG || {
  environment: "local",
  apiBase: "/api/v1",
};
