const TILE_ASSET_NAMES = [
  "Back.svg",
  "Blank.svg",
  "Front.svg",
  "Man1.svg",
  "Man2.svg",
  "Man3.svg",
  "Man4.svg",
  "Man5.svg",
  "Man5-Dora.svg",
  "Man6.svg",
  "Man7.svg",
  "Man8.svg",
  "Man9.svg",
  "Pin1.svg",
  "Pin2.svg",
  "Pin3.svg",
  "Pin4.svg",
  "Pin5.svg",
  "Pin5-Dora.svg",
  "Pin6.svg",
  "Pin7.svg",
  "Pin8.svg",
  "Pin9.svg",
  "Sou1.svg",
  "Sou2.svg",
  "Sou3.svg",
  "Sou4.svg",
  "Sou5.svg",
  "Sou5-Dora.svg",
  "Sou6.svg",
  "Sou7.svg",
  "Sou8.svg",
  "Sou9.svg",
  "Ton.svg",
  "Nan.svg",
  "Shaa.svg",
  "Pei.svg",
  "Chun.svg",
  "Hatsu.svg",
  "Haku.svg",
] as const;

/**
 * Simple preload using link preload tags - browser native, non-blocking.
 */
export function preloadAllTileImages() {
  if (typeof window === "undefined") return Promise.resolve();

  TILE_ASSET_NAMES.forEach((name) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = `/tiles/${name}`;
    document.head.appendChild(link);
  });

  return Promise.resolve();
}

/**
 * Preload tiles with progress tracking using Image objects.
 * Uses requestAnimationFrame to ensure progress updates happen after React renders.
 */
export async function preloadAllTileImagesWithProgress(options?: {
  timeoutMs?: number;
  onProgress?: (loaded: number, total: number) => void;
}) {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const onProgress = options?.onProgress;
  if (typeof window === "undefined") return { loaded: 0, total: 0, timedOut: false };

  const urls = TILE_ASSET_NAMES.map((name) => `/tiles/${name}`);
  const total = urls.length;
  
  let loaded = 0;
  let timedOut = false;
  let finished = false;

  // Use RAF to batch progress updates and ensure they happen after React renders
  let pendingUpdate = false;
  const scheduleProgressUpdate = () => {
    if (pendingUpdate || finished) return;
    pendingUpdate = true;
    requestAnimationFrame(() => {
      pendingUpdate = false;
      if (!finished) {
        onProgress?.(loaded, total);
      }
    });
  };

  // Report initial progress after a microtask to let React finish mounting
  await Promise.resolve();
  onProgress?.(0, total);

  // Create a promise that resolves when all images are loaded
  const loadPromise = new Promise<void>((resolve) => {
    let remaining = total;

    const onImageDone = () => {
      if (finished) return;
      loaded++;
      remaining--;
      scheduleProgressUpdate();
      if (remaining <= 0) {
        resolve();
      }
    };

    // Start loading all images
    urls.forEach((url) => {
      const img = new Image();
      img.onload = onImageDone;
      img.onerror = onImageDone;
      img.src = url;
    });
  });

  // Race between load completion and timeout
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve();
    }, timeoutMs);
  });

  await Promise.race([loadPromise, timeoutPromise]);
  
  finished = true;
  
  // Final progress update
  onProgress?.(loaded, total);

  return { loaded, total, timedOut };
}
