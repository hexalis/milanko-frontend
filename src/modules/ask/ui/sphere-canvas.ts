import { paintSphere, projectSphere, type SphereGeometry, type Texture } from "../domain/sphere";

/*
 * Draws a textured sphere into a canvas (POC homeSphere's canvas half). The pixel math lives in
 * domain/sphere.ts; this sizes the canvas for the screen and adds the thin line of atmosphere on
 * the edge, which also hides the stair-steps of the pixels.
 */

const MAX_DPR = 2;
const RIM = "rgba(122, 159, 235, 0.55)";

export type SphereFrame = Omit<SphereGeometry, "width" | "height" | "dpr"> & {
  /** Canvas size in CSS pixels. */
  cssWidth: number;
  cssHeight: number;
  /** Blend texels (see paintSphere): for a sphere painted once. */
  smooth?: boolean;
};

/** A function that paints the sphere turned by `turn` radians, or undefined without a 2D canvas. */
export function createSpherePainter(
  canvas: HTMLCanvasElement,
  frame: SphereFrame,
  texture: Texture,
): ((turn: number) => void) | undefined {
  const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
  const { cssWidth, cssHeight, smooth = false, ...geometry } = frame;
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  const map = projectSphere({ ...geometry, width, height, dpr });
  const image = context.createImageData(width, height);
  return (turn) => {
    paintSphere(map, texture, turn, image.data, smooth);
    context.putImageData(image, 0, 0);
    context.beginPath();
    context.arc(geometry.cx * dpr, geometry.cy * dpr, geometry.r * dpr - 0.5, 0, Math.PI * 2);
    context.lineWidth = 1.5 * dpr;
    context.strokeStyle = RIM;
    context.stroke();
  };
}
