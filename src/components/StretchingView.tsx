import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight,
  Activity,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StretchingExercise, NormalizedLandmark } from '../types/pose';
import { soundFx, speakAlertTh } from '../utils/poseGeometry';
import { drawPoseCanvas } from '../utils/canvasRenderer';

const STRETCHING_ROUTINE: StretchingExercise[] = [
  {
    id: 'stretch_neck',
    order: 1,
    bodyPartTh: '1. คอและศีรษะ (Neck & Cervical)',
    nameTh: 'ท่ายืดกล้ามเนื้อคอด้านข้าง',
    nameEn: 'Lateral Neck Flexion Stretch',
    durationSeconds: 15,
    targetJoints: ['ศีรษะ', 'ต้นคอ', 'กล้ามเนื้อบ่า (Trapezius)'],
    instructionsTh: [
      '1. นั่งหรือยืนตัวตรง ไหล่ผ่อนคลายทั้งสองข้าง',
      '2. ค่อยๆ เอียงศีรษะให้ใบหูเข้าใกล้หัวไหล่ข้างหนึ่งอย่างนุ่มนวล',
      '3. ใช้มือข้างเดียวกันแตะศีรษะเบาๆ เพื่อเพิ่มแรงยืดพอดี ไม่เกร็งบ่า',
      '4. หายใจเข้าออกสม่ำเสมอ ค้างไว้จนครบเวลา แล้วสลับข้าง',
    ],
    benefitsTh: 'ลดอาการปวดเมื่อยคอบ่า คลายความตึงเครียดของเส้นประสาทต้นคอ',
  },
  {
    id: 'stretch_shoulders',
    order: 2,
    bodyPartTh: '2. หัวไหล่และสะบัก (Shoulders & Scapula)',
    nameTh: 'ท่ายืดหัวไหล่ข้ามลำตัว',
    nameEn: 'Cross-Body Shoulder Stretch',
    durationSeconds: 15,
    targetJoints: ['หัวไหล่ (Deltoid)', 'สะบัก', 'แขนท่อนบน'],
    instructionsTh: [
      '1. ยืนตรง วาดแขนข้างหนึ่งพาดขวางหน้าอก',
      '2. ใช้แขนอีกข้างหรือมือเกี่ยวข้อศอกแล้วดึงเข้าหาลำตัวเบาๆ',
      '3. รักษาแนวหัวไหล่ให้ขนานพื้น ไม่ยกไหล่ขึ้นติดหู',
      '4. ค้างท่าไว้ รู้สึกตึงกำลังดีที่หัวไหล่ด้านหลัง',
    ],
    benefitsTh: 'เพิ่มความยืดหยุ่นของข้อต่อหัวไหล่ ป้องกันการบาดเจ็บช่วงยกน้ำหนักหรือวิดพื้น',
  },
  {
    id: 'stretch_triceps',
    order: 3,
    bodyPartTh: '3. แขนและต้นแขนด้านหลัง (Triceps & Arms)',
    nameTh: 'ท่ายืดต้นแขนด้านหลังเหนือศีรษะ',
    nameEn: 'Overhead Triceps Stretch',
    durationSeconds: 15,
    targetJoints: ['ข้อศอก', 'ต้นแขนด้านหลัง (Triceps)', 'ปีกหลัง (Lats)'],
    instructionsTh: [
      '1. ยกแขนข้างหนึ่งขึ้นเหนือศีรษะแล้วพับข้อศอกลง ให้มือแตะหลังส่วนบน',
      '2. ใช้มืออีกข้างจับข้อศอกแล้วดึงไปทางด้านหลังและตรงข้ามอย่างนุ่มนวล',
      '3. ยืดอก หลังตรง ไม่งอคอไปข้างหน้า',
      '4. ค้างท่าไว้ 15 วินาที แล้วสลับข้าง',
    ],
    benefitsTh: 'คลายกล้ามเนื้อหลังแขนและข้อต่อข้อศอก เพิ่มมุมการเคลื่อนไหวช่วงกดหรือดัน',
  },
  {
    id: 'stretch_torso',
    order: 4,
    bodyPartTh: '4. ลำตัวและกระดูกสันหลัง (Torso & Spine)',
    nameTh: 'ท่ายืดลำตัวด้านข้างและแนวกระดูกสันหลัง',
    nameEn: 'Standing Side Bend & Torso Stretch',
    durationSeconds: 15,
    targetJoints: ['แนวกระดูกสันหลัง', 'เอวด้านข้าง (Obliques)', 'ซี่โครง'],
    instructionsTh: [
      '1. ยืนตรง กางเท้ากว้างเท่าหัวไหล่ ชูแขนข้างหนึ่งขึ้นฟ้า',
      '2. ค่อยๆ เอียงลำตัวไปฝั่งตรงข้าม มืออีกข้างวางทาบต้นขา',
      '3. รู้สึกถึงการยืดเหยียดตั้งแต่สะโพก ชายโครง ไปจนถึงปลายนิ้วมือ',
      '4. อย่าให้ลำตัวคว่ำลงไปข้างหน้า รักษาแนวกึ่งกลาง',
    ],
    benefitsTh: 'เปิดช่องว่างระหว่างกระดูกสันหลัง เพิ่มการหมุนตัวและความคล่องตัวของแกนกลาง',
  },
  {
    id: 'stretch_hips',
    order: 5,
    bodyPartTh: '5. สะโพกและกล้ามเนื้อก้น (Hips & Glutes)',
    nameTh: 'ท่ายืดข้อต่อสะโพกขาหนีบ',
    nameEn: 'Kneeling Hip Flexor & Glute Stretch',
    durationSeconds: 15,
    targetJoints: ['ข้อต่อสะโพก (Hip Flexor)', 'กล้ามเนื้อก้น (Gluteus)', 'ขาหนีบ'],
    instructionsTh: [
      '1. ก้าวขาข้างหนึ่งไปข้างหน้า ย่อตัวลงในท่าลันจ์ต่ำ (หรือวางเข่าหลังแตะพื้น)',
      '2. ดันสะโพกไปข้างหน้าช้าๆ จนรู้สึกตึงบริเวณหน้าขาและสะโพกข้างหลัง',
      '3. ลำตัวตั้งตรง เกร็งหน้าท้องเล็กน้อย',
      '4. ค้างท่าไว้ 15 วินาที สลับข้าง',
    ],
    benefitsTh: 'ลดการดึงรั้งของสะโพกที่ทำให้ปวดหลังส่วนล่าง และเตรียมข้อต่อก่อนทำสควอช',
  },
  {
    id: 'stretch_quads',
    order: 6,
    bodyPartTh: '6. ต้นขาด้านหน้า (Quadriceps & Thighs)',
    nameTh: 'ท่ายืนยืดหน้าขาขาเดียว',
    nameEn: 'Standing Quadriceps Stretch',
    durationSeconds: 15,
    targetJoints: ['กล้ามเนื้อหน้าขา (Quadriceps)', 'ข้อเข่า', 'หน้าสะโพก'],
    instructionsTh: [
      '1. ยืนตรง (สามารถใช้มือข้างหนึ่งจับเก้าอี้หรือกำแพงเพื่อทรงตัว)',
      '2. พับเข่าข้างหนึ่งไปด้านหลัง ใช้มือจับข้อเท้าดึงส้นเท้าเข้าใกล้สะโพก',
      '3. ให้หัวเข่าทั้งสองข้างชิดกัน ลำตัวตรง ไม่งอตัวหรือแอ่นหลัง',
      '4. ค้างไว้ 15 วินาที แล้วสลับข้าง',
    ],
    benefitsTh: 'คลายกล้ามเนื้อต้นขาด้านหน้า ลดแรงกดทับสะบ้าหัวเข่าในท่าสควอชและลันจ์',
  },
  {
    id: 'stretch_hamstrings',
    order: 7,
    bodyPartTh: '7. ต้นขาด้านหลัง (Hamstrings & Back Thighs)',
    nameTh: 'ท่ายืดต้นขาด้านหลัง',
    nameEn: 'Standing Hamstring & Calf Fold',
    durationSeconds: 15,
    targetJoints: ['กล้ามเนื้อต้นขาด้านหลัง (Hamstrings)', 'ใต้ข้อพับเข่า', 'สะโพก'],
    instructionsTh: [
      '1. ก้าวขาข้างหนึ่งไปข้างหน้าเล็กน้อย กระดกปลายเท้าขึ้น ส้นเท้าแตะพื้น',
      '2. งอเข่าขาหลังเล็กน้อย ดันสะโพกไปข้างหลัง โน้มตัวจากสะโพกไปข้างหน้า',
      '3. วางมือบนต้นขาขาหลัง (ห้ามกดบนเข่าขาหน้า)',
      '4. รู้สึกตึงกำลังดีที่ใต้ต้นขาด้านหลัง ค้างไว้ 15 วินาที',
    ],
    benefitsTh: 'ป้องกันการฉีกขาดของเส้นใยกล้ามเนื้อแฮมสตริง เพิ่มความคล่องตัวของการก้าวขา',
  },
  {
    id: 'stretch_calves_ankles',
    order: 8,
    bodyPartTh: '8. น่อง ข้อเท้า และเอ็นร้อยหวาย (Calves & Ankles)',
    nameTh: 'ท่ายืดน่องและเอ็นร้อยหวาย',
    nameEn: 'Calf & Achilles Tendon Wall Stretch',
    durationSeconds: 15,
    targetJoints: ['กล้ามเนื้อน่อง (Gastrocnemius)', 'เอ็นร้อยหวาย', 'ข้อเท้า'],
    instructionsTh: [
      '1. ยืนหันหน้าหากำแพง ก้าวขาข้างหนึ่งถอยไปข้างหลัง',
      '2. กดส้นเท้าหลังให้แนบสนิทกับพื้น ขาหลังเหยียดตรง ปลายเท้าชี้ตรงไปข้างหน้า',
      '3. งอเข่าหน้าเล็กน้อย โน้มตัวเข้าหากำแพงช้าๆ จนรู้สึกตึงที่น่องหลัง',
      '4. ค้างไว้ 15 วินาที แล้วสลับข้าง',
    ],
    benefitsTh: 'เพิ่มองศาการงอข้อเท้า (Ankle Dorsiflexion) ทำให้สควอชได้ลึกโดยส้นเท้าไม่ลอย',
  },
];

