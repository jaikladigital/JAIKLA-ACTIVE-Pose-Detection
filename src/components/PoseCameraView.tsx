import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Video as VideoIcon,
  Sparkles,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Clock,
  Crosshair,
  BookOpen,
  ArrowRight,
  Check,
  HelpCircle,
  X,
  Camera,
  Layers,
  Eye,
  EyeOff,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExerciseType,
  ExerciseMeta,
  CalibrationData,
  PoseFeedbackResult,
  NormalizedLandmark,
  WorkoutSessionRecord,
  MotionClipRecord,
  CameraViewMode,
  BodySide,
  BodySegmentDetail,
  SideProfileAnalysis,
} from '../types/pose';
import {
  POSE_LANDMARKS,
  ExerciseTracker,
  checkTPose,
  soundFx,
  speakAlertTh,
  setGlobalAudioMuted,
} from '../utils/poseGeometry';
import { drawPoseCanvas, DrawOptions } from '../utils/canvasRenderer';
import { WorkoutVideoRecorder, saveLocalMotionClip } from '../utils/videoRecorder';

const EXERCISE_METAS: ExerciseMeta[] = [
  {
    id: 'squat',
    nameTh: 'สควอช (Squat)',
    nameEn: 'Bodyweight Squat',
    category: 'Legs',
    targetAngles: {
      primaryJoint: 'ข้อเข่า (Knees)',
      targetRange: [80, 95],
      restRange: [160, 180],
    },
    tipsTh: [
      'กางขาให้กว้างพอดีหัวไหล่ ปลายเท้าชี้เฉียงออกเล็กน้อย (~15°)',
      'ย่อตัวลงดันสะโพกไปข้างหลัง ต้นขาขนานพื้น (~90°)',
      'ระวังอย่าให้หัวเข่างุ้มเข้า หรือยื่นเลยปลายเท้ามากเกินไป',
      'ยืดอก มองตรง ไม่โก่งหลัง',
    ],
    mistakesToAvoidTh: [
      'เข่าเลยปลายเท้ามากเกินไป (ทำให้เกิดแรงเฉือนที่เอ็นข้อเข่า)',
      'หลังค่อมหรือโน้มตัวไปข้างหน้าเกิน 35 องศา',
      'ย่อตัวไม่ลึกพอจนกล้ามเนื้อก้นและต้นขาไม่ได้ทำงานเต็มช่วง',
    ],
    executionStepsTh: [
      '1. ยืนตรง เท้ากว้างเท่าหัวไหล่ มือประสานหน้าอก',
      '2. หายใจเข้า ค่อยๆ ดันสะโพกไปข้างหลังเหมือนนั่งเก้าอี้',
      '3. ย่อตัวลงจนข้อเข่างอทำมุมประมาณ 90 องศา',
      '4. หายใจออก ดันส้นเท้าเหยียดตัวขึ้นสู่ท่ายืนตรงเพื่อนับ 1 ครั้ง',
    ],
  },
  {
    id: 'pushup',
    nameTh: 'วิดพื้น (Push-up)',
    nameEn: 'Standard Push-up',
    category: 'Upper Body',
    targetAngles: {
      primaryJoint: 'ข้อศอก (Elbows)',
      targetRange: [75, 95],
      restRange: [160, 180],
    },
    tipsTh: [
      'วางมือห่างกว่าหัวไหล่เล็กน้อย นิ้วมือกางออก',
      'เกร็งหน้าท้อง ลำตัว ศอก และส้นเท้าเป็นเส้นตรง (~175°)',
      'ลดตัวลงจนข้อศอกทำมุม 90 องศา แล้วดันขึ้น',
      'ไม่แอ่นหลังหรือยกสะโพกโด่ง',
    ],
    mistakesToAvoidTh: [
      'สะโพกตกหรือแอ่นหลังจนเกิดแรงกดที่กระดูกสันหลังส่วนล่าง',
      'กางข้อศอกออกข้าง 90° (ควรทำมุม 45° กับลำตัว)',
      'ลดตัวลงไม่สุดหรือข้อศอกงอไม่ถึง 90 องศา',
    ],
    executionStepsTh: [
      '1. วางมือบนพื้นกว้างกว่าไหล่เล็กน้อย ลำตัวเป็นแผ่นตรง',
      '2. งอข้อศอก 45 องศาลดหน้าอกลงใกล้พื้นจนข้อศอกทำมุม 90°',
      '3. เกร็งกล้ามเนื้ออกและแขน ดันตัวกลับขึ้นสู่ท่าเริ่มต้น',
    ],
  },
  {
    id: 'lunge',
    nameTh: 'ลันจ์ (Forward Lunge)',
    nameEn: 'Bodyweight Lunge',
    category: 'Legs',
    targetAngles: {
      primaryJoint: 'เข่าขาหน้า (Front Knee)',
      targetRange: [85, 95],
      restRange: [160, 180],
    },
    tipsTh: [
      'ก้าวขาไปข้างหน้าหนึ่งก้าว ลำตัวตั้งตรง',
      'ย่อตัวลงจนหัวเข่าหน้าทำมุม 90 องศา เข่าหลังเกือบแตะพื้น',
      'ดันตัวกลับสู่ท่ายืนด้วยส้นเท้าหน้า',
    ],
    mistakesToAvoidTh: [
      'ก้าวขาสั้นเกินไปจนเข่าหน้าเลยปลายเท้า',
      'ลำตัวเอียงไปข้างหน้ามากเกินไป',
    ],
    executionStepsTh: [
      '1. ยืนตรง เท้าชิด',
      '2. ก้าวขาข้างหนึ่งไปข้างหน้า ย่อตัวลงจนเข่าหน้าและหลังทำมุม 90 องศา',
      '3. ดันตัวกลับสู่ท่ายืนตรง แล้วสลับข้าง',
    ],
  },
  {
    id: 'jumping_jack',
    nameTh: 'กระโดดตบ (Jumping Jack)',
    nameEn: 'Jumping Jacks',
    category: 'Full Body',
    targetAngles: {
      primaryJoint: 'การกางแขน (Shoulder Abduction)',
      targetRange: [140, 180],
      restRange: [0, 45],
    },
    tipsTh: [
      'กระโดดกางขาพร้อมวาดแขนขึ้นเหนือศีรษะ',
      'ลงน้ำหนักด้วยปลายเท้าเบาๆ',
      'รักษาจังหวะการหายใจสม่ำเสมอ',
    ],
    mistakesToAvoidTh: ['ลงน้ำหนักที่ส้นเท้าเต็มแรง', 'วาดแขนขึ้นไม่สุดเหนือศีรษะ'],
    executionStepsTh: [
      '1. ยืนตรง แขนแนบลำตัว',
      '2. กระโดดกางขาออก กว้างกว่าไหล่ พร้อมวาดแขนขึ้นปรบมือเหนือศีรษะ',
      '3. กระโดดกลับสู่ท่ายืนตรงเพื่อนับ 1 ครั้ง',
    ],
  },
  {
    id: 'plank',
    nameTh: 'แพลงก์ (Core Plank)',
    nameEn: 'Isometric Plank',
    category: 'Core',
    targetAngles: {
      primaryJoint: 'แกนสะโพก (Hip Alignment)',
      targetRange: [165, 180],
      restRange: [165, 180],
    },
    tipsTh: [
      'ตั้งศอกให้อยู่ใต้หัวไหล่พอดี',
      'เกร็งกล้ามเนื้อแกนกลางลำตัว สะโพกไม่งอหรือหย่อน',
      'หายใจเข้าออกอย่างต่อเนื่อง',
    ],
    mistakesToAvoidTh: ['กลั้นหายใจ', 'สะโพกตกหรือยกก้นโด่งสูงเกินไป'],
    executionStepsTh: [
      '1. คว่ำหน้า วางข้อศอกใต้หัวไหล่ ปลายเท้ายันพื้น',
      '2. เกร็งหน้าท้องและก้น ลำตัวตรงขนานพื้น',
      '3. ค้างท่าไว้และจับเวลา',
    ],
  },
];

