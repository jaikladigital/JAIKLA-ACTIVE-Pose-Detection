import React from 'react';
import { Camera, Video, History, CheckCircle2, AlertTriangle, ShieldCheck, Flame, Volume2, VolumeX, Activity } from 'lucide-react';
import { CalibrationData } from '../types/pose';
import { JaiklaLogo } from './JaiklaLogo';

export type NavTab = 'sports_fitting' | 'live' | 'stretching' | 'compare' | 'history';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  calibration: CalibrationData;
  onOpenCalibration: () => void;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  calibration,
  onOpenCalibration,
  videoDevices,
  selectedDeviceId,
  onSelectDevice,
  isAudioMuted = true,
  onToggleAudio,
}) => {
  return (
    <header className="border-b border-cyan-500/20 bg-[#06080f]/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 shadow-[0_4px_30px_rgba(6,182,212,0.12)]">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Logo: High-res authentic JAIKLA ACTIVE emblem & typography */}
        <div className="flex items-center gap-3">
          <JaiklaLogo size="md" variant="full" />
        </div>

        {/* Navigation Tabs: Sports Fitting is Rank #1 as requested */}
        <nav className="flex items-center gap-1.5 bg-[#0a0f1d]/90 p-1.5 rounded-xl border border-cyan-500/25 overflow-x-auto max-w-full shadow-inner shadow-black/60">
          {/* RANK #1: Sports Motion Analysis & Biomechanical Fitting (กอล์ฟ วิ่ง ปั่นจักรยาน) */}
          <button
            onClick={() => setActiveTab('sports_fitting')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sports_fitting'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.55)] border border-cyan-300/60 ring-1 ring-cyan-400/40'
                : 'text-cyan-300 hover:text-white hover:bg-slate-800/70 border border-cyan-500/20'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'sports_fitting' ? 'text-cyan-100' : 'text-cyan-400'}`} />
            <span>1. วิเคราะห์กีฬา & ฟิตติ้ง</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 font-black tracking-tight">
              อันดับ 1
            </span>
          </button>

          {/* 2. Fitness & Bodyweight Live HUD */}
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)] border border-cyan-300/40'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Camera className={`w-4 h-4 ${activeTab === 'live' ? 'text-cyan-200' : 'text-cyan-400'}`} />
            <span>ตรวจจับสดบอดี้เวท</span>
          </button>

          {/* 3. Stretching Section (Head to Ankles) */}
          <button
            onClick={() => setActiveTab('stretching')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'stretching'
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white shadow-[0_0_18px_rgba(245,158,11,0.4)] border border-amber-300/40'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'stretching' ? 'text-amber-200' : 'text-amber-400'}`} />
            <span>ยืดเหยียด (Stretching 1-8)</span>
          </button>

          {/* 4. Compare */}
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)] border border-cyan-300/40'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Video className={`w-4 h-4 ${activeTab === 'compare' ? 'text-cyan-200' : 'text-cyan-400'}`} />
            <span>เปรียบเทียบ Before/After</span>
          </button>

          {/* 5. History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)] border border-cyan-300/40'
                : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-cyan-200' : 'text-cyan-400'}`} />
            <span>คลังประวัติ & คลาวด์</span>
          </button>
        </nav>

        {/* Right Tools: Camera switcher & T-Pose Calibration status */}
        <div className="flex items-center gap-2.5">
          {videoDevices.length > 1 && (
            <div className="relative">
              <select
                value={selectedDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="bg-[#0b101c] border border-cyan-500/30 text-cyan-200 text-xs rounded-lg px-2.5 py-1.5 pr-6 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm hover:border-cyan-400/60 transition-colors"
              >
                {videoDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `กล้อง ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Master Audio Mute/Unmute Button (Default: Muted ปิดเสียง) */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200 hover:bg-cyan-900/70 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
            }`}
            title={
              isAudioMuted
                ? 'ระบบปิดเสียงอยู่ (ค่าเริ่มต้น) — คลิกเพื่อเปิดเสียงเตือนและเสียงเอฟเฟกต์'
                : 'ระบบเปิดเสียงอยู่ — คลิกเพื่อปิดเสียงทั้งหมด'
            }
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


          {/* T-Pose Calibration Status Button */}
          <button
            onClick={onOpenCalibration}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              calibration.isCalibrated
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:bg-emerald-900/70'
                : 'bg-gradient-to-r from-violet-950/90 to-cyan-950/90 border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.3)] hover:brightness-110 animate-pulse'
            }`}
            title="กดเพื่อคาลิเบรตสัดส่วนร่างกายด้วยท่า T-Pose"
          >
            {calibration.isCalibrated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>คาลิเบรตแล้ว (T-Pose)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>เริ่มคาลิเบรต T-Pose</span>
              </>
            )}
          </button>

          {/* Firestore badge */}
          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0a0f1d] border border-cyan-500/20 text-[11px] text-cyan-300/80">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Cloud Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
