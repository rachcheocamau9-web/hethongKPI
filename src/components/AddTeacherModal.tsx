/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  UserPlus, 
  HelpCircle, 
  ClipboardList, 
  Check, 
  AlertCircle, 
  Sparkles,
  Info
} from "lucide-react";

interface AddTeacherModalProps {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    email: string;
    subject: string;
    department: string;
    avatarUrl: string;
    groupRole?: "Tổ trưởng" | "Tổ phó" | "Thành viên";
    teachingRole?: "Giáo viên chủ nhiệm" | "Giáo viên bộ môn";
    assignedClass?: string;
    password?: string;
  }) => Promise<void>;
  onAddBulk?: (teachers: Array<{
    name: string;
    email: string;
    subject: string;
    department: string;
    teachingRole?: "Giáo viên chủ nhiệm" | "Giáo viên bộ môn";
    assignedClass?: string;
  }>) => Promise<void>;
  departments?: string[];
}

export default function AddTeacherModal({ 
  onClose, 
  onAdd, 
  onAddBulk,
  departments = ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn"]
}: AddTeacherModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Teacher Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Giáo viên chủ nhiệm");
  const [department, setDepartment] = useState(departments[0] || "Tổ Khối 1");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [groupRole, setGroupRole] = useState<"Tổ trưởng" | "Tổ phó" | "Thành viên">("Thành viên");
  const [teachingRole, setTeachingRole] = useState<"Giáo viên chủ nhiệm" | "Giáo viên bộ môn">("Giáo viên chủ nhiệm");
  const [assignedClass, setAssignedClass] = useState("");
  const [password, setPassword] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Teachers states
  const [bulkInput, setBulkInput] = useState("");
  const [parsedTeachers, setParsedTeachers] = useState<Array<{
    name: string;
    email: string;
    department: string;
    subject: string;
    isValid: boolean;
    errorReason?: string;
  }>>([]);

  const SUBJECT_DEPARTMENTS: Record<string, string[]> = {
    "Tổ Khối 1": ["Chủ nhiệm (Khối 1)"],
    "Tổ Khối 2": ["Chủ nhiệm (Khối 2)"],
    "Tổ Khối 3": ["Chủ nhiệm (Khối 3)"],
    "Tổ Khối 4": ["Chủ nhiệm (Khối 4)"],
    "Tổ Khối 5": ["Chủ nhiệm (Khối 5)"],
    "Tổ Bộ môn": ["Tiếng Anh", "Âm nhạc", "Mỹ thuật", "Giáo dục thể chất", "Tin học tiểu học", "Hoạt động trải nghiệm"]
  };

  const handleDepartmentChange = (dept: string) => {
    setDepartment(dept);
    if (dept === "Tổ Bộ môn") {
      setTeachingRole("Giáo viên bộ môn");
      setSubject("Tiếng Anh");
    } else {
      setTeachingRole("Giáo viên chủ nhiệm");
      setSubject("Giáo viên chủ nhiệm");
    }
  };

  // Submit single teacher
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên và Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name,
        email,
        subject,
        department,
        avatarUrl,
        groupRole,
        teachingRole,
        assignedClass: assignedClass.trim() || "Chưa phân lớp",
        password
      });
      onClose();
    } catch (err) {
      alert("Đã xảy ra lỗi khi thêm giáo viên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parsing pasted bulk data
  const handleBulkInputChange = (value: string) => {
    setBulkInput(value);
    
    if (!value.trim()) {
      setParsedTeachers([]);
      return;
    }

    const lines = value.split("\n");
    const parsed: typeof parsedTeachers = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty line

      // Detect separator: Tab, comma, semicolon
      let parts: string[] = [];
      if (trimmedLine.includes("\t")) {
        parts = trimmedLine.split("\t");
      } else if (trimmedLine.includes(";")) {
        parts = trimmedLine.split(";");
      } else if (trimmedLine.includes(",")) {
        parts = trimmedLine.split(",");
      } else {
        parts = [trimmedLine];
      }

      const rawName = parts[0]?.trim() || "";
      const rawEmail = parts[1]?.trim() || "";
      let rawDept = parts[2]?.trim() || "";
      let rawSubject = parts[3]?.trim() || "";

      // Smart matching for Department
      let matchedDept = "Chưa phân công";
      if (rawDept) {
        const foundDept = departments.find(d => 
          rawDept.toLowerCase().includes(d.toLowerCase()) || 
          d.toLowerCase().includes(rawDept.toLowerCase())
        );

        if (foundDept) {
          matchedDept = foundDept;
        } else {
          // Fallback checks
          if (rawDept.includes("1") || rawDept.includes("một")) matchedDept = "Tổ Khối 1";
          else if (rawDept.includes("2") || rawDept.includes("hai")) matchedDept = "Tổ Khối 2";
          else if (rawDept.includes("3") || rawDept.includes("ba")) matchedDept = "Tổ Khối 3";
          else if (rawDept.includes("4") || rawDept.includes("bốn")) matchedDept = "Tổ Khối 4";
          else if (rawDept.includes("5") || rawDept.includes("năm")) matchedDept = "Tổ Khối 5";
          else if (rawDept.toLowerCase().includes("môn") || rawDept.toLowerCase().includes("bộ môn")) matchedDept = "Tổ Bộ môn";
        }
      }

      // Smart matching / default for Subject
      let matchedSubject = rawSubject;
      if (!matchedSubject) {
        if (matchedDept === "Tổ Khối 1") matchedSubject = "Chủ nhiệm (Khối 1)";
        else if (matchedDept === "Tổ Khối 2") matchedSubject = "Chủ nhiệm (Khối 2)";
        else if (matchedDept === "Tổ Khối 3") matchedSubject = "Chủ nhiệm (Khối 3)";
        else if (matchedDept === "Tổ Khối 4") matchedSubject = "Chủ nhiệm (Khối 4)";
        else if (matchedDept === "Tổ Khối 5") matchedSubject = "Chủ nhiệm (Khối 5)";
        else if (matchedDept === "Tổ Bộ môn") matchedSubject = "Tiếng Anh";
        else matchedSubject = "Chưa phân công";
      }

      // Generate a neat temp email if missing to keep database valid and operational
      let finalEmail = rawEmail;
      if (!finalEmail && rawName) {
        const cleanName = rawName.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9]/g, "");
        finalEmail = `gv.${cleanName || "temp"}.${Math.floor(1000 + Math.random() * 9000)}@school.edu.vn`;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = !rawEmail || emailRegex.test(rawEmail);
      const isNameValid = rawName.length >= 2;

      const isValid = isNameValid && isEmailValid;
      let errorReason = "";
      if (!isNameValid) errorReason = "Tên quá ngắn hoặc rỗng";
      else if (!isEmailValid) errorReason = "Email sai định dạng";

      parsed.push({
        name: rawName,
        email: finalEmail,
        department: matchedDept,
        subject: matchedSubject,
        isValid,
        errorReason
      });
    });

    setParsedTeachers(parsed);
  };

  // Submit bulk teachers list
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTeachers = parsedTeachers.filter(t => t.isValid);
    if (validTeachers.length === 0) {
      alert("Không tìm thấy giáo viên hợp lệ nào để nhập hệ thống.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onAddBulk) {
        await onAddBulk(validTeachers);
        alert(`Nhập thành công ${validTeachers.length} giáo viên mới vào niên khóa!`);
        onClose();
      } else {
        // Fallback sequential
        for (const teacher of validTeachers) {
          await onAdd({
            name: teacher.name,
            email: teacher.email,
            department: teacher.department,
            subject: teacher.subject,
            avatarUrl: ""
          });
        }
        onClose();
      }
    } catch (err) {
      alert("Có lỗi xảy ra trong quá trình nhập đồng loạt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pasteSampleTemplate = () => {
    const template = `Nguyễn Văn A\tvana@school.edu.vn\tTổ Khối 1\tChủ nhiệm (Khối 1)
Trần Thị B\tthib@school.edu.vn\tTổ Khối 2\tChủ nhiệm (Khối 2)
Phạm Minh C\tminhc@school.edu.vn\tTổ Bộ môn\tTiếng Anh`;
    handleBulkInputChange(template);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <UserPlus size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-tight">
                Quản Lý & Thêm Mới Nhân Sự Sư Phạm
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Bổ sung giáo viên và cài đặt KPI khởi tạo ban đầu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Tabs Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "single" 
              ? "border-slate-900 text-slate-900 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Thêm 1 Giáo viên
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1 ${
              activeTab === "bulk" 
              ? "border-slate-900 text-slate-900 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Thêm Đồng Loạt (Nhập Excel / TSV)
            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Mới</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-5">
          
          {activeTab === "single" ? (
            /* SINGLE TEACHER FORM */
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Họ và Tên:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Email Trường Học:</label>
                <input
                  type="email"
                  required
                  placeholder="annguyen@school.edu.vn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Department Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Tổ Chuyên Môn / Tổ Khối:</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Nhiệm vụ giảng dạy */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nhiệm vụ giảng dạy:</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                  value={teachingRole}
                  onChange={(e) => {
                    const val = e.target.value as "Giáo viên chủ nhiệm" | "Giáo viên bộ môn";
                    setTeachingRole(val);
                    if (val === "Giáo viên chủ nhiệm") {
                      setSubject("Giáo viên chủ nhiệm");
                    } else {
                      setSubject("Tiếng Anh");
                    }
                  }}
                >
                  <option value="Giáo viên chủ nhiệm">Giáo viên chủ nhiệm</option>
                  <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                </select>
              </div>

              {/* Subject Selection (Shown only for subject teachers) */}
              {teachingRole === "Giáo viên bộ môn" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Môn giảng dạy cụ thể:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                    value={subject === "Giáo viên chủ nhiệm" || subject === "Giáo viên bộ môn" ? "Tiếng Anh" : subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    {SUBJECT_DEPARTMENTS["Tổ Bộ môn"].map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lớp / Khối phụ trách */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Lớp / Khối phụ trách:</label>
                <input
                  type="text"
                  placeholder={teachingRole === "Giáo viên chủ nhiệm" ? "Ví dụ: Lớp 4A" : "Ví dụ: Khối 4, 5"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                />
              </div>

              {/* Group Role Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Chức danh / Chức vụ trong Tổ:</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium cursor-pointer"
                  value={groupRole}
                  onChange={(e) => setGroupRole(e.target.value as any)}
                >
                  <option value="Thành viên">Thành viên</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Tổ phó">Tổ phó</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Mật khẩu Đăng nhập (Cho Tổ trưởng / Tổ phó):</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mật khẩu (Mặc định: 123456)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Profile Picture (Optional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đường Dẫn Ảnh Đại Diện (Tùy chọn):</label>
                  <span className="text-[9px] text-slate-400">URL hình ảnh</span>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              {/* Seeding information note */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
                <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <p>
                  Giáo viên mới sẽ tự động được khởi tạo với điểm trung bình cơ sở ban đầu (80/100) trên tất cả chỉ số con KPI của tổ khối đang hiện hành.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors disabled:bg-slate-300"
                >
                  {isSubmitting ? "Đang xử lý..." : "Thêm Nhân Sự"}
                </button>
              </div>
            </form>
          ) : (
            /* BULK IMPORT FORM */
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              
              {/* Instructions */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Sparkles size={15} className="text-blue-600" />
                  <span>Hướng dẫn nhập dữ liệu hàng loạt từ Excel / Sheets</span>
                </div>
                <p className="text-[11px] text-blue-700/90 leading-relaxed">
                  Sao chép danh sách giáo viên từ file Excel hoặc Google Sheets rồi dán vào khung văn bản dưới đây. Cấu trúc các cột cần theo thứ tự:
                </p>
                <div className="font-mono text-[10px] bg-white border border-blue-100 rounded-lg p-2.5 text-slate-700 font-bold">
                  Họ tên [Tab] Email [Tab] Tổ Chuyên Môn [Tab] Môn Giảng Dạy
                </div>
                <div className="flex items-center justify-between text-[10px] text-blue-600 pt-1">
                  <span>* Hệ thống hỗ trợ phân tích thông minh, tự nhận diện Tổ khối và điền môn giảng dạy tương ứng.</span>
                  <button
                    type="button"
                    onClick={pasteSampleTemplate}
                    className="underline hover:text-blue-800 cursor-pointer font-bold"
                  >
                    Mẫu thử nghiệm
                  </button>
                </div>
              </div>

              {/* Textarea for pasted values */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Dán nội dung bảng tính tại đây:
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => handleBulkInputChange(e.target.value)}
                  placeholder="Dán dữ liệu sao chép từ Excel..."
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-mono leading-relaxed"
                />
              </div>

              {/* Parsed Teachers Live Preview */}
              {parsedTeachers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Bản xem trước dữ liệu phát hiện ({parsedTeachers.length} dòng):
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      Hợp lệ: {parsedTeachers.filter(t => t.isValid).length} / {parsedTeachers.length}
                    </span>
                  </div>

                  {/* Table review */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-2 pl-3">Họ và tên</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Tổ chuyên môn</th>
                          <th className="p-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {parsedTeachers.map((teacher, idx) => (
                          <tr key={idx} className={teacher.isValid ? "hover:bg-slate-50/50" : "bg-rose-50/30"}>
                            <td className="p-2 pl-3 font-semibold text-slate-800">{teacher.name || <span className="text-slate-300">Trống</span>}</td>
                            <td className="p-2 font-mono text-slate-600">{teacher.email || <span className="text-slate-300">Trống</span>}</td>
                            <td className="p-2">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[10px]">
                                {teacher.department}
                              </span>
                            </td>
                            <td className="p-2">
                              {teacher.isValid ? (
                                <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                                  <Check size={12} /> Hợp lệ
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold inline-flex items-center gap-0.5" title={teacher.errorReason}>
                                  <AlertCircle size={12} /> Lỗi
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Seeding metadata info */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <p>
                  Hệ thống tự động kích hoạt các chỉ số con tương ứng với chuyên môn của từng tổ khối. Điểm thực tế của các chỉ số sẽ được khởi tạo với điểm thi đua ban đầu (80/100).
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || parsedTeachers.filter(t => t.isValid).length === 0}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Đang xử lý nhập hàng loạt..." : `Đồng ý Nhập (${parsedTeachers.filter(t => t.isValid).length} Giáo Viên)`}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
