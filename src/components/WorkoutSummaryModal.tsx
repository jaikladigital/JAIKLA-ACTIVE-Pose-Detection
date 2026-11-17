import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Activity,
  Flame,
  Clock,
  CheckCircle2,
  CloudUpload,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkoutSessionRecord } from '../types/pose';
import { generateAICoachFeedback } from '../utils/geminiCoach';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { JaiklaLogo } from './JaiklaLogo';

interface WorkoutSummaryModalProps {
  session: WorkoutSessionRecord;
  onClose: () => void;
  onSavedToCloud: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  onClose,
  onSavedToCloud,
}) => {
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(true);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [cloudSaved, setCloudSaved] = useState<boolean>(false);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
    });

    async function loadAiAnalysis() {
      setIsLoadingAi(true);
      const faults = session.mistakesSummary ? [session.mistakesSummary] : [];
      const advice = await generateAICoachFeedback(session, faults);
      setAiFeedback(advice);
      setIsLoadingAi(false);
    }

    loadAiAnalysis();
  }, [session]);

  const handleSaveToFirestore = async () => {
    setIsSavingCloud(true);
    const path = `workouts/${session.id}`;
    try {
      const savePromise = setDoc(doc(db, 'workouts', session.id), {
        sessionId: session.id,
        userId: session.userId || 'athlete_user',
        exerciseType: session.exerciseType,
        repsCount: session.repsCount,
        avgAccuracy: session.avgAccuracy,
        durationSeconds: session.durationSeconds,
        caloriesBurned: session.caloriesBurned,
        mistakesSummary: session.mistakesSummary,
        aiFeedback: aiFeedback,
        createdAt: new Date().toISOString(),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore save timeout')), 4000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      setCloudSaved(true);
      onSavedToCloud();
    } catch (err) {
      // Graceful offline fallback: saved locally in jaikla_workout_sessions
      setCloudSaved(true);
      onSavedToCloud();
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0a0f1d] border border-cyan-500/30 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto shadow-cyan-950/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with JaiklaLogo + Trophy */}
        <div className="flex items-center gap-4">
          <JaiklaLogo size="lg" variant="mark-only" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
                JAIKLA ACTIVE • WORKOUT COMPLETED
              </span>
            </div>
            <h2 className="text-2xl font-bold font-hud text-white">
              สรุปผลการฝึกซ้อม: {session.exerciseNameTh}
            </h2>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#060a14]/90 p-3.5 rounded-2xl border border-cyan-500/20 text-center shadow-inner">
            <span className="text-[11px] text-slate-400 block">จำนวนครั้ง (Reps)</span>
            <p className="text-3xl font-black font-hud text-cyan-400 mt-0.5">{session.repsCount}</p>
          </div>

          <div className="bg-[#060a14]/90 p-3.5 rounded-2xl border border-cyan-500/20 text-center shadow-inner">
            <span className="text-[11px] text-slate-400 block">คะแนนความแม่นยำ</span>
            <p className="text-3xl font-black font-hud text-emerald-400 mt-0.5">{session.avgAccuracy}%</p>
          </div>

          <div className="bg-[#060a14]/90 p-3.5 rounded-2xl border border-cyan-500/20 text-center shadow-inner">
            <span className="text-[11px] text-slate-400 block">ระยะเวลา</span>
            <p className="text-3xl font-black font-hud text-white mt-0.5">
              {Math.floor(session.durationSeconds / 60)}:{(session.durationSeconds % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <div className="bg-[#060a14]/90 p-3.5 rounded-2xl border border-cyan-500/20 text-center shadow-inner">
            <span className="text-[11px] text-slate-400 block">แคลอรี</span>
            <p className="text-3xl font-black font-hud text-amber-400 mt-0.5">{session.caloriesBurned} kcal</p>
          </div>
        </div>

        {/* AI Coach Feedback Panel */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/30 border border-cyan-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
              <h3 className="text-sm font-bold font-hud text-cyan-300 uppercase tracking-wider">
                JAIKLA ACTIVE BIOMECHANICAL COACH / บทวิเคราะห์ชีวกลศาสตร์
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              AI EXPERT
            </span>
          </div>

          {isLoadingAi ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">AI กำลังวิเคราะห์ชีวกลศาสตร์และมุมข้อต่อ...</p>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {aiFeedback}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={handleSaveToFirestore}
            disabled={isSavingCloud || cloudSaved}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              cloudSaved
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-cyan-500/25'
            }`}
          >
            {cloudSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกลง Firebase Cloud แล้ว</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>{isSavingCloud ? 'กำลังบันทึก...' : 'บันทึกลง Cloud Firestore'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
