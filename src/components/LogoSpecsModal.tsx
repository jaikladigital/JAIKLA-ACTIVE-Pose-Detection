import React, { useState } from 'react';
import { X, Copy, Check, Info, Layout, Palette, Shield, Sparkles } from 'lucide-react';
import { JaiklaLogo, PoseDetectionTargetIcon } from './JaiklaLogo';
import jaiklaThumbMarkImg from '../assets/images/jaikla_thumb_mark_1792112438107.jpg';

interface LogoSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoSpecsModal: React.FC<LogoSpecsModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#080d1a] border border-violet-500/40 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(139,92,246,0.3)] text-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#080d1a]/95 backdrop-blur-md border-b border-violet-500/30 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-hud tracking-wide">
                คู่มือตรวจสอบขนาดและข้อมูลจำเพาะของโลโก้ (Logo Specs)
              </h2>
              <p className="text-xs text-violet-300/80 font-mono">
                JAIKLA ACTIVE POSE DETECTION — สำหรับการผลิตไฟล์ภาพกราฟิกทดแทนใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Live Preview of Current Header Lockup */}
          <div className="bg-[#04060c] p-4 rounded-xl border border-violet-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
                การแสดงผลจริงบนแถบเมนูนำทาง (Header Live Preview)
              </span>
              <JaiklaLogo size="md" variant="full" />
            </div>
            <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
              <div>ความสูงในแถบเมนู: <span className="text-white font-bold">46 px</span></div>
              <div>ความกว้างรวมข้อความ: <span className="text-white font-bold">~280 - 320 px</span></div>
              <div>สัดส่วนกว้าง:ยาว: <span className="text-cyan-300 font-bold">~ 5:1 ถึง 6:1</span></div>
            </div>
          </div>

          {/* Section 1: Thumbnail Target Mark */}
          <div className="bg-[#0b1020] p-5 rounded-xl border border-violet-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-white text-sm">
                  1. ทรัมเนลเป้าตรวจจับมุมซ้ายบน (Thumbnail Target Reticle Mark)
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded bg-violet-600/30 text-violet-200 border border-violet-500/40 font-mono">
                อัตราส่วน 1:1 (Square)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              เป้าตรวจจับการเคลื่อนไหวร่างกาย สื่อถึงระบบ AI Optical Pose Tracking, ข้อต่อมนุษย์ 33 จุด และปีกพลังงานจลน์ (Kinetic Motion Wing)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#060812] p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-slate-400 text-[11px]">ขนาดแสดงผลในระบบ (Web)</div>
                <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">46 x 46 px</div>
                <div className="text-[10px] text-slate-500 mt-0.5">(38px ในมือถือ, 60px ในการ์ด)</div>
              </div>

              <div className="bg-[#060812] p-3 rounded-lg border border-violet-500/30 text-xs">
                <div className="text-slate-400 text-[11px]">ขนาดไฟล์ผลิตใหม่ (Standard)</div>
                <div className="font-mono text-violet-300 font-bold text-sm mt-0.5">512 x 512 px</div>
                <div className="text-[10px] text-slate-500 mt-0.5">สำหรับ Web Icon, App Icon, PWA</div>
              </div>

              <div className="bg-[#060812] p-3 rounded-lg border border-cyan-500/30 text-xs">
                <div className="text-slate-400 text-[11px]">ขนาดไฟล์ผลิตมาสเตอร์ (Hi-Res)</div>
                <div className="font-mono text-emerald-300 font-bold text-sm mt-0.5">1024 x 1024 px</div>
                <div className="text-[10px] text-slate-500 mt-0.5">300 DPI, Vector SVG / PNG</div>
              </div>
            </div>
          </div>

          {/* Section 2: Full Horizontal Logo Lockup */}
          <div className="bg-[#0b1020] p-5 rounded-xl border border-violet-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  2. โลโก้แนวนอนรวมข้อความ 3 บรรทัด (Horizontal Full Lockup)
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-mono">
                อัตราส่วน 5:1 หรือ 6:1
              </span>
            </div>

            <div className="bg-[#060914] p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-200">ลำดับการจัดวางตัวอักษร 3 บรรทัด (Strict Hierarchy):</div>
              <ul className="space-y-1.5 font-mono text-[11px]">
                <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-white font-black tracking-wider">บรรทัดที่ 1 (บนสุด - ขนาดใหญ่สุด): JAIKLA ACTIVE</span>
                  <span className="text-cyan-400 text-[10px]">Font Weight: 900 (Black)</span>
                </li>
                <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-violet-300 font-bold tracking-widest">บรรทัดที่ 2 (กลาง - ลดหลั่นลงมา): POSE DETECTION</span>
                  <span className="text-violet-400 text-[10px]">Font Weight: 700 (Bold)</span>
                </li>
                <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 font-medium tracking-widest">บรรทัดที่ 3 (ล่างสุด - เล็กที่สุด): MOVE BETTER · LIVE BETTER</span>
                  <span className="text-slate-400 text-[10px]">Font Weight: 500 (Medium)</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#060812] p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-slate-400 text-[11px]">ขนาดผลิตไฟล์ภาพแนวนอน (Web & Display)</div>
                <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">1500 x 300 px (5:1)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">PNG พื้นหลังโปร่งใส (Transparent Alpha)</div>
              </div>
              <div className="bg-[#060812] p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-slate-400 text-[11px]">ขนาดผลิตความละเอียดสูง (Retina & Print)</div>
                <div className="font-mono text-emerald-300 font-bold text-sm mt-0.5">1920 x 384 px หรือ 2500 x 500 px</div>
                <div className="text-[10px] text-slate-500 mt-0.5">300 DPI สำหรับพิมพ์เสื้อ, สติกเกอร์, หรือป้าย</div>
              </div>
            </div>
          </div>

          {/* Section 3: Official Color Palette & Hex Codes */}
          <div className="bg-[#0b1020] p-5 rounded-xl border border-violet-500/25 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                3. รหัสสีประจำระบบ JAIKLA ACTIVE (Official Color Palette)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { name: 'Neon Violet (สีหลัก)', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]', text: 'text-white' },
                { name: 'Ultraviolet Core', hex: '#7C3AED', bg: 'bg-[#7C3AED]', text: 'text-white' },
                { name: 'Cyber Cyan (เป้าเล็ง)', hex: '#00F0FF', bg: 'bg-[#00F0FF]', text: 'text-slate-950' },
                { name: 'Void Black (พื้นหลัง)', hex: '#06080F', bg: 'bg-[#06080F]', text: 'text-white border border-slate-700' },
              ].map((c) => (
                <div
                  key={c.hex}
                  onClick={() => copyToClipboard(c.hex, c.hex)}
                  className="bg-[#060812] p-2.5 rounded-lg border border-slate-800 hover:border-slate-600 cursor-pointer transition-all group"
                  title="คลิกเพื่อคัดลอกรหัสสี"
                >
                  <div className={`h-8 w-full rounded-md ${c.bg} flex items-center justify-center font-mono font-bold text-xs ${c.text}`}>
                    {copiedKey === c.hex ? 'COPIED!' : c.hex}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="truncate">{c.name}</span>
                    {copiedKey === c.hex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: File Format Recommendations */}
          <div className="bg-[#0b1020] p-4 rounded-xl border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">คำแนะนำสำหรับทีมออกแบบและฝ่ายผลิตกราฟิก:</span>
              <p className="leading-relaxed">
                ควรส่งมอบไฟล์ในรูปแบบ <strong className="text-cyan-300">Vector SVG</strong> เพื่อความคมชัดทุกขนาดหน้าจอ และไฟล์ <strong className="text-violet-300">PNG 32-bit Transparent</strong> ที่ตัดขอบเรียบร้อยโดยมีระยะ Safe Zone ขอบข้างละ 8% เพื่อไม่ให้เป้าตรวจจับชิดขอบจนเกินไป
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#060812] border-t border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            JAIKLA ACTIVE POSE DETECTION • MOVE BETTER · LIVE BETTER
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    </div>
  );
};
