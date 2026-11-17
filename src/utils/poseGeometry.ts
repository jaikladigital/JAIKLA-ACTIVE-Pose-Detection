import {
  NormalizedLandmark,
  ExerciseType,
  CalibrationData,
  PoseFeedbackResult,
  AngleFeedback,
  SideProfileAnalysis,
  CameraViewMode,
  BodySide,
  BodySegmentDetail,
} from '../types/pose';

// MediaPipe Pose Landmark Indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// 3D Skeleton connection pairs for drawing futuristic HUD (Front View)
export const POSE_CONNECTIONS: [number, number][] = [
  // Face / Upper
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
  
  // Torso / Shoulders
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  
  // Left Arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  
  // Right Arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  
  // Left Leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  
  // Right Leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

// Side-Profile (Sagittal View) Kinetic Skeleton Connections
export const SIDE_POSE_CONNECTIONS_LEFT: [number, number][] = [
  // Head & Neck
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_SHOULDER],
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  // Left Arm & Hand
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  // Left Leg, Shank, Ankle & Foot
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
];

export const SIDE_POSE_CONNECTIONS_RIGHT: [number, number][] = [
  // Head & Neck
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.RIGHT_EAR, POSE_LANDMARKS.RIGHT_SHOULDER],
  // Torso
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  // Right Arm & Hand
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  // Right Leg, Shank, Ankle & Foot
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];


/**
 * Calculates joint angle between three points with vertex at point B.
 * Uses 3D vectors when z coordinate is present for robust front/depth tracking.
 * Returns angle in degrees [0, 180]
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  if (!a || !b || !c) return 0;

  // 3D vector components (with z depth scaling)
  const v1 = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: ((a.z ?? 0) - (b.z ?? 0)) * 0.8,
  };
  const v2 = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: ((c.z ?? 0) - (b.z ?? 0)) * 0.8,
  };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 * mag2 === 0) return 0;
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));
  return Math.round((Math.acos(cosTheta) * 180.0) / Math.PI);
}

/**
 * Evaluates whether the user is currently holding a valid T-Pose for calibration
 */
export function checkTPose(landmarks: NormalizedLandmark[]): {
  isTPose: boolean;
  score: number;
  messageTh: string;
} {
  if (!landmarks || landmarks.length < 33) {
    return { isTPose: false, score: 0, messageTh: 'กรุณายืนให้เห็นร่างกายทั้งตัว' };
  }

  const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  const lAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  const minVis = 0.55;
  const critical = [lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip];
  const allVisible = critical.every((pt) => (pt.visibility ?? 1) > minVis);

  if (!allVisible) {
    return { isTPose: false, score: 0.1, messageTh: 'ขยับถอยหลังให้อยู่ในกรอบกล้อง' };
  }

  // 1. Arm straightness
  const leftArmAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightArmAngle = calculateAngle(rShoulder, rElbow, rWrist);
  const armsStraight = leftArmAngle >= 145 && rightArmAngle >= 145;

  // 2. Arm horizontality
  const shoulderY = (lShoulder.y + rShoulder.y) / 2;
  const torsoHeight = Math.abs((lHip.y + rHip.y) / 2 - shoulderY) || 0.3;
  const yTolerance = torsoHeight * 0.32;

  const leftHorizontal = Math.abs(lElbow.y - shoulderY) < yTolerance && Math.abs(lWrist.y - shoulderY) < yTolerance;
  const rightHorizontal = Math.abs(rElbow.y - shoulderY) < yTolerance && Math.abs(rWrist.y - shoulderY) < yTolerance;

  // 3. Hands wide
  const armsSpread = lWrist.x > lShoulder.x && rWrist.x < rShoulder.x;

  // 4. Upright stance
  const upright = shoulderY < (lHip.y + rHip.y) / 2 && (lHip.y + rHip.y) / 2 < (lAnkle.y + rAnkle.y) / 2;

  let checksPassed = 0;
  if (armsStraight) checksPassed++;
  if (leftHorizontal && rightHorizontal) checksPassed++;
  if (armsSpread) checksPassed++;
  if (upright) checksPassed++;

  const score = checksPassed / 4;

  if (!armsStraight) {
    return { isTPose: false, score, messageTh: 'เหยียดแขนทั้งสองข้างให้ตรง' };
  }
  if (!leftHorizontal || !rightHorizontal) {
    return { isTPose: false, score, messageTh: 'ยกแขนให้อยู่ในแนวระดับเดียวกับหัวไหล่' };
  }
  if (!armsSpread) {
    return { isTPose: false, score, messageTh: 'กางแขนออกทั้งสองข้าง (T-Pose)' };
  }
  if (!upright) {
    return { isTPose: false, score, messageTh: 'ยืนตัวตรง กางขาพอดีหัวไหล่' };
  }

  return { isTPose: true, score: 1.0, messageTh: 'รักษาท่า T-Pose ไว้อีกสักครู่...' };
}

/**
 * Detects whether the user is facing camera from Left profile or Right profile.
 * Automatically chooses the side with higher keypoint visibility & confidence.
 */