interface StretchingViewProps {
  onBackToWorkout: () => void;
  selectedDeviceId: string;
  videoDevices?: MediaDeviceInfo[];
  onSelectDevice?: (id: string) => void;
  onRefreshDevices?: () => void;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const StretchingView: React.FC<StretchingViewProps> = ({
  onBackToWorkout,
  selectedDeviceId,
  videoDevices,
  onSelectDevice,
  onRefreshDevices,
  isAudioMuted = true,
  onToggleAudio,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedStretches, setCompletedStretches] = useState<number[]>([]);
  const [isRoutineCompleted, setIsRoutineCompleted] = useState<boolean>(false);
  // Default to MUTED (false) as requested
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(!isAudioMuted);

  // Synchronize audio state whenever isAudioMuted changes from parent or header
  useEffect(() => {
    if (isAudioMuted !== undefined) {
      setVoiceEnabled(!isAudioMuted);
    }
  }, [isAudioMuted]);

  const handleToggleVoice = () => {
    if (onToggleAudio) {
      onToggleAudio();
    } else {
      setVoiceEnabled((prev) => !prev);
    }
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseModelRef = useRef<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const currentStretch = STRETCHING_ROUTINE[currentIndex];

  // Initialize camera for stretching posture checking
  useEffect(() => {
    async function initCamera() {
      try {
        // Clean up previous tracks before switching
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch (e) {}
          });
          mediaStreamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Camera in stretching view unavailable:', err);
      }
    }

    initCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [selectedDeviceId]);

  // Pose model loop for stretching
  useEffect(() => {
    let isCancelled = false;

    async function loop() {
      if (isCancelled) return;
      const win = window as any;
      if (win.Pose && !poseModelRef.current) {
        const pose = new win.Pose({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
        });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true });
        pose.onResults((results: any) => {
          if (isCancelled) return;
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawPoseCanvas(ctx, canvas.width, canvas.height, results.poseLandmarks || [], null, null, {
                showAngles: true,
                showSkeleton: true,
                showHUD: false,
                calibrationMode: false,
                tPoseProgress: 0,
                calibrationMessage: '',
              });
            }
          }
        });
        poseModelRef.current = pose;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && video.readyState >= 2 && poseModelRef.current && canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }
        try {
          await poseModelRef.current.send({ image: video });
        } catch (e) {
          // ignore
        }
      }
      animationFrameId.current = requestAnimationFrame(loop);
    }

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      isCancelled = true;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => {
          if (sec <= 1) {
            // Finished current stretch!
            if (voiceEnabled) soundFx.playRepSuccess();
            setCompletedStretches((prev) => Array.from(new Set([...prev, currentIndex])));

            if (voiceEnabled) {
              speakAlertTh(`ครบเวลาท่ายืด ${currentStretch.nameTh} เรียบร้อยครับ`, true);
            }

            if (currentIndex < STRETCHING_ROUTINE.length - 1) {
              // Auto advance or pause
              setTimeout(() => {
                setCurrentIndex((idx) => idx + 1);
                setSecondsRemaining(STRETCHING_ROUTINE[currentIndex + 1].durationSeconds);
              }, 1200);
            } else {
              // Routine complete!
              setIsRoutineCompleted(true);
              confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
            }
            return 0;
          }
          if (sec <= 4) {
            if (voiceEnabled) soundFx.playCountdownTick();
          }
          return sec - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining, currentIndex, currentStretch.nameTh, voiceEnabled]);

  const handleSelectStretch = (idx: number) => {
    setCurrentIndex(idx);
    setSecondsRemaining(STRETCHING_ROUTINE[idx].durationSeconds);
    setIsTimerRunning(false);
    if (voiceEnabled) {
      speakAlertTh(`ท่าที่ ${idx + 1} ${STRETCHING_ROUTINE[idx].nameTh}`, true);
    }
  };

  const toggleTimer = () => {
    if (!isTimerRunning && secondsRemaining === 0) {
      setSecondsRemaining(currentStretch.durationSeconds);
    }
    setIsTimerRunning((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex < STRETCHING_ROUTINE.length - 1) {
      handleSelectStretch(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectStretch(currentIndex - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0f1d]/90 p-4 rounded-2xl border border-cyan-500/25 shadow-xl shadow-black/50">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-hud text-white uppercase tracking-wider">
              JAIKLA ACTIVE • FULL-BODY STRETCHING (การยืดเหยียดกล้ามเนื้อ หัวจรดข้อเท้า)
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            โปรแกรมยืดเหยียดกล้ามเนื้อตามลำดับกายวิภาคศาสตร์ 8 ท่า เพื่อเตรียมความพร้อมและป้องกันการบาดเจ็บตามหลัก MOVE BETTER • LIVE BETTER
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              voiceEnabled
                ? 'bg-cyan-950/70 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/50 hover:bg-rose-900/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
            }`}
            title={
              voiceEnabled
                ? 'ระบบเปิดเสียงอยู่ — คลิกเพื่อปิดเสียง'
                : 'ระบบปิดเสียงอยู่ (ค่าเริ่มต้น) — คลิกเพื่อเปิดเสียงแนะนำ'
            }
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>เปิดเสียง</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>ปิดเสียง</span>
              </>
            )}
          </button>

          <button
            onClick={onBackToWorkout}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30"
          >
            ← กลับไปโหมดฝึกซ้อม
          </button>
        </div>
      </div>

      {/* Routine Progress Indicator (8 steps) */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[680px] gap-2">
          {STRETCHING_ROUTINE.map((stretch, idx) => {
            const isDone = completedStretches.includes(idx);
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={stretch.id}
                onClick={() => handleSelectStretch(idx)}
                className={`flex-1 flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : isDone
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                  <span className="truncate">{stretch.bodyPartTh.split(' ')[1]}</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">{stretch.nameTh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stretching Stage: Camera Pose View + Step Instruction Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Camera Feed with Live Skeleton (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] border-2 border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-0"
              playsInline
              muted
            />

            {/* Overlaid skeleton canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-10 pointer-events-none"
            />

            {/* Top Stretch Tag */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
              <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-800/60 shadow-lg text-xs">
                <span className="font-hud font-bold text-cyan-300 uppercase">{currentStretch.bodyPartTh}</span>
              </div>

              {/* Step counter badge */}
              <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
                {currentIndex + 1} / {STRETCHING_ROUTINE.length}
              </div>
            </div>

            {/* Hold Timer Center Display */}
            <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between">
              <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-cyan-500/40 shadow-xl flex items-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950" />}
                </button>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">HOLD TIMER</span>
                  <span className="text-2xl font-black font-hud text-white leading-none">
                    {secondsRemaining}s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === STRETCHING_ROUTINE.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 disabled:opacity-40"
                >
                  <span>ท่าถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Stretch Instructions & Anatomical Benefits (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
                {currentStretch.nameEn}
              </span>
              <h3 className="text-xl font-bold font-hud text-white mt-0.5">{currentStretch.nameTh}</h3>
              <p className="text-xs text-slate-400 mt-1">{currentStretch.bodyPartTh}</p>
            </div>

            {/* Target joints badges */}
            <div className="flex flex-wrap gap-1.5">
              {currentStretch.targetJoints.map((joint, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 px-2.5 py-0.5 rounded-lg"
                >
                  🎯 {joint}
                </span>
              ))}
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">วิธีปฏิบัติทีละขั้นตอน:</span>
              <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                {currentStretch.instructionsTh.map((ins, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                    {ins}
                  </p>
                ))}
              </div>
            </div>

            {/* Anatomical Benefits */}
            <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">ประโยชน์ทางชีวกลศาสตร์:</span>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">{currentStretch.benefitsTh}</p>
              </div>
            </div>
          </div>

          {/* Quick jump to start workout button */}
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">ยืดเหยียดพร้อมแล้วหรือยัง?</p>
              <p className="text-[11px] text-slate-400">เข้าสู่โหมดตรวจจับสดและเริ่มทดสอบระบบ</p>
            </div>
            <button
              onClick={onBackToWorkout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-md shadow-emerald-500/25"
            >
              <span>ไปฝึกซ้อมต่อ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Routine Completed Modal */}
      {isRoutineCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-hud text-white">🎉 ยืดเหยียดกล้ามเนื้อครบทุกส่วนแล้ว!</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                กล้ามเนื้อตั้งแต่คอจรดข้อเท้าได้รับความยืดหยุ่นพร้อมสำหรับการฝึกซ้อม ร่างกายลดความเสี่ยงต่อการบาดเจ็บได้อย่างมีประสิทธิภาพ
              </p>
            </div>
            <button
              onClick={() => {
                setIsRoutineCompleted(false);
                onBackToWorkout();
              }}
              className="w-full py-3 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:brightness-110"
            >
              เข้าสู่หน้าตรวจจับสด & เริ่มทดสอบระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
