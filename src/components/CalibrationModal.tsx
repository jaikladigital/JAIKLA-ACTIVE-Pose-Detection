import React from 'react';
import { X, CheckCircle2, Crosshair, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CalibrationData } from '../types/pose';
import { JaiklaLogo } from './JaiklaLogo';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: CalibrationData;
  onStartCalibration: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  calibration,
  onStartCalibration,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0a0f1d] border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative shadow-cyan-950/40">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <JaiklaLogo size="md" variant="mark-only" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                JAIKLA ACTIVE • BODY CALIBRATION
              </span>
            </div>
            <h3 className="text-xl font-bold font-hud text-white">คาลิเบรตสรีระด้วยท่า T-Pose</h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          ระบบ AI Computer Vision ของ JAIKLA ACTIVE จะตรวจจับความยาวช่วงแขน (Arm Span) และสัดส่วนลำตัว เพื่อปรับเกณฑ์มุมองศาการตรวจจับให้แม่นยำ 100% สอดคล้องกับสรีระของคุณโดยเฉพาะ
        </p>

        {/* 3 Step Guide */}
        <div className="space-y-3">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
              1
            </span>
            <div>
              <p className="text-xs font-semibold text-white">ยืนถอยหลังให้อยู่ในกรอบภาพ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ให้กล้องเห็นตั้งแต่ศีรษะ ลำตัว ไปจนถึงข้อเท้า</p>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
              2
            </span>
            <div>
              <p className="text-xs font-semibold text-white">กางแขนออกทั้งสองข้าง (T-Pose)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">เหยียดแขนตรงให้อยู่ในระนาบเดียวกับหัวไหล่</p>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
              3
            </span>
            <div>
              <p className="text-xs font-semibold text-white">ค้างท่าไว้ประมาณ 2 วินาที</p>
              <p className="text-[11px] text-slate-400 mt-0.5">วงแหวน HUD จะนับครบ 100% และแจ้งเตือนด้วยเสียง</p>
            </div>
          </div>
        </div>

        {/* Existing Calibration Stats if any */}
        {calibration.isCalibrated && (
          <div className="bg-emerald-950/30 border border-emerald-600/40 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>คาลิเบรตแล้ว: ช่วงแขน ~{calibration.armSpanPx}px</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">STATUS: OPTIMAL</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            ปิด
          </button>

          <button
            onClick={() => {
              onStartCalibration();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-lg shadow-cyan-500/30"
          >
            <span>เริ่มคาลิเบรตทันที</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
