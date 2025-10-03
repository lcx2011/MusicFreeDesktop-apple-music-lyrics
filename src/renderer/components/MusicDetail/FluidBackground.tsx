import {useEffect, useRef} from "react";

interface FluidBackgroundProps {
  artwork?: string | null;
  fallback?: string;
}

type BackgroundController = {
  updateArtwork: (url?: string | null) => void;
  destroy: () => void;
};

const BASE_PALETTE = [
  0.92, 0.24, 0.46,
  0.17, 0.24, 0.56,
  0.08, 0.35, 0.72,
  0.98, 0.74, 0.42,
] as const;

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform float u_time;
  uniform float u_flow;
  uniform float u_volume;
  uniform float u_zoom;
  uniform float u_noise;
  uniform float u_hasImage;
  uniform vec2 u_resolution;
  uniform vec3 u_palette[4];

  float gradientNoise(vec2 uv) {
    const vec2 k = vec2(12.9898, 78.233);
    float f = sin(dot(uv, k)) * 43758.5453;
    return fract(f);
  }

  mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  vec4 fallbackGradient(vec2 uv) {
    vec3 c1 = vec3(0.92, 0.24, 0.46);
    vec3 c2 = vec3(0.17, 0.24, 0.56);
    vec3 c3 = vec3(0.98, 0.74, 0.42);
    float t = smoothstep(0.0, 1.0, uv.y);
    vec3 mix1 = mix(c1, c2, t);
    float radial = smoothstep(0.0, 0.6, length(uv - 0.5));
    vec3 color = mix(mix1, c3, radial);
    return vec4(color, 1.0);
  }

  void main() {
    vec2 uv = v_uv;
    vec2 centered = uv - 0.5;

    float beat = sin(u_time * u_flow * 0.8) * 0.5 + 0.5;
    float swirl = sin(length(centered) * 8.0 - u_time * u_flow * 1.4) * 0.12;
    float angle = u_time * (0.1 + u_flow * 0.03) + swirl * (0.6 + u_volume * 0.8);
    centered = rotate(angle) * centered;

    float zoomFactor = mix(1.4, 0.6, u_zoom);
    centered *= zoomFactor;

    vec2 warped = centered;
    warped += 0.05 * vec2(
      sin(centered.y * 6.0 + u_time * u_flow),
      cos(centered.x * 6.0 + u_time * (u_flow * 0.7 + 2.0))
    );

    float noiseOffset = gradientNoise(centered * 8.0 + u_time * 0.3) - 0.5;
    warped += u_noise * 15.0 * noiseOffset;

    vec2 sampleUV = warped + 0.5;
    vec4 coverColor = texture2D(u_texture, sampleUV);

    vec4 baseColor = mix(fallbackGradient(uv), coverColor, u_hasImage);

    vec3 meshA = mix(u_palette[0], u_palette[1], clamp(sampleUV.x, 0.0, 1.0));
    vec3 meshB = mix(u_palette[2], u_palette[3], clamp(sampleUV.x, 0.0, 1.0));
    vec3 meshColor = mix(meshA, meshB, clamp(sampleUV.y, 0.0, 1.0));
    baseColor.rgb = mix(baseColor.rgb, meshColor, 0.45);

    float edgeFade = smoothstep(0.72, 0.15, length(centered));
    float volumeGlow = mix(0.6, 1.4, clamp(u_volume + beat * 0.2, 0.0, 1.2));
    vec3 color = baseColor.rgb * edgeFade * volumeGlow;

    float dither = (gradientNoise(gl_FragCoord.xy + u_time) - 0.5) * u_noise * 80.0;
    color += vec3(dither);

    float vignette = smoothstep(0.9, 0.2, length(centered));
    color *= mix(0.55, 1.1, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

type UniformLocations = {
  time: WebGLUniformLocation | null;
  flow: WebGLUniformLocation | null;
  volume: WebGLUniformLocation | null;
  zoom: WebGLUniformLocation | null;
  noise: WebGLUniformLocation | null;
  hasImage: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  texture: WebGLUniformLocation | null;
  palette: WebGLUniformLocation | null;
};

function createFluidBackground(canvas: HTMLCanvasElement): BackgroundController | null {
  const gl = canvas.getContext("webgl", {
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
  });

  if (!gl) {
    console.warn("[FluidBackground] WebGL is not supported in this environment.");
    return null;
  }

  let program: WebGLProgram | null = null;
  let quadBuffer: WebGLBuffer | null = null;
  let animationFrameId = 0;
  let destroyed = false;
  let imageRequestId = 0;

  const uniforms: UniformLocations = {
    time: null,
    flow: null,
    volume: null,
    zoom: null,
    noise: null,
    hasImage: null,
    resolution: null,
    texture: null,
    palette: null,
  };

  const state = {
    flow: 3,
    volume: 0.6,
    zoom: 1,
    noise: 0,
    hasImage: 0,
    startTime: performance.now(),
    texture: null as WebGLTexture | null,
    defaultTexture: null as WebGLTexture | null,
    palette: new Float32Array(BASE_PALETTE),
  };

  function createShader(type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info ?? "unknown"}`);
    }
    return shader;
  }

  function createProgram(vertexSrc: string, fragmentSrc: string) {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSrc);
    const prog = gl.createProgram();
    if (!prog) {
      throw new Error("Unable to create program");
    }
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`Program link error: ${info ?? "unknown"}`);
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return prog;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    if (uniforms.resolution) {
      gl.uniform2f(uniforms.resolution, width, height);
    }
  }

  function updateUniforms(time: number) {
    if (uniforms.time) gl.uniform1f(uniforms.time, time);
    if (uniforms.flow) gl.uniform1f(uniforms.flow, state.flow);
    if (uniforms.volume) gl.uniform1f(uniforms.volume, state.volume);
    if (uniforms.zoom) gl.uniform1f(uniforms.zoom, state.zoom);
    if (uniforms.noise) gl.uniform1f(uniforms.noise, state.noise);
    if (uniforms.hasImage) gl.uniform1f(uniforms.hasImage, state.hasImage);
    if (uniforms.texture) gl.uniform1i(uniforms.texture, 0);
    if (uniforms.palette) gl.uniform3fv(uniforms.palette, state.palette);
  }

  function renderFrame(now: number) {
    if (destroyed) return;
    const elapsed = (now - state.startTime) * 0.001;

    resizeCanvas();
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (state.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, state.texture);
    }

    updateUniforms(elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  function createProcessedCover(image: HTMLImageElement) {
    const size = 32;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = size;
    const ctx = tempCanvas.getContext("2d", {willReadFrequently: true});
    if (!ctx) return null;

    const srcWidth = image.naturalWidth || image.width;
    const srcHeight = image.naturalHeight || image.height;
    if (!srcWidth || !srcHeight) return null;

    const squareSize = Math.min(srcWidth, srcHeight);
    const sx = (srcWidth - squareSize) / 2;
    const sy = (srcHeight - squareSize) / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, sx, sy, squareSize, squareSize, 0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size);
    applyImageEnhancement(imageData);
    ctx.putImageData(imageData, 0, 0);
    return imageData;
  }

  function applyImageEnhancement(imageData: ImageData) {
    contrastImage(imageData, 0.4);
    saturateImage(imageData, 3.0);
    contrastImage(imageData, 1.7);
    brightnessImage(imageData, 0.75);
    blurImage(imageData, 2, 4);
  }

  function contrastImage(imageData: ImageData, contrast: number) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      pixels[i] = (r - 128) * contrast + 128;
      pixels[i + 1] = (g - 128) * contrast + 128;
      pixels[i + 2] = (b - 128) * contrast + 128;
      pixels[i + 3] = a;
    }
  }

  function saturateImage(imageData: ImageData, saturation: number) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      const gray = r * 0.3 + g * 0.59 + b * 0.11;
      pixels[i] = gray * (1 - saturation) + r * saturation;
      pixels[i + 1] = gray * (1 - saturation) + g * saturation;
      pixels[i + 2] = gray * (1 - saturation) + b * saturation;
      pixels[i + 3] = a;
    }
  }

  function brightnessImage(imageData: ImageData, brightness: number) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = pixels[i] * brightness;
      pixels[i + 1] = pixels[i + 1] * brightness;
      pixels[i + 2] = pixels[i + 2] * brightness;
    }
  }

  function blurImage(imageData: ImageData, radius: number, quality: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const wm = width - 1;
    const hm = height - 1;
    const rad1x = radius + 1;
    const divx = radius + rad1x;
    const rad1y = radius + 1;
    const divy = radius + rad1y;
    const div2 = 1 / (divx * divy);

    const r = new Float32Array(width * height);
    const g = new Float32Array(width * height);
    const b = new Float32Array(width * height);
    const a = new Float32Array(width * height);

    const vmin = new Uint32Array(Math.max(width, height));
    const vmax = new Uint32Array(Math.max(width, height));

    while (quality-- > 0) {
      let yw = 0;
      let yi = 0;

      for (let y = 0; y < height; y++) {
        let rsum = pixels[yw] * rad1x;
        let gsum = pixels[yw + 1] * rad1x;
        let bsum = pixels[yw + 2] * rad1x;
        let asum = pixels[yw + 3] * rad1x;

        for (let i = 1; i <= radius; i++) {
          const p = yw + ((i > wm ? wm : i) << 2);
          rsum += pixels[p];
          gsum += pixels[p + 1];
          bsum += pixels[p + 2];
          asum += pixels[p + 3];
        }

        for (let x = 0; x < width; x++) {
          r[yi] = rsum;
          g[yi] = gsum;
          b[yi] = bsum;
          a[yi] = asum;

          if (y === 0) {
            vmin[x] = Math.min(x + rad1x, wm) << 2;
            vmax[x] = Math.max(x - radius, 0) << 2;
          }

          const p1 = yw + vmin[x];
          const p2 = yw + vmax[x];

          rsum += pixels[p1] - pixels[p2];
          gsum += pixels[p1 + 1] - pixels[p2 + 1];
          bsum += pixels[p1 + 2] - pixels[p2 + 2];
          asum += pixels[p1 + 3] - pixels[p2 + 3];

          yi++;
        }
        yw += width << 2;
      }

      for (let x = 0; x < width; x++) {
        let yp = x;
        let rsum = r[yp] * rad1y;
        let gsum = g[yp] * rad1y;
        let bsum = b[yp] * rad1y;
        let asum = a[yp] * rad1y;

        for (let i = 1; i <= radius; i++) {
          yp += i > hm ? 0 : width;
          rsum += r[yp];
          gsum += g[yp];
          bsum += b[yp];
          asum += a[yp];
        }

        let yi = x << 2;
        for (let y = 0; y < height; y++) {
          pixels[yi] = (rsum * div2 + 0.5) | 0;
          pixels[yi + 1] = (gsum * div2 + 0.5) | 0;
          pixels[yi + 2] = (bsum * div2 + 0.5) | 0;
          pixels[yi + 3] = (asum * div2 + 0.5) | 0;

          if (x === 0) {
            vmin[y] = Math.min(y + rad1y, hm) * width;
            vmax[y] = Math.max(y - radius, 0) * width;
          }

          const p1 = x + vmin[y];
          const p2 = x + vmax[y];

          rsum += r[p1] - r[p2];
          gsum += g[p1] - g[p2];
          bsum += b[p1] - b[p2];
          asum += a[p1] - a[p2];

          yi += width << 2;
        }
      }
    }
  }

  function extractPalette(imageData: ImageData) {
    const {width, height, data} = imageData;
    if (!width || !height) return null;

    const sample = (ux: number, uy: number) => {
      const x = Math.min(width - 1, Math.max(0, Math.floor(ux * (width - 1))));
      const y = Math.min(height - 1, Math.max(0, Math.floor(uy * (height - 1))));
      const idx = (y * width + x) * 4;
      return [data[idx] / 255, data[idx + 1] / 255, data[idx + 2] / 255];
    };

    const topLeft = sample(0.1, 0.9);
    const topRight = sample(0.9, 0.9);
    const bottomLeft = sample(0.1, 0.1);
    const bottomRight = sample(0.9, 0.1);
    return new Float32Array([
      ...topLeft,
      ...topRight,
      ...bottomLeft,
      ...bottomRight,
    ]);
  }

  function createTextureFromImage(image: HTMLImageElement) {
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const processed = createProcessedCover(image);
    const source = processed ?? image;
    const isImageData = source instanceof ImageData;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, isImageData ? 0 : 1);

    const width = source instanceof ImageData
      ? source.width
      : (source.naturalWidth || source.width);
    const height = source instanceof ImageData
      ? source.height
      : (source.naturalHeight || source.height);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (source instanceof ImageData) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        source.width,
        source.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source.data,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
    }

    const isPowerOfTwo = (value: number) => (value & (value - 1)) === 0;
    if (width && height && isPowerOfTwo(width) && isPowerOfTwo(height)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    if (processed) {
      const palette = extractPalette(processed);
      if (palette) state.palette.set(palette);
    }

    return texture;
  }

  function resetToDefaultTexture() {
    if (state.texture && state.texture !== state.defaultTexture) {
      gl.deleteTexture(state.texture);
    }
    state.texture = state.defaultTexture;
    state.hasImage = 0;
  }

  function applyImageToBackground(image: HTMLImageElement) {
    const texture = createTextureFromImage(image);
    if (!texture) return;

    if (state.texture && state.texture !== state.defaultTexture) {
      gl.deleteTexture(state.texture);
    }
    state.texture = texture;
    state.hasImage = 1;
  }

  function loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (/^https?:\/\//i.test(url)) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  function updateArtwork(url?: string | null) {
    imageRequestId += 1;
    const requestId = imageRequestId;

    if (!url) {
      resetToDefaultTexture();
      return;
    }

    loadImage(url)
      .then((image) => {
        if (destroyed || requestId !== imageRequestId) return;
        applyImageToBackground(image);
      })
      .catch((error) => {
        console.warn("[FluidBackground]", error);
        if (destroyed || requestId !== imageRequestId) return;
        resetToDefaultTexture();
      });
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", resizeCanvas);
    if (state.texture && state.texture !== state.defaultTexture) {
      gl.deleteTexture(state.texture);
    }
    if (state.defaultTexture) {
      gl.deleteTexture(state.defaultTexture);
    }
    if (quadBuffer) {
      gl.deleteBuffer(quadBuffer);
    }
    if (program) {
      gl.deleteProgram(program);
    }
  }

  function init() {
    program = createProgram(VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    gl.useProgram(program);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    const vertices = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniforms.time = gl.getUniformLocation(program, "u_time");
    uniforms.flow = gl.getUniformLocation(program, "u_flow");
    uniforms.volume = gl.getUniformLocation(program, "u_volume");
    uniforms.zoom = gl.getUniformLocation(program, "u_zoom");
    uniforms.noise = gl.getUniformLocation(program, "u_noise");
    uniforms.hasImage = gl.getUniformLocation(program, "u_hasImage");
    uniforms.resolution = gl.getUniformLocation(program, "u_resolution");
    uniforms.texture = gl.getUniformLocation(program, "u_texture");
    uniforms.palette = gl.getUniformLocation(program, "u_palette[0]");

    const defaultTexture = gl.createTexture();
    if (!defaultTexture) {
      throw new Error("Unable to create default texture");
    }
    state.defaultTexture = defaultTexture;
    gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    const pixel = new Uint8Array([150, 40, 120, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    state.texture = defaultTexture;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationFrameId = requestAnimationFrame(renderFrame);
  }

  init();

  return {
    updateArtwork,
    destroy,
  };
}

function FluidBackground({artwork, fallback}: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<BackgroundController | null>(null);
  const pendingArtworkRef = useRef<string | undefined>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => undefined;

    const controller = createFluidBackground(canvas);
    controllerRef.current = controller;

    if (controller && pendingArtworkRef.current) {
      controller.updateArtwork(pendingArtworkRef.current);
    }

    return () => {
      controllerRef.current = null;
      controller?.destroy();
    };
  }, []);

  useEffect(() => {
    const target = artwork ?? fallback ?? undefined;
    if (controllerRef.current) {
      controllerRef.current.updateArtwork(target);
    } else {
      pendingArtworkRef.current = target;
    }
  }, [artwork, fallback]);

  return <canvas className="music-detail-background" ref={canvasRef} aria-hidden="true" />;
}

export default FluidBackground;
