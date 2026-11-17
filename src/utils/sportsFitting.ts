import {
  NormalizedLandmark,
  SportType,
  SportsFittingResult,
  SportsFittingMetricItem,
  SportFittingProfile,
  CameraViewMode,
} from '../types/pose';
import { POSE_LANDMARKS, calculateAngle } from './poseGeometry';

export const SPORT_PROFILES: Record<SportType, SportFittingProfile> = {
  golf: {
    id: 'golf',
    nameTh: 'กอล์ฟ (Golf Swing & Posture Fitting)',
    nameEn: 'Golf Swing Biomechanics',
    icon: '🏌️‍♂️',
    taglineTh: 'วิเคราะห์แนวกระดูกสันหลัง ระนาบสวิง และฟิตติ้งก้าน/องศาหน้าไม้',
    descriptionTh:
      'ระบบ AI ตรวจจับมุมกระดูกสันหลัง (Spine Angle), การเหยียดแขนนำ (Lead Arm), มุมงอเข่าสปริง และฟิตติ้ง Lie Angle & Shaft Flex ให้เหมาะกับสรีระคุณ',
    primaryMetricNameTh: 'องศากระดูกสันหลัง (Spine Angle)',
    primaryUnit: '°',
    targetRange: [35, 45],
    fittingPurposeTh: 'ฟิตติ้ง Lie Angle, ความยาวก้านไม้ (Club Length) และจังหวะสวิง',
  },
  running: {
    id: 'running',
    nameTh: 'วิ่ง (Running Gait & Stride Fitting)',
    nameEn: 'Running Biomechanics & Gait',
    icon: '🏃‍♂️',
    taglineTh: 'วิเคราะห์รอบขา (Cadence) มุมโน้มตัว และฟิตติ้งรองเท้าวิ่ง',
    descriptionTh:
      'ระบบ AI ตรวจจับจังหวะก้าว (Cadence SPM), มุมโน้มตัวจากข้อเท้า (Forward Lean), การซับแรงกระแทกที่หัวเข่า และแนะนำลักษณะรองเท้าวิ่งที่เหมาะสม',
    primaryMetricNameTh: 'รอบขาเรียลไทม์ (Cadence)',
    primaryUnit: 'SPM',
    targetRange: [170, 185],
    fittingPurposeTh: 'ฟิตติ้งประเภทรองเท้า (Drop & Cushion) และปรับแต่งท่าวิ่งเพื่อป้องกันบาดเจ็บ',
  },
  cycling: {
    id: 'cycling',
    nameTh: 'ปั่นจักรยาน (Dynamic Bike Fitting)',
    nameEn: 'Dynamic Bicycle Fitting',
    icon: '🚴‍♂️',
    taglineTh: 'วิเคราะห์มุมเข่าจุดต่ำสุด (BDC) ปรับความสูงอาน และระยะเอื้อมแฮนด์',
    descriptionTh:
      'ระบบ AI ตรวจจับมุมข้อเข่าจุดต่ำสุดของบันได (BDC Knee Angle: 25°-35° / 145°-155°), มุมลำตัว (Torso Angle) และมุมข้อศอก เพื่อคำนวณการปรับความสูงอานและสเต็มจักรยานอย่างแม่นยำ',
    primaryMetricNameTh: 'มุมเข่าจุดต่ำสุด BDC',
    primaryUnit: '°',
    targetRange: [145, 155],
    fittingPurposeTh: 'ฟิตติ้งปรับความสูงอาน (Saddle Height), ระยะเดินหน้าถอยหลัง (Fore/Aft) และความยาวสเต็ม',
  },
};

// Moving window cadence tracker for running
class RunningCadenceTracker {
  private lastStepTime = 0;
  private stepIntervals: number[] = [];
  private lastLeftAnkleY = 0;
  private lastRightAnkleY = 0;
  private lastPeak = 'none';