interface PoseCameraViewProps {
  selectedDeviceId: string;
  calibration: CalibrationData;
  setCalibration: React.Dispatch<React.SetStateAction<CalibrationData>>;
  onFinishWorkout: (session: WorkoutSessionRecord) => void;
  onClipSaved: (clip: MotionClipRecord) => void;
  isCalibratingModal: boolean;
  setIsCalibratingModal: (val: boolean) => void;
  onNavigateTab?: (tab: 'live' | 'stretching' | 'compare' | 'history') => void;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const PoseCameraView: React.FC<PoseCameraViewProps> = ({
  selectedDeviceId,
  calibration,
  setCalibration,
  onFinishWorkout,
  onClipSaved,
  isCalibratingModal,
  setIsCalibratingModal,
  onNavigateTab,
  isAudioMuted = true,
  onToggleAudio,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<WorkoutVideoRecorder>(new WorkoutVideoRecorder());
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);

  // Fullscreen & Camera viewport fit mode (Cover vs Contain)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // 3 Transparent Overlays
  const [showGuideOverlay, setShowGuideOverlay] = useState<boolean>(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState<boolean>(true);

  const [showAnglesOverlay, setShowAnglesOverlay] = useState<boolean>(true);
  const [isAnglesCollapsed, setIsAnglesCollapsed] = useState<boolean>(false);

  const [showStatsOverlay, setShowStatsOverlay] = useState<boolean>(true);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(false);

  // Core user requirement: Large frameless numbers on right side with shadow, and toggle show/hide button
  const [showNumbersHUD, setShowNumbersHUD] = useState<boolean>(true);
  const [rightHudMode, setRightHudMode] = useState<'frameless' | 'detailed'>('frameless');

  // Side-View Motion Tracking & Sagittal 14-Segment Analysis Mode
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('side');
  const [selectedBodySide, setSelectedBodySide] = useState<BodySide>('auto'); // 'auto' | 'left' | 'right'
  const [showPlumbLine, setShowPlumbLine] = useState<boolean>(true);
  const [sideSegmentFilter, setSideSegmentFilter] = useState<'all' | 'upper' | 'core' | 'lower'>('all');
  const [zenMode, setZenMode] = useState<boolean>(false); // Mode to minimize all overlays for maximum spacious view

  // Detection active state (Requested: ปุ่มเริ่ม/หยุดการตรวจจับ)
  const [isDetectionActive, setIsDetectionActive] = useState<boolean>(true);
  const isDetectionActiveRef = useRef<boolean>(true);

  // Guided Preparation Workflow: 'briefing' -> 'trial' -> 'ready' -> 'active'
  const [workflowMode, setWorkflowMode] = useState<'briefing' | 'trial' | 'ready' | 'active'>('briefing');
  const [trialRepsCompleted, setTrialRepsCompleted] = useState<number>(0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);

  // Interactive System Walkthrough Modal state before trial (Requested)
  const [isTrialGuideModalOpen, setIsTrialGuideModalOpen] = useState<boolean>(false);

  // Exercise & Session state
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>('squat');
  const [exerciseTracker] = useState<ExerciseTracker>(() => new ExerciseTracker('squat'));
  const [isActiveWorkout, setIsActiveWorkout] = useState<boolean>(false);
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [currentFeedback, setCurrentFeedback] = useState<PoseFeedbackResult | null>(null);
  const [lastAlertText, setLastAlertText] = useState<string>('');

  // Audio settings - Default: MUTED (false) as requested ("ช่วยปรับปรุงให้ ค่าเริ่มต้น เท่ากับ ปิดเสียง")
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(!isAudioMuted);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(!isAudioMuted);

  // Synchronize audio state whenever isAudioMuted changes from parent or header
  useEffect(() => {
    if (isAudioMuted !== undefined) {
      setVoiceAlertsEnabled(!isAudioMuted);
      setSoundEffectsEnabled(!isAudioMuted);
    }
  }, [isAudioMuted]);

  // Master Audio Toggle Handler
  const handleToggleMasterAudio = () => {
    if (onToggleAudio) {
      onToggleAudio();
    } else {
      const nextMuted = !isAudioMuted;
      setVoiceAlertsEnabled(!nextMuted);
      setSoundEffectsEnabled(!nextMuted);
      setGlobalAudioMuted(nextMuted);
    }
  };

  // Toast feedback
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Ref to always hold latest handlePoseResults callback, preventing stale closures in MediaPipe Pose
  const handlePoseResultsRef = useRef<(results: any) => void>(() => {});

  // HUD options
  const [hudOptions, setHudOptions] = useState<DrawOptions>({
    showAngles: true,
    showSkeleton: true,
    showHUD: true,
    calibrationMode: false,
    tPoseProgress: 0,
    calibrationMessage: 'กางแขนออกทั้งสองข้าง (T-Pose) เพื่อคาลิเบรต',
  });

  // Camera & Model status
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Video clip recording state
  const [isRecordingClip, setIsRecordingClip] = useState<boolean>(false);
  const isRecordingClipRef = useRef<boolean>(false);
  const recordTimerRef = useRef<any>(null);
  const [clipSecondsLeft, setClipSecondsLeft] = useState<number>(0);
  const [recordedClipPreview, setRecordedClipPreview] = useState<{ url: string; base64: string } | null>(null);
  const [clipCategoryTag, setClipCategoryTag] = useState<'before' | 'after' | 'practice'>('before');

  useEffect(() => {
    isRecordingClipRef.current = isRecordingClip;
  }, [isRecordingClip]);

  useEffect(() => {
    isDetectionActiveRef.current = isDetectionActive;
  }, [isDetectionActive]);

  // Calibration counter
  const tPoseHoldFrames = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const poseModelRef = useRef<any>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Sync exercise tracker when exercise type changes
  useEffect(() => {
    exerciseTracker.setExercise(currentExercise);
    setCurrentFeedback(null);
    setTrialRepsCompleted(0);
    setWorkflowMode('briefing');
  }, [currentExercise, exerciseTracker]);

  // Sync calibration mode with modal prop
  useEffect(() => {
    setHudOptions((prev) => ({
      ...prev,
      calibrationMode: isCalibratingModal,
    }));
    if (isCalibratingModal) {
      tPoseHoldFrames.current = 0;
      if (voiceAlertsEnabled) {
        speakAlertTh('กรุณายืนกางแขนในท่า ทีโพสต์ เพื่อคาลิเบรตระยะสัดส่วนร่างกายครับ', true);
      }
    }
  }, [isCalibratingModal]);

  // Workout duration timer
  useEffect(() => {
    let interval: any = null;
    if (isActiveWorkout && isDetectionActive) {
      interval = setInterval(() => {
        setWorkoutDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActiveWorkout, isDetectionActive]);

  // Toggle Detection Handler (Start / Stop)
  const toggleDetection = useCallback(() => {
    setIsDetectionActive((prev) => {
      const next = !prev;
      if (next) {
        if (soundEffectsEnabled) soundFx.playRepSuccess();
        if (voiceAlertsEnabled) speakAlertTh('เริ่มการตรวจจับท่าทางเรียลไทม์', true);
      } else {
        if (soundEffectsEnabled) soundFx.playCalibrationBeep(330);
        if (voiceAlertsEnabled) speakAlertTh('หยุดการตรวจจับชั่วคราว', true);
      }
      return next;
    });
  }, [soundEffectsEnabled, voiceAlertsEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!cameraContainerRef.current) return;
    if (!document.fullscreenElement) {
      cameraContainerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  // Auto-collapse on small mobile screens to keep camera view clean
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setIsGuideCollapsed(true);
      setIsAnglesCollapsed(true);
      setIsStatsCollapsed(true);
    }
  }, []);

  // Initialize MediaPipe Pose Model
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipePose() {
      setModelLoading(true);
      setModelError(null);

      try {
        const win = window as any;
        if (win.Pose) {
          const pose = new win.Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          pose.onResults((results: any) => {
            if (!isMounted) return;
            handlePoseResultsRef.current(results);
          });

          // Pre-initialize WASM module before sending any frames
          if (typeof pose.initialize === 'function') {
            await pose.initialize();
          }

          poseModelRef.current = pose;
          setModelLoading(false);
        } else {
          setTimeout(initMediaPipePose, 500);
        }
      } catch (err: any) {
        console.error('Failed to load Pose model:', err);
        if (isMounted) {
          setModelError('ไม่สามารถโหลดโมเดล AI Vision ได้ เปิดโหมดจำลอง (Demo Mode) ให้โดยอัตโนมัติ');
          setIsDemoMode(true);
          setModelLoading(false);
        }
      }
    }

    initMediaPipePose();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraPermission('granted');
      setIsDemoMode(false);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable, switching to Demo Simulation:', err);
      setCameraPermission('denied');
      setIsDemoMode(true);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    startCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [startCamera]);

  // Main Processing & Rendering Loop
  const handlePoseResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // If detection is paused, skip evaluation
      if (!isDetectionActive || !isDetectionActiveRef.current) {
        drawPoseCanvas(
          ctx,
          width,
          height,
          [],
          currentFeedback,
          calibration,
          { ...hudOptions, isDetectionPaused: true },
          videoRef.current
        );
        return;
      }

      const landmarks: NormalizedLandmark[] = results.poseLandmarks || [];

      // If user is in T-Pose Calibration Mode
      if (hudOptions.calibrationMode) {
        const tPoseCheck = checkTPose(landmarks);

        if (tPoseCheck.isTPose) {
          tPoseHoldFrames.current += 1;
          const targetFrames = 45;
          const progress = Math.min(1.0, tPoseHoldFrames.current / targetFrames);

          setHudOptions((prev) => ({
            ...prev,
            tPoseProgress: progress,
            calibrationMessage: progress >= 1.0 ? 'คาลิเบรตสำเร็จเรียบร้อย!' : 'ค้างท่า T-Pose ไว้อีกสักครู่...',
          }));

          if (soundEffectsEnabled && tPoseHoldFrames.current % 15 === 0) {
            soundFx.playCalibrationBeep(520 + progress * 200);
          }

          if (progress >= 1.0) {
            const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
            const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
            const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
            const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
            const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];

            const armSpan = Math.abs(lWrist.x - rWrist.x) * width;
            const torsoH = Math.abs(lShoulder.y - lHip.y) * height;

            setCalibration({
              isCalibrated: true,
              tPoseProgress: 1.0,
              armSpanPx: Math.round(armSpan),
              torsoHeightPx: Math.round(torsoH),
              bodyHeightPx: Math.round(height * 0.8),
              shoulderWidthPx: Math.round(Math.abs(lShoulder.x - rShoulder.x) * width),
              baselineCenter: { x: (lShoulder.x + rShoulder.x) / 2, y: lShoulder.y },
              calibratedAt: new Date().toISOString(),
            });

            if (soundEffectsEnabled) soundFx.playRepSuccess();
            if (voiceAlertsEnabled) speakAlertTh('คาลิเบรตสรีระด้วยท่าทีโพสต์สำเร็จ พร้อมเริ่มการฝึกซ้อมครับ', true);

            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });

            setTimeout(() => {
              setIsCalibratingModal(false);
            }, 1000);
          }
        } else {
          tPoseHoldFrames.current = Math.max(0, tPoseHoldFrames.current - 2);
          setHudOptions((prev) => ({
            ...prev,
            tPoseProgress: tPoseHoldFrames.current / 45,
            calibrationMessage: tPoseCheck.messageTh,
          }));
        }
      }

      // Live Exercise Tracker Analysis
      if (landmarks.length >= 33 && !hudOptions.calibrationMode) {
        const feedback = exerciseTracker.update(landmarks, calibration, cameraViewMode, selectedBodySide);
        setCurrentFeedback(feedback);

        // Rep detection
        if (feedback.repCount > (currentFeedback?.repCount ?? 0)) {
          if (soundEffectsEnabled) soundFx.playRepSuccess();

          // If in Trial Mode: verify 1 rep, then notify readiness!
          if (workflowMode === 'trial') {
            setTrialRepsCompleted((r) => {
              const updated = r + 1;
              if (updated >= 1) {
                if (voiceAlertsEnabled) {
                  speakAlertTh('ทดสอบระบบตรวจจับสำเร็จ! กล้องตรวจจับการเคลื่อนไหวได้แม่นยำ พร้อมเริ่มฝึกซ้อมจริงแล้วครับ', true);
                }
                confetti({
                  particleCount: 40,
                  spread: 60,
                  origin: { y: 0.6 },
                });
                setWorkflowMode('ready');
              }
              return updated;
            });
          } else {
            if (voiceAlertsEnabled) {
              speakAlertTh(`${feedback.repCount} ครั้ง`, true);
            }
          }
        } else if (feedback.voiceWarning && feedback.voiceWarning !== lastAlertText) {
          setLastAlertText(feedback.voiceWarning);
          if (soundEffectsEnabled) soundFx.playErrorWarning();
          if (voiceAlertsEnabled) speakAlertTh(feedback.voiceWarning);
        }

        // Render graphics to canvas directly overlaid on camera feed
        drawPoseCanvas(
          ctx,
          width,
          height,
          landmarks,
          feedback,
          calibration,
          {
            ...hudOptions,
            compositeVideo: isRecordingClipRef.current,
            viewMode: cameraViewMode,
            selectedSide: selectedBodySide,
            showPlumbLine,
          },
          videoRef.current
        );
        return;
      }

