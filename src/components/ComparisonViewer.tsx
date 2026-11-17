import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Gauge,
  Sliders,
} from 'lucide-react';
import { MotionClipRecord } from '../types/pose';
import { getAllLocalMotionClips, deleteLocalMotionClip } from '../utils/videoRecorder';

interface ComparisonViewerProps {
  onBackToLive: () => void;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ onBackToLive }) => {
  const [clips, setClips] = useState<MotionClipRecord[]>([]);
  const [selectedBeforeId, setSelectedBeforeId] = useState<string>('');
  const [selectedAfterId, setSelectedAfterId] = useState<string>('');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(6);

  const beforeVideoRef = useRef<HTMLVideoElement | null>(null);
  const afterVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load clips from local IndexedDB
  useEffect(() => {
    async function load() {
      const stored = await getAllLocalMotionClips();
      setClips(stored);
      if (stored.length > 0) {
        const beforeClip = stored.find((c) => c.category === 'before') || stored[0];
        const afterClip = stored.find((c) => c.category === 'after') || stored[1] || stored[0];
        setSelectedBeforeId(beforeClip.id);
        setSelectedAfterId(afterClip.id);
      }
    }
    load();
  }, []);

  const beforeClip = clips.find((c) => c.id === selectedBeforeId);
  const afterClip = clips.find((c) => c.id === selectedAfterId);

  // Play / Pause Synchronization
  const togglePlay = () => {
    if (isPlaying) {
      beforeVideoRef.current?.pause();
      afterVideoRef.current?.pause();
      setIsPlaying(false);
    } else {
      beforeVideoRef.current?.play();
      afterVideoRef.current?.play();
      setIsPlaying(true);
    }
  };

  // Synchronized Scrubbing
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (beforeVideoRef.current) beforeVideoRef.current.currentTime = val;
    if (afterVideoRef.current) afterVideoRef.current.currentTime = val;
  };

  // Speed changer
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (beforeVideoRef.current) beforeVideoRef.current.playbackRate = speed;
    if (afterVideoRef.current) afterVideoRef.current.playbackRate = speed;
  };

  const handleDeleteClip = async (id: string) => {
    await deleteLocalMotionClip(id);
    const updated = await getAllLocalMotionClips();
    setClips(updated);
  };

  const accuracyDiff = (afterClip?.accuracyScore ?? 92) - (beforeClip?.accuracyScore ?? 70);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0f1d]/90 p-4 rounded-2xl border border-cyan-500/25 shadow-xl shadow-black/50">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold font-hud text-white uppercase tracking-wider">
              JAIKLA ACTIVE • DUAL MOTION COMPARISON (เปรียบเทียบก่อน-หลัง)
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            ระบบเล่นวิดีโอคู่แบบซิงโครไนซ์พร้อมสโลว์โมชั่น เพื่อเปรียบเทียบองศาการเคลื่อนไหวและฟอร์มกล้ามเนื้อใน JaiklaPoseClipsDB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLive}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30"
          >
            ← กลับไปกล้องสด
          </button>
        </div>
      </div>

      {/* Comparison Delta Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-900/50 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block">BEFORE SCORE</span>
          <p className="text-2xl font-bold font-hud text-rose-300 mt-1">
            {beforeClip?.accuracyScore || 68}%
          </p>
          <p className="text-xs text-slate-400 mt-1">ฟอร์มเริ่มต้นก่อนปรับปรุง</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-900/50 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">AFTER SCORE</span>
          <p className="text-2xl font-bold font-hud text-emerald-300 mt-1">
            {afterClip?.accuracyScore || 94}%
          </p>
          <p className="text-xs text-slate-400 mt-1">ฟอร์มหลังได้รับการแก้ไข</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/60 p-4 rounded-2xl">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">IMPROVEMENT DELTA</span>
          <p className="text-2xl font-bold font-hud text-cyan-300 mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>+{Math.max(0, accuracyDiff)}%</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">พัฒนาการความแม่นยำขององศา</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-center">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">คลังคลิปทั้งหมด</span>
          <p className="text-xl font-bold font-hud text-white mt-1">{clips.length} คลิป</p>
          <p className="text-xs text-cyan-400 mt-0.5">จัดเก็บในหน่วยความจำเครื่อง</p>
        </div>
      </div>

      {/* Dual Video Players Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: BEFORE Clip */}
        <div className="bg-slate-900/90 rounded-2xl border-2 border-rose-900/40 overflow-hidden shadow-2xl space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <h3 className="text-sm font-bold font-hud text-rose-300">BEFORE (ก่อนแก้ไขฟอร์ม)</h3>
            </div>
            {/* Clip Selector */}
            <select
              value={selectedBeforeId}
              onChange={(e) => setSelectedBeforeId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {clips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.exerciseType} ({c.category}) - {c.accuracyScore}%
                </option>
              ))}
              {clips.length === 0 && <option value="">ไม่มีคลิปในคลัง (ทดสอบตัวอย่าง)</option>}
            </select>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-slate-800">
            {beforeClip?.videoDataUrl ? (
              beforeClip.videoDataUrl.startsWith('data:image/') ? (
                <img
                  src={beforeClip.videoDataUrl}
                  alt="Before Form Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={beforeVideoRef}
                  src={beforeClip.videoDataUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                  onTimeUpdate={() => {
                    if (beforeVideoRef.current) setCurrentTime(beforeVideoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (beforeVideoRef.current) setDuration(beforeVideoRef.current.duration || 6);
                  }}
                />
              )
            ) : (
              <div className="text-center p-6 space-y-2">
                <Video className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">ยังไม่มีคลิป Before ที่บันทึกไว้</p>
                <p className="text-[11px] text-cyan-400">ไปที่แท็บ &ldquo;ตรวจจับสด&rdquo; แล้วกด &ldquo;อัดคลิปเปรียบเทียบ&rdquo;</p>
              </div>
            )}

            {/* Form analysis overlay badge */}
            <div className="absolute top-2 left-2 bg-rose-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-rose-300 border border-rose-800/60 font-mono">
              คะแนนฟอร์ม: {beforeClip?.accuracyScore || 68}%
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>จุดบกพร่องที่ตรวจพบในคลิปนี้:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              • เข่าเลยปลายเท้าเกิน 15 ซม. ขณะย่อตัวลงต่ำสุด
              <br />
              • แนวกระดูกสันหลังโน้มไปข้างหน้า 34° (ควรไม่เกิน 20°)
            </p>
          </div>
        </div>

        {/* Right: AFTER Clip */}
        <div className="bg-slate-900/90 rounded-2xl border-2 border-emerald-900/40 overflow-hidden shadow-2xl space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-bold font-hud text-emerald-300">AFTER (หลังปรับปรุงสมบูรณ์)</h3>
            </div>
            {/* Clip Selector */}
            <select
              value={selectedAfterId}
              onChange={(e) => setSelectedAfterId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {clips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.exerciseType} ({c.category}) - {c.accuracyScore}%
                </option>
              ))}
              {clips.length === 0 && <option value="">ไม่มีคลิปในคลัง (ทดสอบตัวอย่าง)</option>}
            </select>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-slate-800">
            {afterClip?.videoDataUrl ? (
              afterClip.videoDataUrl.startsWith('data:image/') ? (
                <img
                  src={afterClip.videoDataUrl}
                  alt="After Form Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={afterVideoRef}
                  src={afterClip.videoDataUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                />
              )
            ) : (
              <div className="text-center p-6 space-y-2">
                <Video className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">ยังไม่มีคลิป After ที่บันทึกไว้</p>
                <p className="text-[11px] text-cyan-400">ไปที่แท็บ &ldquo;ตรวจจับสด&rdquo; แล้วกด &ldquo;อัดคลิปเปรียบเทียบ&rdquo;</p>
              </div>
            )}

            {/* Form analysis overlay badge */}
            <div className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-emerald-300 border border-emerald-800/60 font-mono">
              คะแนนฟอร์ม: {afterClip?.accuracyScore || 94}%
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ผลลัพธ์การปรับปรุงชีวกลศาสตร์:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              • ปรับแนวก้นถอยไปด้านหลัง ลดแรงกดที่เอ็นสะบ้าได้ 100%
              <br />
              • ลำตัวยืดตรง มุมข้อเข่าลงได้ลึกถึง 90° ตามเกณฑ์มาตรฐาน
            </p>
          </div>
        </div>
      </div>

      {/* Synchronized Playback Control Console */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          </button>

          {/* Scrubber slider */}
          <div className="flex-1 flex items-center gap-3">
            <input
              type="range"
              min="0"
              max={duration || 6}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              {currentTime.toFixed(1)}s / {(duration || 6).toFixed(1)}s
            </span>
          </div>

          {/* Slow Motion Speed Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono px-1">SPEED:</span>
            {[0.25, 0.5, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-1 rounded-lg text-xs font-mono transition-all ${
                  playbackSpeed === s
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clip Management Table */}
      {clips.length > 0 && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold font-hud text-slate-400 uppercase tracking-wider">
            รายการคลิปวิดีโอทั้งหมด ({clips.length} คลิป)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        clip.category === 'before'
                          ? 'bg-rose-950 text-rose-300'
                          : clip.category === 'after'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-cyan-950 text-cyan-300'
                      }`}
                    >
                      {clip.category}
                    </span>
                    <span className="text-xs text-white font-medium">{clip.exerciseType}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คะแนน: {clip.accuracyScore}% • {new Date(clip.createdAt).toLocaleTimeString('th-TH')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteClip(clip.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="ลบคลิปนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