  update(leftAnkle: NormalizedLandmark, rightAnkle: NormalizedLandmark): number {
    const now = performance.now();
    const lDiff = leftAnkle.y - this.lastLeftAnkleY;
    const rDiff = rightAnkle.y - this.lastRightAnkleY;

    // Detect alternating peak displacement
    if (lDiff < -0.015 && this.lastPeak !== 'left') {
      if (this.lastStepTime > 0) {
        const interval = now - this.lastStepTime;
        if (interval > 200 && interval < 800) {
          this.stepIntervals.push(interval);
          if (this.stepIntervals.length > 8) this.stepIntervals.shift();
        }
      }
      this.lastStepTime = now;
      this.lastPeak = 'left';
    } else if (rDiff < -0.015 && this.lastPeak !== 'right') {
      if (this.lastStepTime > 0) {
        const interval = now - this.lastStepTime;
        if (interval > 200 && interval < 800) {
          this.stepIntervals.push(interval);
          if (this.stepIntervals.length > 8) this.stepIntervals.shift();
        }
      }
      this.lastStepTime = now;
      this.lastPeak = 'right';
    }

    this.lastLeftAnkleY = leftAnkle.y;
    this.lastRightAnkleY = rightAnkle.y;

    if (this.stepIntervals.length >= 3) {
      const avgInterval = this.stepIntervals.reduce((a, b) => a + b, 0) / this.stepIntervals.length;
      const spm = Math.round((60000 / avgInterval));
      return Math.min(210, Math.max(120, spm));
    }
    return 172; // default athletic baseline
  }
}

const runningTracker = new RunningCadenceTracker();

/**
 * Main Analysis Function for Sports Fitting (Golf, Running, Cycling)
 */
