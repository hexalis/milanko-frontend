import { Notice } from "@/shared/ui/notice";

type ApiStatusProps =
  | { isAvailable: true; version: string; coreVariables: number; database?: string }
  | { isAvailable: false; reason: string };

export function ApiStatus(props: ApiStatusProps) {
  if (!props.isAvailable) {
    return <Notice tone="error">La API no responde: {props.reason}</Notice>;
  }
  return (
    <Notice>
      API en línea · versión {props.version} · {props.coreVariables} variables núcleo
      {props.database ? ` · base de datos ${props.database}` : ""}
    </Notice>
  );
}
