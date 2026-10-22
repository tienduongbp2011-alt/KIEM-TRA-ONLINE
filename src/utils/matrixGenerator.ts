import { Question, QuestionLevel } from '../types';

export interface MatrixConfig {
  subject: string;
  grade: 10 | 11 | 12;
  topic?: string;
  totalQuestions: number;
  ratios: {
    nhanBiet: number; // e.g. 40
    thongHieu: number; // e.g. 30
    vanDung: number; // e.g. 20
    vanDungCao: number; // e.g. 10
  };
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  examCode: string;
}

export interface MatrixGenerationResult {
  success: boolean;
  message: string;
  questions: Question[];
  breakdown: {
    nhanBietCount: number;
    thongHieuCount: number;
    vanDungCount: number;
    vanDungCaoCount: number;
  };
}

// Utility to shuffle array immutably
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateExamFromMatrix(
  questionBank: Question[],
  config: MatrixConfig
): MatrixGenerationResult {
  // 1. Filter bank by subject and grade (and topic if specified and not 'ALL')
  let pool = questionBank.filter(
    (q) =>
      q.subject === config.subject &&
      Number(q.grade) === Number(config.grade)
  );

  if (config.topic && config.topic !== 'ALL') {
    pool = pool.filter((q) => q.topic.includes(config.topic!) || (q.chapter && q.chapter.includes(config.topic!)));
  }

  if (pool.length === 0) {
    return {
      success: false,
      message: `Ngân hàng hiện chưa có câu hỏi nào thuộc môn ${config.subject} khối ${config.grade}. Vui lòng nhập thêm câu hỏi vào ngân hàng trước!`,
      questions: [],
      breakdown: { nhanBietCount: 0, thongHieuCount: 0, vanDungCount: 0, vanDungCaoCount: 0 },
    };
  }

  // Calculate target numbers
  const total = config.totalQuestions;
  const targetNB = Math.round((config.ratios.nhanBiet / 100) * total);
  const targetTH = Math.round((config.ratios.thongHieu / 100) * total);
  const targetVD = Math.round((config.ratios.vanDung / 100) * total);
  const targetVDC = Math.max(0, total - targetNB - targetTH - targetVD);

  const nbPool = pool.filter((q) => q.level === 'NHAN_BIET');
  const thPool = pool.filter((q) => q.level === 'THONG_HIEU');
  const vdPool = pool.filter((q) => q.level === 'VAN_DUNG');
  const vdcPool = pool.filter((q) => q.level === 'VAN_DUNG_CAO');

  // Pick questions with fallback to other pools if specific level runs short
  const pickFromPool = (arr: Question[], count: number): { picked: Question[]; remaining: Question[] } => {
    const shuffled = shuffleArray(arr);
    return {
      picked: shuffled.slice(0, count),
      remaining: shuffled.slice(count),
    };
  };

  const nbRes = pickFromPool(nbPool, targetNB);
  const thRes = pickFromPool(thPool, targetTH);
  const vdRes = pickFromPool(vdPool, targetVD);
  const vdcRes = pickFromPool(vdcPool, targetVDC);

  let selected = [...nbRes.picked, ...thRes.picked, ...vdRes.picked, ...vdcRes.picked];

  // If selected count is less than target, borrow from any leftover in pool
  if (selected.length < total) {
    const remainingPool = [
      ...nbRes.remaining,
      ...thRes.remaining,
      ...vdRes.remaining,
      ...vdcRes.remaining,
    ];
    const needed = total - selected.length;
    const additional = shuffleArray(remainingPool).slice(0, needed);
    selected = [...selected, ...additional];
  }

  // If still less, return what we have with notice
  let finalQuestions = selected.map((q) => ({ ...q }));

  // Apply option shuffle if requested
  if (config.shuffleOptions) {
    finalQuestions = finalQuestions.map((q) => {
      if (q.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0) {
        // Find correct text
        const correctOpt = q.options.find((o) => o.key === q.correctAnswer);
        const correctText = correctOpt ? correctOpt.content : '';

        // Shuffle options content
        const shuffledContents = shuffleArray(q.options.map((o) => o.content));
        const newKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        const newOptions = shuffledContents.slice(0, 4).map((content, idx) => ({
          key: newKeys[idx],
          content,
        }));

        const newCorrectKey = newOptions.find((o) => o.content === correctText)?.key || 'A';

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectKey,
        };
      }
      return q;
    });
  }

  // Shuffle order of questions if requested
  if (config.shuffleQuestions) {
    finalQuestions = shuffleArray(finalQuestions);
  } else {
    // Sort logically: Phần I -> Phần II -> Phần III, then level Nhận biết -> Thông hiểu -> Vận dụng -> Vận dụng cao
    const typeOrder = { MULTIPLE_CHOICE: 1, TRUE_FALSE: 2, SHORT_ANSWER: 3 };
    const levelOrder = { NHAN_BIET: 1, THONG_HIEU: 2, VAN_DUNG: 3, VAN_DUNG_CAO: 4 };

    finalQuestions.sort((a, b) => {
      const typeDiff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      if (typeDiff !== 0) return typeDiff;
      return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0);
    });
  }

  const breakdown = {
    nhanBietCount: finalQuestions.filter((q) => q.level === 'NHAN_BIET').length,
    thongHieuCount: finalQuestions.filter((q) => q.level === 'THONG_HIEU').length,
    vanDungCount: finalQuestions.filter((q) => q.level === 'VAN_DUNG').length,
    vanDungCaoCount: finalQuestions.filter((q) => q.level === 'VAN_DUNG_CAO').length,
  };

  const isShort = finalQuestions.length < total;
  const message = isShort
    ? `Đã tạo đề với ${finalQuestions.length}/${total} câu (ngân hàng không đủ câu hỏi theo ma trận, hệ thống lấy tối đa số câu khả dụng).`
    : `Đã tạo đề kiểm tra thành công với đúng ${finalQuestions.length} câu theo ma trận đặc tả!`;

  return {
    success: true,
    message,
    questions: finalQuestions,
    breakdown,
  };
}
