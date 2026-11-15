import { createMilankoClient, unwrap } from "./client";

export type ApiHealth = {
  status: string;
  version: string;
  core_variables: number;
  database?: string;
};

export async function getHealth(): Promise<ApiHealth> {
  return unwrap(createMilankoClient().GET("/health"));
}
