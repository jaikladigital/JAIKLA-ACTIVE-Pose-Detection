import {
  NormalizedLandmark,
  CalibrationData,
  PoseFeedbackResult,
  CameraViewMode,
  BodySide,
} from '../types/pose';
import {
  POSE_CONNECTIONS,
  POSE_LANDMARKS,
  SIDE_POSE_CONNECTIONS_LEFT,
  SIDE_POSE_CONNECTIONS_RIGHT,
} from './poseGeometry';

export interface DrawOptions {
  showAngles: boolean;
  showSkeleton: boolean;
  showHUD: boolean;
  calibrationMode: boolean;
  tPoseProgress: number; // 0 to 1
  calibrationMessage: string;
  isDetectionPaused?: boolean;
  compositeVideo?: boolean;
  viewMode?: CameraViewMode;
  selectedSide?: BodySide;
  showPlumbLine?: boolean;
  showFloorGrid?: boolean;
}

export function drawPoseCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: NormalizedLandmark[],
  feedback: PoseFeedbackResult | null,
  calibration: CalibrationData | null,
  options: DrawOptions,
  sourceVideo?: HTMLVideoElement | null
) {
  ctx.clearRect(0, 0, width, height);

  // If composite video is requested (e.g. during video clip recording)
  if (options.compositeVideo && sourceVideo && sourceVideo.readyState >= 2) {
    ctx.drawImage(sourceVideo, 0, 0, width, height);
  }

  // If detection is paused, don't draw skeleton; Paused banner is rendered via unmirrored HTML HUD
  if (options.isDetectionPaused) {
    return;
  }

  // Futuristic HUD Grid / Vignette if enabled
  if (options.showHUD) {
    drawHUDFrame(ctx, width, height, feedback, options);
  }

  // Calibration Overlay Mode (T-Pose Guidance)
  if (options.calibrationMode) {
    drawCalibrationGuides(ctx, width, height, landmarks, options.tPoseProgress, options.calibrationMessage);
  }

  if (!landmarks || landmarks.length < 33) {
    return;
  }

  const isSideMode = options.viewMode === 'side';

  // Draw Side-Profile Guides (Plumb line, Ground plane, Knee-over-toe guide)
  if (isSideMode && feedback?.sideProfile) {
    drawSideProfileGuides(ctx, width, height, landmarks, feedback, options);
  }

  // Draw Skeleton Connections
  if (options.showSkeleton) {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const connectionsToDraw = isSideMode
      ? feedback?.sideProfile?.activeSide === 'right'
        ? SIDE_POSE_CONNECTIONS_RIGHT
        : SIDE_POSE_CONNECTIONS_LEFT
      : POSE_CONNECTIONS;

    for (const [startIndex, endIndex] of connectionsToDraw) {
      const start = landmarks[startIndex];
      const end = landmarks[endIndex];

      if (!start || !end || (start.visibility ?? 1) < 0.35 || (end.visibility ?? 1) < 0.35) {
        continue;
      }

      const x1 = start.x * width;
      const y1 = start.y * height;
      const x2 = end.x * width;
      const y2 = end.y * height;

      // Color coding based on form feedback matching JAIKLA ACTIVE Electric Cyan & Ultraviolet brand
      let strokeColor = 'rgba(6, 182, 212, 0.95)'; // JAIKLA Neon Cyan default
      if (feedback && !feedback.isInGoodForm) {
        const isLeg = startIndex >= 23 || endIndex >= 23;
        const isArm = (startIndex >= 11 && startIndex <= 16) || (endIndex >= 11 && endIndex <= 16);
        if ((feedback.exercise === 'squat' && isLeg) || (feedback.exercise === 'pushup' && isArm)) {
          strokeColor = 'rgba(244, 63, 94, 0.95)'; // Neon rose alert
        } else {
          strokeColor = 'rgba(245, 158, 11, 0.95)'; // Warning amber
        }
      } else if (feedback?.isInGoodForm && feedback.stage === 'down') {
        strokeColor = 'rgba(0, 240, 255, 0.98)'; // Peak rep depth: high-voltage electric cyan
      } else {
        // Spine & core connections in violet, limbs in electric cyan
        const isSpine = (startIndex === 11 && endIndex === 12) || (startIndex === 23 && endIndex === 24) || (startIndex === 11 && endIndex === 23) || (startIndex === 12 && endIndex === 24);
        strokeColor = isSpine ? 'rgba(168, 85, 247, 0.95)' : 'rgba(6, 182, 212, 0.95)';
      }

      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw Glowing Keypoints
    const sideActiveKeypoints =
      isSideMode && feedback?.sideProfile?.activeSide === 'right'
        ? [8, 12, 14, 16, 20, 24, 26, 28, 30, 32, 0]
        : isSideMode
        ? [7, 11, 13, 15, 19, 23, 25, 27, 29, 31, 0]
        : null;

    for (let i = 0; i < landmarks.length; i++) {
      if (sideActiveKeypoints && !sideActiveKeypoints.includes(i)) {
        continue;
      }

      const pt = landmarks[i];
      if (!pt || (pt.visibility ?? 1) < 0.35) continue;

      const px = pt.x * width;
      const py = pt.y * height;

      const isMajorJoint = [
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.LEFT_ELBOW,
        POSE_LANDMARKS.RIGHT_ELBOW,
        POSE_LANDMARKS.LEFT_WRIST,
        POSE_LANDMARKS.RIGHT_WRIST,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.LEFT_KNEE,
        POSE_LANDMARKS.RIGHT_KNEE,
        POSE_LANDMARKS.LEFT_ANKLE,
        POSE_LANDMARKS.RIGHT_ANKLE,
      ].includes(i);

      const radius = isMajorJoint ? 6 : 4;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(px, py, radius + 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = isMajorJoint ? 'rgba(6, 182, 212, 0.45)' : 'rgba(168, 85, 247, 0.35)';
      ctx.fill();

      // Inner solid point with cyan neon glow
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw Real-time Angle Badges with un-mirror transformation compensation!
  if (options.showAngles && feedback) {
    if (isSideMode && feedback.sideProfile) {
      drawSideProfileAngleBadges(ctx, width, height, landmarks, feedback);
    } else {
      drawJointAngleBadges(ctx, width, height, landmarks, feedback);
    }
  }

  // Draw JAIKLA ACTIVE Watermark (Un-mirrored for camera & recorded video)
  drawJaiklaBrandWatermark(ctx, width, height);
}


function drawJointAngleBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: NormalizedLandmark[],
  feedback: PoseFeedbackResult
) {
  const lKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  const jointsToRender: { pt: NormalizedLandmark; angle: number; name: string; target: number }[] = [];

  if (feedback.exercise === 'squat' || feedback.exercise === 'lunge') {
    if (lKnee && (lKnee.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lKnee, angle: feedback.angles.leftKnee, name: 'เข่าซ้าย', target: 90 });
    }
    if (rKnee && (rKnee.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: rKnee, angle: feedback.angles.rightKnee, name: 'เข่าขวา', target: 90 });
    }
    if (lHip && (lHip.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lHip, angle: feedback.angles.leftHip, name: 'สะโพก', target: 85 });
    }
  } else if (feedback.exercise === 'pushup') {
    if (lElbow && (lElbow.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lElbow, angle: feedback.angles.leftElbow, name: 'ศอกซ้าย', target: 90 });
    }
    if (rElbow && (rElbow.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: rElbow, angle: feedback.angles.rightElbow, name: 'ศอกขวา', target: 90 });
    }
    if (lHip && (lHip.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lHip, angle: feedback.angles.leftHip, name: 'แกนสะโพก', target: 175 });
    }
  } else {
    if (lKnee && (lKnee.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lKnee, angle: feedback.angles.leftKnee, name: 'เข่า', target: 90 });
    }
    if (lElbow && (lElbow.visibility ?? 1) > 0.5) {
      jointsToRender.push({ pt: lElbow, angle: feedback.angles.leftElbow, name: 'ข้อศอก', target: 90 });
    }
  }

  for (const item of jointsToRender) {
    const px = item.pt.x * width;
    const py = item.pt.y * height;

    const diff = Math.abs(item.angle - item.target);
    const isGood = diff <= 15;
    const isMedium = diff <= 30;

    const bgColor = isGood ? 'rgba(16, 185, 129, 0.9)' : isMedium ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    const text = `${item.name} ${item.angle}°`;

    ctx.save();
    // Critical: Compensate for -scale-x-100 mirroring so text reads left-to-right correctly!
    ctx.translate(px, py);
    ctx.scale(-1, 1);

    ctx.font = '600 12px "Chakra Petch", sans-serif';
    const textWidth = ctx.measureText(text).width;
    const boxW = textWidth + 16;
    const boxH = 22;

    // Draw pill tag next to joint
    ctx.fillStyle = bgColor;
    ctx.shadowColor = bgColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(8, -11, boxW, boxH, 4);
    ctx.fill();

    // Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 16, 4);

    // Connecting pointer dot
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.restore();
  }
}

function drawSideProfileGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: NormalizedLandmark[],
  feedback: PoseFeedbackResult,
  options: DrawOptions
) {
  if (!feedback.sideProfile) return;
  const sp = feedback.sideProfile;
  const isLeft = sp.activeSide === 'left';

  const ear = landmarks[isLeft ? POSE_LANDMARKS.LEFT_EAR : POSE_LANDMARKS.RIGHT_EAR];
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];
  const heel = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HEEL : POSE_LANDMARKS.RIGHT_HEEL];
  const toe = landmarks[isLeft ? POSE_LANDMARKS.LEFT_FOOT_INDEX : POSE_LANDMARKS.RIGHT_FOOT_INDEX];

  // 1. Vertical Plumb Line (แนวดิ่ง Ear down to floor)
  if (options.showPlumbLine !== false && ear && ankle) {
    const plumbX = ear.x * width;
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(plumbX, (ear.y - 0.05) * height);
    ctx.lineTo(plumbX, height - 15);
    ctx.stroke();

    // Plumb line label (un-mirrored)
    ctx.translate(plumbX, ear.y * height - 12);
    ctx.scale(-1, 1);
    ctx.font = 'bold 10px "Chakra Petch", monospace';
    ctx.fillStyle = 'rgba(192, 132, 252, 0.95)';
    ctx.fillText('PLUMB LINE (แนวดิ่ง)', 6, 0);
    ctx.restore();
  }

  // 2. Knee Over Toe Alignment Guideline
  if (knee && toe) {
    const toeX = toe.x * width;
    ctx.save();
    const kneeStatusColor =
      sp.kneeOverToeStatus === 'safe'
        ? 'rgba(52, 211, 153, 0.75)'
        : sp.kneeOverToeStatus === 'warning'
        ? 'rgba(251, 191, 36, 0.85)'
        : 'rgba(244, 63, 94, 0.95)';

    ctx.strokeStyle = kneeStatusColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toeX, knee.y * height - 25);
    ctx.lineTo(toeX, toe.y * height + 10);
    ctx.stroke();

    // Toe vertical marker tag
    ctx.translate(toeX, knee.y * height - 10);
    ctx.scale(-1, 1);
    ctx.font = 'bold 9px "Chakra Petch", monospace';
    ctx.fillStyle = kneeStatusColor;
    ctx.fillText(sp.kneeOverToeStatus === 'safe' ? 'TOE LIMIT: SAFE' : 'TOE LIMIT', 6, 0);
    ctx.restore();
  }

  // 3. Ground Contact Plane Line (Heel to Toe)
  if (heel && toe) {
    const yGround = Math.max(heel.y, toe.y) * height;
    ctx.save();
    const isLifting = sp.heel.status === 'critical';
    ctx.strokeStyle = isLifting ? 'rgba(244, 63, 94, 0.85)' : 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 3;
    ctx.shadowColor = isLifting ? 'rgba(244, 63, 94, 0.8)' : 'rgba(52, 211, 153, 0.8)';
    ctx.shadowBlur = 8;
    const minX = Math.min(heel.x, toe.x);
    const maxX = Math.max(heel.x, toe.x);
    ctx.beginPath();
    ctx.moveTo((minX - 0.05) * width, yGround);
    ctx.lineTo((maxX + 0.05) * width, yGround);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSideProfileAngleBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: NormalizedLandmark[],
  feedback: PoseFeedbackResult
) {
  if (!feedback.sideProfile) return;
  const sp = feedback.sideProfile;
  const isLeft = sp.activeSide === 'left';

  const ear = landmarks[isLeft ? POSE_LANDMARKS.LEFT_EAR : POSE_LANDMARKS.RIGHT_EAR];
  const shoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
  const elbow = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW];
  const wrist = landmarks[isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST];
  const hip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP];
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];
  const heel = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HEEL : POSE_LANDMARKS.RIGHT_HEEL];

  const badges: { pt: NormalizedLandmark; text: string; status: 'optimal' | 'warning' | 'critical' }[] = [];

  if (ear && (ear.visibility ?? 1) > 0.4) {
    badges.push({ pt: ear, text: `หัว: ${sp.head.direction}`, status: sp.head.status });
  }
  if (shoulder && (shoulder.visibility ?? 1) > 0.4) {
    badges.push({ pt: shoulder, text: `ไหล่ ${sp.shoulder.angle}° | คอ ${sp.neck.angle}°`, status: sp.neck.status });
  }
  if (elbow && (elbow.visibility ?? 1) > 0.4) {
    badges.push({ pt: elbow, text: `ศอก ${sp.arm.angle}°`, status: sp.arm.status });
  }
  if (wrist && (wrist.visibility ?? 1) > 0.4) {
    badges.push({ pt: wrist, text: `ข้อมือ ${sp.wrist.angle}°`, status: sp.wrist.status });
  }
  if (hip && (hip.visibility ?? 1) > 0.4) {
    badges.push({ pt: hip, text: `สะโพก/เอว ${sp.waist.angle}° (${sp.thigh.direction})`, status: sp.waist.status });
  }
  if (knee && (knee.visibility ?? 1) > 0.4) {
    badges.push({ pt: knee, text: `เข่า ${sp.knee.angle}° (แข้ง ${sp.shank.angle}°)`, status: sp.knee.status });
  }
  if (ankle && (ankle.visibility ?? 1) > 0.4) {
    badges.push({ pt: ankle, text: `ข้อเท้า ${sp.ankle.angle}°`, status: sp.ankle.status });
  }
  if (heel && (heel.visibility ?? 1) > 0.4) {
    badges.push({ pt: heel, text: sp.heel.direction, status: sp.heel.status });
  }

  for (const b of badges) {
    const px = b.pt.x * width;
    const py = b.pt.y * height;
    const bgColor =
      b.status === 'optimal'
        ? 'rgba(16, 185, 129, 0.92)'
        : b.status === 'warning'
        ? 'rgba(245, 158, 11, 0.92)'
        : 'rgba(239, 68, 68, 0.92)';

    ctx.save();
    // Compensate for -scale-x-100 mirroring
    ctx.translate(px, py);
    ctx.scale(-1, 1);
    ctx.font = '600 11px "Chakra Petch", sans-serif';
    const textW = ctx.measureText(b.text).width;
    const boxW = textW + 16;
    const boxH = 21;

    ctx.fillStyle = bgColor;
    ctx.shadowColor = bgColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(8, -10, boxW, boxH, 4);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.text, 16, 4);
    ctx.restore();
  }
}


function drawHUDFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  feedback: PoseFeedbackResult | null,
  _options: DrawOptions
) {
  const bracketSize = 28;
  const margin = 16;
  const hudColor = feedback?.isInGoodForm ? '#8b5cf6' : '#f43f5e';

  ctx.strokeStyle = hudColor;
  ctx.lineWidth = 2.5;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(margin, margin + bracketSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + bracketSize, margin);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(width - margin - bracketSize, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, margin + bracketSize);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(margin, height - margin - bracketSize);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin + bracketSize, height - margin);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(width - margin - bracketSize, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin, height - margin - bracketSize);
  ctx.stroke();

  // Crosshairs in the center
  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy);
  ctx.lineTo(cx + 15, cy);
  ctx.moveTo(cx, cy - 15);
  ctx.lineTo(cx, cy + 15);
  ctx.stroke();
}

function drawCalibrationGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _landmarks: NormalizedLandmark[],
  progress: number,
  message: string
) {
  ctx.fillStyle = 'rgba(8, 4, 17, 0.55)';
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height * 0.46;

  // Ghost T-Pose silhouette guide
  ctx.save();
  ctx.strokeStyle = progress > 0.8 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(168, 85, 247, 0.65)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);

  // Head circle
  ctx.beginPath();
  ctx.arc(cx, cy - height * 0.28, 28, 0, 2 * Math.PI);
  ctx.stroke();

  // Spine
  ctx.beginPath();
  ctx.moveTo(cx, cy - height * 0.24);
  ctx.lineTo(cx, cy + height * 0.08);
  ctx.stroke();

  // Horizontal Arms
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.36, cy - height * 0.18);
  ctx.lineTo(cx + width * 0.36, cy - height * 0.18);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(cx, cy + height * 0.08);
  ctx.lineTo(cx - width * 0.12, cy + height * 0.42);
  ctx.moveTo(cx, cy + height * 0.08);
  ctx.lineTo(cx + width * 0.12, cy + height * 0.42);
  ctx.stroke();
  ctx.restore();

  // Calibration Progress Ring in center
  const ringRadius = 55;
  ctx.beginPath();
  ctx.arc(cx, cy - height * 0.02, ringRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Active progress arc
  ctx.beginPath();
  ctx.arc(
    cx,
    cy - height * 0.02,
    ringRadius,
    -Math.PI / 2,
    -Math.PI / 2 + 2 * Math.PI * progress
  );
  ctx.strokeStyle = progress >= 0.99 ? '#10b981' : '#a855f7';
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Un-mirrored Progress text inside ring
  ctx.save();
  ctx.translate(cx, cy - height * 0.02);
  ctx.scale(-1, 1); // Unmirror!
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(progress * 100)}%`, 0, 7);
  ctx.restore();

  // Un-mirrored instruction banner at bottom
  const bannerY = height * 0.88;
  ctx.save();
  ctx.translate(cx, bannerY);
  ctx.scale(-1, 1); // Unmirror!

  ctx.fillStyle = 'rgba(14, 7, 28, 0.92)';
  ctx.beginPath();
  ctx.roundRect(-230, -28, 460, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#c084fc';
  ctx.font = '600 16px "Prompt", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, 0, 7);
  ctx.restore();
}

/**
 * Renders un-mirrored JAIKLA ACTIVE watermark on canvas and in recorded clips
 */
function drawJaiklaBrandWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  // Anchor at the corner with mirror compensation
  const anchorX = 24;
  const anchorY = height - 28;

  ctx.translate(anchorX, anchorY);
  ctx.scale(-1, 1); // Crucial: Invert horizontally so text reads left-to-right!

  // Semi-transparent sleek dark background badge matching JAIKLA ACTIVE obsidian card
  ctx.fillStyle = 'rgba(6, 8, 15, 0.88)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-8, -20, 280, 34, 8);
  ctx.fill();
  ctx.stroke();

  // White JAIKLA brand wordmark with athletic glow
  ctx.font = '900 13px "Chakra Petch", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('JAIKLA', 0, 2);

  // Luminous cyan ACTIVE speed tag
  ctx.fillStyle = '#06b6d4';
  ctx.font = '700 9px "Chakra Petch", monospace';
  ctx.fillText('— ACTIVE —', 58, 2);

  // Subtitle
  ctx.fillStyle = '#c084fc';
  ctx.font = '600 8px "Prompt", sans-serif';
  ctx.fillText('• MOVE BETTER · LIVE BETTER', 132, 2);

  ctx.restore();
}

