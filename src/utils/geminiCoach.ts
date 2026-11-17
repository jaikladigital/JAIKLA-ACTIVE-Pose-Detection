import { GoogleGenAI } from '@google/genai';
import { WorkoutSessionRecord } from '../types/pose';

// Initialize Gemini SDK with runtime API key if available
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__ || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateAICoachFeedback(
  session: Partial<WorkoutSessionRecord>,
  angleFaults: string[]
): Promise<string> {
  // If API key is not configured or in offline mode, provide smart biomechanical advice
  if (!ai || !apiKey) {
    return generateFallbackFeedback(session, angleFaults);
  }

  try {
    const prompt = `
คุณคือ AI โค้ชผู้เชี่ยวชาญด้านเวชศาสตร์การกีฬาและชีวกลศาสตร์ (Biomechanics & Physical Therapy)
วิเคราะห์ผลการฝึกซ้อมของผู้ใช้งานและให้คำแนะนำแบบมืออาชีพเป็นภาษาไทย:

ข้อมูลการฝึกซ้อม:
- ท่าออกกำลังกาย: ${session.exerciseType}
- จำนวนครั้งที่ทำได้ (Reps): ${session.repsCount} ครั้ง
- ความแม่นยำเฉลี่ย (Accuracy): ${session.avgAccuracy}%
- ระยะเวลา: ${session.durationSeconds} วินาที
- ข้อผิดพลาดของมุมข้อต่อที่ตรวจพบ: ${angleFaults.join(', ') || 'ไม่มีข้อผิดพลาดสำคัญ ฟอร์มการเล่นยอดเยี่ยม'}

กรุณาให้คำตอบเป็นภาษาไทย โดยแบ่งเป็น 3 หัวข้อสั้นกระชับและตรงจุด:
1. 🎯 การประเมินฟอร์มโดยรวม (สรุปจุดแข็ง)
2. ⚠️ ชีวกลศาสตร์และจุดที่ควรปรับปรุง (เน้นองศาข้อต่อและการวางตำแหน่งกระดูกสันหลัง/เข่า/สะโพก)
3. 💡 ทริคสำหรับการฝึกในเซ็ตถัดไป (เช่น คิวการหายใจ, การโฟกัสกล้ามเนื้อ)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || generateFallbackFeedback(session, angleFaults);
  } catch (error) {
    console.warn('Gemini AI API unavailable, using local biomechanical engine:', error);
    return generateFallbackFeedback(session, angleFaults);
  }
}

function generateFallbackFeedback(
  session: Partial<WorkoutSessionRecord>,
  angleFaults: string[]
): string {
  const accuracy = session.avgAccuracy ?? 85;
  const ex = session.exerciseType ?? 'squat';

  if (accuracy >= 90) {
    return `🎯 การประเมินฟอร์ม: ยอดเยี่ยมมาก! ทำคะแนนฟอร์มได้สูงถึง ${accuracy}% รักษาแนวกระดูกสันหลังและการกระจายน้ำหนักได้สมดุล
💡 ชีวกลศาสตร์: มุมข้อต่อและระยะการเคลื่อนไหว (Range of Motion) อยู่ในเกณฑ์มาตรฐานสากล
🔥 คำแนะนำถัดไป: สามารถเพิ่มความหน่วงในจังหวะลง (Eccentric Phase 3 วินาที) เพื่อเพิ่มความแข็งแรงของเส้นใยกล้ามเนื้อได้อีกขั้น!`;
  }

  if (ex === 'squat') {
    return `🎯 การประเมินฟอร์ม: ฟอร์มอยู่ในเกณฑ์ดี (${accuracy}%) แต่ยังมีจุดที่ต้องคุมองศาในจังหวะก้นลงต่ำสุด
⚠️ ชีวกลศาสตร์: ${angleFaults.length > 0 ? angleFaults.join(' และ ') : 'ระวังอย่าให้หัวเข่างุ้มเข้าด้านในและดันสะโพกไปด้านหลังเพื่อลดแรงเฉือนที่สะบ้า'}
💡 ทริคถัดไป: ก่อนย่อตัวลง ให้จินตนาการว่ากำลังนั่งลงบนเก้าอี้ และเปิดปลายเท้าออกเฉียงประมาณ 15-20 องศาเพื่อเปิดมุมข้อต่อสะโพก`;
  }

  if (ex === 'pushup') {
    return `🎯 การประเมินฟอร์ม: คะแนนฟอร์ม ${accuracy}% กล้ามเนื้อแกนกลางและแขนทำงานได้ดี
⚠️ ชีวกลศาสตร์: ${angleFaults.length > 0 ? angleFaults.join(' และ ') : 'ระวังสะโพกตกหรือยกก้นสูงเกินไป ให้เกร็งหน้าท้องเป็นแผ่นตรง'}
💡 ทริคถัดไป: กางนิ้วมือให้กว้างและหมุนข้อศอกทำมุม 45 องศากับลำตัวเพื่อลดแรงกดบนข้อต่อหัวไหล่`;
  }

  return `🎯 การประเมินฟอร์ม: ทำผลงานได้ดีที่ ${accuracy}% ร่างกายเริ่มปรับตัวกับการเคลื่อนไหว
⚠️ ชีวกลศาสตร์: รักษาแนวกระดูกสันหลังให้เป็นธรรมชาติ ไม่เงยหน้าหรือก้มหน้ามากเกินไป
💡 ทริคถัดไป: ควบคุมจังหวะการหายใจ (หายใจเข้าตอนผ่อน หายใจออกตอนออกแรง)`;
}
