import type { Point } from "@/types";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type FaceFrame = {
  landmarks: Point[];
  blendshapes: Record<string, number>;
};

export type LandmarkerHandle = {
  detect(video: HTMLVideoElement, timestampMs: number): FaceFrame | null;
  draw(
    ctx: CanvasRenderingContext2D,
    landmarks: Point[],
    width: number,
    height: number,
  ): void;
  close(): void;
};

type VisionModule = typeof import("@mediapipe/tasks-vision");

export async function createFaceLandmarker(): Promise<LandmarkerHandle> {
  const vision: VisionModule = await import("@mediapipe/tasks-vision");
  const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

  const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
  const options = {
    runningMode: "VIDEO" as const,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  };

  let landmarker: Awaited<ReturnType<typeof FaceLandmarker.createFromOptions>>;
  try {
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    });
  } catch {
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    });
  }

  type MeshDrawer = {
    drawConnectors: (
      landmarks?: Point[],
      connections?: unknown,
      style?: { color?: string; lineWidth?: number },
    ) => void;
  };

  let drawing: MeshDrawer | null = null;
  let boundCtx: CanvasRenderingContext2D | null = null;
  let lastW = 0;
  let lastH = 0;

  return {
    detect(video, timestampMs) {
      const result = landmarker.detectForVideo(video, timestampMs);
      const face = result.faceLandmarks[0];
      if (!face || face.length < 455) return null;
      const blendshapes: Record<string, number> = {};
      const categories = result.faceBlendshapes?.[0]?.categories ?? [];
      for (const category of categories) {
        if (category.categoryName) {
          blendshapes[category.categoryName] = category.score ?? 0;
        }
      }
      return { landmarks: face as Point[], blendshapes };
    },
    draw(ctx, landmarks, width, height) {
      if (boundCtx !== ctx || lastW !== width || lastH !== height) {
        drawing = new DrawingUtils(ctx) as MeshDrawer;
        boundCtx = ctx;
        lastW = width;
        lastH = height;
      }
      if (!drawing) return;
      ctx.clearRect(0, 0, width, height);
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "rgba(94, 224, 176, 0.22)", lineWidth: 0.45 },
      );
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#7CFFCB", lineWidth: 1.35 },
      );
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#7CFFCB", lineWidth: 1.35 },
      );
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#E4C36B", lineWidth: 1.55 },
      );
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#E4C36B", lineWidth: 1.55 },
      );
      drawing.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "rgba(231, 243, 236, 0.28)", lineWidth: 0.8 },
      );
    },
    close() {
      landmarker.close();
    },
  };
}
