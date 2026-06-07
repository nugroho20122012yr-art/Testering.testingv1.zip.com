import { CrayonMode } from "./types";

/**
 * Highly optimized, premium crayon style rendering engine.
 * Converts an HTMLImageElement into an authentic hand-drawn wax crayon sketch.
 */
export function renderCrayonArtwork(
  sourceImage: HTMLImageElement,
  mode: CrayonMode,
  options: {
    textureIntensity: number; // 0 to 100
    outlineStrength: number;   // 0 to 100
    paperGrain: number;        // 0 to 100
    colorCount: number;        // 2 to 32 (color simplification)
  }
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Set maximum render size to keep processing fast while maintaining high fidelity (e.g., max width/height 1000px)
  const maxDim = 1000;
  let width = sourceImage.naturalWidth || sourceImage.width || 800;
  let height = sourceImage.naturalHeight || sourceImage.height || 600;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;

  // Step 1: Draw the original image onto our canvas
  ctx.drawImage(sourceImage, 0, 0, width, height);

  // Step 2: Grab the pixel data for custom crayon filtering
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Palette mappings for 9 crayon systems (Hex values mapped to math scales)
  // Each mono mode has a base RGB vector
  const monoBaseColors: Record<Exclude<CrayonMode, "multi">, [number, number, number]> = {
    red: [215, 38, 56],      // Crimson Red
    blue: [26, 117, 239],     // Deep Sky Blue
    green: [34, 139, 34],     // Forest Green
    yellow: [249, 191, 59],   // Golden Wax Yellow
    orange: [242, 120, 75],    // Sunshine Orange
    violet: [155, 89, 182],   // Royal Velvet Violet
    brown: [139, 90, 43],     // Earth Sienna Brown
    black: [44, 53, 57],      // Organic Charcoal Black
  };

  const paperGrainStrength = options.paperGrain / 100;
  const waxTextureStrength = options.textureIntensity / 100;
  const outlineStrength = options.outlineStrength / 100;
  const kColors = options.colorCount;

  // Let's perform color quantization and crayon texturizing
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Compute luminance/brightness
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    let targetR = r;
    let targetG = g;
    let targetB = b;

    if (mode === "multi") {
      // Color Quantization to make colors look like they came from a box of limited crayons
      // Simple cluster interval
      const qInterval = Math.max(8, Math.round(256 / kColors));
      targetR = Math.min(255, Math.round(r / qInterval) * qInterval);
      targetG = Math.min(255, Math.round(g / qInterval) * qInterval);
      targetB = Math.min(255, Math.round(b / qInterval) * qInterval);

      // Slightly enrich saturation to mimic vivid wax pigments
      const avg = (targetR + targetG + targetB) / 3;
      targetR = Math.min(255, Math.max(0, Math.round(avg + 1.25 * (targetR - avg))));
      targetG = Math.min(255, Math.max(0, Math.round(avg + 1.25 * (targetG - avg))));
      targetB = Math.min(255, Math.max(0, Math.round(avg + 1.25 * (targetB - avg))));
    } else {
      // Monochrome Crayon Mapping
      const base = monoBaseColors[mode];
      // Blend base crayon pigment with a white paper background based on luminance
      // Dark areas are fully colored with base pigment; bright areas approach white paper
      const inkFactor = 1 - luma / 255; // 0 (brightest) to 1 (darkest)
      
      // Quantize grayscale steps for a more stylized, stepped wax-shading effect
      const steps = kColors;
      const stepInkFactor = Math.round(inkFactor * steps) / steps;

      targetR = Math.round(255 - (255 - base[0]) * stepInkFactor);
      targetG = Math.round(255 - (255 - base[1]) * stepInkFactor);
      targetB = Math.round(255 - (255 - base[2]) * stepInkFactor);
    }

    // Apply high-frequency wax granular noise
    // Wax pigment skips microscopic recesses in paper, creating a grainy/rough pattern
    const pxCoordX = (i / 4) % width;
    const pxCoordY = Math.floor((i / 4) / width);

    // Fractal-like high-frequency pattern simulation using sin/cos of pixel coordinates
    const fineNoiseVal = Math.sin(pxCoordX * 1.7) * Math.cos(pxCoordY * 2.3) +
                         Math.sin(pxCoordY * 4.1 + pxCoordX * 0.9) * 0.5;
    
    // Add subtle paper grain streak (streaky lines in paper texture)
    const grainNoiseVal = Math.sin((pxCoordX + pxCoordY * 0.5) * 0.4) * 0.7 +
                          Math.sin((pxCoordY - pxCoordX * 1.2) * 0.8) * 0.3;

    // Total texture factor
    const textureNoise = fineNoiseVal * waxTextureStrength * 28 + grainNoiseVal * paperGrainStrength * 22;

    // Apply calculated texture adjustments
    data[i]     = Math.min(255, Math.max(0, targetR + textureNoise));
    data[i + 1] = Math.min(255, Math.max(0, targetG + textureNoise));
    data[i + 2] = Math.min(255, Math.max(0, targetB + textureNoise));
  }

  // Write base crayon fill back to canvas
  ctx.putImageData(imgData, 0, 0);

  // Step 3: Draw Sketch Outline Edges (Crayon Outline Edge Filter)
  // We perform an on-canvas edge detection and overlay rough hand-sketched boundaries
  if (outlineStrength > 0.05) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(sourceImage, 0, 0, width, height);
      const edgeData = tempCtx.getImageData(0, 0, width, height);
      const d = edgeData.data;

      // Sobel operator convolution parameters
      const edgeLines = new Uint8ClampedArray(width * height);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;

          // Simple horizontal / vertical edge detection helper
          // Get luminance values of surrounding pixels
          const getLuma = (xo: number, yo: number) => {
            const index = ((y + yo) * width + (x + xo)) * 4;
            return 0.299 * d[index] + 0.587 * d[index + 1] + 0.114 * d[index + 2];
          };

          const dx = (getLuma(1, -1) + 2 * getLuma(1, 0) + getLuma(1, 1)) -
                     (getLuma(-1, -1) + 2 * getLuma(-1, 0) + getLuma(-1, 1));
          const dy = (getLuma(-1, 1) + 2 * getLuma(0, 1) + getLuma(1, 1)) -
                     (getLuma(-1, -1) + 2 * getLuma(0, -1) + getLuma(1, -1));

          const magnitude = Math.sqrt(dx * dx + dy * dy);
          edgeLines[y * width + x] = magnitude > 35 ? Math.min(255, magnitude) : 0;
        }
      }

      // Overlay the computed hand-drawn edges with organic, jittered style
      // Instead of exact lines, we simulate sketchy strokes by drawing slightly displaced points
      ctx.save();
      
      // Determine stroke color of edges
      let strokeHex = "#2c3539"; // Charcoal outline by default for multi-color
      if (mode !== "multi") {
        const base = monoBaseColors[mode];
        // Make the line darker than the base crayon pigment
        const dR = Math.max(0, base[0] - 80);
        const dG = Math.max(0, base[1] - 80);
        const dB = Math.max(0, base[2] - 80);
        strokeHex = `rgb(${dR},${dG},${dB})`;
      }

      ctx.fillStyle = strokeHex;
      ctx.globalAlpha = outlineStrength * 0.85;

      const strokeDensity = 1.0;
      for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
          const edgeMag = edgeLines[y * width + x];
          if (edgeMag > 0) {
            // Draw a tiny organic chalky dot
            const size = (edgeMag / 255) * 2.5 + Math.random() * 1.5;
            
            // Jitter offsets to replicate unsteady drawing hand
            const jitterX = (Math.random() - 0.5) * 1.8;
            const jitterY = (Math.random() - 0.5) * 1.8;

            ctx.beginPath();
            ctx.arc(x + jitterX, y + jitterY, size * 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  }

  // Step 4: Overlay Paper Texture & Canvas fibers
  // This blends a soft textured grain across the full image for extreme authenticity
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = paperGrainStrength * 0.18;

  // Let's draw horizontal and vertical soft paper fibers
  const fiberSpacing = 3;
  ctx.strokeStyle = "#808080";
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  // Horizontal guidelines
  for (let y = 0; y < height; y += fiberSpacing) {
    ctx.moveTo(0, y + (Math.random() - 0.5) * 1.5);
    ctx.lineTo(width, y + (Math.random() - 0.5) * 1.5);
  }
  // Vertical guidelines
  for (let x = 0; x < width; x += fiberSpacing) {
    ctx.moveTo(x + (Math.random() - 0.5) * 1.5, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 1.5, height);
  }
  ctx.stroke();
  ctx.restore();

  return canvas;
}
