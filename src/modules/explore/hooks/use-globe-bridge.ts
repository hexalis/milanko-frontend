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
 *
 * The frame does not always stay the same: going back from the globe keeps this page hidden and
 * rebuilds the frame, and a failed load reloads it. Each time (this page shown or hidden, the frame
 * loading a new document) the queue holds the commands again, and "hello" asks a globe that is
 * already built to say "ready", so nothing (the rail's width, the flight to a case) goes to a window
 * that is gone.
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
    function hello() {
      queue.reset();
      frameRef.current?.contentWindow?.postMessage({ etd: 1, type: "hello" }, "*");
    }
    const element = frameRef.current;
    window.addEventListener("message", listen);
    element?.addEventListener("load", hello);
    hello();
    return () => {
      window.removeEventListener("message", listen);
      element?.removeEventListener("load", hello);
      queue.reset();
    };
  }, [frameRef, queue]);
}
