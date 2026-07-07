/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Teacher } from "../types";
import { Search, Filter, Plus, ArrowRight, Award, AlertTriangle, HelpCircle, Trash2 } from "lucide-react";

interface TeacherListProps {
  teachers: Teacher[];
  onSelectTeacher: (teacher: Teacher) => void;
  onAddTeacherClick: () => void;
  onDeleteTeacher?: (id: string) => Promise<void>;
  isAdmin?: boolean;
  isLeader?: boolean;
  leaderInfo?: { id: string; name: string; department: string; groupRole: string } | null;
  departments?: string[];
}

export default function TeacherList({ 
  teachers, 
  onSelectTeacher, 
  onAddTeacherClick, 
  onDeleteTeacher, 
  isAdmin = false,
  isLeader = false,
  leaderInfo = null,
  departments: orderedDepartments = []
}: TeacherListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Departments list for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    teachers.forEach((t) => depts.add(t.department));
    const list = Array.from(depts);

    const deptOrder: Record<string, number> = {};
    const deptsList = orderedDepartments && orderedDepartments.length > 0 
      ? orderedDepartments 
      : ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Tổ Văn phòng", "Ban Giám Hiệu", "Chưa phân công"];
      
    deptsList.forEach((dept, index) => {
      deptOrder[dept] = index + 1;
    });

    return list.sort((a, b) => {
      const orderA = deptOrder[a] || 999;
      const orderB = deptOrder[b] || 999;
      return orderA - orderB;
    });
  }, [teachers, orderedDepartments]);

  // Filter & Search Logic & Sort by department order, then overallScore descending, then name
  const filteredTeachers = useMemo(() => {
    const deptOrder: Record<string, number> = {};
    const deptsList = orderedDepartments && orderedDepartments.length > 0 
      ? orderedDepartments 
      : ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Tổ Văn phòng", "Ban Giám Hiệu", "Chưa phân công"];
      
    deptsList.forEach((dept, index) => {
      deptOrder[dept] = index + 1;
    });

    return teachers
      .filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              t.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDept = selectedDept === "all" || t.department === selectedDept;
        const matchesStatus = selectedStatus === "all" || t.status === selectedStatus;

        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        const orderA = deptOrder[a.department] || 999;
        const orderB = deptOrder[b.department] || 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // Priority: "Tổ trưởng" -> "Tổ phó" -> "Thành viên" -> other
        const roleOrder: Record<string, number> = {
          "Tổ trưởng": 1,
          "Tổ phó": 2,
          "Thành viên": 3
        };
        const rA = a.groupRole ? (roleOrder[a.groupRole] || 4) : 4;
        const rB = b.groupRole ? (roleOrder[b.groupRole] || 4) : 4;
        if (rA !== rB) {
          return rA - rB;
        }

        if (b.overallScore !== a.overallScore) {
          return b.overallScore - a.overallScore;
        }
        return a.name.localeCompare(b.name, "vi");
      });
  }, [teachers, searchTerm, selectedDept, selectedStatus, orderedDepartments]);

  // Color badges helper
  const getStatusBadge = (status: Teacher["status"]) => {
    switch (status) {
      case "Xuất sắc":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Khá":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Trung bình":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Yếu":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800">Danh Sách & Đánh Giá Chỉ Số KPI Giáo Viên</h2>
          <p className="text-xs text-slate-500">Tìm kiếm, lọc danh sách và quản lý hồ sơ đánh giá của giáo viên.</p>
        </div>
        {isAdmin && (
          <button
            onClick={onAddTeacherClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
          >
            <Plus size={16} /> Thêm Giáo Viên Mới
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, môn học, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dept Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Filter size={14} />
          </span>
          <select
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-colors appearance-none cursor-pointer"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">Tất cả Tổ khối / Tổ bộ môn</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Award size={14} />
          </span>
          <select
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-colors appearance-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả Xếp loại KPI</option>
            <option value="Xuất sắc">Xuất sắc (90 - 100)</option>
            <option value="Khá">Khá (80 - 89)</option>
            <option value="Trung bình">Trung bình (65 - 79)</option>
            <option value="Yếu">Yếu (Dưới 65)</option>
          </select>
        </div>
      </div>

      {/* Teachers Table (Desktop only) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
              <th className="py-3 px-5">Họ Tên Giáo Viên</th>
              <th className="py-3 px-5">Tổ Khối / Tổ Bộ môn</th>
              <th className="py-3 px-5">Môn Giảng Dạy</th>
              <th className="py-3 px-5 text-center">Chỉ Số Tổng Hợp (Weighted)</th>
              <th className="py-3 px-5">Xếp Loại KPI</th>
              <th className="py-3 px-5 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <tr 
                  key={teacher.id} 
                  className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  onClick={() => onSelectTeacher(teacher)}
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-semibold text-slate-950 group-hover:text-blue-600 transition-colors flex items-center gap-1.5 flex-wrap">
                          <span>{teacher.name}</span>
                          {teacher.groupRole && teacher.groupRole !== "Thành viên" && (
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border border-blue-200">
                              {teacher.groupRole}
                            </span>
                          )}
                          {isLeader && leaderInfo && teacher.department === leaderInfo.department && (
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border border-emerald-200">
                              Cùng Tổ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                      {teacher.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-800">
                        {teacher.subject === "Giáo viên chủ nhiệm" || teacher.subject === "Giáo viên bộ môn" 
                          ? (teacher.teachingRole || teacher.subject) 
                          : teacher.subject}
                      </span>
                      {teacher.teachingRole && (
                        <span className="text-[10px] text-slate-400 font-semibold font-sans">
                          {teacher.teachingRole} {teacher.assignedClass && teacher.assignedClass !== "Chưa phân lớp" ? `(${teacher.assignedClass})` : ""}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`font-mono font-bold text-sm ${
                      teacher.overallScore >= 90 ? "text-emerald-600" :
                      teacher.overallScore >= 80 ? "text-blue-600" :
                      teacher.overallScore >= 65 ? "text-amber-600" :
                      "text-rose-600"
                    }`}>
                      {teacher.overallScore}
                    </span>
                    <span className="text-slate-400 text-[10px] ml-0.5">/100</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusBadge(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="text-slate-400 hover:text-blue-600 font-semibold inline-flex items-center gap-1 hover:translate-x-0.5 transition-all text-xs cursor-pointer"
                        onClick={() => onSelectTeacher(teacher)}
                      >
                        Đánh giá chi tiết <ArrowRight size={14} />
                      </button>
                      {onDeleteTeacher && isAdmin && (
                        <button
                          title="Xóa giáo viên"
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50/50 transition-colors cursor-pointer"
                          onClick={async () => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên "${teacher.name}" khỏi danh sách không?`)) {
                              try {
                                await onDeleteTeacher(teacher.id);
                              } catch (err) {
                                alert("Không thể xóa giáo viên. Vui lòng thử lại.");
                              }
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                  <div className="flex justify-center text-slate-300">
                    <Search size={32} />
                  </div>
                  <div className="text-xs">Không tìm thấy giáo viên nào khớp với điều kiện tìm kiếm.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Teachers Mobile List (Mobile only) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <div 
              key={teacher.id}
              onClick={() => onSelectTeacher(teacher)}
              className="p-4 active:bg-slate-50 hover:bg-slate-50/40 transition-colors cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={teacher.avatarUrl}
                    alt={teacher.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                      <span>{teacher.name}</span>
                      {teacher.groupRole && teacher.groupRole !== "Thành viên" && (
                        <span className="bg-blue-50 text-blue-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-blue-200">
                          {teacher.groupRole}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">{teacher.email}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className={`font-mono font-black text-base ${
                      teacher.overallScore >= 90 ? "text-emerald-600" :
                      teacher.overallScore >= 80 ? "text-blue-600" :
                      teacher.overallScore >= 65 ? "text-amber-600" :
                      "text-rose-600"
                    }`}>
                      {teacher.overallScore}
                    </span>
                    <span className="text-slate-400 text-[9px]">/100</span>
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getStatusBadge(teacher.status)}`}>
                    {teacher.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                    {teacher.department}
                  </span>
                  <span className="bg-blue-50 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                    {teacher.subject === "Giáo viên chủ nhiệm" || teacher.subject === "Giáo viên bộ môn" 
                      ? (teacher.teachingRole || teacher.subject) 
                      : teacher.subject}
                  </span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-lg bg-blue-50 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => onSelectTeacher(teacher)}
                  >
                    Xem <ArrowRight size={12} />
                  </button>
                  {onDeleteTeacher && isAdmin && (
                    <button
                      title="Xóa"
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md bg-rose-50 border border-rose-100 cursor-pointer"
                      onClick={async () => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa giáo viên "${teacher.name}" khỏi danh sách không?`)) {
                          try {
                            await onDeleteTeacher(teacher.id);
                          } catch (err) {
                            alert("Không thể xóa giáo viên. Vui lòng thử lại.");
                          }
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="flex justify-center text-slate-300">
              <Search size={32} />
            </div>
            <div className="text-xs">Không tìm thấy giáo viên nào khớp với điều kiện tìm kiếm.</div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-slate-400 text-[10px] gap-2">
        <div>
          Đang hiển thị <strong>{filteredTeachers.length}</strong> giáo viên trong tổng số <strong>{teachers.length}</strong> giáo viên.
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span> Xuất sắc (≥90)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span> Khá (80-89)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full inline-block"></span> Trung bình (65-79)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-rose-500 rounded-full inline-block"></span> Yếu (&lt;65)
          </span>
        </div>
      </div>
    </div>
  );
}