export function detectVisibleSide(
  landmarks: NormalizedLandmark[],
  requestedSide: BodySide = 'auto'
): { activeSide: 'left' | 'right'; confidence: number; facingDirection: 'left' | 'right' } {
  if (!landmarks || landmarks.length < 33) {
    return { activeSide: 'left', confidence: 0, facingDirection: 'left' };
  }

  const leftIndices = [
    POSE_LANDMARKS.LEFT_EAR,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.LEFT_HEEL,
    POSE_LANDMARKS.LEFT_FOOT_INDEX,
  ];
  const rightIndices = [
    POSE_LANDMARKS.RIGHT_EAR,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.RIGHT_HEEL,
    POSE_LANDMARKS.RIGHT_FOOT_INDEX,
  ];

  const leftVis = leftIndices.reduce((acc, idx) => acc + (landmarks[idx]?.visibility ?? 0.5), 0) / leftIndices.length;
  const rightVis = rightIndices.reduce((acc, idx) => acc + (landmarks[idx]?.visibility ?? 0.5), 0) / rightIndices.length;

  const leftHipZ = landmarks[POSE_LANDMARKS.LEFT_HIP]?.z ?? 0;
  const rightHipZ = landmarks[POSE_LANDMARKS.RIGHT_HIP]?.z ?? 0;
  const leftCloser = leftHipZ < rightHipZ;

  let activeSide: 'left' | 'right' = 'left';
  if (requestedSide === 'left') {
    activeSide = 'left';
  } else if (requestedSide === 'right') {
    activeSide = 'right';
  } else {
    // auto detection
    if (Math.abs(leftVis - rightVis) > 0.06) {
      activeSide = leftVis >= rightVis ? 'left' : 'right';
    } else {
      activeSide = leftCloser ? 'left' : 'right';
    }
  }

  // Facing direction: compare nose with ear of active side
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const ear = activeSide === 'left' ? landmarks[POSE_LANDMARKS.LEFT_EAR] : landmarks[POSE_LANDMARKS.RIGHT_EAR];
  const facingDirection: 'left' | 'right' = nose && ear && nose.x > ear.x ? 'right' : 'left';

  const chosenVis = activeSide === 'left' ? leftVis : rightVis;
  const confidence = Math.min(100, Math.max(15, Math.round(chosenVis * 100)));

  return { activeSide, confidence, facingDirection };
}

/**
 * Detailed Side-Profile Biomechanics Analysis (Sagittal Plane)
 * Computes exact degrees and movement directions for all 14 body segments:
 * 1. หัว (Head)
 * 2. คอ (Neck)
 * 3. ไหล่ (Shoulder)
 * 4. แขน (Arm / Elbow)
 * 5. ข้อมือ (Wrist)
 * 6. นิ้วมือ (Fingers / Hand)
 * 7. เอว/สะโพก (Waist / Hip / Lumbar)
 * 8. ต้นขา (Thigh / Femur)
 * 9. หัวเข่า (Knee)
 * 10. ลำแข้ง (Shank / Tibia)
 * 11. ข้อเท้า (Ankle)
 * 12. ส้นเท้า (Heel)
 * 13. ข้างฝ่าเท้า (Midfoot / Lateral Arch)
 * 14. ปลายนิ้วเท้า (Toe / Foot Index)
 */
