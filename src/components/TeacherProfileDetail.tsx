/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Teacher, KPICategory, KPIMetric, EvaluationItem } from "../types";
import { 
  ArrowLeft, 
  Sparkles, 
  History, 
  Calendar, 
  User, 
  TrendingUp, 
  Info, 
  Edit3, 
  Save, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Plus,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

interface TeacherProfileDetailProps {
  teacher: Teacher;
  onBack: () => void;
  onUpdateTeacherKPIs: (teacherId: string, updatedKpis: KPICategory[]) => Promise<void>;
  onTriggerAIEvaluation: (teacherId: string, evaluatorName: string) => Promise<EvaluationItem>;
  onUpdateTeacherDetails?: (teacherId: string, updatedFields: Partial<Teacher>) => Promise<void>;
  onDeleteTeacher?: (teacherId: string) => Promise<void>;
  isAdmin?: boolean;
  isLeader?: boolean;
  leaderInfo?: { id: string; name: string; department: string; groupRole: string } | null;
  departments?: string[];
}

export default function TeacherProfileDetail({ 
  teacher, 
  onBack, 
  onUpdateTeacherKPIs, 
  onTriggerAIEvaluation,
  onUpdateTeacherDetails,
  onDeleteTeacher,
  isAdmin = false,
  isLeader = false,
  leaderInfo = null,
  departments = ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn"]
}: TeacherProfileDetailProps) {
  const [localKpis, setLocalKpis] = useState<KPICategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [evaluatorName, setEvaluatorName] = useState("Hiệu trưởng Lê Thị Thanh");
  
  // AI States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [currentEvalItem, setCurrentEvalItem] = useState<EvaluationItem | null>(null);

  // Transfer state
  const [transferDept, setTransferDept] = useState(teacher.department);
  const [transferSubject, setTransferSubject] = useState(teacher.subject);
  const [transferRole, setTransferRole] = useState(teacher.groupRole || "Thành viên");
  const [transferTeachingRole, setTransferTeachingRole] = useState<"Giáo viên chủ nhiệm" | "Giáo viên bộ môn">(teacher.teachingRole || "Giáo viên chủ nhiệm");
  const [transferAssignedClass, setTransferAssignedClass] = useState(teacher.assignedClass || "");
  const [transferPassword, setTransferPassword] = useState(teacher.password || "123456");
  const [showTransferPassword, setShowTransferPassword] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Period management states
  const [customPeriod, setCustomPeriod] = useState("");
  const [showCustomPeriodInput, setShowCustomPeriodInput] = useState(false);
  const [isChangingPeriod, setIsChangingPeriod] = useState(false);

  const canEdit = isAdmin || (isLeader && teacher.department === leaderInfo?.department);

  // Derive period list dynamically from teacher's active academic year (e.g. 2026-2027 -> September 2026 to June 2027)
  const periodsList = React.useMemo(() => {
    let year1 = 2025;
    let year2 = 2026;

    // Parse academic year like "2026-2027"
    const match = teacher.academicYear?.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      year1 = parseInt(match[1]);
      year2 = parseInt(match[2]);
    } else {
      const singleYearMatch = teacher.academicYear?.match(/\d{4}/);
      if (singleYearMatch) {
        year1 = parseInt(singleYearMatch[0]);
        year2 = year1 + 1;
      }
    }

    // Default months from June of second year back to September of first year
    const defaults = [
      `Tháng 06/${year2}`,
      `Tháng 05/${year2}`,
      `Tháng 04/${year2}`,
      `Tháng 03/${year2}`,
      `Tháng 02/${year2}`,
      `Tháng 01/${year2}`,
      `Tháng 12/${year1}`,
      `Tháng 11/${year1}`,
      `Tháng 10/${year1}`,
      `Tháng 09/${year1}`
    ];

    // Determine the active/currently viewed month name to generate corresponding weekly options
    const activeMonthMatch = teacher.kpiPeriod?.match(/Tháng \d{2}\/\d{4}/);
    const activeMonthStr = activeMonthMatch ? activeMonthMatch[0] : `Tháng 06/${year2}`;

    // Add 4 weeks corresponding to the active month
    const weeklyOptions = [
      `Tuần 1 - ${activeMonthStr}`,
      `Tuần 2 - ${activeMonthStr}`,
      `Tuần 3 - ${activeMonthStr}`,
      `Tuần 4 - ${activeMonthStr}`
    ];

    const set = new Set([...weeklyOptions, ...defaults]);
    if (teacher.kpiPeriod) set.add(teacher.kpiPeriod);
    if (teacher.periodKPIs) {
      Object.keys(teacher.periodKPIs).forEach(p => set.add(p));
    }
    if (teacher.evaluations) {
      teacher.evaluations.forEach(e => {
        if (e.period) set.add(e.period);
      });
    }

    return Array.from(set);
  }, [teacher.kpiPeriod, teacher.periodKPIs, teacher.evaluations, teacher.academicYear]);

  const DEPARTMENTS = departments;
  const SUBJECTS_FOR_DEPT: Record<string, string[]> = {
    "Tổ Khối 1": ["Chủ nhiệm (Khối 1)", "Chủ nhiệm"],
    "Tổ Khối 2": ["Chủ nhiệm (Khối 2)", "Chủ nhiệm"],
    "Tổ Khối 3": ["Chủ nhiệm (Khối 3)", "Chủ nhiệm"],
    "Tổ Khối 4": ["Chủ nhiệm (Khối 4)", "Chủ nhiệm"],
    "Tổ Khối 5": ["Chủ nhiệm (Khối 5)", "Chủ nhiệm"],
    "Tổ Bộ môn": ["Tiếng Anh", "Âm nhạc", "Mỹ thuật", "Giáo dục thể chất", "Tin học tiểu học", "Hoạt động trải nghiệm"]
  };

  // Sync state with prop
  useEffect(() => {
    if (teacher) {
      setLocalKpis(JSON.parse(JSON.stringify(teacher.kpis)));
      setCurrentEvalItem(null);
      setTransferDept(teacher.department);
      setTransferSubject(teacher.subject);
      setTransferRole(teacher.groupRole || "Thành viên");
      setTransferTeachingRole(teacher.teachingRole || "Giáo viên chủ nhiệm");
      setTransferAssignedClass(teacher.assignedClass || "");
      setTransferPassword(teacher.password || "123456");

      // Auto-populate evaluator name if logged in as Leader
      if (isLeader && leaderInfo) {
        setEvaluatorName(`${leaderInfo.groupRole} ${leaderInfo.name}`);
      } else {
        setEvaluatorName("Hiệu trưởng Lê Thị Thanh");
      }
    }
  }, [teacher, isLeader, leaderInfo]);

  const handlePeriodChange = async (newPeriod: string) => {
    setIsChangingPeriod(true);
    try {
      if (onUpdateTeacherDetails) {
        await onUpdateTeacherDetails(teacher.id, { kpiPeriod: newPeriod });
      }
    } catch (err) {
      alert("Lỗi khi chuyển đổi kỳ đánh giá.");
    } finally {
      setIsChangingPeriod(false);
    }
  };

  const handleAddCustomPeriod = async () => {
    if (!customPeriod.trim()) return;
    const cleanPeriod = customPeriod.trim();
    setIsChangingPeriod(true);
    try {
      if (onUpdateTeacherDetails) {
        await onUpdateTeacherDetails(teacher.id, { kpiPeriod: cleanPeriod });
        setCustomPeriod("");
        setShowCustomPeriodInput(false);
      }
    } catch (err) {
      alert("Lỗi khi thêm kỳ đánh giá mới.");
    } finally {
      setIsChangingPeriod(false);
    }
  };

  const handleTransferDeptChange = (dept: string) => {
    setTransferDept(dept);
    const subs = SUBJECTS_FOR_DEPT[dept];
    if (subs && subs.length > 0) {
      setTransferSubject(subs[0]);
    }
    if (dept === "Tổ Bộ môn") {
      setTransferTeachingRole("Giáo viên bộ môn");
    } else {
      setTransferTeachingRole("Giáo viên chủ nhiệm");
    }
  };

  const handleTransferSubmit = async () => {
    setIsTransferring(true);
    try {
      if (onUpdateTeacherDetails) {
        await onUpdateTeacherDetails(teacher.id, {
          department: transferDept,
          subject: transferSubject,
          groupRole: transferRole,
          teachingRole: transferTeachingRole,
          assignedClass: transferAssignedClass.trim() || "Chưa phân lớp",
          password: transferPassword
        });
        setTransferSuccess(true);
        setTimeout(() => setTransferSuccess(false), 3000);
      }
    } catch (err) {
      alert("Lỗi khi luân chuyển tổ chuyên môn hoặc cập nhật chức vụ.");
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle KPI range slider change
  const handleMetricChange = (catId: string, metricId: string, newValue: number) => {
    setLocalKpis(prevKpis => {
      const updated = prevKpis.map(cat => {
        if (cat.id === catId) {
          const updatedMetrics = cat.metrics.map(m => {
            if (m.id === metricId) {
              return { ...m, actual: newValue };
            }
            return m;
          });
          return { ...cat, metrics: updatedMetrics };
        }
        return cat;
      });
      return updated;
    });
  };

  // Recalculate intermediate overall score just for live preview
  const liveOverallScore = React.useMemo(() => {
    if (localKpis.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;

    localKpis.forEach(cat => {
      let catSum = 0;
      cat.metrics.forEach(m => {
        catSum += (m.actual * (m.weight / 100));
      });
      totalScore += (catSum * (cat.weight / 100));
      totalWeight += (cat.weight / 100);
    });

    return parseFloat((totalScore / (totalWeight || 1)).toFixed(1));
  }, [localKpis]);

  const liveStatus = React.useMemo(() => {
    if (liveOverallScore >= 90) return "Xuất sắc";
    if (liveOverallScore >= 80) return "Khá";
    if (liveOverallScore >= 65) return "Trung bình";
    return "Yếu";
  }, [liveOverallScore]);

  // Save modified raw metrics
  const handleSaveKPIs = async () => {
    setIsSaving(true);
    try {
      await onUpdateTeacherKPIs(teacher.id, localKpis);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert("Đã xảy ra lỗi khi lưu chỉ số KPI.");
    } finally {
      setIsSaving(false);
    }
  };

  // Run Server-side Gemini AI review
  const handleTriggerAI = async () => {
    setIsEvaluating(true);
    
    // Series of fun loading messages
    const statuses = [
      "Đang chuẩn bị hồ sơ thô giáo viên...",
      "Đang kết nối với Gemini-3.5-Flash...",
      "Đang tính toán các điểm số thực tế so với mục tiêu...",
      "Đang tổng hợp điểm khảo sát phụ huynh & học sinh...",
      "Đang đối chiếu hiệu suất với Thông tư 27 về đánh giá học sinh tiểu học...",
      "Đang biên soạn kiến nghị sư phạm và kế hoạch cải tiến..."
    ];

    let statusIndex = 0;
    setAiStatusMessage(statuses[0]);
    
    const interval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      setAiStatusMessage(statuses[statusIndex]);
    }, 1500);

    try {
      const evaluation = await onTriggerAIEvaluation(teacher.id, evaluatorName);
      setCurrentEvalItem(evaluation);
    } catch (error: any) {
      alert("Lỗi khi gửi dữ liệu lên AI: " + error.message);
    } finally {
      clearInterval(interval);
      setIsEvaluating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Xuất sắc": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Khá": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Trung bình": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Yếu": return "bg-rose-100 text-rose-800 border-rose-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getMetricProgressColor = (actual: number, target: number) => {
    const ratio = actual / (target || 1);
    if (ratio >= 1) return "bg-emerald-500";
    if (ratio >= 0.85) return "bg-blue-500";
    if (ratio >= 0.7) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium text-xs bg-white py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </button>
          {onDeleteTeacher && (isAdmin || isLeader) && (
            <button
              onClick={async () => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên "${teacher.name}" khỏi hệ thống không? Hành động này không thể hoàn tác.`)) {
                  try {
                    await onDeleteTeacher(teacher.id);
                  } catch (err) {
                    alert("Đã xảy ra lỗi khi xóa giáo viên.");
                  }
                }
              }}
              className="inline-flex items-center gap-1.5 text-rose-600 hover:text-white hover:bg-rose-600 font-semibold text-xs bg-white hover:border-transparent py-1.5 px-3 rounded-lg border border-rose-200 cursor-pointer transition-all"
            >
              <Trash2 size={13} /> Xóa giáo viên
            </button>
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium font-mono">
          MÃ SỐ GIÁO VIÊN: #{teacher.id.toUpperCase()}
        </div>
      </div>

      {/* Teacher Main Info Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={teacher.avatarUrl}
            alt={teacher.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-950">{teacher.name}</h1>
            <div className="text-xs text-slate-500 font-medium">{teacher.email}</div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Tổ {teacher.department}
              </span>
              <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Dạy môn: {teacher.subject}
              </span>
              {teacher.groupRole && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  teacher.groupRole === "Tổ trưởng" 
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : teacher.groupRole === "Tổ phó"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  Chức vụ: {teacher.groupRole}
                </span>
              )}
              {teacher.teachingRole && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  teacher.teachingRole === "Giáo viên chủ nhiệm" 
                    ? "bg-teal-50 text-teal-800 border-teal-200"
                    : "bg-indigo-50 text-indigo-800 border-indigo-200"
                }`}>
                  Nhiệm vụ: {teacher.teachingRole} {teacher.assignedClass ? `(${teacher.assignedClass})` : ""}
                </span>
              )}
              <span className="text-slate-400 text-[10px] font-medium font-mono">
                Kỳ đánh giá: {teacher.kpiPeriod}
              </span>
            </div>
          </div>
        </div>

        {/* Live Score Display */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-start">
          <div className="space-y-0.5 text-right md:text-left">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Điểm KPI Tổng Hợp</div>
            <div className="flex items-baseline gap-1 justify-end md:justify-start">
              <span className="text-3xl font-black font-mono text-slate-900">{liveOverallScore}</span>
              <span className="text-slate-400 text-xs font-mono">/100</span>
            </div>
            {liveOverallScore !== teacher.overallScore && (
              <span className="text-[10px] text-amber-600 font-medium flex items-center justify-end md:justify-start gap-0.5">
                <AlertCircle size={10} /> Chưa lưu chỉ số mới
              </span>
            )}
          </div>
          <div className="border-l border-slate-200 h-8 hidden md:block"></div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Xếp Loại Khuyến Nghị</div>
            <div className={`mt-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(liveStatus)}`}>
              {liveStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Columns (3/5 width): Interactive Metrics Slider */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                  <Edit3 size={15} className="text-blue-500" /> Cập Nhật Số Liệu KPI Trực Tiếp
                </h2>
                <p className="text-[11px] text-slate-500">Kéo thanh trượt để thay đổi dữ liệu thô thực tế đạt được của giáo viên.</p>
              </div>

              {canEdit ? (
                <button
                  onClick={handleSaveKPIs}
                  disabled={isSaving}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                    saveSuccess 
                    ? "bg-emerald-500 text-white" 
                    : "bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300"
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 size={13} /> Đã Lưu Thành Công!
                    </>
                  ) : isSaving ? (
                    "Đang lưu..."
                  ) : (
                    <>
                      <Save size={13} /> Lưu KPI Mới
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-slate-100 text-slate-500 rounded-lg py-1.5 px-3 border border-slate-200/60 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  <span>Chế độ Xem (Chỉ đọc)</span>
                </div>
              )}
            </div>

            {/* Slider Categories */}
            <div className="p-5 space-y-6">
              {localKpis.map((category) => (
                <div key={category.id} className="space-y-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-800 tracking-wider uppercase flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      {category.name}
                    </h3>
                    <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      Trọng số tổ: {category.weight}%
                    </span>
                  </div>

                  <div className="space-y-5">
                    {category.metrics.map((metric) => (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex justify-between items-start text-xs gap-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800">{metric.name}</span>
                            <span className="text-[10px] text-slate-400 block">{metric.description}</span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-slate-400 text-[10px]">Đạt:</span>
                              <span className="font-bold text-slate-900 font-mono text-sm">{metric.actual}</span>
                              <span className="text-slate-400 font-mono text-[10px]">/ Mục tiêu: {metric.target}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium">Trọng số nhóm: {metric.weight}%</span>
                          </div>
                        </div>

                        {/* Slide input and Progress indicator */}
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                            value={metric.actual}
                            onChange={(e) => handleMetricChange(category.id, metric.id, parseInt(e.target.value))}
                            disabled={!canEdit}
                          />
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${getMetricProgressColor(metric.actual, metric.target)}`}
                              style={{ width: `${Math.min(100, (metric.actual / (metric.target || 1)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI Accountability Logs / Print View */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Printer size={15} className="text-blue-500" /> Báo Cáo Thi Đua Sư Phạm Định Kỳ
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer size={13} /> In Phiếu KPI
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Phiếu điểm này chứa đầy đủ thông tin chữ ký số, bảng điểm chuẩn hóa và nhật ký đánh giá của AI. Được sử dụng chính thức làm tài liệu tham chiếu minh bạch phục vụ công tác nâng ngạch và khen thưởng giáo viên cuối học kỳ.
            </p>
          </div>
        </div>

        {/* Right Columns (2/5 width): AI Smart Evaluator & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Period Selection Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-200/50">
                <Calendar size={14} className={isChangingPeriod ? "animate-spin" : ""} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-tight">
                  Kỳ & Tuần Giảng Dạy KPI
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Theo dõi và đánh giá chi tiết theo từng mốc thời gian</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Chọn Tuần / Tháng Đánh Giá:
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                    value={teacher.kpiPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    disabled={isChangingPeriod || !canEdit}
                  >
                    {periodsList.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Custom Period Section */}
              {canEdit && (!showCustomPeriodInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomPeriodInput(true)}
                  className="w-full py-1.5 border border-dashed border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={12} /> Thêm Kỳ / Tuần Giảng Dạy Mới
                </button>
              ) : (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                      Tên Kỳ/Tuần Mới:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tuần 3 - Tháng 10/2025"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 transition-all font-medium"
                      value={customPeriod}
                      onChange={(e) => setCustomPeriod(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddCustomPeriod();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomPeriod}
                      disabled={isChangingPeriod || !customPeriod.trim()}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-1 rounded-md text-[10px] font-bold cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      Xác Nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomPeriodInput(false);
                        setCustomPeriod("");
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Smart Review Evaluator Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl shadow-md border border-slate-800 overflow-hidden space-y-4 p-5 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-1">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Sparkles size={11} /> Đánh Giá Trực Tuyến Bằng AI
              </div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">Trợ Lý Phân Tích Sư Phạm Gemini</h2>
              <p className="text-[11px] text-slate-400">Tự động hóa báo cáo, tìm kiếm ưu điểm và đề xuất lộ trình sư phạm cá nhân hóa.</p>
            </div>

            {/* Evaluator Field input for audit logs */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tên Người Đánh Giá Thực Hiện:</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            {/* AI Call Button */}
            <button
              onClick={handleTriggerAI}
              disabled={isEvaluating || !canEdit}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
              title={!canEdit ? "Chỉ dành cho Ban Giám Hiệu hoặc Tổ trưởng/Phó của Tổ khối này" : ""}
            >
              <Sparkles size={14} /> 
              {isEvaluating ? "Đang tiến hành phân tích..." : !canEdit ? "Chỉ Tổ trưởng/Phó tổ này mới có quyền Đánh giá" : "Tạo Đánh Giá Thử Nghiệm Bằng AI"}
            </button>

            {/* Loading Status Indicator */}
            {isEvaluating && (
              <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700/60 text-center space-y-3 animate-pulse">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                </div>
                <div className="text-xs text-slate-200 font-medium font-mono">{aiStatusMessage}</div>
                <div className="text-[10px] text-slate-500">Hệ thống phân tích tự động bảo mật cao, không lưu trữ thông tin nhạy cảm.</div>
              </div>
            )}

            {/* Display newly generated evaluation right away */}
            {currentEvalItem && (
              <div className="bg-slate-800/80 rounded-xl p-4 border border-blue-500/30 text-xs space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="font-bold text-emerald-400">Kết Quả Đánh Giá Mới Nhất</span>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Thành công</span>
                </div>
                <div className="space-y-3 leading-relaxed text-slate-300">
                  {/* Clean Markdown rendering simulator */}
                  {currentEvalItem.feedback.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('**Nhận xét tổng thể:**')) {
                      return <p key={idx}><strong className="text-slate-100 block mb-1">📝 Tổng Quan:</strong>{paragraph.replace('**Nhận xét tổng thể:**', '')}</p>;
                    }
                    if (paragraph.startsWith('**Ưu điểm nổi bật:**')) {
                      return (
                        <div key={idx}>
                          <strong className="text-emerald-400 block mb-1">👍 Ưu Điểm:</strong>
                          <div className="text-slate-300 space-y-1">{paragraph.replace('**Ưu điểm nổi bật:**', '').trim().split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
                        </div>
                      );
                    }
                    if (paragraph.startsWith('**Điểm cần cải thiện:**')) {
                      return (
                        <div key={idx}>
                          <strong className="text-rose-400 block mb-1">⚠️ Cần Cải Thiện:</strong>
                          <div className="text-slate-300 space-y-1">{paragraph.replace('**Điểm cần cải thiện:**', '').trim().split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
                        </div>
                      );
                    }
                    if (paragraph.startsWith('**Kế hoạch hành động đề xuất:**')) {
                      return (
                        <div key={idx}>
                          <strong className="text-blue-400 block mb-1">💡 Kế Hoạch Đề Xuất:</strong>
                          <div className="text-slate-300 space-y-1">{paragraph.replace('**Kế hoạch hành động đề xuất:**', '').trim().split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
                        </div>
                      );
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transfer Department Widget */}
          {(isAdmin || isLeader) && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-200/50">
                  <RefreshCw size={14} className={isTransferring ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-tight">
                    Luân Chuyển Tổ & Thay Đổi Chức Vụ
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Thay đổi tổ khối, phân môn hoặc bổ nhiệm làm Tổ trưởng/Phó</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Chọn Tổ Khối / Bộ Môn Mới:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                    value={transferDept}
                    onChange={(e) => handleTransferDeptChange(e.target.value)}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Môn Giảng Dạy Mới / Nhiệm Vụ:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                    value={transferTeachingRole}
                    onChange={(e) => {
                      const val = e.target.value as "Giáo viên chủ nhiệm" | "Giáo viên bộ môn";
                      setTransferTeachingRole(val);
                      if (val === "Giáo viên chủ nhiệm") {
                        setTransferSubject("Giáo viên chủ nhiệm");
                      } else {
                        setTransferSubject("Tiếng Anh");
                      }
                    }}
                  >
                    <option value="Giáo viên chủ nhiệm">Giáo viên chủ nhiệm</option>
                    <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                  </select>
                </div>

                {transferTeachingRole === "Giáo viên bộ môn" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Môn Học Bộ Môn Cụ Thể:</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                      value={transferSubject === "Giáo viên chủ nhiệm" || transferSubject === "Giáo viên bộ môn" ? "Tiếng Anh" : transferSubject}
                      onChange={(e) => setTransferSubject(e.target.value)}
                    >
                      {SUBJECTS_FOR_DEPT["Tổ Bộ môn"].map((subj) => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Chức Vụ trong Tổ Khối:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                    value={transferRole}
                    onChange={(e) => setTransferRole(e.target.value as any)}
                  >
                    <option value="Thành viên">Thành viên</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Tổ phó">Tổ phó</option>
                  </select>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Lớp / Khối Phụ Trách:</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                    placeholder={transferTeachingRole === "Giáo viên chủ nhiệm" ? "Ví dụ: Lớp 4A" : "Ví dụ: Khối 4, 5"}
                    value={transferAssignedClass}
                    onChange={(e) => setTransferAssignedClass(e.target.value)}
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Mật khẩu Đăng nhập (Cho Tổ trưởng / Tổ phó):</label>
                  <div className="relative">
                    <input
                      type={showTransferPassword ? "text" : "password"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
                      placeholder="Nhập mật khẩu (Mặc định: 123456)"
                      value={transferPassword}
                      onChange={(e) => setTransferPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTransferPassword(!showTransferPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showTransferPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTransferSubmit}
                  disabled={isTransferring || (
                    transferDept === teacher.department && 
                    transferSubject === teacher.subject && 
                    transferRole === (teacher.groupRole || "Thành viên") &&
                    transferTeachingRole === (teacher.teachingRole || "Giáo viên chủ nhiệm") &&
                    transferAssignedClass === (teacher.assignedClass || "") &&
                    transferPassword === (teacher.password || "123456")
                  )}
                  className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    transferSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  }`}
                >
                  {transferSuccess ? (
                    <>
                      <CheckCircle2 size={13} /> Lưu Thiết Lập Thành Công!
                    </>
                  ) : isTransferring ? (
                    "Đang lưu thiết lập..."
                  ) : (
                    <>
                      <RefreshCw size={13} /> Lưu Cấu Hình Nhân Sự
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Historic Evaluations History Logs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <History size={15} className="text-slate-500" /> Nhật Ký Đánh Giá Định Kỳ ({teacher.evaluations.length})
            </h3>

            {teacher.evaluations.length > 0 ? (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {teacher.evaluations.map((item) => (
                  <div key={item.id} className="border-l-2 border-slate-200 pl-4 py-1 space-y-2 relative">
                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border border-white"></div>
                    
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-800">{item.period}</span>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getStatusBadgeColor(item.status)}`}>
                        {item.overallScore} điểm ({item.status})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                      {item.feedback}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><User size={12} /> Người đánh giá: {item.evaluator}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> Ngày: {item.evaluatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-1.5">
                <History size={24} className="mx-auto text-slate-300" />
                <p className="text-xs">Giáo viên này chưa có biên bản đánh giá lịch sử nào.</p>
                <p className="text-[10px] text-slate-400">Sử dụng nút Đánh giá AI ở trên để bắt đầu lập báo cáo cho giáo viên này.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
