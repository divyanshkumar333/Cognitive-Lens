export interface EnvironmentScore {
  brightness: number;
  glare: number;
  clutter: number;
  noise: number;
  status: "dim" | "good" | "glare" | "cluttered" | "noisy";
  narration: string;
  recommendedMode: "normal" | "high-contrast" | "calm" | "focus" | "noisy";
}

const GLARE_THRESHOLD = 240;
const GLARE_PERCENT_ALERT = 8;
const DIM_BRIGHTNESS_ALERT = 35;
const CLUTTER_ALERT = 55;
const NOISE_ALERT = 45;

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function estimateClutter(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let varianceSum = 0;
  let count = 0;

  const step = 4;
  for (let y = 0; y < height - step; y += step) {
    for (let x = 0; x < width - step; x += step) {
      const i = (y * width + x) * 4;
      const iRight = (y * width + (x + step)) * 4;
      const iDown = ((y + step) * width + x) * 4;

      if (iRight >= data.length || iDown >= data.length) continue;

      const l = luminance(data[i], data[i + 1], data[i + 2]);
      const lRight = luminance(data[iRight], data[iRight + 1], data[iRight + 2]);
      const lDown = luminance(data[iDown], data[iDown + 1], data[iDown + 2]);

      varianceSum += Math.abs(l - lRight) + Math.abs(l - lDown);
      count++;
    }
  }

  if (count === 0) return 0;

  const avgVariance = varianceSum / (count * 2);
  return Math.min(100, Math.round((avgVariance / 60) * 100));
}

export function scoreFrame(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  noiseLevel = 0
): EnvironmentScore {
  let total = 0;
  let count = 0;
  let blownOut = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const l = luminance(r, g, b);
    total += l;
    count++;

    if (l > GLARE_THRESHOLD) {
      blownOut++;
    }
  }

  const brightness = count > 0 ? Math.round((total / count) * (100 / 255)) : 0;
  const glare = count > 0 ? Math.round((blownOut / count) * 100) : 0;
  const clutter = estimateClutter(data, width, height);
  const noise = Math.round(noiseLevel);

  let status: EnvironmentScore["status"] = "good";
  let narration = "Workspace looks clear. Optimal reading conditions.";
  let recommendedMode: EnvironmentScore["recommendedMode"] = "normal";

  if (noise >= NOISE_ALERT) {
    status = "noisy";
    narration = "Noisy environment detected - narrowing focus to one line at a time.";
    recommendedMode = "noisy";
  } else if (glare >= GLARE_PERCENT_ALERT) {
    status = "glare";
    narration = "Detected glare - switching to high-contrast mode.";
    recommendedMode = "high-contrast";
  } else if (brightness <= DIM_BRIGHTNESS_ALERT) {
    status = "dim";
    narration = "Low light detected - brightening the interface.";
    recommendedMode = "calm";
  } else if (clutter >= CLUTTER_ALERT) {
    status = "cluttered";
    narration = "Busy visual environment - simplifying to reduce load.";
    recommendedMode = "focus";
  }

  return { brightness, glare, clutter, noise, status, narration, recommendedMode };
}