export function analyzeSideProfilePose(
  landmarks: NormalizedLandmark[],
  requestedSide: BodySide = 'auto',
  exercise: ExerciseType = 'squat'
): SideProfileAnalysis {
  const sideInfo = detectVisibleSide(landmarks, requestedSide);
  const isLeft = sideInfo.activeSide === 'left';

  // Extract keypoints of tracked side
  const ear = landmarks[isLeft ? POSE_LANDMARKS.LEFT_EAR : POSE_LANDMARKS.RIGHT_EAR] || { x: 0.5, y: 0.2 };
  const nose = landmarks[POSE_LANDMARKS.NOSE] || { x: 0.52, y: 0.2 };
  const shoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER] || { x: 0.5, y: 0.3 };
  const elbow = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW] || { x: 0.55, y: 0.4 };
  const wrist = landmarks[isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST] || { x: 0.55, y: 0.5 };
  const indexFinger = landmarks[isLeft ? POSE_LANDMARKS.LEFT_INDEX : POSE_LANDMARKS.RIGHT_INDEX] || { x: 0.56, y: 0.53 };
  const hip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP] || { x: 0.5, y: 0.52 };
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE] || { x: 0.52, y: 0.7 };
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE] || { x: 0.5, y: 0.88 };
  const heel = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HEEL : POSE_LANDMARKS.RIGHT_HEEL] || { x: 0.48, y: 0.9 };
  const toe = landmarks[isLeft ? POSE_LANDMARKS.LEFT_FOOT_INDEX : POSE_LANDMARKS.RIGHT_FOOT_INDEX] || { x: 0.55, y: 0.9 };

  // 1. หัว (Head): Cranial tilt angle & gaze direction
  const headDx = nose.x - ear.x;
  const headDy = nose.y - ear.y;
  const headPitch = Math.round((Math.atan2(headDy, Math.abs(headDx) || 0.001) * 180) / Math.PI);
  let headDetail: BodySegmentDetail;
  if (headPitch >= -5 && headPitch <= 12) {
    headDetail = {
      partNameTh: 'หัว (Head)',
      partKey: 'head',
      angle: Math.abs(headPitch),
      direction: `มองตรงระดับสายตา (${Math.abs(headPitch)}°)`,
      status: 'optimal',
      description: 'แนวสายตาขนานพื้นเป็นธรรมชาติ ช่วยจัดแนวกระดูกคอ',
    };
  } else if (headPitch > 12) {
    headDetail = {
      partNameTh: 'หัว (Head)',
      partKey: 'head',
      angle: headPitch,
      direction: `ก้มหน้ามองพื้น (${headPitch}°)`,
      status: 'warning',
      description: 'ก้มศีรษะลงมากเกินไป ควรมองตรงไปข้างหน้าระดับสายตา',
    };
  } else {
    headDetail = {
      partNameTh: 'หัว (Head)',
      partKey: 'head',
      angle: Math.abs(headPitch),
      direction: `เงยหน้าขึ้น (${Math.abs(headPitch)}°)`,
      status: 'warning',
      description: 'เงยคอขึ้นมากเกินไป อาจเพิ่มแรงเค้นที่กระดูกต้นคอ',
    };
  }

  // 2. คอ (Neck): Cervical angle relative to vertical plumb line
  const neckAngle = Math.round(
    (Math.atan2(Math.abs(ear.x - shoulder.x), Math.abs(shoulder.y - ear.y) || 0.001) * 180) / Math.PI
  );
  let neckDetail: BodySegmentDetail;
  if (neckAngle <= 18) {
    neckDetail = {
      partNameTh: 'คอ (Neck)',
      partKey: 'neck',
      angle: neckAngle,
      direction: `แนวคอตรงเป็นธรรมชาติ (Neutral ${neckAngle}°)`,
      status: 'optimal',
      description: 'กระดูกต้นคอเรียงตัวตามแนวดิ่ง ปลอดภัยสมดุล',
    };
  } else if (neckAngle <= 32) {
    neckDetail = {
      partNameTh: 'คอ (Neck)',
      partKey: 'neck',
      angle: neckAngle,
      direction: `คอยื่นไปข้างหน้าเล็กน้อย (${neckAngle}°)`,
      status: 'warning',
      description: 'ระวังคอยื่น (Forward Head Posture) ให้เก็บคอและยืดอก',
    };
  } else {
    neckDetail = {
      partNameTh: 'คอ (Neck)',
      partKey: 'neck',
      angle: neckAngle,
      direction: `คอยื่นไปข้างหน้ามาก (${neckAngle}°)`,
      status: 'critical',
      description: 'คอยื่นเกินเกณฑ์ ปรับแนวกระดูกคอให้อยู่เหนือแนวไหล่',
    };
  }

  // 3. ไหล่ (Shoulder): Glenohumeral flexion / arm forward elevation
  const shoulderAngle = calculateAngle(hip, shoulder, elbow);
  let shoulderDetail: BodySegmentDetail;
  if (shoulderAngle < 35) {
    shoulderDetail = {
      partNameTh: 'ไหล่ (Shoulder)',
      partKey: 'shoulder',
      angle: shoulderAngle,
      direction: `แขนแนบลำตัว (${shoulderAngle}°)`,
      status: 'optimal',
      description: 'หัวไหล่ผ่อนคลายในแนวระนาบสมบูรณ์',
    };
  } else if (shoulderAngle <= 75) {
    shoulderDetail = {
      partNameTh: 'ไหล่ (Shoulder)',
      partKey: 'shoulder',
      angle: shoulderAngle,
      direction: `ยกแขนไปข้างหน้า (${shoulderAngle}°)`,
      status: 'optimal',
      description: 'ยกแขนช่วยรักษาสมดุลแรงเหวี่ยงของลำตัว',
    };
  } else if (shoulderAngle <= 110) {
    shoulderDetail = {
      partNameTh: 'ไหล่ (Shoulder)',
      partKey: 'shoulder',
      angle: shoulderAngle,
      direction: `ยกแขนระดับไหล่ (${shoulderAngle}°)`,
      status: 'optimal',
      description: 'ระดับยกแขนแนวระนาบสร้างบาลานซ์ได้ยอดเยี่ยม',
    };
  } else {
    shoulderDetail = {
      partNameTh: 'ไหล่ (Shoulder)',
      partKey: 'shoulder',
      angle: shoulderAngle,
      direction: `ชูแขนขึ้นสูง (${shoulderAngle}°)`,
      status: 'optimal',
      description: 'เปิดแนวหัวไหล่เต็มระยะเคลื่อนไหว',
    };
  }

  // 4. แขน / ศอก (Arm / Elbow): Elbow flexion angle
  const armAngle = calculateAngle(shoulder, elbow, wrist);
  let armDetail: BodySegmentDetail;
  if (armAngle >= 155) {
    armDetail = {
      partNameTh: 'แขน (Arm / Elbow)',
      partKey: 'arm',
      angle: armAngle,
      direction: `เหยียดแขนตรง (${armAngle}°)`,
      status: 'optimal',
      description: 'ข้อศอกเหยียดตรงอย่างมั่นคง',
    };
  } else if (armAngle >= 80 && armAngle <= 115) {
    armDetail = {
      partNameTh: 'แขน (Arm / Elbow)',
      partKey: 'arm',
      angle: armAngle,
      direction: `งอศอกมุมฉาก (${armAngle}°)`,
      status: 'optimal',
      description: 'ข้อศอกพับมุมฉาก 90° ตามฟอร์มมาตรฐาน',
    };
  } else {
    armDetail = {
      partNameTh: 'แขน (Arm / Elbow)',
      partKey: 'arm',
      angle: armAngle,
      direction: `พับศอกลึก (${armAngle}°)`,
      status: 'optimal',
      description: 'พับแขนกระชับใกล้ลำตัว',
    };
  }

  // 5. ข้อมือ (Wrist): Wrist flexion-extension relative to forearm
  const wristAngle = calculateAngle(elbow, wrist, indexFinger);
  let wristDetail: BodySegmentDetail;
  if (wristAngle >= 150) {
    wristDetail = {
      partNameTh: 'ข้อมือ (Wrist)',
      partKey: 'wrist',
      angle: wristAngle,
      direction: `ข้อมือตรงแนวแขน (Neutral ${wristAngle}°)`,
      status: 'optimal',
      description: 'ข้อมืออยู่ในแนวตรง ไม่บิดหรืองอ ป้องกันการบาดเจ็บ',
    };
  } else {
    wristDetail = {
      partNameTh: 'ข้อมือ (Wrist)',
      partKey: 'wrist',
      angle: wristAngle,
      direction: `ข้อมือกระดก/พับ (${wristAngle}°)`,
      status: 'warning',
      description: 'ปรับข้อมือให้อยู่ในแนวระนาบตรงเดียวกับท่อนแขน',
    };
  }

  // 6. นิ้วมือ (Fingers / Hand): Pointing vector & orientation
  const handAngle = Math.round((Math.atan2(indexFinger.y - wrist.y, indexFinger.x - wrist.x) * 180) / Math.PI);
  const fingerDetail: BodySegmentDetail = {
    partNameTh: 'นิ้วมือ (Fingers / Hand)',
    partKey: 'finger',
    angle: Math.abs(handAngle),
    direction: sideInfo.facingDirection === 'right' ? 'ปลายนิ้วชี้ไปข้างหน้า' : 'ปลายนิ้วชี้ไปข้างหน้า (ซ้าย)',
    status: 'optimal',
    description: 'ปลายนิ้วและฝ่ามือผ่อนคลาย ไม่ออกแรงเกร็งเกินจำเป็น',
  };

  // 7. เอว / สะโพก (Waist / Hip / Lumbar): Pelvic tilt & Hip Hinge angle
  const hipAngle = calculateAngle(shoulder, hip, knee);
  let waistDetail: BodySegmentDetail;
  if (hipAngle >= 150) {
    waistDetail = {
      partNameTh: 'เอว/สะโพก (Waist / Hip)',
      partKey: 'waist',
      angle: hipAngle,
      direction: `ลำตัวและสะโพกตั้งตรง (${hipAngle}°)`,
      status: 'optimal',
      description: 'แกนสะโพกอยู่ในแนวยืนตรงเต็มความสูง',
    };
  } else if (hipAngle >= 75 && hipAngle <= 115) {
    waistDetail = {
      partNameTh: 'เอว/สะโพก (Waist / Hip)',
      partKey: 'waist',
      angle: hipAngle,
      direction: `พับสะโพกได้จังหวะดี (Hip Hinge ${hipAngle}°)`,
      status: 'optimal',
      description: 'พับสะโพกส่งแรงผ่านกล้ามเนื้อก้น (Glutes) ได้อย่างมีประสิทธิภาพ',
    };
  } else {
    waistDetail = {
      partNameTh: 'เอว/สะโพก (Waist / Hip)',
      partKey: 'waist',
      angle: hipAngle,
      direction: `พับสะโพกลึกมาก (${hipAngle}°)`,
      status: 'warning',
      description: 'สะโพกพับลึกเกินไป ระวังอย่าให้หลังส่วนล่างงอค่อม',
    };
  }

  // 8. ต้นขา (Thigh / Femur): Thigh angle relative to horizontal ground
  const thighSlope = Math.round((Math.atan2(knee.y - hip.y, Math.abs(knee.x - hip.x) || 0.001) * 180) / Math.PI);
  let thighDetail: BodySegmentDetail;
  if (Math.abs(thighSlope) <= 12) {
    thighDetail = {
      partNameTh: 'ต้นขา (Thigh / Femur)',
      partKey: 'thigh',
      angle: Math.abs(thighSlope),
      direction: `ขนานพื้นพอดี (Parallel ${Math.abs(thighSlope)}°)`,
      status: 'optimal',
      description: 'ต้นขาขนานพื้นสมบูรณ์แบบ ได้ความลึกมาตรฐานยิม',
    };
  } else if (thighSlope > 12) {
    thighDetail = {
      partNameTh: 'ต้นขา (Thigh / Femur)',
      partKey: 'thigh',
      angle: thighSlope,
      direction: `สูงกว่าแนวขนาน (${thighSlope}°)`,
      status: 'warning',
      description: 'ต้นขายังไม่ขนานพื้น สามารถย่อตัวลงอีกเล็กน้อย',
    };
  } else {
    thighDetail = {
      partNameTh: 'ต้นขา (Thigh / Femur)',
      partKey: 'thigh',
      angle: Math.abs(thighSlope),
      direction: `ย่อลึกต่ำกว่าขนาน (Deep ${Math.abs(thighSlope)}°)`,
      status: 'optimal',
      description: 'ระดับความลึกแบบ Deep Squat สำหรับนักกีฬาที่มีความยืดหยุ่นสูง',
    };
  }

  // 9. หัวเข่า (Knee): Knee flexion angle
  const kneeAngle = calculateAngle(hip, knee, ankle);
  let kneeDetail: BodySegmentDetail;
  if (kneeAngle >= 155) {
    kneeDetail = {
      partNameTh: 'หัวเข่า (Knee)',
      partKey: 'knee',
      angle: kneeAngle,
      direction: `เหยียดเข่าตรง (${kneeAngle}°)`,
      status: 'optimal',
      description: 'ข้อเข่าเหยียดตรงพร้อมเริ่มจังหวะถัดไป',
    };
  } else if (kneeAngle >= 78 && kneeAngle <= 105) {
    kneeDetail = {
      partNameTh: 'หัวเข่า (Knee)',
      partKey: 'knee',
      angle: kneeAngle,
      direction: `งอเข่ามุมฉากทองคำ (${kneeAngle}°)`,
      status: 'optimal',
      description: 'มุมเข่า 90° มิติการย่อเหมาะสมที่สุด ปลอดภัยต่อข้อเข่า',
    };
  } else {
    kneeDetail = {
      partNameTh: 'หัวเข่า (Knee)',
      partKey: 'knee',
      angle: kneeAngle,
      direction: `งอเข่าลึก (${kneeAngle}°)`,
      status: 'warning',
      description: 'มุมเข่าพับลึก ระวังแรงกดทับที่กระดูกสะบ้า',
    };
  }

  // 10. ลำแข้ง (Shank / Tibia): Tibial progression angle vs vertical line
  const shankAngle = Math.round(
    (Math.atan2(Math.abs(knee.x - ankle.x), Math.abs(ankle.y - knee.y) || 0.001) * 180) / Math.PI
  );
  let shankDetail: BodySegmentDetail;
  if (shankAngle >= 12 && shankAngle <= 28) {
    shankDetail = {
      partNameTh: 'ลำแข้ง (Shank / Tibia)',
      partKey: 'shank',
      angle: shankAngle,
      direction: `แข้งโน้มไปข้างหน้าสมดุล (${shankAngle}°)`,
      status: 'optimal',
      description: 'มุมหน้าแข้งโน้มกำลังดี สอดคล้องกับแนวกระดูกสันหลัง',
    };
  } else if (shankAngle < 12) {
    shankDetail = {
      partNameTh: 'ลำแข้ง (Shank / Tibia)',
      partKey: 'shank',
      angle: shankAngle,
      direction: `แข้งเกือบตั้งฉาก (${shankAngle}°)`,
      status: 'optimal',
      description: 'หน้าแข้งตั้งตรง น้ำหนักกระจายลงสู่ส้นเท้าเต็มที่',
    };
  } else {
    shankDetail = {
      partNameTh: 'ลำแข้ง (Shank / Tibia)',
      partKey: 'shank',
      angle: shankAngle,
      direction: `แข้งโน้มไปข้างหน้ามาก (${shankAngle}°)`,
      status: 'warning',
      description: 'หน้าแข้งโน้มล้ำไปข้างหน้ามาก อาจมีแรงเฉือนสะสมที่หัวเข่า',
    };
  }

  // 11. ข้อเท้า (Ankle): Ankle dorsiflexion / plantarflexion angle
  const ankleAngle = calculateAngle(knee, ankle, toe);
  let ankleDetail: BodySegmentDetail;
  if (ankleAngle >= 70 && ankleAngle <= 90) {
    ankleDetail = {
      partNameTh: 'ข้อเท้า (Ankle)',
      partKey: 'ankle',
      angle: ankleAngle,
      direction: `กระดกข้อเท้าปกติ (Dorsiflexion ${ankleAngle}°)`,
      status: 'optimal',
      description: 'องศาการกระดกข้อเท้าอยู่ในเกณฑ์ยืดหยุ่นดีเยี่ยม',
    };
  } else if (ankleAngle > 90) {
    ankleDetail = {
      partNameTh: 'ข้อเท้า (Ankle)',
      partKey: 'ankle',
      angle: ankleAngle,
      direction: `เหยียดปลายเท้า (Plantarflexion ${ankleAngle}°)`,
      status: 'optimal',
      description: 'ข้อเท้าเปิดกว้างในแนวยืน',
    };
  } else {
    ankleDetail = {
      partNameTh: 'ข้อเท้า (Ankle)',
      partKey: 'ankle',
      angle: ankleAngle,
      direction: `กระดกข้อเท้างอลึก (${ankleAngle}°)`,
      status: 'warning',
      description: 'ข้อเท้างอลึกสุดขีด หากรู้สึกตึงควรวอร์มข้อเท้าเพิ่มเติม',
    };
  }

  // 12. ส้นเท้า (Heel): Calcaneus ground contact & elevation
  const isHeelLifting = toe.y - heel.y > 0.022;
  const heelElevDeg = isHeelLifting ? Math.round((toe.y - heel.y) * 100 * 4) : 0;
  let heelDetail: BodySegmentDetail;
  if (isHeelLifting) {
    heelDetail = {
      partNameTh: 'ส้นเท้า (Heel)',
      partKey: 'heel',
      angle: heelElevDeg,
      direction: `ส้นเท้ายกลอยขึ้น (~${heelElevDeg}°)`,
      status: 'critical',
      description: 'ส้นเท้ายกลอย! เสี่ยงล้มและเข่ารับแรงกระแทก กดส้นเท้าลงพื้น',
    };
  } else {
    heelDetail = {
      partNameTh: 'ส้นเท้า (Heel)',
      partKey: 'heel',
      angle: 0,
      direction: 'ส้นเท้าแนบพื้นเต็มฝ่า (Flat Contact 0°)',
      status: 'optimal',
      description: 'ส้นเท้าติดพื้นมั่นคง กระจายแรงน้ำหนักได้ 100%',
    };
  }

  // 13. ข้างฝ่าเท้า (Midfoot / Lateral Arch): Lateral arch stability
  const midfootDetail: BodySegmentDetail = {
    partNameTh: 'ข้างฝ่าเท้า (Midfoot / Lateral Arch)',
    partKey: 'midfoot',
    angle: 0,
    direction: 'ระนาบข้างฝ่าเท้าสัมผัสพื้นมั่นคง',
    status: 'optimal',
    description: 'อุ้งเท้าด้านข้างรองรับน้ำหนักเสถียร ไม่ยุบตัวเข้าด้านใน',
  };

  // 14. ปลายนิ้วเท้า (Toe / Foot Index): Grounding & toe angle
  const toeDetail: BodySegmentDetail = {
    partNameTh: 'ปลายนิ้วเท้า (Toe / Foot Index)',
    partKey: 'toes',
    angle: 0,
    direction: 'แนบระนาบพื้นราบเรียบ 0° (เกาะพื้นแน่น)',
    status: 'optimal',
    description: 'ปลายนิ้วเท้าแผ่ออกและยึดเกาะพื้นได้ดีเยี่ยม มอบฐานรองรับที่แข็งแกร่ง',
  };

  // Biomechanical Kinematic Calculations
  // Knee-over-toe distance offset
  const kneeOffset = sideInfo.facingDirection === 'right' ? knee.x - toe.x : toe.x - knee.x;
  let kneeOverToeStatus: 'safe' | 'warning' | 'excessive' = 'safe';
  if (kneeOffset > 0.12) {
    kneeOverToeStatus = 'excessive';
  } else if (kneeOffset > 0.05) {
    kneeOverToeStatus = 'warning';
  }

  // Plumb Line Deviation (Ear - Shoulder - Hip - Ankle alignment)
  const avgPlumbX = (ear.x + shoulder.x + hip.x + ankle.x) / 4;
  const plumbLineDeviation = Math.round(
    Math.max(
      Math.abs(ear.x - avgPlumbX),
      Math.abs(shoulder.x - avgPlumbX),
      Math.abs(hip.x - avgPlumbX),
      Math.abs(ankle.x - avgPlumbX)
    ) * 100 * 2
  );

  // Back posture analysis
  const spineDx = shoulder.x - hip.x;
  const spineDy = shoulder.y - hip.y;
  const spineAngle = Math.round(Math.abs((Math.atan2(spineDx, -spineDy) * 180) / Math.PI));
  let backPosture: 'neutral' | 'rounded' | 'hyperextended' = 'neutral';
  let backPostureText = 'แนวหลังและกระดูกสันหลังตรงสมดุล (Neutral Spine)';
  if (spineAngle > 34) {
    backPosture = 'rounded';
    backPostureText = 'ลำตัวโน้มไปข้างหน้ามากเกินไป (ระวังหลังค่อม)';
  }

  // Calculate Overall Form Score
  let score = 100;
  if (headDetail.status === 'warning') score -= 5;
  if (neckDetail.status === 'warning') score -= 8;
  if (neckDetail.status === 'critical') score -= 15;
  if (waistDetail.status === 'warning') score -= 10;
  if (thighDetail.status === 'warning') score -= 10;
  if (isHeelLifting) score -= 20;
  if (kneeOverToeStatus === 'warning') score -= 8;
  if (kneeOverToeStatus === 'excessive') score -= 18;
  if (backPosture === 'rounded') score -= 15;
  score = Math.max(30, Math.min(100, score));

  return {
    activeSide: sideInfo.activeSide,
    detectedSideMode: requestedSide,
    confidence: sideInfo.confidence,
    facingDirection: sideInfo.facingDirection,
    head: headDetail,
    neck: neckDetail,
    shoulder: shoulderDetail,
    arm: armDetail,
    wrist: wristDetail,
    finger: fingerDetail,
    waist: waistDetail,
    thigh: thighDetail,
    knee: kneeDetail,
    shank: shankDetail,
    ankle: ankleDetail,
    heel: heelDetail,
    midfoot: midfootDetail,
    toes: toeDetail,
    plumbLineDeviation,
    kneeOverToeOffsetPx: Math.round(kneeOffset * 1000),
    kneeOverToeStatus,
    backPosture,
    backPostureText,
    overallFormScore: score,
  };
}


