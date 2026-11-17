import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  Activity,
  Flame,
  Award,
  Calendar,
  Filter,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { WorkoutSessionRecord } from '../types/pose';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';

interface HistoryDashboardProps {
  localSessions: WorkoutSessionRecord[];
  onStartNewWorkout: () => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  localSessions,
  onStartNewWorkout,
}) => {
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>(localSessions);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);

  useEffect(() => {
    async function fetchCloudSessions() {
      setIsLoadingCloud(true);
      try {
        const q = query(collection(db, 'workouts'), limit(30));
        const fetchPromise = getDocs(q);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore connection timeout')), 3000)
        );
        const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
        const cloudData: WorkoutSessionRecord[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          cloudData.push({
            id: doc.id,
            userId: data.userId || '',
            exerciseType: data.exerciseType || 'squat',
            exerciseNameTh: data.exerciseType === 'squat' ? 'สควอช' : data.exerciseType === 'pushup' ? 'วิดพื้น' : data.exerciseType,
            repsCount: data.repsCount || 0,
            avgAccuracy: data.avgAccuracy || 0,
            durationSeconds: data.durationSeconds || 0,
            caloriesBurned: data.caloriesBurned || 0,
            mistakesSummary: data.mistakesSummary || '',
            aiFeedback: data.aiFeedback || '',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });

        // Merge with local sessions, removing duplicates
        const combined = [...localSessions];
        cloudData.forEach((c) => {
          if (!combined.some((item) => item.id === c.id)) {
            combined.push(c);
          }
        });
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSessions(combined);
      } catch (err) {
        // Fallback gracefully to local cached sessions immediately
        setSessions(localSessions);
      } finally {
        setIsLoadingCloud(false);
      }
    }

    fetchCloudSessions();
  }, [localSessions]);

  const filteredSessions = sessions.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.exerciseType === selectedFilter;
  });

  const totalReps = sessions.reduce((acc, s) => acc + s.repsCount, 0);
  const totalCalories = sessions.reduce((acc, s) => acc + s.caloriesBurned, 0);
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
  const avgAccuracy =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.avgAccuracy, 0) / sessions.length)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0f1d]/90 p-4 rounded-2xl border border-cyan-500/25 shadow-xl shadow-black/50">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold font-hud text-white uppercase tracking-wider">
              JAIKLA ACTIVE • WORKOUT ANALYTICS & CLOUD HISTORY (ประวัติการฝึกซ้อม)
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            วิเคราะห์พัฒนาการความแม่นยำของสรีระและประวัติการออกกำลังกายที่เชื่อมต่อกับ Firebase และ jaikla_workout_sessions
          </p>
        </div>

        <button
          onClick={onStartNewWorkout}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all self-start md:self-auto"
        >
          + เริ่มการฝึกซ้อมใหม่
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
            <Activity className="w-4 h-4" />
            <span>จำนวนครั้งรวม (Total Reps)</span>
          </div>
          <p className="text-3xl font-black font-hud text-white">{totalReps}</p>
          <span className="text-[11px] text-slate-400">จากทั้งหมด {sessions.length} เซ็ต</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
            <Award className="w-4 h-4" />
            <span>ความแม่นยำเฉลี่ย (Avg Form)</span>
          </div>
          <p className="text-3xl font-black font-hud text-emerald-400">{avgAccuracy}%</p>
          <span className="text-[11px] text-slate-400">ประเมินด้วย AI Pose Vision</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
            <Flame className="w-4 h-4" />
            <span>แคลอรีเผาผลาญ</span>
          </div>
          <p className="text-3xl font-black font-hud text-amber-300">{totalCalories} kcal</p>
          <span className="text-[11px] text-slate-400">ประมาณการพลังงาน</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
            <Calendar className="w-4 h-4" />
            <span>เวลารวมในการฝึก</span>
          </div>
          <p className="text-3xl font-black font-hud text-white">{totalMinutes} นาที</p>
          <span className="text-[11px] text-slate-400">บันทึกอัตโนมัติ</span>
        </div>
      </div>

      {/* Filter and Session List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">กรองตามท่าออกกำลังกาย:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'squat', 'pushup', 'lunge', 'jumping_jack', 'plank'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedFilter === f
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all'
                  ? 'ทั้งหมด'
                  : f === 'squat'
                  ? 'สควอช'
                  : f === 'pushup'
                  ? 'วิดพื้น'
                  : f === 'lunge'
                  ? 'ลันจ์'
                  : f === 'jumping_jack'
                  ? 'กระโดดตบ'
                  : 'แพลงก์'}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Cards */}
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Activity className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-400">ยังไม่พบประวัติการฝึกซ้อม</p>
            <p className="text-xs text-slate-500">เริ่มการฝึกซ้อมในแท็บ &ldquo;ตรวจจับสด&rdquo; เพื่อบันทึกประวัติ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 hover:border-cyan-800/60 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {session.exerciseNameTh || session.exerciseType}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(session.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">REPS</span>
                      <span className="text-lg font-bold font-hud text-cyan-300">{session.repsCount} ครั้ง</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">ACCURACY</span>
                      <span
                        className={`text-lg font-bold font-hud ${
                          session.avgAccuracy >= 85 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {session.avgAccuracy}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">BURNED</span>
                      <span className="text-lg font-bold font-hud text-amber-300">{session.caloriesBurned} kcal</span>
                    </div>
                  </div>
                </div>

                {/* AI Advice Snippet if present */}
                {session.aiFeedback && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed text-slate-300">{session.aiFeedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
