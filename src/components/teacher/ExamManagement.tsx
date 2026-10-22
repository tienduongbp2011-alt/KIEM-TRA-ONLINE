import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, ExamStatus } from '../../types';
import { generateExamFromMatrix, MatrixConfig } from '../../utils/matrixGenerator';
import {
  PlusCircle,
  Wand2,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit3,
  Play,
  Pause,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
  Shuffle,
  X,
  Sparkles,
} from 'lucide-react';

interface ExamManagementProps {
  onViewResults: (examId: string) => void;
}

export const ExamManagement: React.FC<ExamManagementProps> = ({ onViewResults }) => {
  const {
    exams,
    classes,
    questions,
    subjects: appSubjects,
    currentUser,
    createExam,
    updateExam,
    deleteExam,
    duplicateExam,
    toggleExamStatus,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState(
    currentUser?.subject || 'ALL'
  );
  const [filterGrade, setFilterGrade] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form State for Manual / General Exam Editing
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState(
    currentUser?.subject || appSubjects[0]?.name || 'Toán'
  );
  const [formGrade, setFormGrade] = useState<10 | 11 | 12>(12);
  const [formClasses, setFormClasses] = useState<string[]>(['12A1']);
  const [formDuration, setFormDuration] = useState(45);
  const [formStartTime, setFormStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [formEndTime, setFormEndTime] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [formMaxAttempts, setFormMaxAttempts] = useState(1);
  const [formShowAnswers, setFormShowAnswers] = useState(true);
  const [formShuffleQuestions, setFormShuffleQuestions] = useState(false);
  const [formShuffleOptions, setFormShuffleOptions] = useState(false);
  const [formStatus, setFormStatus] = useState<ExamStatus>('OPEN');
  const [formExamCode, setFormExamCode] = useState('DE-101');
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([]);

  // Matrix Generator Form State as required
  const [matrixSubject, setMatrixSubject] = useState(
    currentUser?.subject || appSubjects[0]?.name || 'Toán'
  );
  const [matrixGrade, setMatrixGrade] = useState<10 | 11 | 12>(12);
  const [matrixTopic, setMatrixTopic] = useState('ALL');
  const [matrixTotalQuestions, setMatrixTotalQuestions] = useState(10);
  const [ratioNB, setRatioNB] = useState(40);
  const [ratioTH, setRatioTH] = useState(30);
  const [ratioVD, setRatioVD] = useState(20);
  const [ratioVDC, setRatioVDC] = useState(10);
  const [matrixShuffleQ, setMatrixShuffleQ] = useState(true);
  const [matrixShuffleOpt, setMatrixShuffleOpt] = useState(true);
  const [matrixCode, setMatrixCode] = useState('101');
  const [matrixTargetClasses, setMatrixTargetClasses] = useState<string[]>(['12A1']);
  const [matrixExamTitle, setMatrixExamTitle] = useState('Bài kiểm tra định kỳ');
  const [matrixDuration, setMatrixDuration] = useState(45);
  const [matrixFeedback, setMatrixFeedback] = useState<{ message: string; success: boolean } | null>(
    null
  );

  // Filter exams
  const filteredExams = exams.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.examCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = filterSubject === 'ALL' || e.subject === filterSubject;
    const matchGrade = filterGrade === 'ALL' || String(e.grade) === filterGrade;
    return matchSearch && matchSubject && matchGrade;
  });

  const availableSubjectNames = Array.from(
    new Set([...appSubjects.map((s) => s.name), ...exams.map((e) => e.subject)])
  );

  // Handlers for manual form
  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormSubject(exam.subject);
    setFormGrade(exam.grade);
    setFormClasses(exam.classIds);
    setFormDuration(exam.durationMinutes);
    setFormStartTime(exam.startTime?.slice(0, 16) || '');
    setFormEndTime(exam.endTime?.slice(0, 16) || '');
    setFormMaxAttempts(exam.maxAttempts);
    setFormShowAnswers(exam.showAnswersAfterSubmit);
    setFormShuffleQuestions(exam.shuffleQuestions);
    setFormShuffleOptions(exam.shuffleOptions);
    setFormStatus(exam.status);
    setFormExamCode(exam.examCode);
    setFormQuestionIds(exam.questionIds);
    setShowCreateModal(true);
  };

  const handleOpenCreateNew = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormSubject('Toán');
    setFormGrade(12);
    setFormClasses(['12A1']);
    setFormDuration(45);
    setFormStartTime(new Date().toISOString().slice(0, 16));
    setFormEndTime(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16));
    setFormMaxAttempts(1);
    setFormShowAnswers(true);
    setFormShuffleQuestions(false);
    setFormShuffleOptions(false);
    setFormStatus('OPEN');
    setFormExamCode(`DE-${Math.floor(100 + Math.random() * 900)}`);
    setFormQuestionIds([]);
    setShowCreateModal(true);
  };

  const handleSaveManualExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra');
      return;
    }

    const availableQ = questions.filter(
      (q) => formQuestionIds.includes(q.id) || (q.subject === formSubject && q.grade === formGrade)
    );
    const chosenQ = formQuestionIds.length > 0
      ? questions.filter((q) => formQuestionIds.includes(q.id))
      : availableQ.slice(0, 10);

    const examData = {
      title: formTitle.trim(),
      subject: formSubject,
      grade: formGrade,
      classIds: formClasses,
      durationMinutes: formDuration,
      startTime: formStartTime,
      endTime: formEndTime,
      questionIds: chosenQ.map((q) => q.id),
      questions: chosenQ,
      totalPoints: 10,
      maxAttempts: formMaxAttempts,
      showAnswersAfterSubmit: formShowAnswers,
      shuffleQuestions: formShuffleQuestions,
      shuffleOptions: formShuffleOptions,
      status: formStatus,
      examCode: formExamCode.trim(),
    };

    if (editingExam) {
      updateExam(editingExam.id, examData);
    } else {
      createExam(examData);
    }

    setShowCreateModal(false);
    setEditingExam(null);
  };

  // Matrix generation execution
  const handleExecuteMatrixGeneration = () => {
    const config: MatrixConfig = {
      subject: matrixSubject,
      grade: matrixGrade,
      topic: matrixTopic,
      totalQuestions: matrixTotalQuestions,
      ratios: {
        nhanBiet: ratioNB,
        thongHieu: ratioTH,
        vanDung: ratioVD,
        vanDungCao: ratioVDC,
      },
      shuffleQuestions: matrixShuffleQ,
      shuffleOptions: matrixShuffleOpt,
      examCode: matrixCode,
    };

    const res = generateExamFromMatrix(questions, config);

    if (!res.success) {
      setMatrixFeedback({ message: res.message, success: false });
      return;
    }

    // Save as new exam
    createExam({
      title: matrixExamTitle || `Đề kiểm tra ${matrixSubject} ${matrixGrade} - Mã ${matrixCode}`,
      subject: matrixSubject,
      grade: matrixGrade,
      classIds: matrixTargetClasses,
      durationMinutes: matrixDuration,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      questionIds: res.questions.map((q) => q.id),
      questions: res.questions,
      totalPoints: 10,
      maxAttempts: 1,
      showAnswersAfterSubmit: true,
      shuffleQuestions: matrixShuffleQ,
      shuffleOptions: matrixShuffleOpt,
      status: 'OPEN',
      examCode: matrixCode,
    });

    setMatrixFeedback({
      message: `${res.message} (Nhận biết: ${res.breakdown.nhanBietCount}, Thông hiểu: ${res.breakdown.thongHieuCount}, Vận dụng: ${res.breakdown.vanDungCount}, Vận dụng cao: ${res.breakdown.vanDungCaoCount})`,
      success: true,
    });

    setTimeout(() => {
      setShowMatrixModal(false);
      setMatrixFeedback(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            QUẢN LÝ BÀI KIỂM TRA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo đề thi theo ma trận đặc tả, phân bổ câu hỏi, giao lớp và kiểm soát thời gian thi
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setMatrixFeedback(null);
              setShowMatrixModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>TẠO ĐỀ THEO MA TRẬN ĐẶC TẢ</span>
          </button>
          <button
            onClick={handleOpenCreateNew}
            className="py-2.5 px-4 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>TẠO BÀI KIỂM TRA MỚI</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bài thi, mã đề..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0D47A1] focus:border-[#0D47A1]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Môn:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-700"
            >
              <option value="ALL">Tất cả môn</option>
              {availableSubjectNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
            <span>Khối:</span>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-700"
            >
              <option value="ALL">Tất cả</option>
              <option value="12">Khối 12</option>
              <option value="11">Khối 11</option>
              <option value="10">Khối 10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tên bài kiểm tra</th>
                <th className="py-3.5 px-3">Môn & Khối</th>
                <th className="py-3.5 px-3">Lớp được giao</th>
                <th className="py-3.5 px-3 text-center">Thời gian</th>
                <th className="py-3.5 px-3 text-center">Số câu</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExams.map((exam) => {
                const questionCount = exam.questions?.length || exam.questionIds.length;
                const isOpened = exam.status === 'OPEN';

                return (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800">{exam.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mã đề: <span className="font-mono text-slate-600 font-bold">{exam.examCode}</span>
                        {exam.shuffleQuestions && ' • Trộn câu'}
                        {exam.shuffleOptions && ' • Trộn phương án'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0D47A1] font-bold text-xs">
                        {exam.subject} - K{exam.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {exam.classIds.join(', ')}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {exam.durationMinutes} phút
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {questionCount} câu
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isOpened
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isOpened ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Toggle Open/Closed as required */}
                        <button
                          onClick={() => toggleExamStatus(exam.id)}
                          title={isOpened ? 'Đóng bài kiểm tra' : 'Mở bài kiểm tra'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                            isOpened
                              ? 'text-amber-700 hover:bg-amber-100'
                              : 'text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isOpened ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        {/* View Results as required */}
                        <button
                          onClick={() => onViewResults(exam.id)}
                          title="Xem kết quả học sinh"
                          className="p-1.5 rounded-lg text-[#0D47A1] hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit as required */}
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          title="Chỉnh sửa bài kiểm tra"
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate as required */}
                        <button
                          onClick={() => duplicateExam(exam.id)}
                          title="Sao chép đề kiểm tra"
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete as required */}
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa bài "${exam.title}"?`)) {
                              deleteExam(exam.id);
                            }
                          }}
                          title="Xóa đề kiểm tra"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TẠO ĐỀ TỰ ĐỘNG THEO MA TRẬN ĐẶC TẢ               */}
      {/* ========================================================= */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF8A00] flex items-center justify-center">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    TẠO ĐỀ TỰ ĐỘNG THEO MA TRẬN ĐẶC TẢ
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tự động bốc câu hỏi từ ngân hàng câu hỏi theo tỷ lệ chuẩn GDPT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {matrixFeedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-start space-x-2 ${
                  matrixFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {matrixFeedback.success ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{matrixFeedback.message}</span>
              </div>
            )}

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài kiểm tra</label>
                <input
                  type="text"
                  value={matrixExamTitle}
                  onChange={(e) => setMatrixExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D47A1] font-bold text-slate-800"
                />
              </div>

              {/* Môn & Khối */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={matrixSubject}
                    onChange={(e) => setMatrixSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D47A1] font-medium"
                  >
                    {availableSubjectNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={matrixGrade}
                    onChange={(e) => setMatrixGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0D47A1] font-medium"
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>
              </div>

              {/* Lớp & Thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chọn lớp giao bài</label>
                  <select
                    multiple
                    value={matrixTargetClasses}
                    onChange={(e) =>
                      setMatrixTargetClasses(
                        Array.from(e.target.selectedOptions, (option) => option.value)
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium h-24"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Lớp {cls.name} (Khối {cls.grade})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    * Giữ Ctrl/Cmd để chọn nhiều lớp
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số câu hỏi đề thi</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={matrixTotalQuestions}
                      onChange={(e) => setMatrixTotalQuestions(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thời gian (phút)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={matrixDuration}
                      onChange={(e) => setMatrixDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* CƠ CẤU MA TRẬN 4 MỨC ĐỘ as requested:
                  Nhận biết: 40%
                  Thông hiểu: 30%
                  Vận dụng: 20%
                  Vận dụng cao: 10%
              */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                    Cơ cấu Ma trận Đặc tả 4 mức độ:
                  </span>
                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded ${
                      ratioNB + ratioTH + ratioVD + ratioVDC === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Tổng: {ratioNB + ratioTH + ratioVD + ratioVDC}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-blue-700 block mb-1">Nhận biết</span>
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        value={ratioNB}
                        onChange={(e) => setRatioNB(Number(e.target.value))}
                        className="w-14 text-center font-black border border-slate-300 rounded p-1"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-emerald-700 block mb-1">Thông hiểu</span>
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        value={ratioTH}
                        onChange={(e) => setRatioTH(Number(e.target.value))}
                        className="w-14 text-center font-black border border-slate-300 rounded p-1"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-amber-700 block mb-1">Vận dụng</span>
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        value={ratioVD}
                        onChange={(e) => setRatioVD(Number(e.target.value))}
                        className="w-14 text-center font-black border border-slate-300 rounded p-1"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-rose-700 block mb-1">Vận dụng cao</span>
                    <div className="flex items-center justify-center space-x-1">
                      <input
                        type="number"
                        value={ratioVDC}
                        onChange={(e) => setRatioVDC(Number(e.target.value))}
                        className="w-14 text-center font-black border border-slate-300 rounded p-1"
                      />
                      <span className="font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shuffling and Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đề thi</label>
                  <input
                    type="text"
                    value={matrixCode}
                    onChange={(e) => setMatrixCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center space-x-6 pt-5">
                  <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={matrixShuffleQ}
                      onChange={(e) => setMatrixShuffleQ(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0D47A1]"
                    />
                    <span>Trộn thứ tự câu hỏi</span>
                  </label>

                  <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={matrixShuffleOpt}
                      onChange={(e) => setMatrixShuffleOpt(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0D47A1]"
                    />
                    <span>Trộn phương án (A,B,C,D)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteMatrixGeneration}
                className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                <span>TẠO ĐỀ TỰ ĐỘNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TẠO HOẶC CHỈNH SỬA THÔNG SỐ ĐỀ THI               */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h2 className="text-lg font-black text-slate-800">
                {editingExam ? 'CHỈNH SỬA BÀI KIỂM TRA' : 'CÀI ĐẶT BÀI KIỂM TRA MỚI'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualExam} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài kiểm tra</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 1 tiết Đại số 12 Chương 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    {availableSubjectNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as 10 | 11 | 12)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp được phép làm bài</label>
                  <select
                    multiple
                    value={formClasses}
                    onChange={(e) =>
                      setFormClasses(Array.from(e.target.selectedOptions, (o) => o.value))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium h-24"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Lớp {cls.name} (Khối {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thời gian làm bài (phút)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={180}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số lần được làm bài</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formMaxAttempts}
                      onChange={(e) => setFormMaxAttempts(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày giờ bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày giờ kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Checkboxes for options as requested */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowAnswers}
                    onChange={(e) => setFormShowAnswers(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Cho phép học sinh xem đáp án và lời giải sau khi nộp</span>
                </label>

                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleQuestions}
                    onChange={(e) => setFormShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Xáo trộn thứ tự các câu hỏi</span>
                </label>

                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShuffleOptions}
                    onChange={(e) => setFormShuffleOptions(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0D47A1]"
                  />
                  <span>Xáo trộn thứ tự các phương án lựa chọn (A, B, C, D)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã đề</label>
                  <input
                    type="text"
                    value={formExamCode}
                    onChange={(e) => setFormExamCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái mở bài</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExamStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="OPEN">Mở cho học sinh làm (OPEN)</option>
                    <option value="CLOSED">Đóng đề thi (CLOSED)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-extrabold shadow-md transition-all cursor-pointer"
                >
                  Lưu bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
