import { useEffect, useState } from "react";
import { EARTH_TEXTURE_URL, type Texture } from "../domain/sphere";

/*
 * NASA's Blue Marble, read once per page load and shared by the home's planet and its horizon
 * (POC ask.js homeEarth). The image is cross-origin; GIBS sends CORS headers, so its pixels can be
 * read. A failure is forgotten, so the next mount tries again; meanwhile the drawn planet stays.
 */

let pending: Promise<Texture> | undefined;

function readPixels(image: HTMLImageElement): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("No 2D canvas to read the Earth texture");
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data };
}

function loadEarthTexture(): Promise<Texture> {
  pending ??= new Promise<Texture>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.addEventListener("load", () => {
      try {
        resolve(readPixels(image));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
    image.addEventListener("error", () => reject(new Error("The Earth texture did not load")));
    image.src = EARTH_TEXTURE_URL;
  });
  pending.catch(() => {
    pending = undefined;
  });
  return pending;
}

/** The Earth texture once it has loaded; undefined while loading, offline or blocked. */
export function useEarthTexture(): Texture | undefined {
  const [texture, setTexture] = useState<Texture>();
  useEffect(() => {
    let isMounted = true;
    loadEarthTexture()
      .then((loaded) => {
        if (isMounted) setTexture(loaded);
      })
      // Offline or blocked: the drawn planet stands in, as in the POC.
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);
  return texture;
}
