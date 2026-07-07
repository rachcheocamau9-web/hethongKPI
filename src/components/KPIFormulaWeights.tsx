/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { KPIWeights } from "../types";
import { 
  Sliders, 
  HelpCircle, 
  Save, 
  CheckCircle, 
  Calculator, 
  Info, 
  Trash2, 
  PlusCircle, 
  ClipboardList, 
  AlertTriangle,
  FolderPlus,
  Layers
} from "lucide-react";

interface KPIFormulaWeightsProps {
  weights: KPIWeights;
  onUpdateWeights: (newWeights: KPIWeights) => Promise<void>;
  metricsSchema?: any[];
  onUpdateMetricsSchema?: (newSchema: any[]) => Promise<void>;
  isAdmin?: boolean;
  departments?: string[];
  onRefreshDepartments?: () => Promise<void>;
  adminToken?: string | null;
}

export default function KPIFormulaWeights({ 
  weights, 
  onUpdateWeights,
  metricsSchema = [],
  onUpdateMetricsSchema,
  isAdmin = false,
  departments = [],
  onRefreshDepartments,
  adminToken = null
}: KPIFormulaWeightsProps) {
  const [teaching, setTeaching] = useState(weights.teaching);
  const [professionalism, setProfessionalism] = useState(weights.professionalism);
  const [activities, setActivities] = useState(weights.activities);
  const [isSavingWeights, setIsSavingWeights] = useState(false);
  const [saveWeightsSuccess, setSaveWeightsSuccess] = useState(false);

  // States for sub-metrics configuration
  const [localSchema, setLocalSchema] = useState<any[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>("teaching");
  const [isSavingSchema, setIsSavingSchema] = useState(false);
  const [saveSchemaSuccess, setSaveSchemaSuccess] = useState(false);

  // Custom departments state
  const [newDeptName, setNewDeptName] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    setIsAddingDept(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: newDeptName.trim() })
      });
      if (res.ok) {
        setNewDeptName("");
        if (onRefreshDepartments) {
          await onRefreshDepartments();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Không thể thêm tổ chuyên môn");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleDeleteDept = async (deptName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tổ "${deptName}" không? Các giáo viên thuộc tổ này cần được gán lại thủ công.`)) {
      return;
    }
    try {
      const res = await fetch("/api/departments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: deptName })
      });
      if (res.ok) {
        if (onRefreshDepartments) {
          await onRefreshDepartments();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Không thể xóa tổ chuyên môn");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    }
  };

  // Sync state if prop changes
  useEffect(() => {
    setTeaching(weights.teaching);
    setProfessionalism(weights.professionalism);
    setActivities(weights.activities);
  }, [weights]);

  useEffect(() => {
    if (metricsSchema && metricsSchema.length > 0) {
      setLocalSchema(JSON.parse(JSON.stringify(metricsSchema))); // Deep clone
    }
  }, [metricsSchema]);

  const total = teaching + professionalism + activities;

  const handleSaveWeights = async () => {
    if (total === 0) return;
    setIsSavingWeights(true);
    try {
      await onUpdateWeights({
        teaching,
        professionalism,
        activities
      });
      setSaveWeightsSuccess(true);
      setTimeout(() => setSaveWeightsSuccess(false), 3000);
    } catch (e) {
      alert("Không thể lưu cấu hình trọng số.");
    } finally {
      setIsSavingWeights(false);
    }
  };

  // Convert weights into percentages
  const teachingPercent = total > 0 ? ((teaching / total) * 100).toFixed(0) : "0";
  const profPercent = total > 0 ? ((professionalism / total) * 100).toFixed(0) : "0";
  const actPercent = total > 0 ? ((activities / total) * 100).toFixed(0) : "0";

  // Sub-metrics manipulation handlers
  const handleUpdateMetricField = (catId: string, metricId: string, field: string, value: any) => {
    setLocalSchema(prev => prev.map(cat => {
      if (cat.catId === catId) {
        return {
          ...cat,
          metrics: cat.metrics.map((m: any) => {
            if (m.id === metricId) {
              return { ...m, [field]: value };
            }
            return m;
          })
        };
      }
      return cat;
    }));
  };

  const handleAddMetric = (catId: string) => {
    const newMetricId = "m_" + Date.now();
    const newMetric = {
      id: newMetricId,
      name: "Chỉ số KPI mới",
      description: "Mô tả yêu cầu và cách thức tính toán chỉ số KPI con này",
      target: 90,
      weight: 30
    };

    setLocalSchema(prev => prev.map(cat => {
      if (cat.catId === catId) {
        return {
          ...cat,
          metrics: [...cat.metrics, newMetric]
        };
      }
      return cat;
    }));
  };

  const handleDeleteMetric = (catId: string, metricId: string) => {
    setLocalSchema(prev => prev.map(cat => {
      if (cat.catId === catId) {
        return {
          ...cat,
          metrics: cat.metrics.filter((m: any) => m.id !== metricId)
        };
      }
      return cat;
    }));
  };

  const handleSaveSchema = async () => {
    if (!onUpdateMetricsSchema) return;
    setIsSavingSchema(true);
    try {
      await onUpdateMetricsSchema(localSchema);
      setSaveSchemaSuccess(true);
      setTimeout(() => setSaveSchemaSuccess(false), 3000);
    } catch (e) {
      alert("Lỗi khi lưu cấu hình các chỉ số con.");
    } finally {
      setIsSavingSchema(false);
    }
  };

  const activeCategory = localSchema.find(c => c.catId === activeCatId);
  const activeMetrics = activeCategory ? activeCategory.metrics : [];
  const metricsWeightSum = activeMetrics.reduce((sum: number, m: any) => sum + (parseInt(m.weight) || 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Top weights config & math formula block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configuration Sliders Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Sliders size={16} className="text-blue-500" /> Trọng Số Nhóm KPI Lớn
            </h2>
            <p className="text-xs text-slate-500 font-medium">Thiết lập tỷ trọng phân phối giữa 3 mảng quản lý chính.</p>
          </div>

          <div className="space-y-5 pt-2">
            {/* Slider 1: Teaching */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">1. Giảng dạy & Chăm sóc</span>
                <span className="font-bold text-slate-900 font-mono">{teachingPercent}% <span className="text-slate-400">({teaching})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={teaching}
                onChange={(e) => setTeaching(parseInt(e.target.value))}
                disabled={!isAdmin}
              />
            </div>

            {/* Slider 2: Professionalism */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">2. Hồ sơ & Chuyên môn</span>
                <span className="font-bold text-slate-900 font-mono">{profPercent}% <span className="text-slate-400">({professionalism})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={professionalism}
                onChange={(e) => setProfessionalism(parseInt(e.target.value))}
                disabled={!isAdmin}
              />
            </div>

            {/* Slider 3: Activities */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">3. Phong trào & Phụ huynh</span>
                <span className="font-bold text-slate-900 font-mono">{actPercent}% <span className="text-slate-400">({activities})</span></span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={activities}
                onChange={(e) => setActivities(parseInt(e.target.value))}
                disabled={!isAdmin}
              />
            </div>

            {/* Warning or Sum Indicator */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Tổng điểm quy đổi trọng số:</span>
              <span className="font-mono font-bold text-slate-800">{total} điểm</span>
            </div>

            {/* Actions */}
            {isAdmin ? (
              <button
                onClick={handleSaveWeights}
                disabled={isSavingWeights || total === 0}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  saveWeightsSuccess 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300"
                }`}
              >
                {saveWeightsSuccess ? (
                  <>
                    <CheckCircle size={15} /> Đã cập nhật trọng số tổng!
                  </>
                ) : isSavingWeights ? (
                  "Đang lưu..."
                ) : (
                  <>
                    <Save size={15} /> Lưu Trọng Số Nhóm Lớn
                  </>
                )}
              </button>
            ) : (
              <div className="bg-slate-100 text-slate-500 rounded-lg p-3 border border-slate-200/60 flex items-center justify-center gap-1.5 text-xs font-semibold">
                <span>🔒 Chế độ Xem (Yêu cầu tài khoản Admin)</span>
              </div>
            )}
          </div>
        </div>

        {/* Transparent Math Engine Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Calculator size={16} className="text-blue-500" /> Bản Đồ Minh Bạch Công Thức Toán Học
            </h2>
            <p className="text-xs text-slate-500">Hệ thống quy đổi kết quả thi đua chuẩn hóa đảm bảo sự khách quan.</p>
          </div>

          {/* Dynamic Formula Display Box */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs md:text-sm overflow-x-auto border-l-4 border-emerald-500 shadow-md">
            <div className="text-slate-400 mb-2">// Công Thức Điểm Thi Đua KPI Tổng Hợp Hiện Tại</div>
            <div className="font-semibold text-slate-200 leading-relaxed py-2">
              KPI = <span className="text-blue-400">Teaching</span> × <span className="text-amber-400">({teachingPercent}%)</span> + 
              {" "}<span className="text-purple-400">Professionalism</span> × <span className="text-amber-400">({profPercent}%)</span> + 
              {" "}<span className="text-emerald-400">Activities</span> × <span className="text-amber-400">({actPercent}%)</span>
            </div>
            <div className="text-slate-400 mt-2 border-t border-slate-800 pt-2 text-[10px]">
              Trong đó điểm mỗi nhóm được tổng hợp từ tỷ trọng con do Ban giám hiệu tự thiết kế tùy biến bên dưới:
              {localSchema.map((cat: any) => {
                const subFormula = cat.metrics.map((m: any) => `(${m.name.split(' ')[0]}... × ${m.weight}%)`).join(' + ');
                return (
                  <div key={cat.catId} className="mt-1">
                    • <span className="capitalize">{cat.catId}</span> = {subFormula || 'Chưa thiết lập chỉ số con'}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-slate-100 p-4 rounded-xl space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
                <Info size={15} className="text-blue-500" />
                Duy trì sự đồng thuận sư phạm
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Khi các tiêu chí đánh giá và trọng số được cấu hình công khai, giáo viên có thể chủ động rèn luyện và tự đánh giá hiệu suất giảng dạy định kỳ của mình một cách hoàn toàn chuẩn xác.
              </p>
            </div>

            <div className="border border-slate-100 p-4 rounded-xl space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
                <CheckCircle size={15} className="text-emerald-500" />
                Quy chuẩn Thông tư 27 Bộ GD&ĐT
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hệ thống hỗ trợ lưu giữ và thay đổi mẫu biểu các chỉ số con nhằm phù hợp với việc đổi mới nhận xét thường xuyên bằng nhận xét định tính sư phạm điện tử.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customizable KPI Sub-Metrics Configuration Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-500" /> Cấu Hình Chỉ Số Con KPI (Thêm Bớt Tùy Chọn)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Thêm, sửa, xóa các chỉ số đánh giá của từng mảng công việc. Thay đổi sẽ tự động đồng bộ hóa toàn bộ giáo viên.</p>
          </div>

          {/* Action button to save schema */}
          {isAdmin && (
            <button
              onClick={handleSaveSchema}
              disabled={isSavingSchema || localSchema.length === 0}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                saveSchemaSuccess 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-300"
              }`}
            >
              {saveSchemaSuccess ? (
                <>
                  <CheckCircle size={14} /> Lưu Chỉ Số Con Thành Công!
                </>
              ) : isSavingSchema ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save size={14} /> Lưu & Đồng Bộ Toàn Trường
                </>
              )}
            </button>
          )}
        </div>

        {/* Categories Tab selector */}
        <div className="flex border-b border-slate-200">
          {localSchema.map((cat) => (
            <button
              key={cat.catId}
              onClick={() => setActiveCatId(cat.catId)}
              className={`px-4 py-2.5 border-b-2 text-xs font-bold cursor-pointer transition-all ${
                activeCatId === cat.catId 
                ? "border-slate-900 text-slate-900 font-black" 
                : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {cat.name}
              <span className="ml-1.5 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {cat.metrics.length}
              </span>
            </button>
          ))}
        </div>

        {/* Warning if weight is not 100% */}
        {metricsWeightSum !== 100 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <span className="font-bold">Lưu ý tỉ trọng:</span> Tổng trọng số của các chỉ số con hiện tại đang là <span className="font-black font-mono">{metricsWeightSum}%</span>. Bạn nên thiết lập tổng trọng số các chỉ số con bằng <span className="font-black font-mono">100%</span> để đảm bảo điểm quy đổi tối đa chuẩn xác.
            </div>
          </div>
        )}

        {/* Sub-Metrics list */}
        <div className="space-y-4">
          {activeMetrics.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Chưa có chỉ số con nào thuộc nhóm này. Hãy bấm nút "Thêm chỉ số con mới" bên dưới.
            </div>
          ) : (
            activeMetrics.map((metric: any, index: number) => (
              <div 
                key={metric.id}
                className="group border border-slate-200 hover:border-slate-300 p-4 rounded-xl space-y-3 bg-slate-50/50 transition-colors relative"
              >
                
                {/* Delete button absolutely positioned on hover */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteMetric(activeCatId, metric.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 bg-white border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer shadow-xs opacity-80 group-hover:opacity-100 transition-colors"
                    title="Xóa chỉ số này"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Sub-Metric index badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                    Chỉ số {index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Name field */}
                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tên Chỉ Số</label>
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => handleUpdateMetricField(activeCatId, metric.id, 'name', e.target.value)}
                      disabled={!isAdmin}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 disabled:bg-slate-100/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      placeholder="Nhập tên tiêu chí KPI con..."
                    />
                  </div>

                  {/* Target field */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mục Tiêu (Target)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={metric.target}
                      onChange={(e) => handleUpdateMetricField(activeCatId, metric.id, 'target', parseInt(e.target.value) || 0)}
                      disabled={!isAdmin}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 font-mono text-center disabled:bg-slate-100/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Weight field */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trọng Số (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={metric.weight}
                      onChange={(e) => handleUpdateMetricField(activeCatId, metric.id, 'weight', parseInt(e.target.value) || 0)}
                      disabled={!isAdmin}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 font-mono text-center disabled:bg-slate-100/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Description field */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mô Tả / Hướng Dẫn Đạt</label>
                    <textarea
                      value={metric.description}
                      onChange={(e) => handleUpdateMetricField(activeCatId, metric.id, 'description', e.target.value)}
                      disabled={!isAdmin}
                      rows={1}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 resize-none h-[38px] disabled:bg-slate-100/50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      placeholder="Mô tả tiêu chuẩn..."
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add sub-metric trigger button */}
          {isAdmin && (
            <button
              onClick={() => handleAddMetric(activeCatId)}
              className="w-full border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50/50 transition-colors"
            >
              <PlusCircle size={15} /> Thêm Chỉ Số Con Mới Vào Nhóm Này
            </button>
          )}
        </div>
      </div>

      {/* Manage Departments Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <Layers size={16} className="text-blue-500" /> Quản lý Tổ chuyên môn / Tổ Khối
          </h2>
          <p className="text-xs text-slate-500">Ban Giám Hiệu có thể thêm mới hoặc xóa các Tổ chuyên môn / Tổ Khối hiện có trong nhà trường.</p>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            {/* Input to add new department */}
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Nhập tên tổ mới (ví dụ: Tổ Ngoại Ngữ, Tổ Văn Thể Mỹ...)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white"
              />
              <button
                onClick={handleAddDept}
                disabled={isAddingDept || !newDeptName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <FolderPlus size={14} /> Thêm Tổ Mới
              </button>
            </div>

            {/* List of current departments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/50 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-700">{dept}</span>
                  {dept !== "Chưa phân công" && (
                    <button
                      onClick={() => handleDeleteDept(dept)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title={`Xóa ${dept}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-500 border border-slate-100 font-medium">
            🔒 Vui lòng đăng nhập tài khoản Admin để quản lý danh sách các Tổ chuyên môn.
          </div>
        )}
      </div>
    </div>
  );
}
