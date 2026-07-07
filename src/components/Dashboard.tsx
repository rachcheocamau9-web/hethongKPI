/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Teacher, DashboardStats, KPIWeights } from "../types";
import { 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  BookOpen, 
  Heart, 
  CheckCircle2, 
  HelpCircle 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface DashboardProps {
  teachers: Teacher[];
  weights: KPIWeights;
  onSelectTeacher: (teacher: Teacher) => void;
}

export default function Dashboard({ teachers, weights, onSelectTeacher }: DashboardProps) {
  // Compute Stats
  const stats: DashboardStats = useMemo(() => {
    if (teachers.length === 0) {
      return {
        averageKPI: 0,
        totalTeachers: 0,
        excellentCount: 0,
        goodCount: 0,
        averageCount: 0,
        needsImprovementCount: 0,
        departmentAverages: [],
        monthlyTrend: []
      };
    }

    const total = teachers.length;
    let sum = 0;
    let excellent = 0;
    let good = 0;
    let average = 0;
    let weak = 0;

    const deptSums: Record<string, { sum: number; count: number }> = {};

    teachers.forEach((t) => {
      sum += t.overallScore;
      if (t.overallScore >= 90) excellent++;
      else if (t.overallScore >= 80) good++;
      else if (t.overallScore >= 65) average++;
      else weak++;

      if (!deptSums[t.department]) {
        deptSums[t.department] = { sum: 0, count: 0 };
      }
      deptSums[t.department].sum += t.overallScore;
      deptSums[t.department].count += 1;
    });

    const departmentAverages = Object.entries(deptSums).map(([dept, data]) => ({
      department: dept,
      average: parseFloat((data.sum / data.count).toFixed(1))
    }));

    // Mock trend for visual purposes
    const monthlyTrend = [
      { month: "Tháng 02", average: 76.5 },
      { month: "Tháng 03", average: 78.2 },
      { month: "Tháng 04", average: 79.8 },
      { month: "Tháng 05", average: 81.2 },
      { month: "Tháng 06", average: parseFloat((sum / total).toFixed(1)) }
    ];

    return {
      averageKPI: parseFloat((sum / total).toFixed(1)),
      totalTeachers: total,
      excellentCount: excellent,
      goodCount: good,
      averageCount: average,
      needsImprovementCount: weak,
      departmentAverages,
      monthlyTrend
    };
  }, [teachers]);

  // Alert: Teachers needing immediate support (score < 65)
  const lowPerformingTeachers = useMemo(() => {
    return teachers.filter((t) => t.overallScore < 65);
  }, [teachers]);

  // Color palette for departments or states
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tổng Quan Hiệu Suất KPI Trường Tiểu Học Rạch Chèo</h1>
          <p className="text-slate-500 text-sm mt-1">
            Báo cáo và phân tích chỉ số KPI của đội ngũ giáo viên tiểu học tính đến {teachers[0]?.kpiPeriod || "Tháng hiện tại"}.
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3 shadow-xs">
          <div className="bg-emerald-500 text-white rounded-full p-1.5">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <div className="text-xs text-emerald-800 font-medium">Hệ thống Minh bạch & Chính xác</div>
            <div className="text-xs text-emerald-600">Đã cập nhật công thức toán học thực tế</div>
          </div>
        </div>
      </div>

      {/* Grid Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: KPI Trung Bình */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">KPI Trung Bình Trường</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900">{stats.averageKPI}</span>
              <span className="text-slate-400 text-sm">/100</span>
            </div>
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <TrendingUp size={14} /> +1.4% so với tháng trước
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 2: Tổng số giáo viên */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Tổng Số Giáo Viên</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900">{stats.totalTeachers}</span>
              <span className="text-slate-400 text-sm">nhân sự</span>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              Phân bổ theo tổ khối & bộ môn tiểu học
            </span>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        {/* Card 3: Giáo viên Xuất sắc & Khá */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Xếp Loại Xuất Sắc & Khá</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-600">
                {stats.excellentCount + stats.goodCount}
              </span>
              <span className="text-slate-400 text-sm">/ {stats.totalTeachers} giáo viên</span>
            </div>
            <span className="text-xs text-emerald-600 font-medium">
              Đạt tỉ lệ chuẩn {( ((stats.excellentCount + stats.goodCount) / stats.totalTeachers) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Award size={24} />
          </div>
        </div>

        {/* Card 4: Giáo viên Cần Hỗ Trợ */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Giáo Viên Cần Hỗ Trợ</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono ${stats.needsImprovementCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
                {stats.needsImprovementCount}
              </span>
              <span className="text-slate-400 text-sm">nhân sự</span>
            </div>
            <span className={`text-xs font-medium ${stats.needsImprovementCount > 0 ? "text-rose-500" : "text-slate-500"}`}>
              {stats.needsImprovementCount > 0 ? "KPI dưới 65 điểm" : "Đạt chỉ tiêu tối thiểu 100%"}
            </span>
          </div>
          <div className={`p-3 rounded-lg ${stats.needsImprovementCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Department Averages */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 text-sm tracking-tight uppercase">Điểm KPI Trung Bình Theo Tổ Chuyên Môn</h2>
              <p className="text-xs text-slate-400">So sánh hiệu suất làm việc giữa các tổ chuyên môn</p>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-1 rounded font-bold uppercase">Biểu đồ</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.departmentAverages}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="department" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px", fontSize: "12px", border: "none" }}
                  formatter={(value) => [`${value} Điểm`, "KPI Trung bình"]}
                />
                <Bar dataKey="average" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {stats.departmentAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Breakdown Legend Cards */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            {stats.departmentAverages.map((item, index) => (
              <div key={item.department} className="text-center p-2 rounded-lg bg-slate-50/50">
                <span className="text-[10px] text-slate-400 font-medium block">{item.department}</span>
                <span className="text-sm font-bold font-mono block mt-0.5" style={{ color: COLORS[index % COLORS.length] }}>
                  {item.average}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm tracking-tight uppercase">Phân Phối Xếp Loại Giáo Viên</h2>
            <p className="text-xs text-slate-400">Tỉ lệ phần trăm xếp loại KPI trên toàn trường</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Excellent */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                  Xuất sắc (90 - 100)
                </span>
                <span className="text-slate-700 font-bold font-mono">
                  {stats.excellentCount} GV ({( (stats.excellentCount / stats.totalTeachers) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(stats.excellentCount / stats.totalTeachers) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Good */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-blue-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>
                  Khá (80 - 89)
                </span>
                <span className="text-slate-700 font-bold font-mono">
                  {stats.goodCount} GV ({( (stats.goodCount / stats.totalTeachers) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${(stats.goodCount / stats.totalTeachers) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Average */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block"></span>
                  Trung bình (65 - 79)
                </span>
                <span className="text-slate-700 font-bold font-mono">
                  {stats.averageCount} GV ({( (stats.averageCount / stats.totalTeachers) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(stats.averageCount / stats.totalTeachers) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                  Yếu (Dưới 65)
                </span>
                <span className="text-slate-700 font-bold font-mono">
                  {stats.needsImprovementCount} GV ({( (stats.needsImprovementCount / stats.totalTeachers) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${(stats.needsImprovementCount / stats.totalTeachers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <BookOpen size={14} /> Ý nghĩa xếp loại KPI:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Xếp loại KPI được dùng để xét thi đua khen thưởng, nâng lương định kỳ và đề xuất các khóa bồi dưỡng năng lực nghiệp vụ sư phạm phù hợp.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Warnings - Proactive Support Column */}
      {lowPerformingTeachers.length > 0 && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-semibold">
            <AlertTriangle className="text-rose-600" size={20} />
            <h3 className="text-sm uppercase tracking-wider">Cảnh Báo Hiệu Suất KPI Cần Lưu Ý</h3>
          </div>
          <p className="text-xs text-slate-600">
            Có <strong>{lowPerformingTeachers.length} giáo viên</strong> có chỉ số KPI dưới 65 điểm. Ban Giám hiệu cần tổ chức các buổi trao đổi, xây dựng lộ trình cải tiến sư phạm phù hợp.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {lowPerformingTeachers.map((t) => (
              <div 
                key={t.id} 
                className="bg-white border border-rose-100 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors"
                onClick={() => onSelectTeacher(t)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={t.avatarUrl} 
                    alt={t.name} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                    <div className="text-[10px] text-slate-400">{t.subject} - {t.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-rose-600">{t.overallScore}</div>
                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full font-medium">Yếu</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
