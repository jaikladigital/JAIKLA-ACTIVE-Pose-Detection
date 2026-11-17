export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type ExerciseType = 'squat' | 'pushup' | 'lunge' | 'jumping_jack' | 'plank';

export type SportType = 'golf' | 'running' | 'cycling';

export interface SportFittingProfile {
  id: SportType;
  nameTh: string;
  nameEn: string;
  icon: string;
  taglineTh: string;
  descriptionTh: string;
  primaryMetricNameTh: string;
  primaryUnit: string;
  targetRange: [number, number];
  fittingPurposeTh: string;
}

export interface SportsFittingMetricItem {
  id: string;
  nameTh: string;
  value: number;
  unit: string;
  targetTh: string;
  status: 'optimal' | 'warning' | 'critical';
  descriptionTh: string;
}

export interface SportsFittingResult {
  sport: SportType;
  timestamp: number;
  primaryMetric: {
    labelTh: string;
    value: number;
    unit: string;
    targetRange: [number, number];
    status: 'optimal' | 'warning' | 'critical';
  };
  metrics: SportsFittingMetricItem[];
  fittingAdvice: {
    titleTh: string;
    actionTh: string;
    equipmentTh: string; // e.g. 'ปรับอานจักรยานขึ้น 5-8 mm' or 'ใช้ก้านไม้ Regular Flex'
    status: 'optimal' | 'warning' | 'critical';
  };
  overallFittingScore: number;
  currentPhaseTh: string;
}

export interface ExerciseMeta {
  id: ExerciseType;
  nameTh: string;
  nameEn: string;
  category: 'Legs' | 'Upper Body' | 'Full Body' | 'Core';
  targetAngles: {
    primaryJoint: string;
    targetRange: [number, number]; // e.g. [80, 95] deg
    restRange: [number, number]; // e.g. [160, 180] deg
  };
  tipsTh: string[];
  mistakesToAvoidTh: string[];
  executionStepsTh: string[];
}

export interface StretchingExercise {
  id: string;
  order: number;
  bodyPartTh: string; // 'คอและศีรษะ' | 'หัวไหล่และแขน' | 'ลำตัวและหลัง' | 'สะโพก' | 'ต้นขา' | 'น่องและข้อเท้า'
  nameTh: string;
  nameEn: string;
  durationSeconds: number;
  targetJoints: string[];
  instructionsTh: string[];
  benefitsTh: string;
}

export interface CalibrationData {
  isCalibrated: boolean;
  tPoseProgress: number; // 0 - 100%
  armSpanPx: number;
  torsoHeightPx: number;
  bodyHeightPx: number;
  shoulderWidthPx: number;
  baselineCenter: { x: number; y: number };
  calibratedAt?: string;
}

export interface AngleFeedback {
  jointName: string;
  currentAngle: number;
  targetAngle: number;
  status: 'optimal' | 'warning' | 'critical';
  message: string;
}

export interface PoseFeedbackResult {
  exercise: ExerciseType;
  repCount: number;
  stage: 'up' | 'down' | 'hold';
  accuracyScore: number; // 0 - 100%
  repProgress: number; // 0 - 100% depth progress towards completing rep
  angles: {
    leftKnee: number;
    rightKnee: number;
    leftElbow: number;
    rightElbow: number;
    leftHip: number;
    rightHip: number;
    spineInclination: number;
  };
  feedbacks: AngleFeedback[];
  voiceWarning?: string;
  isInGoodForm: boolean;
  sideProfile?: SideProfileAnalysis;
}

export type CameraViewMode = 'front' | 'side';
export type BodySide = 'auto' | 'left' | 'right';

export interface BodySegmentDetail {
  partNameTh: string; // e.g. 'หัว (Head)'
  partKey: string;
  angle: number; // degrees
  direction: string; // e.g. 'ก้มลง 12°', 'ขนานพื้น', 'เหยียดตรง'
  status: 'optimal' | 'warning' | 'critical';
  description: string;
}

export interface SideProfileAnalysis {
  activeSide: 'left' | 'right';
  detectedSideMode: BodySide;
  confidence: number; // 0 - 100%
  facingDirection: 'left' | 'right'; // which direction user is facing
  // The 14 requested segments from head to toe:
  head: BodySegmentDetail;       // 1. หัว (Head / Cranial tilt & gaze)
  neck: BodySegmentDetail;       // 2. คอ (Neck / Cervical flexion & forward head)
  shoulder: BodySegmentDetail;   // 3. ไหล่ (Shoulder / Glenohumeral flexion)
  arm: BodySegmentDetail;        // 4. แขน (Arm / Elbow flexion)
  wrist: BodySegmentDetail;      // 5. ข้อมือ (Wrist flexion-extension)
  finger: BodySegmentDetail;     // 6. นิ้วมือ (Fingers / Hand orientation vector)
  waist: BodySegmentDetail;      // 7. เอว/สะโพก (Waist / Pelvic tilt / Hip hinge)
  thigh: BodySegmentDetail;      // 8. ต้นขา (Thigh inclination relative to ground)
  knee: BodySegmentDetail;       // 9. หัวเข่า (Knee flexion angle & knee-over-toe)
  shank: BodySegmentDetail;      // 10. ลำแข้ง (Shank / Tibial progression angle)
  ankle: BodySegmentDetail;      // 11. ข้อเท้า (Ankle dorsiflexion / plantarflexion)
  heel: BodySegmentDetail;       // 12. ส้นเท้า (Heel ground contact / Calcaneus elevation)
  midfoot: BodySegmentDetail;    // 13. ข้างฝ่าเท้า (Lateral midfoot plane)
  toes: BodySegmentDetail;       // 14. ปลายนิ้วเท้า (Toe index angle & grounding)
  
  // Biomechanical safety & kinematic metrics
  plumbLineDeviation: number;    // Cervical-to-Ankle vertical plumb line alignment deviation (deg)
  kneeOverToeOffsetPx: number;   // Knee horizontal offset relative to toe
  kneeOverToeStatus: 'safe' | 'warning' | 'excessive';
  backPosture: 'neutral' | 'rounded' | 'hyperextended';
  backPostureText: string;
  overallFormScore: number;      // 0 - 100%
}

export interface WorkoutSessionRecord {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  exerciseNameTh: string;
  repsCount: number;
  avgAccuracy: number;
  durationSeconds: number;
  caloriesBurned: number;
  mistakesSummary: string;
  aiFeedback: string;
  createdAt: string;
  recordedClipUrl?: string;
  viewMode?: CameraViewMode;
}

export interface MotionClipRecord {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  category: 'before' | 'after' | 'practice';
  accuracyScore: number;
  videoDataUrl: string;
  repsCount: number;
  notes: string;
  createdAt: string;
  viewMode?: CameraViewMode;
}