/**
 * Exercise State Tracker for Reps & Form Analysis with Hysteresis
 */
export class ExerciseTracker {
  exercise: ExerciseType;
  repCount: number = 0;
  stage: 'up' | 'down' | 'hold' = 'up';
  currentAccuracy: number = 100;
  totalAccuracies: number[] = [];
  lastVoiceAlertTime: number = 0;
  baselineStandingHipY: number | null = null;
  minKneeAngleRecordedInRep: number = 180;

  constructor(exercise: ExerciseType) {
    this.exercise = exercise;
  }

  setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.repCount = 0;
    this.stage = 'up';
    this.totalAccuracies = [];
    this.baselineStandingHipY = null;
    this.minKneeAngleRecordedInRep = 180;
  }

  reset() {
    this.repCount = 0;
    this.stage = 'up';
    this.totalAccuracies = [];
    this.baselineStandingHipY = null;
    this.minKneeAngleRecordedInRep = 180;
  }

  update(
    landmarks: NormalizedLandmark[],
    _calibration?: CalibrationData,
    viewMode: CameraViewMode = 'front',
    selectedSide: BodySide = 'auto'
  ): PoseFeedbackResult {
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

    // Computed joint angles
    const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle);
    const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle);
    const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);
    const leftHipAngle = calculateAngle(lShoulder, lHip, lKnee);
    const rightHipAngle = calculateAngle(rShoulder, rHip, rKnee);

    // Spine inclination relative to vertical
    const midShoulder = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
    const midHip = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
    const spineDx = midShoulder.x - midHip.x;
    const spineDy = midShoulder.y - midHip.y;
    const spineInclination = Math.round(Math.abs((Math.atan2(spineDx, -spineDy) * 180) / Math.PI));

    // Full 14-segment Side-Profile Sagittal Kinematics Analysis
    const sideProfile = analyzeSideProfilePose(landmarks, selectedSide, this.exercise);

    const feedbacks: AngleFeedback[] = [];
    let repIncremented = false;
    let voiceWarning: string | undefined = undefined;
    let repScore = 100;
    let isGoodForm = true;
    let repProgress = 0; // 0 to 100%

    // In Side-View mode: focus on the tracked side's knee/elbow/hip angles for highest precision
    const isLeftTracked = sideProfile.activeSide === 'left';
    const sideKneeAngle = isLeftTracked ? leftKneeAngle : rightKneeAngle;
    const sideElbowAngle = isLeftTracked ? leftElbowAngle : rightElbowAngle;
    const sideHipAngle = isLeftTracked ? leftHipAngle : rightHipAngle;

    const avgKneeAngle = viewMode === 'side' ? sideKneeAngle : Math.round((leftKneeAngle + rightKneeAngle) / 2);
    const avgElbowAngle = viewMode === 'side' ? sideElbowAngle : Math.round((leftElbowAngle + rightElbowAngle) / 2);
    const avgHipAngle = viewMode === 'side' ? sideHipAngle : Math.round((leftHipAngle + rightHipAngle) / 2);

    // Track baseline standing hip level
    if (avgKneeAngle > 155 && !this.baselineStandingHipY) {
      this.baselineStandingHipY = midHip.y;
    }

    switch (this.exercise) {
      case 'squat': {
        // Calculate depth progress: 170° = 0%, 90° = 100%
        const squatDepthProgress = Math.min(100, Math.max(0, Math.round(((170 - avgKneeAngle) / (170 - 90)) * 100)));
        repProgress = squatDepthProgress;

        if (this.stage === 'down') {
          this.minKneeAngleRecordedInRep = Math.min(this.minKneeAngleRecordedInRep, avgKneeAngle);
        }

        // Robust Squat State Machine
        // Standing: Knee angle > 150°
        // Descend & Depth: Knee angle < 115°
        if (avgKneeAngle > 152) {
          if (this.stage === 'down') {
            // Rep completed upon full extension!
            if (this.minKneeAngleRecordedInRep <= 118) {
              this.repCount += 1;
              repIncremented = true;
            }
            this.stage = 'up';
            this.minKneeAngleRecordedInRep = 180;
          } else {
            this.stage = 'up';
          }
        } else if (avgKneeAngle <= 115) {
          this.stage = 'down';
        }

        // Form checks
        if (this.stage === 'down') {
          if (avgKneeAngle > 105) {
            feedbacks.push({
              jointName: 'ความลึกของท่า (Knee Depth)',
              currentAngle: avgKneeAngle,
              targetAngle: 90,
              status: 'warning',
              message: 'ย่อตัวลงอีกให้ต้นขาขนานพื้น (เป้าหมาย 90°)',
            });
            repScore -= 15;
            isGoodForm = false;
            voiceWarning = 'ย่อตัวลงอีกนิดครับ';
          } else if (avgKneeAngle < 65) {
            feedbacks.push({
              jointName: 'ความลึกมากเกินไป (Too Deep)',
              currentAngle: avgKneeAngle,
              targetAngle: 90,
              status: 'critical',
              message: 'ระวังอย่าย่อลึกเกินไป อาจเกิดแรงกดที่ข้อเข่า',
            });
            repScore -= 20;
            isGoodForm = false;
            voiceWarning = 'ระวังอย่าย่อลึกเกินไป';
          } else {
            feedbacks.push({
              jointName: 'ความลึกข้อเข่า (Knee Angle)',
              currentAngle: avgKneeAngle,
              targetAngle: 90,
              status: 'optimal',
              message: 'ระดับความลึกสมบูรณ์แบบ!',
            });
          }
        }

        // Spine alignment check
        if (spineInclination > 35) {
          feedbacks.push({
            jointName: 'แนวกระดูกสันหลัง (Spine Angle)',
            currentAngle: spineInclination,
            targetAngle: 15,
            status: 'critical',
            message: 'ลำตัวโน้มไปข้างหน้ามากเกินไป ยืดอกหลังตรง',
          });
          repScore -= 25;
          isGoodForm = false;
          voiceWarning = 'ยืดอก หลังตรงครับ';
        }
        break;
      }

      case 'pushup': {
        // Depth progress: 160° = 0%, 90° = 100%
        repProgress = Math.min(100, Math.max(0, Math.round(((160 - avgElbowAngle) / (160 - 90)) * 100)));

        if (avgElbowAngle > 148) {
          if (this.stage === 'down') {
            this.repCount += 1;
            this.stage = 'up';
            repIncremented = true;
          } else {
            this.stage = 'up';
          }
        } else if (avgElbowAngle < 100) {
          this.stage = 'down';
        }

        if (this.stage === 'down') {
          if (avgElbowAngle > 105) {
            feedbacks.push({
              jointName: 'การงอข้อศอก (Elbow Angle)',
              currentAngle: avgElbowAngle,
              targetAngle: 90,
              status: 'warning',
              message: 'ลดหน้าอกลงอีกจนข้อศอกทำมุม 90°',
            });
            repScore -= 20;
            isGoodForm = false;
            voiceWarning = 'ลดตัวลงอีกนิดครับ';
          }
        }

        if (avgHipAngle < 150) {
          feedbacks.push({
            jointName: 'แนวสะโพก (Hip Line)',
            currentAngle: avgHipAngle,
            targetAngle: 175,
            status: 'critical',
            message: 'สะโพกตก/แอ่นหลัง เกร็งหน้าท้องให้ลำตัวเป็นแนวตรง',
          });
          repScore -= 30;
          isGoodForm = false;
          voiceWarning = 'อย่าให้สะโพกตก เกร็งหน้าท้อง';
        }
        break;
      }

      case 'lunge': {
        const leadKnee = Math.min(leftKneeAngle, rightKneeAngle);
        repProgress = Math.min(100, Math.max(0, Math.round(((160 - leadKnee) / (160 - 90)) * 100)));

        if (leadKnee > 148) {
          if (this.stage === 'down') {
            this.repCount += 1;
            this.stage = 'up';
            repIncremented = true;
          } else {
            this.stage = 'up';
          }
        } else if (leadKnee < 105) {
          this.stage = 'down';
        }
        break;
      }

      case 'jumping_jack': {
        const leftArmRaise = calculateAngle(lHip, lShoulder, lWrist);
        const rightArmRaise = calculateAngle(rHip, rShoulder, rWrist);
        const avgArm = (leftArmRaise + rightArmRaise) / 2;
        repProgress = Math.min(100, Math.max(0, Math.round((avgArm / 150) * 100)));

        if (avgArm > 135) {
          if (this.stage === 'down') {
            this.repCount += 1;
            this.stage = 'up';
            repIncremented = true;
          }
        } else if (avgArm < 65) {
          this.stage = 'down';
        }
        break;
      }

      case 'plank': {
        this.stage = 'hold';
        repProgress = 100;
        if (avgHipAngle >= 155 && avgHipAngle <= 190) {
          feedbacks.push({
            jointName: 'แนวหลังและสะโพก (Plank Posture)',
            currentAngle: avgHipAngle,
            targetAngle: 175,
            status: 'optimal',
            message: 'ลำตัวตรงสมบูรณ์แบบ รักษาท่าไว้!',
          });
          isGoodForm = true;
        } else {
          feedbacks.push({
            jointName: 'แนวหลังและสะโพก (Plank Posture)',
            currentAngle: avgHipAngle,
            targetAngle: 175,
            status: 'critical',
            message: 'ปรับแนวสะโพกให้ขนานกับไหล่และข้อเท้า',
          });
          repScore -= 30;
          isGoodForm = false;
          voiceWarning = 'ปรับแนวลำตัวให้ตรงครับ';
        }
        break;
      }
    }

    repScore = Math.max(0, Math.min(100, repScore));
    this.currentAccuracy = repScore;
    if (repIncremented) {
      this.totalAccuracies.push(repScore);
    }

    const overallAccuracy =
      this.totalAccuracies.length > 0
        ? Math.round(this.totalAccuracies.reduce((a, b) => a + b, 0) / this.totalAccuracies.length)
        : repScore;

    return {
      exercise: this.exercise,
      repCount: this.repCount,
      stage: this.stage,
      accuracyScore: overallAccuracy,
      repProgress,
      angles: {
        leftKnee: leftKneeAngle,
        rightKnee: rightKneeAngle,
        leftElbow: leftElbowAngle,
        rightElbow: rightElbowAngle,
        leftHip: leftHipAngle,
        rightHip: rightHipAngle,
        spineInclination,
      },
      feedbacks,
      voiceWarning,
      isInGoodForm: isGoodForm,
      sideProfile,
    };
  }
}

