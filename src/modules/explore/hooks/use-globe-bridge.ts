"use client";

import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import {
  createCommandQueue,
  isFromFrame,
  parseGlobeMessage,
  type FrameCommand,
  type GlobeMessage,
} from "../domain/globe-messages";

type CommandQueue = ReturnType<typeof createCommandQueue>;

/** The page's queue of commands for the globe; they go out once the frame says "ready". */
export function useGlobeCommands(): CommandQueue {
  const [queue] = useState(createCommandQueue);
  return queue;
}

/**
 * Listens to the globe (the POC's onFrame): only messages from that frame's window and its
 * sandboxed origin, and only once they parse. Its "ready" releases the queued commands to that window.
 */
export function useGlobeMessages(
  frameRef: RefObject<HTMLIFrameElement | null>,
  queue: CommandQueue,
  onMessage: (message: GlobeMessage) => void,
): void {
  const handle = useEffectEvent(onMessage);

  useEffect(() => {
    function listen(event: MessageEvent) {
      const frame = frameRef.current?.contentWindow;
      if (!frame || !isFromFrame(event, frame)) return;
      const message = parseGlobeMessage(event.data);
      if (!message) return;
      if (message.type === "ready") {
        // An opaque origin cannot be named, so the target is "*"; the window is this page's own
        // frame, and the commands carry only coordinates and ids that are public anyway.
        queue.ready((command: FrameCommand) => frame.postMessage({ etd: 1, ...command }, "*"));
      }
      handle(message);
    }
    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, [frameRef, queue]);
}
