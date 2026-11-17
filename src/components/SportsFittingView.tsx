import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Play,
  Pause,
  Eye,
  EyeOff,
  Camera,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import {
  SportType,
  SportsFittingResult,
  CalibrationData,
  NormalizedLandmark,
} from '../types/pose';
import { SPORT_PROFILES, analyzeSportsFitting } from '../utils/sportsFitting';
import { POSE_CONNECTIONS, POSE_LANDMARKS, soundFx, speakAlertTh } from '../utils/poseGeometry';

interface SportsFittingViewProps {
  selectedDeviceId: string;
  calibration: CalibrationData;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
  onSwitchToFitness?: () => void;
}

export const SportsFittingView: React.FC<SportsFittingViewProps> = ({
  selectedDeviceId,
  calibration,
  isAudioMuted = true,
  onToggleAudio,
  onSwitchToFitness,
}) => {
  // Current active sport: 'golf' | 'running' | 'cycling'
  const [selectedSport, setSelectedSport] = useState<SportType>('cycling');

  // Video & Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const poseModelRef = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Core requirement: SHOW/HIDE NUMBERS BUTTON
  const [showNumbersHUD, setShowNumbersHUD] = useState<boolean>(true);

  // Detection active state (Start / Pause)
  const [isDetectionActive, setIsDetectionActive] = useState<boolean>(true);
  const isDetectionActiveRef = useRef<boolean>(true);

  // Camera & Model status
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Analysis result state
  const [fittingResult, setFittingResult] = useState<SportsFittingResult | null>(null);
  const [trackedSide, setTrackedSide] = useState<'auto' | 'left' | 'right'>('auto');

  // Fitting Calculator Modal / Drawer
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [userInseamCm, setUserInseamCm] = useState<number>(80);
  const [userHeightCm, setUserHeightCm] = useState<number>(175);
  const [showFittingDetails, setShowFittingDetails] = useState<boolean>(false);

  // Audio Voice Alert state
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(!isAudioMuted);
  const lastSpokenTimeRef = useRef<number>(0);

  useEffect(() => {
    isDetectionActiveRef.current = isDetectionActive;
  }, [isDetectionActive]);

  useEffect(() => {
    setVoiceAlertsEnabled(!isAudioMuted);
  }, [isAudioMuted]);

  // Handle Master Audio toggle
  const handleToggleAudio = () => {
    if (onToggleAudio) {
      onToggleAudio();
    } else {
      setVoiceAlertsEnabled((prev) => !prev);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.warn(err));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Initialize MediaPipe Pose Model
  useEffect(() => {
    let isMounted = true;
    async function initPose() {
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
            handlePoseResults(results);
          });

          if (typeof pose.initialize === 'function') {
            await pose.initialize();
          }
          poseModelRef.current = pose;
          setModelLoading(false);
        } else {
          setModelError('ไม่พบไลบรารี MediaPipe Pose กรุณาโหลดหน้าเว็บใหม่อีกครั้ง');
          setModelLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing Pose:', err);
        setModelError(err.message || 'เกิดข้อผิดพลาดในการโหลด AI โมเดล');
        setModelLoading(false);
      }
    }

    initPose();
    return () => {
      isMounted = false;
      if (poseModelRef.current?.close) {
        poseModelRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Start Camera Stream
  useEffect(() => {
    let isCancelled = false;

    async function startCamera() {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.warn(e));
            setCameraPermission('granted');
          };
        }
      } catch (err) {
        console.warn('Camera error:', err);
        if (!isCancelled) setCameraPermission('denied');
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedDeviceId]);

  // Frame processing loop
  useEffect(() => {
    let active = true;

    async function processFrame() {
      if (!active) return;

      if (
        isDetectionActiveRef.current &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        poseModelRef.current &&
        !isProcessingFrameRef.current
      ) {
        try {
          isProcessingFrameRef.current = true;
          await poseModelRef.current.send({ image: videoRef.current });
        } catch {
          // ignore dropped frame
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    }

    animationFrameId.current = requestAnimationFrame(processFrame);

    return () => {
      active = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Handle Pose Results from AI model
  const handlePoseResults = useCallback(
    (results: any) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const landmarks = results.poseLandmarks as NormalizedLandmark[];
      if (!landmarks || landmarks.length < 33 || !isDetectionActiveRef.current) {
        return;
      }

      // Analyze Sports Fitting metrics
      const result = analyzeSportsFitting(landmarks, selectedSport, 'side', trackedSide);
      setFittingResult(result);

      // Audio feedback throttle
      const now = Date.now();
      if (voiceAlertsEnabled && now - lastSpokenTimeRef.current > 7000) {
        if (result.fittingAdvice.status === 'optimal') {
          speakAlertTh(`${result.primaryMetric.labelTh} อยู่ในเกณฑ์เหมาะสมมากครับ`, false);
          lastSpokenTimeRef.current = now;
        } else if (result.fittingAdvice.status === 'critical') {
          speakAlertTh(result.fittingAdvice.actionTh, false);
          lastSpokenTimeRef.current = now;
        }
      }

      // Draw futuristic skeleton on canvas
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // Draw skeleton connections
      for (const [startIndex, endIndex] of POSE_CONNECTIONS) {
        const start = landmarks[startIndex];
        const end = landmarks[endIndex];
        if (!start || !end || (start.visibility ?? 1) < 0.35 || (end.visibility ?? 1) < 0.35) {
          continue;
        }

        const x1 = start.x * width;
        const y1 = start.y * height;
        const x2 = end.x * width;
        const y2 = end.y * height;

        // Color coding based on status
        let strokeColor = 'rgba(6, 182, 212, 0.9)'; // Neon cyan
        if (result.primaryMetric.status === 'optimal') {
          strokeColor = 'rgba(16, 185, 129, 0.95)'; // Neon emerald
        } else if (result.primaryMetric.status === 'warning') {
          strokeColor = 'rgba(245, 158, 11, 0.95)'; // Amber
        }

        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw Key Fitting Joint Nodes
      const keyJoints = [
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.LEFT_KNEE,
        POSE_LANDMARKS.RIGHT_KNEE,
        POSE_LANDMARKS.LEFT_ANKLE,
        POSE_LANDMARKS.RIGHT_ANKLE,
      ];

      for (const jIdx of keyJoints) {
        const pt = landmarks[jIdx];
        if (!pt || (pt.visibility ?? 1) < 0.35) continue;
        const px = pt.x * width;
        const py = pt.y * height;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    },
    [selectedSport, trackedSide, voiceAlertsEnabled]
  );

  // Calculated Saddle Height Recommendation (Lemond & 109% methods)
  const lemondSaddleHeight = Math.round(userInseamCm * 0.883 * 10) / 10; // cm from BB center
  const totalSaddleDistance109 = Math.round(userInseamCm * 1.09 * 10) / 10; // cm from pedal at bottom

  const currentProfile = SPORT_PROFILES[selectedSport];

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
      {/* Top Banner: Sports Analysis & Fitting Branding (#1 Menu Item) */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#0b1329] via-[#09101f] to-[#070b16] p-3 sm:p-4 rounded-2xl border border-cyan-500/30 shadow-[0_4px_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white font-black text-xl">
            {currentProfile.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                #1 SPORTS FITTING
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• AI Motion Dynamic Analysis</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold font-hud text-white tracking-wide">
              {currentProfile.nameTh}
            </h1>
          </div>
        </div>

        {/* Sport Selector Pills (Golf, Running, Cycling) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-cyan-500/20 shadow-inner">
          <button
            onClick={() => {
              setSelectedSport('cycling');
              if (voiceAlertsEnabled) speakAlertTh('สลับสู่โหมดฟิตติ้งจักรยาน', true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSport === 'cycling'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <span>🚴‍♂️</span>
            <span>ปั่นจักรยาน</span>
          </button>

          <button
            onClick={() => {
              setSelectedSport('golf');
              if (voiceAlertsEnabled) speakAlertTh('สลับสู่โหมดวิเคราะห์วงสวิงกอล์ฟ', true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSport === 'golf'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <span>🏌️‍♂️</span>
            <span>กอล์ฟ</span>
          </button>

          <button
            onClick={() => {
              setSelectedSport('running');
              if (voiceAlertsEnabled) speakAlertTh('สลับสู่โหมดวิเคราะห์รอบขาวิ่ง', true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSport === 'running'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <span>🏃‍♂️</span>
            <span>วิ่ง</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-black border border-cyan-500/25 shadow-2xl aspect-video min-h-[500px] max-h-[82vh] flex items-center justify-center"
      >
        {/* Video Element (mirrored for intuitive sports posture monitoring) */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* AI Canvas Skeleton Overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none z-10"
        />

        {/* TOP CONTROLS & HUD VISIBILITY TOGGLE BAR */}
        <div className="absolute top-3 inset-x-3 sm:inset-x-4 flex items-center justify-between z-30 pointer-events-auto">
          {/* Left: Sport badge & Detection indicator */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDetectionActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-bold font-hud text-white uppercase tracking-wider">
              {currentProfile.nameEn}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/80 hidden sm:inline">
              | {fittingResult?.currentPhaseTh || 'พร้อมวิเคราะห์'}
            </span>
          </div>

          {/* Right Controls: SHOW/HIDE NUMBERS BUTTON (Requested) */}
          <div className="flex items-center gap-2">
            {/* Primary Toggle: Show or Hide Numbers HUD */}
            <button
              onClick={() => setShowNumbersHUD((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer backdrop-blur-md ${
                showNumbersHUD
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="กดเพื่อแสดงหรือซ่อนตัวเลขการแสดงผลบนหน้าจอ"
            >
              {showNumbersHUD ? (
                <>
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>ซ่อนตัวเลข</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>แสดงตัวเลข HUD</span>
                </>
              )}
            </button>

            {/* Quick Calculator / Fitting Spec Drawer Toggle */}
            <button
              onClick={() => setShowCalculator((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all cursor-pointer ${
                showCalculator
                  ? 'bg-violet-600/30 border-violet-400 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title="เครื่องคำนวณและคำแนะนำการปรับอุปกรณ์ฟิตติ้ง"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">คำนวณฟิตติ้ง</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white backdrop-blur-md"
              title="เต็มหน้าจอ"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT-SIDE NUMBERS DISPLAY HUD (FRAMELESS & GIANT SHADOW)      */}
        {/* User Request:                                                 */}
        {/* "ปรับตัวเลขการแสดงผล ให้มีขนาดใหญ่และไม่มีพื้นหลังแสดงเป็นกรอบหน้าต่างสำหรับการแสดงผลฝั่งขวาจอแสดงผล และเพิ่มเงามารองใต้ตัวเลขการแสดงผลเพื่อการมองเห็นที่ชัดเจน สามารถ กด ปุ่มแสดงหรือซ้อนตัวเลขได้" */}
        {/* ============================================================== */}
        {showNumbersHUD && (
          <div className="absolute top-16 right-3 sm:right-6 bottom-20 z-20 flex flex-col justify-center items-end text-right pointer-events-none select-none max-w-[340px] sm:max-w-[420px] transition-all">
            {/* Primary Fitting Metric: GIANT NUMBER, FRAMELESS, HEAVY DROP SHADOW */}
            <div className="mb-4">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-cyan-200 uppercase hud-contrast-text block">
                {currentProfile.primaryMetricNameTh}
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-hud tracking-tighter hud-giant-number ${
                    fittingResult?.primaryMetric.status === 'optimal'
                      ? 'text-emerald-400'
                      : fittingResult?.primaryMetric.status === 'warning'
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  {fittingResult?.primaryMetric.value ?? (selectedSport === 'cycling' ? 148 : selectedSport === 'golf' ? 40 : 175)}
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-hud text-cyan-300 hud-contrast-text">
                  {currentProfile.primaryUnit}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs font-mono hud-contrast-text">
                <span className="text-slate-300 font-bold">
                  เป้าหมาย: {currentProfile.targetRange[0]}-{currentProfile.targetRange[1]}{currentProfile.primaryUnit}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    fittingResult?.primaryMetric.status === 'optimal'
                      ? 'text-emerald-300 bg-emerald-950/40'
                      : fittingResult?.primaryMetric.status === 'warning'
                      ? 'text-amber-300 bg-amber-950/40'
                      : 'text-rose-300 bg-rose-950/40'
                  }`}
                >
                  {fittingResult?.primaryMetric.status === 'optimal'
                    ? '✓ เหมาะสม'
                    : fittingResult?.primaryMetric.status === 'warning'
                    ? '⚠ ต้องปรับ'
                    : '✗ ไม่ตรงเกณฑ์'}
                </span>
              </div>
            </div>

            {/* Secondary Metrics: Large Numbers, No Window Border/Background, High-Contrast Shadow */}
            <div className="space-y-3">
              {fittingResult?.metrics.slice(1, 4).map((metric) => (
                <div key={metric.id} className="flex flex-col items-end">
                  <span className="text-[11px] sm:text-xs text-slate-200 font-medium hud-contrast-text">
                    {metric.nameTh}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl sm:text-4xl md:text-5xl font-black font-hud tracking-tight hud-giant-number ${
                        metric.status === 'optimal'
                          ? 'text-cyan-300'
                          : metric.status === 'warning'
                          ? 'text-amber-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {metric.value}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-300 hud-contrast-text">
                      {metric.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-200/90 font-mono hud-contrast-text">
                    แนะนำ: {metric.targetTh}
                  </span>
                </div>
              ))}
            </div>

            {/* Fitting Action Toast Overlay */}
            {fittingResult?.fittingAdvice && (
              <div className="mt-4 pt-2 border-t border-cyan-400/30 flex flex-col items-end">
                <span className="text-[11px] font-bold text-amber-300 tracking-wide hud-contrast-text flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 inline" />
                  <span>คำแนะนำฟิตติ้ง:</span>
                </span>
                <p className="text-xs sm:text-sm font-bold text-white hud-contrast-text max-w-[280px] sm:max-w-[340px] leading-tight">
                  {fittingResult.fittingAdvice.actionTh}
                </p>
                <span className="text-[10px] text-cyan-200 hud-contrast-text mt-0.5">
                  {fittingResult.fittingAdvice.equipmentTh}
                </span>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM CONTROLS BAR: Start/Pause, Audio, Calculator & Fitting Mode */}
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 flex flex-wrap items-center justify-between gap-2 z-30 pointer-events-auto">
          {/* Left: Audio & Detection start/pause */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
            {/* Master Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 hover:bg-rose-900/70'
                  : 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200 hover:bg-cyan-900/70 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              }`}
              title={isAudioMuted ? 'ระบบปิดเสียงอยู่ — คลิกเพื่อเปิดเสียงเตือน' : 'ระบบเปิดเสียงอยู่ — คลิกเพื่อปิดเสียง'}
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>ปิดเสียง</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>เปิดเสียง</span>
                </>
              )}
            </button>

            {/* Start / Pause Detection */}
            <button
              onClick={() => {
                setIsDetectionActive((prev) => {
                  const next = !prev;
                  if (next) {
                    soundFx.playRepSuccess();
                    if (voiceAlertsEnabled) speakAlertTh('เริ่มตรวจจับการเคลื่อนไหว', true);
                  } else {
                    soundFx.playCalibrationBeep(330);
                    if (voiceAlertsEnabled) speakAlertTh('หยุดตรวจจับชั่วคราว', true);
                  }
                  return next;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isDetectionActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/30'
              }`}
            >
              {isDetectionActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-rose-300" />
                  <span>หยุดชั่วคราว</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>เริ่มตรวจจับ</span>
                </>
              )}
            </button>

            {/* Side Selector (Left / Right / Auto) */}
            <div className="hidden sm:flex items-center gap-1 pl-1 text-[11px] font-mono text-slate-400">
              <span>มุมกล้อง:</span>
              <button
                onClick={() => setTrackedSide('auto')}
                className={`px-1.5 py-0.5 rounded ${
                  trackedSide === 'auto' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setTrackedSide('left')}
                className={`px-1.5 py-0.5 rounded ${
                  trackedSide === 'left' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
              >
                ซ้าย
              </button>
              <button
                onClick={() => setTrackedSide('right')}
                className={`px-1.5 py-0.5 rounded ${
                  trackedSide === 'right' ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
              >
                ขวา
              </button>
            </div>
          </div>

          {/* Right: Fitting Score & Details Drawer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFittingDetails((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-lg"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>คะแนนฟิตติ้ง: {fittingResult?.overallFittingScore || 95}%</span>
              {showFittingDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {onSwitchToFitness && (
              <button
                onClick={onSwitchToFitness}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>ตรวจจับบอดี้เวท</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK INSEAM & FITTING CALCULATOR DRAWER */}
      {showCalculator && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#0c1326] to-[#080d1a] border border-violet-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-violet-900/40 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white font-hud uppercase">
                เครื่องคำนวณและเกณฑ์อ้างอิงฟิตติ้ง ({currentProfile.nameTh})
              </h3>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ปิดหน้าต่างนี้ ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Input Inseam */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">
                ความยาวช่วงขา (Inseam ความสูงเป้าถึงพื้น):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={userInseamCm}
                  onChange={(e) => setUserInseamCm(Number(e.target.value) || 80)}
                  className="w-24 bg-slate-950 border border-violet-500/40 rounded-lg px-2.5 py-1 text-sm font-bold font-mono text-cyan-300 focus:outline-none"
                  min={60}
                  max={105}
                />
                <span className="text-xs text-slate-400 font-mono">ซม. (cm)</span>
              </div>
            </div>

            {/* Input Height */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">
                ส่วนสูงรวมของผู้เล่น (Athlete Height):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={userHeightCm}
                  onChange={(e) => setUserHeightCm(Number(e.target.value) || 175)}
                  className="w-24 bg-slate-950 border border-violet-500/40 rounded-lg px-2.5 py-1 text-sm font-bold font-mono text-cyan-300 focus:outline-none"
                  min={140}
                  max={215}
                />
                <span className="text-xs text-slate-400 font-mono">ซม. (cm)</span>
              </div>
            </div>

            {/* Calculated Advice Card */}
            <div className="bg-gradient-to-br from-violet-950/60 to-slate-900 p-3 rounded-xl border border-violet-500/40 space-y-1">
              <span className="text-xs font-semibold text-violet-300 block">
                {selectedSport === 'cycling'
                  ? '📐 ความสูงหลักอานมาตรฐาน (BB-to-Saddle):'
                  : selectedSport === 'golf'
                  ? '🏌️ ความยาวก้านไม้กอล์ฟแนะนำ:'
                  : '🏃‍♂️ โซนรอบขาและระยะก้าวแนะนำ:'}
              </span>
              <p className="text-base font-black font-hud text-emerald-300">
                {selectedSport === 'cycling'
                  ? `${lemondSaddleHeight} ซม. (สูตร Lemond) / ${totalSaddleDistance109} ซม. (109%)`
                  : selectedSport === 'golf'
                  ? userHeightCm >= 180
                    ? 'ก้านยาวกว่ามาตรฐาน (+0.5 นิ้ว)'
                    : userHeightCm <= 165
                    ? 'ก้านสั้นกว่ามาตรฐาน (-0.5 นิ้ว)'
                    : 'ก้านขนาดมาตรฐาน (Standard 37.5" เหล็ก 7)'
                  : '172 - 182 SPM • จังหวะก้าวสั้นกระชับ'}
              </p>
              <p className="text-[10px] text-slate-400">
                {selectedSport === 'cycling'
                  ? 'วัดจากกึ่งกลางแกนกะโหลก (Bottom Bracket) ถึงจุดกึ่งกลางเบาะนั่ง'
                  : selectedSport === 'golf'
                  ? 'ช่วยให้จัดท่ายืนได้สมดุล ไม่ต้องก้มหรือยืนชันเกินไป'
                  : 'ลดแรงเฉือนที่ข้อเข่าและเพิ่มประสิทธิภาพการหายใจ'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED FITTING REPORT & METRIC BREAKDOWN ACCORDION */}
      {showFittingDetails && fittingResult && (
        <div className="mt-4 p-4 rounded-2xl bg-[#090f1e] border border-cyan-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <h3 className="text-sm font-bold text-white font-hud flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>ผลการวิเคราะห์ชีวกลศาสตร์และการฟิตติ้งแบบละเอียด</span>
            </h3>
            <span className="text-xs text-cyan-300 font-mono">
              คะแนนความสมบูรณ์แบบ: {fittingResult.overallFittingScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {fittingResult.metrics.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{m.nameTh}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      m.status === 'optimal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {m.status === 'optimal' ? 'สมบูรณ์แบบ' : 'ควรปรับ'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-hud text-cyan-300">{m.value}</span>
                  <span className="text-xs text-slate-400">{m.unit}</span>
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">
                    (เกณฑ์: {m.targetTh})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{m.descriptionTh}</p>
              </div>
            ))}
          </div>

          {/* Fitting Action Card */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-cyan-300 block">
                🛠️ {fittingResult.fittingAdvice.titleTh}
              </span>
              <p className="text-xs text-slate-200 font-medium">
                {fittingResult.fittingAdvice.actionTh}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {fittingResult.fittingAdvice.equipmentTh}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                STATUS: {fittingResult.fittingAdvice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