/**
 * Web Audio Synthesizer for futuristic HUD sounds
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  // Default to MUTED as requested by user ("ช่วยปรับปรุงให้ ค่าเริ่มต้น เท่ากับ ปิดเสียง")
  private isMuted: boolean = true;

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.initCtx();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  private initCtx() {
    if (this.isMuted) return;
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  playRepSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playErrorWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196, this.ctx.currentTime); // G3
      osc.frequency.setValueAtTime(164.81, this.ctx.currentTime + 0.1); // E3
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playCountdownTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playCalibrationBeep(freq = 659.25) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
}

export const soundFx = new SoundEngine();

/**
 * Text-to-Speech Voice Assistant with strict Mute Control and Throttle
 * Default to MUTED as requested ("ช่วยปรับปรุงให้ ค่าเริ่มต้น เท่ากับ ปิดเสียง")
 */
let isSpeechMuted = true;
let lastSpeechTimestamp = 0;

export function setSpeechMuted(muted: boolean) {
  isSpeechMuted = muted;
  if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

export function getSpeechMuted(): boolean {
  return isSpeechMuted;
}

export function setGlobalAudioMuted(muted: boolean) {
  soundFx.setMuted(muted);
  setSpeechMuted(muted);
}

export function isGlobalAudioMuted(): boolean {
  return soundFx.getMuted() && isSpeechMuted;
}

export function speakAlertTh(text: string, force = false) {
  // If muted, unconditionally reject all speech attempts
  if (isSpeechMuted) return;

  const now = Date.now();
  if (!force && now - lastSpeechTimestamp < 3200) {
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    lastSpeechTimestamp = now;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech error:', e);
  }
}
