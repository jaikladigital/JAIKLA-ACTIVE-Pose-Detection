/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { SportsFittingView } from './components/SportsFittingView';
import { PoseCameraView } from './components/PoseCameraView';
import { StretchingView } from './components/StretchingView';
import { ComparisonViewer } from './components/ComparisonViewer';
import { HistoryDashboard } from './components/HistoryDashboard';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';
import { CalibrationModal } from './components/CalibrationModal';
import { CalibrationData, WorkoutSessionRecord, MotionClipRecord } from './types/pose';
import { getAllLocalMotionClips } from './utils/videoRecorder';
import { setGlobalAudioMuted, soundFx } from './utils/poseGeometry';

export default function App() {
  // Sports Fitting is Tab #1 by default as requested: "นำฟังก์ชั่นวิเคราะห์การเล่นกีฬามาไว้เป็นอันดับ 1 ของเมนู"
  const [activeTab, setActiveTab] = useState<NavTab>('sports_fitting');

  // Master Audio Mute State - Default: true (MUTED / ปิดเสียง) as requested by user
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);

  // Enforce muted audio on application initial boot
  useEffect(() => {
    setGlobalAudioMuted(true);
  }, []);

  const handleToggleAudio = (targetState?: boolean) => {
    setIsAudioMuted((prev) => {
      const next = targetState !== undefined ? targetState : !prev;
      setGlobalAudioMuted(next);
      if (!next) {
        // Unmuted: unlock audio context with gentle confirmation chime
        soundFx.playCalibrationBeep(659.25);
      }
      return next;
    });
  };

  // Camera devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // T-Pose Calibration Data
  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrated: false,
    tPoseProgress: 0,
    armSpanPx: 0,
    torsoHeightPx: 0,
    bodyHeightPx: 0,
    shoulderWidthPx: 0,
    baselineCenter: { x: 0.5, y: 0.3 },
  });

  // Modal states
  const [isCalibratingModal, setIsCalibratingModal] = useState<boolean>(false);
  const [isCalibrationGuideOpen, setIsCalibrationGuideOpen] = useState<boolean>(false);
  const [completedSession, setCompletedSession] = useState<WorkoutSessionRecord | null>(null);

  // History & Motion Clips State
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionRecord[]>([]);
  const [savedClips, setSavedClips] = useState<MotionClipRecord[]>([]);

  // Enumerate video input devices
  useEffect(() => {
    async function getDevices() {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
          if (videoInputs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        } catch (e) {
          console.warn('Could not enumerate media devices:', e);
        }
      }
    }
    getDevices();
  }, [selectedDeviceId]);

  // Load existing clips and sessions from storage
  useEffect(() => {
    async function loadInitial() {
      try {
        const clips = await getAllLocalMotionClips();
        setSavedClips(clips || []);
      } catch (err) {
        console.warn('Could not load local motion clips:', err);
        setSavedClips([]);
      }

      // Load sessions from local storage cache
      try {
        const cached = localStorage.getItem('jaikla_workout_sessions');
        if (cached) {
          setWorkoutSessions(JSON.parse(cached));
        } else {
          // Provide an initial sample workout session for immediate analytics display
          const sample: WorkoutSessionRecord = {
            id: 'sample_squat_01',
            userId: 'athlete_demo',
            exerciseType: 'squat',
            exerciseNameTh: 'สควอช (Squat)',
            repsCount: 15,
            avgAccuracy: 92,
            durationSeconds: 145,
            caloriesBurned: 35,
            mistakesSummary: 'ฟอร์มการย่อเข่า 90° สมบูรณ์แบบ',
            aiFeedback: '🎯 การประเมินฟอร์ม: ยอดเยี่ยมมาก! รักษาแนวกระดูกสันหลังและการกระจายน้ำหนักได้สมดุล',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          };
          setWorkoutSessions([sample]);
        }
      } catch (e) {
        console.warn('Local storage error:', e);
      }
    }
    loadInitial();
  }, []);

  const handleFinishWorkout = (session: WorkoutSessionRecord) => {
    setCompletedSession(session);
    setWorkoutSessions((prev) => {
      const updated = [session, ...prev];
      try {
        localStorage.setItem('jaikla_workout_sessions', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClipSaved = (clip: MotionClipRecord) => {
    setSavedClips((prev) => [clip, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#06080f] bg-ambient-jaikla text-slate-100 jaikla-grid flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Futuristic Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calibration={calibration}
        onOpenCalibration={() => setIsCalibrationGuideOpen(true)}
        videoDevices={videoDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* RANK #1: Sports Motion Analysis & Biomechanical Fitting (กอล์ฟ, วิ่ง, ปั่นจักรยาน) */}
        {activeTab === 'sports_fitting' && (
          <SportsFittingView
            selectedDeviceId={selectedDeviceId}
            calibration={calibration}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
            onSwitchToFitness={() => setActiveTab('live')}
          />
        )}

        {/* Fitness & Bodyweight Live HUD */}
        {activeTab === 'live' && (
          <PoseCameraView
            selectedDeviceId={selectedDeviceId}
            calibration={calibration}
            setCalibration={setCalibration}
            onFinishWorkout={handleFinishWorkout}
            onClipSaved={handleClipSaved}
            isCalibratingModal={isCalibratingModal}
            setIsCalibratingModal={setIsCalibratingModal}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
          />
        )}

        {/* Dedicated Head-to-Ankles Anatomical Stretching Section */}
        {activeTab === 'stretching' && (
          <StretchingView
            onBackToWorkout={() => setActiveTab('live')}
            selectedDeviceId={selectedDeviceId}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
          />
        )}

        {activeTab === 'compare' && (
          <ComparisonViewer onBackToLive={() => setActiveTab('live')} />
        )}

        {activeTab === 'history' && (
          <HistoryDashboard
            localSessions={workoutSessions}
            onStartNewWorkout={() => setActiveTab('live')}
          />
        )}
      </main>

      {/* T-Pose Calibration Guide Modal */}
      <CalibrationModal
        isOpen={isCalibrationGuideOpen}
        onClose={() => setIsCalibrationGuideOpen(false)}
        calibration={calibration}
        onStartCalibration={() => {
          setActiveTab('live');
          setIsCalibratingModal(true);
        }}
      />

      {/* Completed Workout Summary & AI Coach Modal */}
      {completedSession && (
        <WorkoutSummaryModal
          session={completedSession}
          onClose={() => setCompletedSession(null)}
          onSavedToCloud={() => {
            // Updated in state
          }}
        />
      )}
    </div>
  );
}