      // Render graphics to canvas directly overlaid on camera feed (idle or calibration)
      drawPoseCanvas(
        ctx,
        width,
        height,
        landmarks,
        currentFeedback,
        calibration,
        {
          ...hudOptions,
          compositeVideo: isRecordingClipRef.current,
          viewMode: cameraViewMode,
          selectedSide: selectedBodySide,
          showPlumbLine,
        },
        videoRef.current
      );
    },
    [
      calibration,
      cameraViewMode,
      currentFeedback,
      exerciseTracker,
      hudOptions,
      isDetectionActive,
      isRecordingClip,
      lastAlertText,
      selectedBodySide,
      setCalibration,
      setIsCalibratingModal,
      showPlumbLine,
      soundEffectsEnabled,
      voiceAlertsEnabled,
      workflowMode,
    ]
  );

  // Keep handlePoseResultsRef always current
  useEffect(() => {
    handlePoseResultsRef.current = handlePoseResults;
  }, [handlePoseResults]);

  // Frame processing loop from Video or Demo Simulation
  useEffect(() => {
    let isCancelled = false;

    async function processLoop() {
      if (isCancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!isDemoMode && video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && poseModelRef.current && canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        if (isDetectionActive) {
          if (!isProcessingFrameRef.current) {
            isProcessingFrameRef.current = true;
            try {
              await poseModelRef.current.send({ image: video });
            } catch (e: any) {
              console.error('Pose frame error:', e);
              const errMsg = String(e || '');
              if (errMsg.includes('Aborted') || errMsg.includes('Module.arguments')) {
                // If WebAssembly aborted, switch gracefully to demo mode
                setIsDemoMode(true);
                setActionToast('สลับเข้าสู่โหมดจำลอง (Demo Mode) เนื่องจากเบราว์เซอร์หยุดการประมวลผล WebAssembly');
              }
            } finally {
              isProcessingFrameRef.current = false;
            }
          }
        } else {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      } else if (isDemoMode && canvas) {
        if (canvas.width !== 640 || canvas.height !== 480) {
          canvas.width = 640;
          canvas.height = 480;
        }
        if (isDetectionActive) {
          renderSimulationFrame(canvas);
        } else {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      if (!isCancelled) {
        animationFrameId.current = requestAnimationFrame(processLoop);
      }
    }

    animationFrameId.current = requestAnimationFrame(processLoop);

    return () => {
      isCancelled = true;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isDemoMode, isDetectionActive]);

  // Synthetic Demonstration generator for instant testing without camera
  const demoTime = useRef(0);
  const renderSimulationFrame = (canvas: HTMLCanvasElement) => {
    demoTime.current += 0.04;
    const t = demoTime.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const squatCycle = (Math.sin(t) + 1) / 2;
    const syntheticLandmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      visibility: 0.9,
    }));

    if (cameraViewMode === 'side') {
      // Sagittal Side-Profile Simulation (facing right)
      const headY = 0.20 + squatCycle * 0.16;
      syntheticLandmarks[POSE_LANDMARKS.NOSE] = { x: 0.53, y: headY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_EYE] = { x: 0.51, y: headY - 0.02, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_EAR] = { x: 0.45, y: headY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_EAR] = { x: 0.44, y: headY, visibility: 0.3 };

      const shoulderX = 0.45 + squatCycle * 0.02;
      const shoulderY = 0.30 + squatCycle * 0.17;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: shoulderX, y: shoulderY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: shoulderX - 0.02, y: shoulderY, visibility: 0.3 };

      const elbowX = shoulderX + 0.08;
      const elbowY = shoulderY + 0.08;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: elbowX, y: elbowY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: elbowX - 0.02, y: elbowY, visibility: 0.3 };

      const wristX = elbowX + 0.08;
      const wristY = elbowY - 0.02;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: wristX, y: wristY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: wristX - 0.02, y: wristY, visibility: 0.3 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_INDEX] = { x: wristX + 0.04, y: wristY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_INDEX] = { x: wristX + 0.02, y: wristY, visibility: 0.3 };

      const hipX = 0.43 - squatCycle * 0.07;
      const hipY = 0.50 + squatCycle * 0.18;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_HIP] = { x: hipX, y: hipY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: hipX - 0.02, y: hipY, visibility: 0.3 };

      const kneeX = 0.51 + squatCycle * 0.03;
      const kneeY = 0.68 + squatCycle * 0.10;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: kneeX, y: kneeY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: kneeX - 0.02, y: kneeY, visibility: 0.3 };

      const ankleX = 0.46;
      const ankleY = 0.88;
      syntheticLandmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: ankleX, y: ankleY, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: ankleX - 0.02, y: ankleY, visibility: 0.3 };

      syntheticLandmarks[POSE_LANDMARKS.LEFT_HEEL] = { x: 0.42, y: 0.90, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_HEEL] = { x: 0.41, y: 0.90, visibility: 0.3 };

      syntheticLandmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX] = { x: 0.54, y: 0.90, visibility: 0.96 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX] = { x: 0.53, y: 0.90, visibility: 0.3 };
    } else {
      const kneeY = 0.65 + squatCycle * 0.12;
      const hipY = 0.48 + squatCycle * 0.18;

      syntheticLandmarks[POSE_LANDMARKS.NOSE] = { x: 0.5, y: 0.18 + squatCycle * 0.16, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.58, y: 0.28 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.42, y: 0.28 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.64, y: 0.38 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.36, y: 0.38 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.58, y: 0.42 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.42, y: 0.42 + squatCycle * 0.17, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_HIP] = { x: 0.56, y: hipY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.44, y: hipY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.58, y: kneeY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.42, y: kneeY, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.57, y: 0.88, visibility: 0.95 };
      syntheticLandmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.43, y: 0.88, visibility: 0.95 };
    }

    handlePoseResults({ poseLandmarks: syntheticLandmarks });
  };

  // Start short 6-second video recording
  const handleStartRecordingClip = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecordingClip) return;

    // Auto-resume detection if paused so motion is captured
    if (!isDetectionActive) {
      setIsDetectionActive(true);
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    setIsRecordingClip(true);
    setClipSecondsLeft(6);
    if (soundEffectsEnabled) soundFx.playCalibrationBeep(440);
    speakAlertTh('เริ่มบันทึกคลิปวิดีโอ 6 วินาทีครับ', true);

    recorderRef.current.startRecording(canvas, (blobUrl, base64) => {
      setRecordedClipPreview({ url: blobUrl, base64 });
      setIsRecordingClip(false);
      setClipSecondsLeft(0);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (soundEffectsEnabled) soundFx.playRepSuccess();
      speakAlertTh('บันทึกคลิปสำเร็จ เลือกประเภทเพื่อนำไปเปรียบเทียบได้เลยครับ', true);
    });

    let left = 6;
    recordTimerRef.current = setInterval(() => {
      left -= 1;
      setClipSecondsLeft(left);
      if (left <= 0) {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        recorderRef.current.stopRecording();
      }
    }, 1000);
  };

  // Stop recording early and finalize immediately
  const handleStopRecordingClip = () => {
    if (!isRecordingClip) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setClipSecondsLeft(0);
    recorderRef.current.stopRecording();
    if (soundEffectsEnabled) soundFx.playRepSuccess();
    if (voiceAlertsEnabled) {
      speakAlertTh('หยุดบันทึกคลิปเรียบร้อย กำลังประมวลผลคลิป...', true);
    }
  };

  // Trigger entering trial mode with instructions
  const handleEnterTrialWithInstructions = () => {
    setIsTrialGuideModalOpen(true);
  };

  // Start trial testing after reviewing instructions
  const handleStartTrialAfterGuide = () => {
    setIsTrialGuideModalOpen(false);
    setWorkflowMode('trial');
    setTrialRepsCompleted(0);
    exerciseTracker.reset();
    if (voiceAlertsEnabled) {
      speakAlertTh('เข้าสู่รอบทดสอบระบบ กรุณาลองทำท่า 1 ครั้งเพื่อทดสอบมุมกล้องครับ', true);
    }
  };

  // Start Official Workout with Countdown & Auto Video Recording (Requested)
  const handleStartOfficialWorkoutWithRecording = () => {
    setCountdownNumber(3);
    if (soundEffectsEnabled) soundFx.playCountdownTick();

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        if (soundEffectsEnabled) soundFx.playCountdownTick();
      } else {
        clearInterval(timer);
        setCountdownNumber(null);
        setWorkflowMode('active');
        setIsActiveWorkout(true);
        exerciseTracker.reset();
        setWorkoutDuration(0);
        if (soundEffectsEnabled) soundFx.playRepSuccess();
        if (voiceAlertsEnabled) speakAlertTh('เริ่มการฝึกซ้อมจริงและบันทึกวิดีโอ ขอให้เต็มที่ครับ!', true);

        // Auto-start recording a set video clip
        handleStartRecordingClip();
      }
    }, 1000);
  };

  // Save recorded clip
  const handleSaveRecordedClip = async () => {
    if (!recordedClipPreview) return;

    if (soundEffectsEnabled) soundFx.playRepSuccess();
    const newClip: MotionClipRecord = {
      id: `clip_${Date.now()}`,
      userId: 'user_local',
      exerciseType: currentExercise,
      category: clipCategoryTag,
      accuracyScore: currentFeedback?.accuracyScore ?? 90,
      videoDataUrl: recordedClipPreview.base64,
      repsCount: currentFeedback?.repCount ?? 0,
      notes: `บันทึกเมื่อ ${new Date().toLocaleTimeString('th-TH')}`,
      createdAt: new Date().toISOString(),
    };

    await saveLocalMotionClip(newClip);
    onClipSaved(newClip);
    setRecordedClipPreview(null);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    const categoryLabel = clipCategoryTag === 'before' ? 'Before (ก่อนแก้)' : clipCategoryTag === 'after' ? 'After (หลังแก้ไข)' : 'ซ้อมทั่วไป';
    if (voiceAlertsEnabled) {
      speakAlertTh(`บันทึกคลิป ${categoryLabel} ลงคลังเรียบร้อยครับ`, true);
    }
    setActionToast(`✅ บันทึกคลิป (${categoryLabel}) ลงคลัง JaiklaPoseClipsDB เรียบร้อยแล้ว!`);
    setTimeout(() => setActionToast(null), 5000);
  };

  // Finish Workout Set
  const handleCompleteWorkout = () => {
    setIsActiveWorkout(false);
    setWorkflowMode('briefing');
    const session: WorkoutSessionRecord = {
      id: `session_${Date.now()}`,
      userId: 'user_athlete',
      exerciseType: currentExercise,
      exerciseNameTh: EXERCISE_METAS.find((e) => e.id === currentExercise)?.nameTh || currentExercise,
      repsCount: currentFeedback?.repCount || 0,
      avgAccuracy: currentFeedback?.accuracyScore || 85,
      durationSeconds: workoutDuration,
      caloriesBurned: Math.round(((currentFeedback?.repCount || 1) * 0.45) + (workoutDuration * 0.12)),
      mistakesSummary: currentFeedback?.feedbacks?.map((f) => f.message).join(' | ') || 'ฟอร์มการเล่นสมบูรณ์แบบ',
      aiFeedback: '',
      createdAt: new Date().toISOString(),
    };

    onFinishWorkout(session);
    exerciseTracker.reset();
    setWorkoutDuration(0);
  };

  const selectedMeta = EXERCISE_METAS.find((e) => e.id === currentExercise) || EXERCISE_METAS[0];

  return (
    <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* Exercise Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0f1d]/85 p-3 rounded-2xl border border-cyan-500/25 shadow-xl shadow-black/50">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-cyan-300/80 font-medium px-2">เลือกท่าฝึก:</span>
          {EXERCISE_METAS.map((meta) => (
            <button
              key={meta.id}
              onClick={() => {
                setCurrentExercise(meta.id);
                exerciseTracker.setExercise(meta.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentExercise === meta.id
                  ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40'
                  : 'bg-[#0d1424]/80 text-slate-300 hover:bg-[#131d33] hover:text-cyan-300 border border-cyan-500/20'
              }`}
            >
              <span>{meta.nameTh}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-cyan-300 font-normal">
                {meta.targetAngles.primaryJoint}
              </span>
            </button>
          ))}
        </div>

        {/* Demo Mode switcher */}
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-600/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>โหมดจำลอง (Demo Simulation)</span>
            </span>
          )}
          <button
            onClick={() => setIsDemoMode((prev) => !prev)}
            className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-4 px-2"
          >
            {isDemoMode ? 'สลับไปใช้กล้องจริง' : 'ทดสอบโหมดจำลอง'}
          </button>
        </div>
      </div>

      {/* Guided 3-Step Preparation Header Bar (Briefing -> Trial -> Ready -> Active) */}
      <div className="bg-gradient-to-r from-[#070b14] via-[#0d1629] to-[#070b14] p-4 rounded-2xl border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(6,182,212,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <BookOpen className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-hud font-bold text-cyan-300 uppercase tracking-wider">
                ขั้นตอนการเตรียมความพร้อม
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0d1527] text-cyan-200 border border-cyan-500/30">
                {workflowMode === 'briefing'
                  ? '1. ศึกษาคำอธิบายท่า'
                  : workflowMode === 'trial'
                  ? '2. รอบทดสอบระบบตรวจจับ'
                  : workflowMode === 'ready'
                  ? '3. ระบบพร้อมแล้ว'
                  : '4. กำลังฝึกซ้อมจริง'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {workflowMode === 'briefing'
                ? 'ทำความเข้าใจวิธีเล่นและจุดระวัง จากนั้นกดทดสอบระบบตรวจจับ'
                : workflowMode === 'trial'
                ? 'ลองย่อหรือทำท่า 1 ครั้ง เพื่อให้ AI ตรวจสอบมุมกล้องและทดสอบการนับครั้ง'
                : workflowMode === 'ready'
                ? 'ระบบตรวจจับสำเร็จ! กดปุ่มเริ่มจับเวลาและบันทึกวิดีโอเพื่อเริ่มการฝึกจริง'
                : 'กำลังฝึกซ้อมและนับครั้งแบบเรียลไทม์'}
            </p>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {workflowMode === 'briefing' && (
            <button
              onClick={handleEnterTrialWithInstructions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/30 transition-all"
            >
              <span>🧪 ทดสอบระบบตรวจจับ (พร้อมคำแนะนำ)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {workflowMode === 'trial' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTrialGuideModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/40"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ดูขั้นตอนอีกครั้ง</span>
              </button>
              <button
                onClick={() => setWorkflowMode('ready')}
                className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-[#0d1424]"
              >
                ข้ามไปหน้าแจ้งความพร้อม
              </button>
            </div>
          )}

          {workflowMode === 'ready' && (
            <button
              onClick={handleStartOfficialWorkoutWithRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:brightness-110 shadow-xl shadow-cyan-400/30 animate-pulse transition-all"
            >
              <span>🚀 เริ่มจับเวลาการฝึกจริง & บันทึกวิดีโอ</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport: Expanded High-Presence Video Camera with 3 Collapsible Transparent Overlays */}
      <div className="w-full space-y-4">
        <div
          ref={cameraContainerRef}
          className={`relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#06030c] border-2 border-purple-600/40 shadow-2xl shadow-purple-950/70 w-full flex items-center justify-center group select-none transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 rounded-none border-none h-screen max-h-none'
              : 'min-h-[520px] h-[68vh] sm:h-[74vh] md:h-[78vh] lg:h-[82vh] max-h-[920px]'
          }`}
        >
          {/* Direct Camera Video Feed - 100% visible and mirrored for natural selfie view */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full transform -scale-x-100 z-0 transition-all ${
              fitMode === 'cover' ? 'object-cover' : 'object-contain bg-[#030107]'
            }`}
            playsInline
            muted
          />

          {/* Transparent Canvas directly overlaying skeleton graphics, angles, and keypoints on user's body */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full transform -scale-x-100 z-10 pointer-events-none transition-all ${
              fitMode === 'cover' ? 'object-cover' : 'object-contain'
            }`}
          />

          {/* Model Loading Indicator */}
          {modelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080411]/90 z-30 space-y-3">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-violet-300">กำลังโหลดโมเดล AI Vision (33 Keypoints)...</p>
              <p className="text-xs text-purple-300/70">กรุณารอสักครู่ ระบบกำลังเร่งความเร็วด้วย WebGL/GPU</p>
            </div>
          )}

          {/* 3-2-1 Countdown Overlay */}
          {countdownNumber !== null && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#080411]/70 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <span className="text-8xl font-black font-hud text-violet-400 animate-ping block">
                  {countdownNumber}
                </span>
                <p className="text-sm font-bold text-white tracking-widest uppercase">GET READY!</p>
              </div>
            </div>
          )}

          {/* Prominent Live Video Recording Indicator Banner */}
          {isRecordingClip && (
            <div className="absolute top-16 inset-x-4 flex justify-center pointer-events-none z-30 animate-pulse">
              <div className="bg-rose-950/95 border-2 border-rose-500 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold font-hud tracking-wider text-rose-200">
                  🔴 REC • กำลังบันทึกคลิป 00:0{clipSecondsLeft} วินาที
                </span>
                <span className="text-[11px] font-mono bg-rose-900/80 px-2 py-0.5 rounded text-rose-300">
                  กดปุ่มแดงเพื่อหยุดและบันทึกทันที
                </span>
              </div>
            </div>
          )}

          {/* UN-MIRRORED PAUSED OVERLAY */}
          {!isDetectionActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080411]/60 backdrop-blur-[3px] p-4">
              <div className="bg-[#120824]/95 border-2 border-amber-500 text-center px-8 py-6 rounded-3xl shadow-2xl space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                  <Pause className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-hud text-amber-400">
                    ⏸️ การตรวจจับหยุดชั่วคราว (PAUSED)
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1">
                    ระบบหยุดประมวลผลมุมข้อต่อชั่วคราว โดยกล้องยังแสดงภาพตามปกติ
                  </p>
                </div>
                <button
                  onClick={toggleDetection}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
                >
                  ▶️ กดเพื่อเริ่มการตรวจจับต่อ
                </button>
              </div>
            </div>
          )}

          {/* TRIAL MODE BANNER (When in trial testing round) */}
          {workflowMode === 'trial' && isDetectionActive && (
            <div className="absolute top-16 inset-x-4 z-20 flex justify-center pointer-events-none">
              <div className="bg-[#160930]/90 border border-violet-400 text-violet-200 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-violet-300 flex-shrink-0 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-violet-300">
                    รอบทดสอบระบบ: ลองย่อหรือขยับ 1 ครั้ง
                  </p>
                  <p className="text-[11px] text-purple-200/80">
                    AI กำลังทดสอบความลึกและการนับครั้ง (ทำแล้ว {trialRepsCompleted}/1 ครั้ง)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* READY NOTIFICATION OVERLAY */}
          {workflowMode === 'ready' && isDetectionActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080411]/60 backdrop-blur-[2px] p-4">
              <div className="bg-[#120824]/95 border-2 border-emerald-500 text-center px-8 py-6 rounded-3xl shadow-2xl space-y-4 max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                    SYSTEM READY
                  </span>
                  <h3 className="text-lg font-bold font-hud text-white mt-0.5">
                    🎯 ระบบพร้อมแล้ว! ตรวจจับมุมข้อต่อได้แม่นยำ
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1.5 leading-relaxed">
                    กล้องจับตำแหน่งร่างกายและระยะย่อได้สมบูรณ์แบบ คุณสามารถเริ่มการฝึกซ้อมจริงพร้อมเปิดจับเวลาและบันทึกคลิปวิดีโอได้ทันที
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleStartOfficialWorkoutWithRecording}
                    className="w-full py-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🚀 เริ่มจับเวลาการฝึกจริง & บันทึกวิดีโอ</span>
                  </button>
                  <button
                    onClick={() => setWorkflowMode('trial')}
                    className="text-[11px] text-purple-300 hover:text-white py-1"
                  >
                    ทดสอบระบบอีกครั้ง
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top HUD Bar Overlay */}
          <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-none">
            {/* Left: Brand Watermark, Phase & Camera View Switcher */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <div className="bg-[#0a0414]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-800/60 shadow-lg flex items-center gap-2">
                <span className="text-[11px] font-hud font-bold tracking-wider text-violet-300">
                  J Λ I K L Λ
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-600/30 text-violet-200 font-mono font-bold border border-violet-500/40">
                  ACTIVE
                </span>
                <span className="text-purple-600">|</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDetectionActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                ></span>
                <span className="text-xs font-hud font-semibold text-white">
                  {selectedMeta.nameEn}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                    !isDetectionActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentFeedback?.stage === 'down'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {!isDetectionActive
                    ? 'PAUSED'
                    : currentFeedback?.stage === 'down'
                    ? 'DOWN (ย่อสุด)'
                    : 'UP (เตรียม)'}
                </span>
              </div>

              {/* Camera View Mode Selector: Front View vs Side-Profile View (14 Segments) */}
              <div className="bg-[#0a0414]/90 backdrop-blur-md p-1 rounded-xl border border-purple-700/60 shadow-lg flex items-center gap-1">
                <button
                  onClick={() => {
                    setCameraViewMode('front');
                    if (soundEffectsEnabled) soundFx.playCalibrationBeep(520);
                  }}
                  className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                    cameraViewMode === 'front'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-md'
                      : 'text-purple-300/70 hover:text-white hover:bg-purple-950/80 font-medium'
                  }`}
                  title="โหมดมุมกล้องหน้าตรง (Frontal Plane Tracking)"
                >
                  <span>🧍‍♂️ หน้าตรง</span>
                </button>
                <button
                  onClick={() => {
                    setCameraViewMode('side');
                    if (soundEffectsEnabled) soundFx.playRepSuccess();
                    if (voiceAlertsEnabled) speakAlertTh('เปิดโหมดตรวจจับการเคลื่อนไหวด้านข้างร่างกาย 14 จุด', true);
                  }}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                    cameraViewMode === 'side'
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white font-extrabold shadow-md ring-1 ring-violet-300'
                      : 'text-purple-300/70 hover:text-violet-300 hover:bg-purple-950/80 font-medium'
                  }`}
                  title="เปิดโหมดตรวจจับการเคลื่อนไหวด้านข้างร่างกาย (Sagittal 14 Segments Analysis)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-ping"></span>
                  <span>🏃‍♂️ ด้านข้าง (14 จุด)</span>
                </button>
              </div>

              {/* Side Selector (Visible when in Side Mode) */}
              {cameraViewMode === 'side' && (
                <div className="hidden lg:flex items-center gap-1 bg-[#0a0414]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-purple-700/60 shadow-lg text-[10px]">
                  <span className="text-violet-400 font-mono font-semibold mr-0.5">ฝั่งร่างกาย:</span>
                  <button
                    onClick={() => setSelectedBodySide('auto')}
                    className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                      selectedBodySide === 'auto'
                        ? 'bg-violet-500/30 text-violet-200 border border-violet-400/60 font-bold'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                    title="ระบบเลือกตรวจจับฝั่งที่มีความชัดเจนที่สุดโดยอัตโนมัติ"
                  >
                    🤖 ออโต้ ({currentFeedback?.sideProfile?.activeSide === 'left' ? 'ซ้าย' : 'ขวา'})
                  </button>
                  <button
                    onClick={() => setSelectedBodySide('left')}
                    className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                      selectedBodySide === 'left'
                        ? 'bg-violet-500/30 text-violet-200 border border-violet-400/60 font-bold'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                    title="บังคับตรวจจับฝั่งซ้ายของร่างกาย"
                  >
                    👈 ซ้าย
                  </button>
                  <button
                    onClick={() => setSelectedBodySide('right')}
                    className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                      selectedBodySide === 'right'
                        ? 'bg-violet-500/30 text-violet-200 border border-violet-400/60 font-bold'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                    title="บังคับตรวจจับฝั่งขวาของร่างกาย"
                  >
                    👉 ขวา
                  </button>
                </div>
              )}
            </div>

            {/* Center Quick HUD Pill Toggles & Zen Mode button */}
            <div className="pointer-events-auto hidden md:flex items-center gap-1 bg-[#0a0414]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-purple-900/60 shadow-lg">
              {/* Guide Overlay Toggle */}
              <button
                onClick={() => {
                  if (!showGuideOverlay) {
                    setShowGuideOverlay(true);
                    setIsGuideCollapsed(false);
                  } else {
                    setIsGuideCollapsed((prev) => !prev);
                  }
                }}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
                  !showGuideOverlay
                    ? 'text-purple-400/60 hover:text-purple-300 bg-transparent'
                    : isGuideCollapsed
                    ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                    : 'bg-violet-500/20 text-violet-200 border border-violet-500/40 font-semibold'
                }`}
                title="กดเพื่อเปิด/ย่อ/ซ้อน กล่องคำแนะนำการเล่น"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>คำแนะนำ {showGuideOverlay ? (isGuideCollapsed ? '(ย่อ)' : '(เปิด)') : '(ปิด)'}</span>
              </button>

              {/* Angles Overlay Toggle */}
              <button
                onClick={() => {
                  if (!showAnglesOverlay) {
                    setShowAnglesOverlay(true);
                    setIsAnglesCollapsed(false);
                  } else {
                    setIsAnglesCollapsed((prev) => !prev);
                  }
                }}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
                  !showAnglesOverlay
                    ? 'text-purple-400/60 hover:text-purple-300 bg-transparent'
                    : isAnglesCollapsed
                    ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                    : 'bg-violet-500/20 text-violet-200 border border-violet-500/40 font-semibold'
                }`}
                title={cameraViewMode === 'side' ? 'กล่องวิเคราะห์สรีระ 14 จุดด้านข้าง' : 'กล่ององศาข้อต่อเรียลไทม์'}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>
                  {cameraViewMode === 'side' ? 'สรีระ 14 จุด' : 'องศาข้อต่อ'}{' '}
                  {showAnglesOverlay ? (isAnglesCollapsed ? '(ย่อ)' : '(เปิด)') : '(ปิด)'}
                </span>
              </button>

              {/* Stats Overlay Toggle */}
              <button
                onClick={() => {
                  if (!showStatsOverlay) {
                    setShowStatsOverlay(true);
                    setIsStatsCollapsed(false);
                  } else {
                    setIsStatsCollapsed((prev) => !prev);
                  }
                }}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
                  !showStatsOverlay
                    ? 'text-purple-400/60 hover:text-purple-300 bg-transparent'
                    : isStatsCollapsed
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-semibold'
                }`}
                title="กดเพื่อเปิด/ย่อ/ซ้อน กล่องสถิติเซ็ตปัจจุบัน"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>สถิติเซ็ต {showStatsOverlay ? (isStatsCollapsed ? '(ย่อ)' : '(เปิด)') : '(ปิด)'}</span>
              </button>

              <div className="w-[1px] h-4 bg-purple-900 mx-0.5"></div>

              {/* Zen Mode Button: Instant Hide/Show All Overlays for Max Video Area */}
              <button
                onClick={() => setZenMode((z) => !z)}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all font-mono ${
                  zenMode
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-md'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-950/70'
                }`}
                title={zenMode ? 'ออกจากโหมดเต็มจอภาพ (แสดงกล่อง overlay)' : 'โหมดจอภาพใหญ่เต็มตา (ซ่อนกล่อง overlay ทุกอัน)'}
              >
                {zenMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{zenMode ? 'แสดงกล่อง' : 'ซ่อนทุกกล่อง'}</span>
              </button>

              {/* Fit Mode Toggle */}
              <button
                onClick={() => setFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                className="text-[11px] px-2 py-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-950/70 transition-all font-mono"
                title={fitMode === 'cover' ? 'เปลี่ยนเป็นโหมดสัดส่วนเต็มกล้อง (Contain)' : 'เปลี่ยนเป็นโหมดครอบเต็มจอ (Cover)'}
              >
                {fitMode === 'cover' ? '🖼️ เต็มจอ' : '🔍 พอดีจอ'}
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="text-[11px] p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-950/70 transition-all"
                title={isFullscreen ? 'ออกจากโหมดเต็มหน้าจอ' : 'ขยายเต็มหน้าจอ (Fullscreen)'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Right: Show/Hide Numbers HUD Button, Reps Counter & Accuracy Display */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNumbersHUD((prev) => !prev)}
                className={`pointer-events-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all font-bold border backdrop-blur-md cursor-pointer ${
                  showNumbersHUD
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="กดเพื่อแสดงหรือซ่อนตัวเลขขนาดใหญ่บนหน้าจอ"
              >
                {showNumbersHUD ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showNumbersHUD ? 'ซ่อนตัวเลข' : 'แสดงตัวเลข'}</span>
              </button>

              <div className="pointer-events-auto flex items-center gap-3 bg-[#0a0414]/90 backdrop-blur-md px-4 py-1.5 rounded-xl border border-violet-500/50 shadow-xl hud-glow-violet">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-violet-400 font-mono tracking-widest block">REPETITIONS</span>
                <span className="text-2xl font-black font-hud text-white leading-none">
                  {currentFeedback?.repCount || 0}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-purple-800"></div>
              <div className="text-center">
                <span className="text-[10px] uppercase text-purple-300/70 font-mono block">ACCURACY</span>
                <span
                  className={`text-lg font-bold font-hud ${
                    (currentFeedback?.accuracyScore || 100) >= 85
                      ? 'text-emerald-400'
                      : (currentFeedback?.accuracyScore || 100) >= 70
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {currentFeedback?.accuracyScore || 100}%
                </span>
              </div>
              <div className="h-8 w-[1px] bg-purple-800 hidden sm:block"></div>
              <div className="text-left hidden sm:block">
                <span className="text-[10px] uppercase text-purple-300/70 font-mono block">TIME</span>
                <span className="text-sm font-bold font-mono text-violet-300">
                  {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* Depth Progress Bar on Top-Left */}
          {isDetectionActive && (
            <div className="absolute top-14 left-3 sm:left-4 z-20 pointer-events-none">
              <div className="bg-[#0a0f1d]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 w-36 sm:w-40 space-y-1 shadow-lg shadow-cyan-950/40">
                <div className="flex justify-between text-[10px] font-mono text-cyan-300/80">
                  <span>DEPTH GAUGE</span>
                  <span className="text-cyan-400 font-bold">{currentFeedback?.repProgress || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 transition-all duration-75"
                    style={{ width: `${currentFeedback?.repProgress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* RIGHT FLOATING HUD: LARGE NUMBERS, FRAMELESS, HEAVY DROP SHADOW */}
          {/* ============================================================== */}
          {showNumbersHUD && rightHudMode === 'frameless' && (
            <div className="absolute top-20 right-4 sm:right-6 bottom-24 z-20 flex flex-col justify-center items-end text-right pointer-events-none select-none max-w-[340px] sm:max-w-[420px] transition-all">
              {/* Giant Repetitions Number */}
              <div className="mb-4">
                <span className="text-xs sm:text-sm font-semibold tracking-wider text-cyan-200 uppercase hud-contrast-text block">
                  จำนวนครั้ง (REPETITIONS)
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-6xl sm:text-7xl md:text-8xl font-black font-hud text-white tracking-tighter hud-giant-number">
                    {currentFeedback?.repCount || 0}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold font-hud text-cyan-400 hud-contrast-text">
                    REPS
                  </span>
                </div>
              </div>

              {/* Giant Joint Angle */}
              <div className="mb-4">
                <span className="text-xs text-slate-200 font-semibold uppercase hud-contrast-text block">
                  {selectedMeta.targetAngles.primaryJoint}
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black font-hud text-cyan-300 tracking-tight hud-giant-number">
                    {cameraViewMode === 'side' && currentFeedback?.sideProfile
                      ? `${currentFeedback.sideProfile.knee.angle}°`
                      : `${currentFeedback?.angles.leftKnee || 170}°`}
                  </span>
                  <span className="text-sm font-mono text-emerald-300 hud-contrast-text">
                    เป้า: {selectedMeta.targetAngles.targetRange[0]}°-{selectedMeta.targetAngles.targetRange[1]}°
                  </span>
                </div>
              </div>

              {/* Accuracy & Form Score */}
              <div className="mb-3">
                <span className="text-[11px] sm:text-xs text-slate-200 font-semibold uppercase hud-contrast-text block">
                  คะแนนความแม่นยำ (ACCURACY)
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span
                    className={`text-4xl sm:text-5xl md:text-6xl font-black font-hud tracking-tight hud-giant-number ${
                      (currentFeedback?.accuracyScore || 100) >= 85
                        ? 'text-emerald-400'
                        : (currentFeedback?.accuracyScore || 100) >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currentFeedback?.accuracyScore || 100}%
                  </span>
                </div>
              </div>

              {/* Spine Angle */}
              <div>
                <span className="text-[11px] text-slate-300 font-semibold uppercase hud-contrast-text block">
                  องศาลำตัว (SPINE TILT)
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-hud text-cyan-200 hud-giant-number">
                    {currentFeedback?.angles.spineInclination || 8}°
                  </span>
                </div>
              </div>

              {/* Switch to detailed card mode button */}
              <div className="pointer-events-auto mt-4 flex items-center gap-2">
                <button
                  onClick={() => setRightHudMode('detailed')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 shadow-md backdrop-blur-sm cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>สลับดูการ์ดละเอียด</span>
                </button>
              </div>
            </div>
          )}

          {/* Detailed Cards Overlay Mode */}
          {showNumbersHUD && rightHudMode === 'detailed' && (
            <div className="absolute top-16 right-3 sm:right-4 bottom-20 z-20 flex flex-col gap-2.5 w-72 sm:w-80 md:w-[350px] max-w-[calc(100%-1.5rem)] pointer-events-none overflow-y-auto custom-scrollbar pr-1 pb-1 transition-all">
              <div className="pointer-events-auto flex items-center justify-between pb-1">
                <button
                  onClick={() => setRightHudMode('frameless')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 shadow-md backdrop-blur-sm cursor-pointer flex items-center gap-1 font-bold"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>สลับเป็นตัวเลขใหญ่ไร้กรอบ</span>
                </button>
              </div>
            
            {/* OVERLAY 1: กล่องคำแนะนำการเล่น (Exercise Guidance) */}
            {showGuideOverlay && (
              <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl transition-all duration-200">
                {/* Header with Title and Fold/Close Controls */}
                <div
                  onClick={() => setIsGuideCollapsed((prev) => !prev)}
                  className="flex items-center justify-between cursor-pointer select-none border-b border-cyan-900/40 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold font-hud text-white uppercase tracking-wider truncate">
                      คำแนะนำการเล่น: {selectedMeta.nameTh}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80">
                      GUIDE
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGuideCollapsed((prev) => !prev);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isGuideCollapsed ? 'ขยายข้อมูล' : 'ซ้อน/ย่อข้อมูล'}
                    >
                      {isGuideCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGuideOverlay(false);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="ปิดการแสดงผลกล่องนี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsed Compact View */}
                {isGuideCollapsed ? (
                  <div
                    onClick={() => setIsGuideCollapsed(false)}
                    className="pt-2 cursor-pointer flex items-center justify-between text-[11px] text-slate-300 hover:text-cyan-300"
                  >
                    <span className="truncate">
                      🎯 {selectedMeta.targetAngles.primaryJoint} ({selectedMeta.targetAngles.targetRange[0]}°-{selectedMeta.targetAngles.targetRange[1]}°)
                    </span>
                    <span className="text-[10px] text-cyan-400 underline font-mono flex-shrink-0 ml-1">
                      คลิกเพื่อขยาย
                    </span>
                  </div>
                ) : (
                  /* Expanded Detailed View */
                  <div className="space-y-2.5 pt-2.5">
                    {/* Execution Steps */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-cyan-300 block">ลำดับการปฏิบัติที่ถูกต้อง:</span>
                      <div className="space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                        {selectedMeta.executionStepsTh.map((step, idx) => (
                          <p key={idx} className="text-[11px] text-slate-300 leading-relaxed">
                            {step}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Mistakes to avoid */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span>ข้อผิดพลาดที่ต้องระวัง:</span>
                      </span>
                      <ul className="space-y-0.5 bg-rose-950/20 p-2 rounded-xl border border-rose-900/30 max-h-24 overflow-y-auto">
                        {selectedMeta.mistakesToAvoidTh.map((mistake, idx) => (
                          <li key={idx} className="text-[10px] text-rose-200/90 flex items-start gap-1">
                            <span className="text-rose-400">•</span>
                            <span>{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-0.5 flex justify-end">
                      <button
                        onClick={() => setIsTrialGuideModalOpen(true)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>ดูวิธีและ 4 ขั้นตอนก่อนเริ่ม</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY 2: กล่ององศาข้อต่อเรียลไทม์ & วิเคราะห์สรีระ 14 จุดด้านข้าง */}
            {showAnglesOverlay && (
              <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl transition-all duration-200">
                {/* Header with Title and Fold/Close Controls */}
                <div
                  onClick={() => setIsAnglesCollapsed((prev) => !prev)}
                  className="flex items-center justify-between cursor-pointer select-none border-b border-cyan-900/40 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold font-hud text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>{cameraViewMode === 'side' ? 'วิเคราะห์สรีระด้านข้าง 14 จุด' : 'องศาข้อต่อเรียลไทม์'}</span>
                        {cameraViewMode === 'side' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                            SAGITTAL
                          </span>
                        )}
                      </h4>
                      {cameraViewMode === 'side' && currentFeedback?.sideProfile && (
                        <p className="text-[10px] text-slate-400">
                          {currentFeedback.sideProfile.activeSide === 'left' ? 'ฝั่งซ้าย' : 'ฝั่งขวา'} •{' '}
                          {currentFeedback.sideProfile.facingDirection === 'right' ? 'หันหน้าขวา' : 'หันหน้าซ้าย'} •{' '}
                          ความแม่นยำ {currentFeedback.sideProfile.confidence}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        isDetectionActive
                          ? 'text-emerald-300 bg-emerald-950/80 border-emerald-800'
                          : 'text-amber-300 bg-amber-950/80 border-amber-800'
                      }`}
                    >
                      {isDetectionActive ? 'LIVE' : 'PAUSED'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAnglesCollapsed((prev) => !prev);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isAnglesCollapsed ? 'ขยายข้อมูล' : 'ซ้อน/ย่อข้อมูล'}
                    >
                      {isAnglesCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAnglesOverlay(false);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="ปิดการแสดงผลกล่องนี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsed Compact View */}
                {isAnglesCollapsed ? (
                  <div
                    onClick={() => setIsAnglesCollapsed(false)}
                    className="pt-2 cursor-pointer flex items-center justify-between text-[11px] text-slate-300 hover:text-cyan-300"
                  >
                    {cameraViewMode === 'side' && currentFeedback?.sideProfile ? (
                      <span className="font-mono truncate">
                        🏃‍♂️ {currentFeedback.sideProfile.activeSide === 'left' ? 'ซ้าย' : 'ขวา'} • ฟอร์ม {currentFeedback.sideProfile.overallFormScore}% • เข่า {currentFeedback.sideProfile.knee.angle}° • เอว {currentFeedback.sideProfile.waist.angle}°
                      </span>
                    ) : (
                      <span className="font-mono truncate">
                        เข่า {currentFeedback?.angles.leftKnee || 170}°/{currentFeedback?.angles.rightKnee || 170}° • ศอก {currentFeedback?.angles.leftElbow || 165}°
                      </span>
                    )}
                    <span className="text-[10px] text-cyan-400 underline font-mono flex-shrink-0 ml-1">
                      คลิกเพื่อขยาย
                    </span>
                  </div>
                ) : (
                  /* Expanded Detailed View */
                  <div className="space-y-2 pt-2">
                    {cameraViewMode === 'side' && currentFeedback?.sideProfile ? (
                      <>
                        {/* Side selector and Plumb guide toggle bar */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900/70 rounded-xl border border-teal-900/40 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono">ฝั่งที่ตรวจจับ:</span>
                            <button
                              onClick={() => setSelectedBodySide('auto')}
                              className={`px-2 py-0.5 rounded transition-all ${
                                selectedBodySide === 'auto'
                                  ? 'bg-teal-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white bg-slate-800/80'
                              }`}
                            >
                              🤖 ออโต้ ({currentFeedback.sideProfile.activeSide === 'left' ? 'ซ้าย' : 'ขวา'})
                            </button>
                            <button
                              onClick={() => setSelectedBodySide('left')}
                              className={`px-2 py-0.5 rounded transition-all ${
                                selectedBodySide === 'left'
                                  ? 'bg-teal-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white bg-slate-800/80'
                              }`}
                            >
                              👈 ซ้าย
                            </button>
                            <button
                              onClick={() => setSelectedBodySide('right')}
                              className={`px-2 py-0.5 rounded transition-all ${
                                selectedBodySide === 'right'
                                  ? 'bg-teal-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white bg-slate-800/80'
                              }`}
                            >
                              👉 ขวา
                            </button>
                          </div>
                          <button
                            onClick={() => setShowPlumbLine(!showPlumbLine)}
                            className={`px-2 py-0.5 rounded font-mono transition-all ${
                              showPlumbLine
                                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                            title="เปิด/ปิดเส้นดิ่งถ่วงน้ำหนัก plumb line บนหน้าจอ"
                          >
                            📏 เส้นดิ่ง {showPlumbLine ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {/* Top KPI Summary Cards */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block font-mono">คะแนนชีวกลศาสตร์</span>
                            <span className="text-base font-bold font-hud text-cyan-300">
                              {currentFeedback.sideProfile.overallFormScore}%
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block font-mono">เข่าเทียบปลายเท้า</span>
                            <span
                              className={`text-[11px] font-bold font-hud ${
                                currentFeedback.sideProfile.kneeOverToeStatus === 'safe'
                                  ? 'text-emerald-400'
                                  : currentFeedback.sideProfile.kneeOverToeStatus === 'warning'
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {currentFeedback.sideProfile.kneeOverToeStatus === 'safe'
                                ? 'ปลอดภัย (ไม่เลย)'
                                : currentFeedback.sideProfile.kneeOverToeStatus === 'warning'
                                ? 'ยื่นเล็กน้อย (~พอดีเท้า)'
                                : 'ยื่นเลยปลายเท้าเกินเกณฑ์'}
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block font-mono">เส้นดิ่ง (Plumb Line)</span>
                            <span className="text-xs font-bold text-slate-200">
                              เบี่ยงเบน {currentFeedback.sideProfile.plumbLineDeviation}°
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block font-mono">แนวกระดูกสันหลัง</span>
                            <span
                              className={`text-[11px] font-bold ${
                                currentFeedback.sideProfile.backPosture === 'neutral'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {currentFeedback.sideProfile.backPostureText}
                            </span>
                          </div>
                        </div>

                        {/* Category filter tabs */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px]">
                          <button
                            onClick={() => setSideSegmentFilter('all')}
                            className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                              sideSegmentFilter === 'all'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ทั้งหมด (14 จุด)
                          </button>
                          <button
                            onClick={() => setSideSegmentFilter('upper')}
                            className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                              sideSegmentFilter === 'upper'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ส่วนบน
                          </button>
                          <button
                            onClick={() => setSideSegmentFilter('core')}
                            className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                              sideSegmentFilter === 'core'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            แกนกลาง
                          </button>
                          <button
                            onClick={() => setSideSegmentFilter('lower')}
                            className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                              sideSegmentFilter === 'lower'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ส่วนล่าง
                          </button>
                        </div>

                        {/* List of 14 segments with detail */}
                        <div className="space-y-1.5 max-h-72 sm:max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                          {[
                            { num: 1, key: 'head', data: currentFeedback.sideProfile.head, cat: 'upper', label: '1. หัว (Head)' },
                            { num: 2, key: 'neck', data: currentFeedback.sideProfile.neck, cat: 'upper', label: '2. คอ (Neck)' },
                            { num: 3, key: 'shoulder', data: currentFeedback.sideProfile.shoulder, cat: 'upper', label: '3. ไหล่ (Shoulders)' },
                            { num: 4, key: 'arm', data: currentFeedback.sideProfile.arm, cat: 'upper', label: '4. แขน (Arm/Elbow)' },
                            { num: 5, key: 'wrist', data: currentFeedback.sideProfile.wrist, cat: 'upper', label: '5. ข้อมือ (Wrist)' },
                            { num: 6, key: 'finger', data: currentFeedback.sideProfile.finger, cat: 'upper', label: '6. นิ้วมือ (Fingers)' },
                            { num: 7, key: 'waist', data: currentFeedback.sideProfile.waist, cat: 'core', label: '7. เอว/สะโพก (Waist)' },
                            { num: 8, key: 'thigh', data: currentFeedback.sideProfile.thigh, cat: 'core', label: '8. ต้นขา (Thigh)' },
                            { num: 9, key: 'knee', data: currentFeedback.sideProfile.knee, cat: 'lower', label: '9. หัวเข่า (Knee)' },
                            { num: 10, key: 'shank', data: currentFeedback.sideProfile.shank, cat: 'lower', label: '10. ลำแข้ง (Shank/Tibia)' },
                            { num: 11, key: 'ankle', data: currentFeedback.sideProfile.ankle, cat: 'lower', label: '11. ข้อเท้า (Ankle)' },
                            { num: 12, key: 'heel', data: currentFeedback.sideProfile.heel, cat: 'lower', label: '12. ส้นเท้า (Heel)' },
                            { num: 13, key: 'midfoot', data: currentFeedback.sideProfile.midfoot, cat: 'lower', label: '13. ข้างฝ่าเท้า (Midfoot)' },
                            { num: 14, key: 'toes', data: currentFeedback.sideProfile.toes, cat: 'lower', label: '14. ปลายนิ้วเท้า (Toes)' },
                          ]
                            .filter((item) => sideSegmentFilter === 'all' || item.cat === sideSegmentFilter)
                            .map((seg) => (
                              <div
                                key={seg.key}
                                className="bg-slate-900/70 hover:bg-slate-900 p-2 rounded-xl border border-slate-800/80 transition-all space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-200">
                                    {seg.label}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                        seg.data.status === 'optimal'
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : seg.data.status === 'warning'
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      }`}
                                    >
                                      {seg.data.status === 'optimal'
                                        ? 'ดีเยี่ยม'
                                        : seg.data.status === 'warning'
                                        ? 'ควรปรับ'
                                        : 'ต้องแก้ไข'}
                                    </span>
                                    <span className="text-sm font-bold font-hud text-cyan-300 min-w-[36px] text-right">
                                      {seg.data.angle}°
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-teal-300 font-medium">
                                    ทิศทาง: {seg.data.direction}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-tight">
                                  {seg.data.description}
                                </p>
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      /* Standard Frontal View Joint Angles */
                      <div className="space-y-1.5">
                        {/* Knee row */}
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-300 font-medium block">ข้อเข่าซ้าย / ขวา</span>
                            <span className="text-[10px] text-slate-400">
                              เป้าหมาย: {selectedMeta.targetAngles.targetRange[0]}° - {selectedMeta.targetAngles.targetRange[1]}°
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-bold font-hud text-cyan-300">
                              {currentFeedback?.angles.leftKnee || 170}° / {currentFeedback?.angles.rightKnee || 170}°
                            </span>
                          </div>
                        </div>

                        {/* Elbow row */}
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-300 font-medium block">ข้อศอกซ้าย / ขวา</span>
                            <span className="text-[10px] text-slate-400">เป้าหมาย: 90°</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-bold font-hud text-cyan-300">
                              {currentFeedback?.angles.leftElbow || 165}° / {currentFeedback?.angles.rightElbow || 165}°
                            </span>
                          </div>
                        </div>

                        {/* Spine row */}
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-300 font-medium block">ความโน้มลำตัว (Spine)</span>
                            <span className="text-[10px] text-slate-400">แนะนำ: ไม่เกิน 25°</span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm sm:text-base font-bold font-hud ${
                                (currentFeedback?.angles.spineInclination || 0) > 30 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {currentFeedback?.angles.spineInclination || 8}°
                            </span>
                          </div>
                        </div>

                        {/* Prompt to switch to side mode */}
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              setCameraViewMode('side');
                              if (voiceAlertsEnabled) speakAlertTh('เปิดโหมดวิเคราะห์ด้านข้าง 14 จุด', true);
                            }}
                            className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>🏃‍♂️ เปิดการวิเคราะห์ด้านข้างครบ 14 จุด (หัวถึงเท้า)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* OVERLAY 3: กล่องสถิติเซ็ตปัจจุบัน (Current Workout Set Stats) */}
            {showStatsOverlay && (
              <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl transition-all duration-200">
                {/* Header with Title and Fold/Close Controls */}
                <div
                  onClick={() => setIsStatsCollapsed((prev) => !prev)}
                  className="flex items-center justify-between cursor-pointer select-none border-b border-emerald-900/40 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold font-hud text-white uppercase tracking-wider">
                      สถิติเซ็ตปัจจุบัน
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        isActiveWorkout
                          ? 'text-rose-300 bg-rose-950/80 border-rose-800 animate-pulse'
                          : 'text-slate-300 bg-slate-900/80 border-slate-700'
                      }`}
                    >
                      {isActiveWorkout ? 'RECORDING' : 'READY'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStatsCollapsed((prev) => !prev);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isStatsCollapsed ? 'ขยายข้อมูล' : 'ซ้อน/ย่อข้อมูล'}
                    >
                      {isStatsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatsOverlay(false);
                      }}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="ปิดการแสดงผลกล่องนี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsed Compact View */}
                {isStatsCollapsed ? (
                  <div
                    onClick={() => setIsStatsCollapsed(false)}
                    className="pt-2 cursor-pointer flex items-center justify-between text-[11px] text-slate-300 hover:text-emerald-300"
                  >
                    <span className="font-mono truncate">
                      {currentFeedback?.repCount || 0} ครั้ง • {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')}m • {Math.round(((currentFeedback?.repCount || 0) * 0.45) + workoutDuration * 0.12)} kcal
                    </span>
                    <span className="text-[10px] text-emerald-400 underline font-mono flex-shrink-0 ml-1">
                      คลิกเพื่อขยาย
                    </span>
                  </div>
                ) : (
                  /* Expanded Detailed View */
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>เวลาฝึกซ้อม</span>
                      </div>
                      <p className="text-base font-bold font-hud text-white">
                        {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')} นาที
                      </p>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>แคลอรี</span>
                      </div>
                      <p className="text-base font-bold font-hud text-amber-300">
                        {Math.round(((currentFeedback?.repCount || 0) * 0.45) + workoutDuration * 0.12)} kcal
                      </p>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>จำนวนครั้ง</span>
                      </div>
                      <p className="text-base font-bold font-hud text-emerald-300">
                        {currentFeedback?.repCount || 0} Reps
                      </p>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
                        <TrendingUp className="w-3 h-3 text-cyan-400" />
                        <span>ความแม่นยำ</span>
                      </div>
                      <p className="text-base font-bold font-hud text-cyan-300">
                        {currentFeedback?.accuracyScore || 100}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Unhide Pills if any overlay was closed */}
            {(!showGuideOverlay || !showAnglesOverlay || !showStatsOverlay) && (
              <div className="pointer-events-auto flex items-center justify-end gap-1.5 pt-1">
                {!showGuideOverlay && (
                  <button
                    onClick={() => setShowGuideOverlay(true)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/90 border border-cyan-800 text-cyan-300 hover:text-white flex items-center gap-1 shadow-md"
                  >
                    <span>+ แสดงคำแนะนำ</span>
                  </button>
                )}
                {!showAnglesOverlay && (
                  <button
                    onClick={() => setShowAnglesOverlay(true)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/90 border border-cyan-800 text-cyan-300 hover:text-white flex items-center gap-1 shadow-md"
                  >
                    <span>+ แสดงองศา</span>
                  </button>
                )}
                {!showStatsOverlay && (
                  <button
                    onClick={() => setShowStatsOverlay(true)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/90 border border-emerald-800 text-emerald-300 hover:text-white flex items-center gap-1 shadow-md"
                  >
                    <span>+ แสดงสถิติ</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

          {/* Bottom HUD Bar: Controls with Pause/Start Detection button */}
          <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 z-20">
            {/* Left tools: Audio toggles & Angle tags */}
            <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800">
              {/* Master Mute / Unmute Button (Default: Muted ปิดเสียง) */}
              <button
                onClick={handleToggleMasterAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isAudioMuted
                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 hover:bg-rose-900/70 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                    : 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200 hover:bg-cyan-900/70 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                }`}
                title={
                  isAudioMuted
                    ? 'ระบบปิดเสียงอยู่ (ค่าเริ่มต้น) — คลิกเพื่อเปิดเสียงแจ้งเตือนและเอฟเฟกต์'
                    : 'ระบบเปิดเสียงอยู่ — คลิกเพื่อปิดเสียงทั้งหมด'
                }
              >
                {isAudioMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>ปิดเสียง</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>เปิดเสียง</span>
                  </>
                )}
              </button>

              {/* Sub-toggle: Thai Voice Assistant */}
              <button
                onClick={() => {
                  const next = !voiceAlertsEnabled;
                  setVoiceAlertsEnabled(next);
                  if (next && isAudioMuted) {
                    handleToggleMasterAudio();
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                  voiceAlertsEnabled
                    ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
                title="เปิด/ปิดเฉพาะเสียงพูดเตือนภาษาไทย"
              >
                VOICE {voiceAlertsEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Sub-toggle: Sound Effects FX */}
              <button
                onClick={() => {
                  const next = !soundEffectsEnabled;
                  setSoundEffectsEnabled(next);
                  if (next && isAudioMuted) {
                    handleToggleMasterAudio();
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                  soundEffectsEnabled
                    ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
                title="เปิด/ปิดเฉพาะเสียงเอฟเฟกต์นับครั้ง (FX)"
              >
                FX {soundEffectsEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setHudOptions((p) => ({ ...p, showAngles: !p.showAngles }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  hudOptions.showAngles ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="เปิด/ปิดแสดงตัวเลของศาบนข้อต่อ"
              >
                DEG {hudOptions.showAngles ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setHudOptions((p) => ({ ...p, showSkeleton: !p.showSkeleton }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  hudOptions.showSkeleton ? 'bg-cyan-600/30 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="เปิด/ปิดเส้นโครงกระดูก"
              >
                SKELETON {hudOptions.showSkeleton ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Right Tools: Start/Pause Detection, Record Clip & Complete Set */}
            <div className="flex items-center gap-2">
              {/* PROMINENT DETECTION START/STOP BUTTON (Requested) */}
              <button
                onClick={toggleDetection}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all border cursor-pointer ${
                  isDetectionActive
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50 backdrop-blur-md ring-1 ring-rose-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 animate-pulse font-extrabold shadow-emerald-500/40'
                }`}
                title={isDetectionActive ? 'กดเพื่อหยุดการตรวจจับชั่วคราว' : 'กดเพื่อเริ่มตรวจจับการเคลื่อนไหว'}
              >
                {isDetectionActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-rose-300" />
                    <span>หยุดตรวจจับ</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>เริ่มตรวจจับ</span>
                  </>
                )}
              </button>

              {/* Short Video Clip Recorder Button */}
              <button
                onClick={() => {
                  if (isRecordingClip) {
                    handleStopRecordingClip();
                  } else {
                    handleStartRecordingClip();
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer ${
                  isRecordingClip
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-400/80 shadow-rose-900/80'
                    : 'bg-rose-950/70 text-rose-200 hover:bg-rose-900/80 hover:text-white border-2 border-rose-500/70 shadow-md shadow-rose-950/50'
                }`}
                title={isRecordingClip ? 'กำลังอัดคลิป - กดเพื่อหยุดและเสร็จสิ้นทันที' : 'บันทึกคลิปวิดีโอ 6 วินาทีเพื่อใช้เปรียบเทียบ Before/After'}
              >
                <VideoIcon className="w-4 h-4" />
                <span>{isRecordingClip ? `🔴 หยุดอัดคลิป (${clipSecondsLeft}s)` : '🔴 อัดคลิปเปรียบเทียบ'}</span>
              </button>

              {/* Workout Set Buttons */}
              {!isActiveWorkout ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleStartOfficialWorkoutWithRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    title="เริ่มจับเวลาเซ็ตและนับคะแนนอย่างเป็นทางการ"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>เริ่มเซ็ตนี้</span>
                  </button>
                  {(currentFeedback?.repCount ?? 0) > 0 && (
                    <button
                      onClick={handleCompleteWorkout}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20 cursor-pointer"
                      title="สรุปผลการฝึกซ้อมและวิเคราะห์ชีวกลศาสตร์จาก AI"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>สรุปผลเซ็ต ({currentFeedback?.repCount} Reps)</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCompleteWorkout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 text-white hover:brightness-110 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400 cursor-pointer animate-pulse"
                  title="กดเพื่อสิ้นสุดเซ็ตและดูการวิเคราะห์ชีวกลศาสตร์จาก AI"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>จบเซ็ต & วิเคราะห์ AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Instant Error Warning Banner at center if bad form detected */}
          {isDetectionActive && currentFeedback && !currentFeedback.isInGoodForm && currentFeedback.feedbacks.length > 0 && (
            <div className="absolute top-16 inset-x-4 flex justify-center pointer-events-none animate-bounce z-20">
              <div className="bg-rose-950/90 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span className="text-xs font-semibold">{currentFeedback.feedbacks[0].message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Toast Notification */}
        {actionToast && (
          <div className="bg-slate-900 border-2 border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-white">{actionToast}</span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('compare')}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/50 flex items-center gap-1 transition-all"
              >
                <span>เปิดดูเปรียบเทียบ Before/After ทันที</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Quick Clip Recorded Modal Drawer */}
        {recordedClipPreview && (
          <div className="bg-slate-900 border border-cyan-800/80 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
                <VideoIcon className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>บันทึกคลิปสำเร็จ! ตรวจสอบตัวอย่างและเลือกระบุหมวดหมู่ Before/After</span>
              </div>
              <button
                onClick={() => setRecordedClipPreview(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Recorded Clip Instant Video Replay Preview Player */}
              {recordedClipPreview.url && (
                <div className="relative rounded-xl overflow-hidden border-2 border-cyan-500/50 w-full sm:w-48 aspect-[4/3] bg-black flex-shrink-0 shadow-lg group">
                  <video
                    src={recordedClipPreview.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1 border border-cyan-800">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>REPLAY</span>
                  </div>
                  <div className="absolute bottom-1.5 inset-x-1.5 text-center bg-black/70 rounded py-0.5 text-[9px] text-slate-300 font-mono">
                    คะแนนฟอร์ม {currentFeedback?.accuracyScore ?? 90}%
                  </div>
                </div>
              )}

              {/* 3 Category Selector Buttons */}
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setClipCategoryTag('before');
                    if (soundEffectsEnabled) soundFx.playCalibrationBeep(520);
                    if (voiceAlertsEnabled) speakAlertTh('เลือกหมวดหมู่คลิป Before เพื่อใช้เปรียบเทียบครับ', true);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    clipCategoryTag === 'before'
                      ? 'bg-rose-950/70 border-rose-500 text-rose-200 ring-4 ring-rose-500/40 shadow-xl shadow-rose-950/60'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-rose-700/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                      <span>🔴 คลิป Before (ก่อนแก้)</span>
                    </p>
                    {clipCategoryTag === 'before' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-bold border border-rose-400/50">
                        เลือกอยู่ ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">ใช้เป็นฟอร์มเริ่มต้นเพื่อดูข้อผิดพลาดและมุมข้อต่อ</p>
                </button>

                <button
                  onClick={() => {
                    setClipCategoryTag('after');
                    if (soundEffectsEnabled) soundFx.playCalibrationBeep(580);
                    if (voiceAlertsEnabled) speakAlertTh('เลือกหมวดหมู่คลิป After หลังแก้ไขฟอร์มครับ', true);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    clipCategoryTag === 'after'
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-4 ring-emerald-500/40 shadow-xl shadow-emerald-950/60'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-emerald-700/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>🟢 คลิป After (หลังแก้ไข)</span>
                    </p>
                    {clipCategoryTag === 'after' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-400/50">
                        เลือกอยู่ ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">ใช้แสดงฟอร์มที่ปรับปรุงสมบูรณ์แล้ว</p>
                </button>

                <button
                  onClick={() => {
                    setClipCategoryTag('practice');
                    if (soundEffectsEnabled) soundFx.playCalibrationBeep(640);
                    if (voiceAlertsEnabled) speakAlertTh('เลือกหมวดหมู่คลิปซ้อมทั่วไปครับ', true);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    clipCategoryTag === 'practice'
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-950/60'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-cyan-700/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                      <span>🔵 คลิปซ้อมทั่วไป</span>
                    </p>
                    {clipCategoryTag === 'practice' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/50">
                        เลือกอยู่ ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">เก็บไว้ในคลังเพื่อดูพัฒนาการ</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                คะแนนฟอร์มที่ตรวจจับได้: <strong className="text-cyan-400">{currentFeedback?.accuracyScore ?? 90}%</strong>
              </span>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRecordedClipPreview(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveRecordedClip}
                  className="px-6 py-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกลงคลังวิดีโอ (JaiklaPoseClipsDB)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SYSTEM WALKTHROUGH & TRIAL ONBOARDING MODAL (Requested) */}
      {isTrialGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-800 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsTrialGuideModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <HelpCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                  JAIKLA ACTIVE • TRIAL ONBOARDING GUIDE
                </span>
                <h3 className="text-xl font-bold font-hud text-white">
                  วิธีและขั้นตอนก่อนเริ่มนับเซ็ต & บันทึกวิดีโอ
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ยินดีต้อนรับสู่ <span className="text-cyan-400 font-bold">JAIKLA ACTIVE</span> เพื่อให้ระบบ AI ตรวจจับการเคลื่อนไหวและนับจำนวนครั้งได้อย่างแม่นยำ 100% กรุณาทำความเข้าใจ 4 ขั้นตอนสำคัญดังนี้ครับ:
            </p>

            {/* 4 Interactive Guide Steps */}
            <div className="space-y-3">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>การจัดตำแหน่งหน้ากล้อง</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ยืนห่างจากกล้องประมาณ 2 - 2.5 เมตร ให้กล้องมองเห็นทั้งตัว (ศีรษะถึงข้อเท้า) มีแสงสว่างเพียงพอ
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>การสังเกตผลบนหน้าจอ (HUD Feedback)</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • 🟢 เส้นสีเขียว: มุมข้อต่อถูกต้องสมบูรณ์แบบ
                    <br />
                    • 🔴 เส้นสีแดง: มุมข้อต่อคลาดเคลื่อน (ระบบจะส่งเสียงเตือนทันที)
                    <br />
                    • 📐 ตัวเลของศาจะแสดงข้างข้อต่อ และแถบ DEPTH บนซ้ายจะบอกระดับความลึก
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>รอบทดสอบระบบตรวจจับ (Trial 1 Rep)</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ผู้เล่นลองทำท่า 1 ครั้ง (เช่น ย่อตัวลง 90° แล้วดันตัวขึ้นยืนตรง) เพื่อให้ระบบตรวจจับความลึกและยืนยันมุมกล้อง
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                  4
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>แจ้งความพร้อม & บันทึกวิดีโออัตโนมัติ</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    เมื่อทดสอบสำเร็จ ระบบจะแสดงปุ่ม &ldquo;เริ่มจับเวลาการฝึกจริง & บันทึกวิดีโอ&rdquo; มีเสียงนับถอยหลัง 3.. 2.. 1.. และเริ่มบันทึกคลิปวิดีโอของเซ็ตนั้นลงคลังอัตโนมัติ!
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons in modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsTrialGuideModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                ปิด
              </button>

              <button
                onClick={handleStartTrialAfterGuide}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-lg shadow-cyan-500/30 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>เข้าใจแล้ว - เริ่มรอบทดสอบทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