export function analyzeSportsFitting(
  landmarks: NormalizedLandmark[],
  sport: SportType,
  _viewMode: CameraViewMode = 'side',
  preferSide: 'left' | 'right' | 'auto' = 'auto'
): SportsFittingResult {
  const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const lToe = landmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX];
  const rToe = landmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX];
  const lHeel = landmarks[POSE_LANDMARKS.LEFT_HEEL];
  const rHeel = landmarks[POSE_LANDMARKS.RIGHT_HEEL];

  // Determine active side
  let activeSide: 'left' | 'right' = 'left';
  if (preferSide === 'right') {
    activeSide = 'right';
  } else if (preferSide === 'left') {
    activeSide = 'left';
  } else {
    // Auto side based on visibility and camera perspective
    const lVis = (lShoulder.visibility || 0) + (lHip.visibility || 0) + (lKnee.visibility || 0);
    const rVis = (rShoulder.visibility || 0) + (rHip.visibility || 0) + (rKnee.visibility || 0);
    activeSide = rVis > lVis ? 'right' : 'left';
  }

  const shoulder = activeSide === 'left' ? lShoulder : rShoulder;
  const elbow = activeSide === 'left' ? lElbow : rElbow;
  const wrist = activeSide === 'left' ? lWrist : rWrist;
  const hip = activeSide === 'left' ? lHip : rHip;
  const knee = activeSide === 'left' ? lKnee : rKnee;
  const ankle = activeSide === 'left' ? lAnkle : rAnkle;
  const toe = activeSide === 'left' ? lToe : rToe;
  const heel = activeSide === 'left' ? lHeel : rHeel;

  // Joint Angles
  const kneeAngle = calculateAngle(hip, knee, ankle);
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const hipAngle = calculateAngle(shoulder, hip, knee);

  // Spine Inclination (angle relative to vertical ground normal)
  const spineDx = shoulder.x - hip.x;
  const spineDy = shoulder.y - hip.y;
  const spineInclination = Math.round(Math.abs((Math.atan2(spineDx, -spineDy) * 180) / Math.PI));

  // Torso Angle relative to horizontal (0° = horizontal, 90° = vertical)
  const torsoAngleHorizontal = Math.round(90 - spineInclination);

  const timestamp = Date.now();

  // -------------------------------------------------------------
  // 1. GOLF SWING & POSTURE FITTING
  // -------------------------------------------------------------
  if (sport === 'golf') {
    // Spine angle target: 35° - 45°
    const spineDiff = Math.abs(spineInclination - 40);
    const spineStatus: 'optimal' | 'warning' | 'critical' =
      spineInclination >= 35 && spineInclination <= 45 ? 'optimal' : spineDiff <= 10 ? 'warning' : 'critical';

    // Lead arm straightness (usually left arm for right-handed golfer)
    const leadArmAngle = activeSide === 'left' ? calculateAngle(lShoulder, lElbow, lWrist) : elbowAngle;
    const leadArmStatus: 'optimal' | 'warning' | 'critical' = leadArmAngle >= 155 ? 'optimal' : 'warning';

    // Stance Knee bend (150° - 162° / flexion ~20°-28°)
    const kneeBendStatus: 'optimal' | 'warning' | 'critical' =
      kneeAngle >= 150 && kneeAngle <= 165 ? 'optimal' : 'warning';

    // Hip rotation / Hinge
    const hipHingeStatus: 'optimal' | 'warning' | 'critical' =
      hipAngle >= 140 && hipAngle <= 160 ? 'optimal' : 'warning';

    // Determine Swing Phase
    let phase = 'ยืนจรดลูก (Address & Setup)';
    const handsAboveShoulders = wrist.y < shoulder.y;
    const handsAboveHips = wrist.y < hip.y && wrist.y >= shoulder.y;

    if (handsAboveShoulders) {
      phase = 'จุดสูงสุดวงสวิง (Top of Swing)';
    } else if (handsAboveHips) {
      phase = 'ขึ้นไม้ / ดาวน์สวิง (Backswing / Downswing)';
    } else {
      phase = 'ท่ายืนจรดลูก (Address Setup)';
    }

    // Fitting Equipment Recommendations
    let adviceTitle = 'การปรับแต่งอุปกรณ์ไม้กอล์ฟ (Golf Fitting)';
    let equipmentAdvice = 'ก้าน Standard / Lie Angle ปกติ (Standard)';
    let actionAdvice = 'รักษาแนวกระดูกสันหลังให้คงที่ตลอดวงสวิง';

    if (spineInclination < 35) {
      adviceTitle = 'แนวกระดูกสันหลังค่อนข้างชัน (Upright Posture)';
      actionAdvice = 'โน้มตัวจากข้อพับสะโพกเพิ่มขึ้น 3°-5° เพื่อให้สวิงได้ระนาบ';
      equipmentAdvice = 'แนะนำ Lie Angle: +1° หรือ +2° Upright (หน้าไม้ชันขึ้น)';
    } else if (spineInclination > 46) {
      adviceTitle = 'ก้มลำตัวมากเกินไป (Flatter Posture)';
      actionAdvice = 'ยืดแผ่นอกขึ้นเล็กน้อยเพื่อป้องกันไม้ตีติดพื้น (Fat Shot)';
      equipmentAdvice = 'แนะนำ Lie Angle: 1° Flat หรือเพิ่มความยาวก้าน +0.5 นิ้ว';
    } else {
      adviceTitle = 'แนวกระดูกสันหลังระดับทัวร์โปร (PGA Tour Standard)';
      actionAdvice = 'มุมสรีระสมดุลยอดเยี่ยม รักษาแกนกระดูกสันหลังขณะหมุนตัว';
      equipmentAdvice = 'ฟิตติ้งก้าน: Regular (R) หรือ Stiff (S) ตามสปีดสวิง';
    }

    const metrics: SportsFittingMetricItem[] = [
      {
        id: 'spine',
        nameTh: 'แนวกระดูกสันหลัง (Spine Angle)',
        value: spineInclination,
        unit: '°',
        targetTh: '35° - 45°',
        status: spineStatus,
        descriptionTh: 'มุมพับสะโพกส่งผลโดยตรงต่อระนาบสวิง (Swing Plane) และความแม่นยำของจุดกระทบลูก',
      },
      {
        id: 'lead_arm',
        nameTh: 'การเหยียดแขนนำ (Lead Arm)',
        value: leadArmAngle,
        unit: '°',
        targetTh: '160° - 180°',
        status: leadArmStatus,
        descriptionTh: 'แขนนำเหยียดตรงสร้างรัศมีวงสวิงกว้าง (Wide Arc) เพิ่มความเร็วหัวไม้',
      },
      {
        id: 'knee_flex',
        nameTh: 'มุมงอเข่าสปริง (Knee Flexion)',
        value: kneeAngle,
        unit: '°',
        targetTh: '150° - 162°',
        status: kneeBendStatus,
        descriptionTh: 'งอเข่าเพื่อสร้างฐานรากที่มั่นคงและสปริงตัวส่งแรงผ่านพื้น (Ground Reaction Force)',
      },
      {
        id: 'hip_hinge',
        nameTh: 'การพับข้อสะโพก (Hip Hinge)',
        value: hipAngle,
        unit: '°',
        targetTh: '142° - 158°',
        status: hipHingeStatus,
        descriptionTh: 'พับสะโพกเพื่อเปิดทางให้แขนทิ้งลงในแนวดิ่งอย่างอิสระ ไม่เกร็งหัวไหล่',
      },
    ];

    let score = 95;
    if (spineStatus === 'warning') score -= 12;
    if (spineStatus === 'critical') score -= 25;
    if (leadArmStatus === 'warning') score -= 8;
    if (kneeBendStatus === 'warning') score -= 8;

    return {
      sport: 'golf',
      timestamp,
      primaryMetric: {
        labelTh: 'องศากระดูกสันหลัง (Spine Angle)',
        value: spineInclination,
        unit: '°',
        targetRange: [35, 45],
        status: spineStatus,
      },
      metrics,
      fittingAdvice: {
        titleTh: adviceTitle,
        actionTh: actionAdvice,
        equipmentTh: equipmentAdvice,
        status: spineStatus,
      },
      overallFittingScore: Math.max(40, Math.min(100, score)),
      currentPhaseTh: phase,
    };
  }

  // -------------------------------------------------------------
  // 2. RUNNING GAIT & STRIDE FITTING
  // -------------------------------------------------------------
  if (sport === 'running') {
    // Real-time Cadence (SPM)
    const cadence = runningTracker.update(lAnkle, rAnkle);
    const cadenceStatus: 'optimal' | 'warning' | 'critical' =
      cadence >= 170 && cadence <= 185 ? 'optimal' : cadence >= 160 ? 'warning' : 'critical';

    // Forward Lean (from ankle to shoulder)
    const leanDx = shoulder.x - ankle.x;
    const leanDy = shoulder.y - ankle.y;
    const forwardLean = Math.round(Math.abs((Math.atan2(leanDx, -leanDy) * 180) / Math.PI));
    const leanStatus: 'optimal' | 'warning' | 'critical' =
      forwardLean >= 5 && forwardLean <= 11 ? 'optimal' : 'warning';

    // Knee Flexion at strike
    const strikeKneeAngle = kneeAngle;
    const strikeStatus: 'optimal' | 'warning' | 'critical' =
      strikeKneeAngle >= 150 && strikeKneeAngle <= 165 ? 'optimal' : 'warning';

    // Foot Strike Pattern (Midfoot vs Heel strike)
    const isHeelFirst = heel.y > toe.y + 0.015;
    const strikeTypeTh = isHeelFirst ? 'ลงส้นเท้า (Heel Strike)' : 'ลงกลางเท้า (Midfoot Strike)';

    // Footwear fitting advice
    let shoeAdvice = 'รองเท้า Neutral Cushioning (Drop 8-10 mm)';
    let actionAdvice = 'รักษาจังหวะก้าวให้กระชับสม่ำเสมอ ก้าวเท้าอยู่ใต้แนวกึ่งกลางตัว';

    if (isHeelFirst) {
      shoeAdvice = 'แนะนำรองเท้าซับแรงกระแทกส้นสูง (Cushion Drop 8-10mm) หรือ Stability';
      actionAdvice = 'โน้มตัวจากข้อเท้าเล็กน้อย และเพิ่มรอบขาเป็น 175 SPM เพื่อลดการลงส้นหนัก (Overstride)';
    } else {
      shoeAdvice = 'แนะนำรองเท้า Low-Drop (0-5mm) หรือ Lightweight Racing / Carbon Plate';
      actionAdvice = 'การลงกลางเท้าเป็นธรรมชาติ ถ่ายเทแรงราบรื่น ประหยัดพลังงานดีเยี่ยม';
    }

    const metrics: SportsFittingMetricItem[] = [
      {
        id: 'cadence',
        nameTh: 'รอบขาเรียลไทม์ (Cadence)',
        value: cadence,
        unit: 'SPM',
        targetTh: '170 - 185 SPM',
        status: cadenceStatus,
        descriptionTh: 'รอบขาก้าวต่อนาที (Steps Per Minute) รอบขาที่เหมาะสมช่วยลดแรงกระแทกสู่ข้อต่อได้ 20%',
      },
      {
        id: 'forward_lean',
        nameTh: 'มุมโน้มตัวจากข้อเท้า (Forward Lean)',
        value: forwardLean,
        unit: '°',
        targetTh: '6° - 10°',
        status: leanStatus,
        descriptionTh: 'โน้มตัวไปข้างหน้าจากข้อเท้า ใช้แรงโน้มถ่วงช่วยส่งตัวไปข้างหน้า ไม่ก้มเอว',
      },
      {
        id: 'strike_knee',
        nameTh: 'มุมงอเข่าลดแรงกระแทก (Strike Knee)',
        value: strikeKneeAngle,
        unit: '°',
        targetTh: '150° - 165°',
        status: strikeStatus,
        descriptionTh: 'ข้อเข่างอเล็กน้อยขณะลงสัมผัสพื้น ป้องกันการเกิดแรงต้าน (Braking Force)',
      },
      {
        id: 'strike_type',
        nameTh: 'รูปแบบการลงสัมผัสพื้น (Foot Strike)',
        value: isHeelFirst ? 45 : 15,
        unit: isHeelFirst ? '° Heel' : '° Mid',
        targetTh: 'Midfoot Contact',
        status: isHeelFirst ? 'warning' : 'optimal',
        descriptionTh: strikeTypeTh,
      },
    ];

    let score = 96;
    if (cadenceStatus === 'warning') score -= 10;
    if (cadenceStatus === 'critical') score -= 20;
    if (leanStatus === 'warning') score -= 8;
    if (isHeelFirst) score -= 6;

    return {
      sport: 'running',
      timestamp,
      primaryMetric: {
        labelTh: 'รอบขาเรียลไทม์ (Cadence)',
        value: cadence,
        unit: 'SPM',
        targetRange: [170, 185],
        status: cadenceStatus,
      },
      metrics,
      fittingAdvice: {
        titleTh: 'การฟิตติ้งรองเท้าและวงรอบก้าววิ่ง',
        actionTh: actionAdvice,
        equipmentTh: shoeAdvice,
        status: cadenceStatus,
      },
      overallFittingScore: Math.max(40, Math.min(100, score)),
      currentPhaseTh: `จังหวะก้าว: ${cadence} SPM • ${strikeTypeTh}`,
    };
  }

  // -------------------------------------------------------------
  // 3. CYCLING / DYNAMIC BIKE FITTING
  // -------------------------------------------------------------
  // Target BDC Knee Angle (ขาจาน 6 นาฬิกา): 145° - 155° (มุมงอ 25° - 35°)
  const bdcKneeStatus: 'optimal' | 'warning' | 'critical' =
    kneeAngle >= 145 && kneeAngle <= 155 ? 'optimal' : kneeAngle >= 140 && kneeAngle <= 160 ? 'warning' : 'critical';

  // Torso / Hip Angle (relative to horizontal ground)
  const torsoStatus: 'optimal' | 'warning' | 'critical' =
    torsoAngleHorizontal >= 35 && torsoAngleHorizontal <= 52 ? 'optimal' : 'warning';

  // Relaxed Elbow bend
  const elbowStatus: 'optimal' | 'warning' | 'critical' =
    elbowAngle >= 150 && elbowAngle <= 168 ? 'optimal' : 'warning';

  // Dynamic Saddle Height Adjustment Algorithm:
  let saddleAction = 'ความสูงหลักอานอยู่ในเกณฑ์ทองคำ (Optimal Saddle Height)';
  let saddleDiffMm = 0;
  let bikeAdvice = 'คงตำแหน่งหลักอานเดิม รักษาแนวกระดูกเชิงกรานให้สมดุล';

  if (kneeAngle < 142) {
    // Knee bent too much -> Saddle too low
    saddleDiffMm = Math.round((148 - kneeAngle) * 1.5);
    saddleAction = `อานต่ำเกินไป — แนะนำปรับหลักอานขึ้น +${saddleDiffMm} มม.`;
    bikeAdvice = `ปลดล็อกรัดหลักอาน แล้วยกความสูงขึ้นประมาณ +${saddleDiffMm} mm เพื่อเพิ่มแรงควงขาและลดแรงกดลูกสะบ้า`;
  } else if (kneeAngle > 156) {
    // Knee over-extended -> Saddle too high
    saddleDiffMm = Math.round((kneeAngle - 150) * 1.5);
    saddleAction = `อานสูงเกินไป — แนะนำปรับหลักอานลง -${saddleDiffMm} มม.`;
    bikeAdvice = `ลดความสูงหลักอานลงประมาณ -${saddleDiffMm} mm ป้องกันสะโพกโยก (Hip Rocking) และเอ็นข้อพับหลังเข่าตึง`;
  } else if (kneeAngle >= 142 && kneeAngle < 145) {
    saddleAction = 'อานต่ำเล็กน้อย — แนะนำปรับหลักอานขึ้น +3 ถึง +5 มม.';
    bikeAdvice = 'ยกหลักอานขึ้นอีก 3-5 มม. จะช่วยให้เหยียดกล้ามเนื้อต้นขาด้านหลังได้มีประสิทธิภาพยิ่งขึ้น';
  } else if (kneeAngle > 153 && kneeAngle <= 156) {
    saddleAction = 'อานสูงเล็กน้อย — แนะนำปรับหลักอานลง -3 ถึง -5 มม.';
    bikeAdvice = 'ลดหลักอานลงเล็กน้อย 3-5 มม. เพื่อให้ข้อเท้าผ่อนคลายขณะควงรอบขา';
  }

  // Reach & Stem fitting advice
  let stemAdvice = 'สเต็ม & ระยะเอื้อม (Reach) พอดี';
  if (torsoAngleHorizontal < 35) {
    stemAdvice = 'ก้มลำตัวต่ำมาก (Aero) หากปวดคอ/หลัง ควรลดความยาวสเต็ม -10mm หรือใส่แหวนรองคอ +5mm';
  } else if (torsoAngleHorizontal > 55) {
    stemAdvice = 'ลำตัวตั้งตรงเกินไป (High Upright) แนะนำเพิ่มความยาวสเต็ม +10mm เพื่อความลู่ลม';
  }

  const metrics: SportsFittingMetricItem[] = [
    {
      id: 'bdc_knee',
      nameTh: 'มุมเข่าจุดต่ำสุด (BDC Knee Angle)',
      value: kneeAngle,
      unit: '°',
      targetTh: '145° - 155°',
      status: bdcKneeStatus,
      descriptionTh:
        'ตัวชี้วัดหลักของการปรับความสูงอานจักรยาน (Saddle Height) เพื่อส่งกำลังสูงสุดและไม่ทำร้ายข้อเข่า',
    },
    {
      id: 'torso_angle',
      nameTh: 'มุมระนาบลำตัว (Torso Angle)',
      value: torsoAngleHorizontal,
      unit: '°',
      targetTh: '40° - 48°',
      status: torsoStatus,
      descriptionTh: 'มุมลำตัวกับแนวราบ สำหรับคำนวณระยะเอื้อม (Reach) และระดับความสูงแฮนด์ (Handlebar Drop)',
    },
    {
      id: 'elbow_flex',
      nameTh: 'มุมงอข้อศอกซับแรง (Elbow Bend)',
      value: elbowAngle,
      unit: '°',
      targetTh: '155° - 165°',
      status: elbowStatus,
      descriptionTh: 'งอศอกเล็กน้อยเพื่อทำหน้าที่เสมือนโช้กอัพซับแรงสะเทือนจากพื้นผิวถนน ไม่ล็อกข้อศอก',
    },
    {
      id: 'saddle_offset',
      nameTh: 'การปรับระยะหลักอาน (Saddle Adjustment)',
      value: saddleDiffMm,
      unit: 'mm',
      targetTh: '0 mm (พอดี)',
      status: bdcKneeStatus,
      descriptionTh: saddleAction,
    },
  ];

  let score = 96;
  if (bdcKneeStatus === 'warning') score -= 12;
  if (bdcKneeStatus === 'critical') score -= 25;
  if (torsoStatus === 'warning') score -= 8;
  if (elbowStatus === 'warning') score -= 6;

  return {
    sport: 'cycling',
    timestamp,
    primaryMetric: {
      labelTh: 'มุมเข่าจุดต่ำสุด BDC',
      value: kneeAngle,
      unit: '°',
      targetRange: [145, 155],
      status: bdcKneeStatus,
    },
    metrics,
    fittingAdvice: {
      titleTh: 'ผลการฟิตติ้งจักรยาน (Bike Fitting)',
      actionTh: saddleAction,
      equipmentTh: `${bikeAdvice} • ${stemAdvice}`,
      status: bdcKneeStatus,
    },
    overallFittingScore: Math.max(40, Math.min(100, score)),
    currentPhaseTh: `บันไดตำแหน่งล่าง BDC (6 นาฬิกา) • ${saddleAction}`,
  };
}
