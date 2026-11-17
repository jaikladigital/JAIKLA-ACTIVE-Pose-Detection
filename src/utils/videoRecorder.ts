import { MotionClipRecord } from '../types/pose';

const DB_NAME = 'JaiklaPoseClipsDB';
const STORE_NAME = 'jaikla_motion_clips';
const DB_VERSION = 3;

/**
 * Robust, self-healing IndexedDB connection.
 * If the object store doesn't exist in the current version, automatically upgrades.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Verify object store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Store missing in current version, bump version to trigger upgrade
          const nextVersion = db.version + 1;
          db.close();
          const fixReq = indexedDB.open(DB_NAME, nextVersion);
          fixReq.onupgradeneeded = () => {
            const upgradedDb = fixReq.result;
            if (!upgradedDb.objectStoreNames.contains(STORE_NAME)) {
              upgradedDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
          };
          fixReq.onsuccess = () => resolve(fixReq.result);
          fixReq.onerror = () => resolve(db); // Fallback
          return;
        }
        resolve(db);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        reject(request.error);
      };
    } catch (err) {
      console.warn('IndexedDB unavailable:', err);
      reject(err);
    }
  });
}

export async function saveLocalMotionClip(clip: MotionClipRecord): Promise<void> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn(`Object store ${STORE_NAME} not found`);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(clip);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save local clip:', err);
  }
}

export async function getAllLocalMotionClips(): Promise<MotionClipRecord[]> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn(`Object store ${STORE_NAME} not found, returning empty list`);
      return [];
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const records = (req.result || []) as MotionClipRecord[];
          records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          if (records.length === 0) {
            resolve(DEFAULT_SAMPLE_CLIPS);
            return;
          }
          resolve(records);
        };
        req.onerror = () => {
          console.warn('Error reading clips from store:', req.error);
          resolve(DEFAULT_SAMPLE_CLIPS);
        };
      } catch (txErr) {
        console.warn('Transaction error in getAllLocalMotionClips:', txErr);
        resolve(DEFAULT_SAMPLE_CLIPS);
      }
    });
  } catch (err) {
    console.warn('Failed to open database in getAllLocalMotionClips:', err);
    return DEFAULT_SAMPLE_CLIPS;
  }
}

/**
 * Built-in initial sample motion clips so ComparisonViewer is immediately interactive
 */
export const DEFAULT_SAMPLE_CLIPS: MotionClipRecord[] = [
  {
    id: 'sample_squat_before_01',
    userId: 'athlete_demo',
    exerciseType: 'squat',
    category: 'before',
    accuracyScore: 68,
    videoDataUrl: '',
    repsCount: 4,
    notes: 'ฟอร์มเริ่มต้น (ก่อนแก้): หัวเข่ายื่นเลยปลายเท้าเกิน 15 ซม. ลำตัวโน้มไปข้างหน้ามากเกินไป',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sample_squat_after_01',
    userId: 'athlete_demo',
    exerciseType: 'squat',
    category: 'after',
    accuracyScore: 94,
    videoDataUrl: '',
    repsCount: 8,
    notes: 'ฟอร์มสมบูรณ์ (หลังแก้ไข): มุมข้อเข่า 90° แนวกระดูกสันหลังตรงสมดุล ศูนย์ถ่วงตกกลางเท้า',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export async function deleteLocalMotionClip(id: string): Promise<void> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch (err) {
    console.warn('Failed to delete clip:', err);
  }
}

/**
 * Robust MediaStream Recorder for capturing short exercise clips from combined canvas
 * Features automatic fallbacks and safety timeouts to guarantee user actions always respond.
 */
export class WorkoutVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private onDataAvailableHandler: ((blobUrl: string, base64: string) => void) | null = null;
  private safetyTimeout: any = null;
  private snapshotDataUrl: string = '';
  private frameCaptureInterval: any = null;

  startRecording(canvas: HTMLCanvasElement, onFinish: (blobUrl: string, base64: string) => void) {
    this.recordedChunks = [];
    this.onDataAvailableHandler = onFinish;
    this.isRecording = true;

    // Capture periodic snapshots in case MediaRecorder yields 0 bytes
    try {
      if (canvas.width > 0 && canvas.height > 0) {
        this.snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
      this.frameCaptureInterval = setInterval(() => {
        try {
          if (canvas.width > 0 && canvas.height > 0) {
            this.snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          // ignore
        }
      }, 400);
    } catch {
      // ignore
    }

    try {
      if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
        throw new Error('MediaRecorder or captureStream unavailable');
      }

      const stream = canvas.captureStream(25);
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      const supportedType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const options: MediaRecorderOptions = supportedType
        ? { mimeType: supportedType, videoBitsPerSecond: 2500000 }
        : {};
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.safetyTimeout) {
          clearTimeout(this.safetyTimeout);
          this.safetyTimeout = null;
        }
        if (this.frameCaptureInterval) {
          clearInterval(this.frameCaptureInterval);
          this.frameCaptureInterval = null;
        }

        if (this.recordedChunks.length > 0) {
          const superBlob = new Blob(this.recordedChunks, { type: supportedType || 'video/webm' });
          const blobUrl = URL.createObjectURL(superBlob);

          const reader = new FileReader();
          reader.readAsDataURL(superBlob);
          reader.onloadend = () => {
            const base64Data = (reader.result as string) || this.snapshotDataUrl;
            if (this.onDataAvailableHandler) {
              this.onDataAvailableHandler(blobUrl, base64Data);
              this.onDataAvailableHandler = null;
            }
          };
        } else {
          this.fallbackFinalize();
        }
      };

      this.mediaRecorder.start(250);
    } catch (err) {
      console.warn('MediaRecorder init failed, falling back to snapshot mode:', err);
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;

    if (this.frameCaptureInterval) {
      clearInterval(this.frameCaptureInterval);
      this.frameCaptureInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('Error on mediaRecorder.stop():', err);
        this.fallbackFinalize();
      }

      // Safety timeout: finalize within 500ms if onstop does not trigger
      this.safetyTimeout = setTimeout(() => {
        this.fallbackFinalize();
      }, 500);
    } else {
      this.fallbackFinalize();
    }
  }

  private fallbackFinalize() {
    if (!this.onDataAvailableHandler) return;
    const handler = this.onDataAvailableHandler;
    this.onDataAvailableHandler = null;

    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }

    const fallbackDataUrl = this.snapshotDataUrl || '';
    let blobUrl = '';
    try {
      if (this.recordedChunks.length > 0) {
        const b = new Blob(this.recordedChunks, { type: 'video/webm' });
        blobUrl = URL.createObjectURL(b);
      } else {
        blobUrl = fallbackDataUrl;
      }
    } catch {
      blobUrl = fallbackDataUrl;
    }

    handler(blobUrl, fallbackDataUrl);
  }

  getRecordingStatus() {
    return this.isRecording;
  }
}
