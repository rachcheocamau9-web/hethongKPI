/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Teacher, KPIWeights } from "./types";
import Dashboard from "./components/Dashboard";
import TeacherList from "./components/TeacherList";
import KPIFormulaWeights from "./components/KPIFormulaWeights";
import TeacherProfileDetail from "./components/TeacherProfileDetail";
import AddTeacherModal from "./components/AddTeacherModal";
import MovementSubmissions from "./components/MovementSubmissions";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw,
  FileDown,
  Plus,
  Calendar,
  Trophy,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Key,
  Menu,
  X
} from "lucide-react";

function ChangePasswordModal({ 
  userType, 
  onSubmit, 
  onClose 
}: { 
  userType: "admin" | "leader", 
  onSubmit: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>, 
  onClose: () => void 
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Vui lòng điền đầy đủ các trường");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    if (newPassword.length < 4) {
      setError("Mật khẩu mới phải từ 4 ký tự trở lên");
      return;
    }
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    const result = await onSubmit(oldPassword, newPassword);
    setIsSubmitting(false);
    if (result.success) {
      setSuccessMsg("Thay đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Key size={16} className="text-blue-600" />
            <span>Đổi mật khẩu {userType === "admin" ? "Ban Giám Hiệu" : "Tổ trưởng/Tổ phó"}</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Mật khẩu hiện tại:
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Mật khẩu mới:
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Xác nhận mật khẩu mới:
            </label>
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700 font-semibold">
              ✓ {successMsg}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupLeaderLoginModal({ teachers, onSubmit, onClose }: { teachers: Teacher[], onSubmit: (id: string, password: string) => Promise<boolean>, onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeader, setSelectedLeader] = useState<Teacher | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaders = teachers.filter(t => t.groupRole === "Tổ trưởng" || t.groupRole === "Tổ phó");
  
  const filteredLeaders = leaders.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.groupRole || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) return;
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    setError("");
    setIsSubmitting(true);
    const success = await onSubmit(selectedLeader.id, password);
    setIsSubmitting(false);
    if (!success) {
      setError("Mật khẩu không chính xác!");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <LogIn size={15} />
            </div>
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wide">
              Đăng nhập Tổ Chuyên Môn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {selectedLeader ? (
          /* Password Entry Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/20">
                <img 
                  src={selectedLeader.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} 
                  alt={selectedLeader.name} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {selectedLeader.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {selectedLeader.department} | {selectedLeader.groupRole}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Nhập mật khẩu của bạn:
                </label>
                <input
                  type="password"
                  placeholder="Mật khẩu đăng nhập (Mặc định: 123456)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium font-mono"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 font-medium">
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedLeader(null);
                  setPassword("");
                  setError("");
                }}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Chọn người khác
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>
          </form>
        ) : (
          /* Leader Selection List */
          <>
            {leaders.length > 0 && (
              <div className="mb-4 shrink-0">
                <input
                  type="text"
                  placeholder="Tìm kiếm Tổ trưởng / Tổ phó..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
              </div>
            )}

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 scrollbar-thin">
              {leaders.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  ⚠️ Chưa có giáo viên nào được Ban Giám Hiệu phân công làm Tổ trưởng hoặc Tổ phó. Vui lòng liên hệ BGH để phân công chức vụ trước.
                </div>
              ) : filteredLeaders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Không tìm thấy tổ trưởng/tổ phó phù hợp với từ khóa.
                </div>
              ) : (
                filteredLeaders.map(l => (
                  <div 
                    key={l.id} 
                    onClick={() => {
                      setSelectedLeader(l);
                      setError("");
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={l.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} 
                        alt={l.name} 
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {l.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5 line-clamp-1">
                          {l.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        l.groupRole === "Tổ trưởng" 
                          ? "bg-amber-100 text-amber-950 border-amber-300"
                          : "bg-orange-100 text-orange-950 border-orange-300"
                      }`}>
                        {l.groupRole}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-all">
                        Chọn
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [weights, setWeights] = useState<KPIWeights>({ teaching: 40, professionalism: 30, activities: 30 });
  const [metricsSchema, setMetricsSchema] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "teachers" | "weights" | "movements">("dashboard");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  // Group Leader Authentication State
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [leaderInfo, setLeaderInfo] = useState<{ id: string; name: string; department: string; groupRole: string } | null>(null);
  const [leaderToken, setLeaderToken] = useState<string | null>(null);
  const [isLeaderLoginModalOpen, setIsLeaderLoginModalOpen] = useState(false);

  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordUserType, setChangePasswordUserType] = useState<"admin" | "leader">("admin");

  const handleChangePasswordSubmit = async (oldPassword: string, newPassword: string) => {
    try {
      const endpoint = changePasswordUserType === "admin" ? "/api/admin/change-password" : "/api/leader/change-password";
      const token = changePasswordUserType === "admin" ? adminToken : leaderToken;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (res.ok) {
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || "Mật khẩu cũ không đúng hoặc có lỗi xảy ra" };
      }
    } catch (err) {
      return { success: false, error: "Lỗi kết nối máy chủ" };
    }
  };

  // Academic Years state
  const [academicYears, setAcademicYears] = useState<string[]>(() => {
    const saved = localStorage.getItem("academicYears");
    return saved ? JSON.parse(saved) : ["2024-2025", "2025-2026", "2026-2027", "2027-2028"];
  });
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => {
    const saved = localStorage.getItem("selectedAcademicYear");
    return saved || "2025-2026";
  });
  const [newYearInput, setNewYearInput] = useState("");
  const [showAddYear, setShowAddYear] = useState(false);

  // Load initial data from Express backend server
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [teachersRes, weightsRes, schemaRes, deptsRes] = await Promise.all([
        fetch("/api/teachers"),
        fetch("/api/weights"),
        fetch("/api/metrics-schema"),
        fetch("/api/departments")
      ]);
      if (teachersRes.ok && weightsRes.ok) {
        const teachersData = await teachersRes.json();
        const weightsData = await weightsRes.json();
        setTeachers(teachersData);
        setWeights(weightsData);
      }
      if (schemaRes && schemaRes.ok) {
        const schemaData = await schemaRes.json();
        setMetricsSchema(schemaData);
      }
      if (deptsRes && deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu từ server:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if session token exists and is valid on startup
  useEffect(() => {
    const checkAdminSession = async () => {
      const storedToken = sessionStorage.getItem("adminToken");
      if (storedToken) {
        try {
          const res = await fetch("/api/admin/verify-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedToken })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.valid) {
              setIsAdmin(true);
              setAdminToken(storedToken);
            } else {
              sessionStorage.removeItem("adminToken");
            }
          }
        } catch (e) {
          console.error("Lỗi xác minh token admin:", e);
        }
      }
    };
    const checkLeaderSession = async () => {
      const storedLeaderToken = sessionStorage.getItem("leaderToken");
      if (storedLeaderToken) {
        try {
          const res = await fetch("/api/leader/verify-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: storedLeaderToken })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.valid) {
              setIsLeader(true);
              setLeaderToken(storedLeaderToken);
              setLeaderInfo(data.leader);
            } else {
              sessionStorage.removeItem("leaderToken");
            }
          }
        } catch (e) {
          console.error("Lỗi xác minh token leader:", e);
        }
      }
    };
    checkAdminSession();
    checkLeaderSession();
    loadData();
  }, []);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPasswordInput })
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(true);
        setAdminToken(data.token);
        sessionStorage.setItem("adminToken", data.token);
        setIsAdminLoginModalOpen(false);
        setAdminPasswordInput("");
        loadData();
      } else {
        let errorMessage = "Mật khẩu không chính xác!";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await res.text();
            console.error("Non-JSON admin login error:", text);
            errorMessage = `Lỗi hệ thống (${res.status})`;
          }
        } catch (parseErr) {
          console.error("Error parsing login error response:", parseErr);
          errorMessage = `Lỗi hệ thống (${res.status})`;
        }
        setAdminLoginError(errorMessage);
      }
    } catch (err) {
      console.error("Network error during admin login:", err);
      setAdminLoginError("Lỗi kết nối máy chủ");
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: adminToken })
        });
      } catch (e) {
        console.error("Lỗi đăng xuất:", e);
      }
    }
    setIsAdmin(false);
    setAdminToken(null);
    sessionStorage.removeItem("adminToken");
    if (activeTab === "weights") {
      setActiveTab("dashboard");
    }
  };

  const getAuthToken = () => {
    return adminToken || leaderToken || "";
  };

  const handleLeaderLoginSubmit = async (teacherId: string, password?: string) => {
    try {
      const res = await fetch("/api/leader/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, password })
      });
      if (res.ok) {
        const data = await res.json();
        setIsLeader(true);
        setLeaderToken(data.token);
        setLeaderInfo(data.leader);
        sessionStorage.setItem("leaderToken", data.token);
        setIsLeaderLoginModalOpen(false);
        loadData();
        setActiveTab("teachers");
        return true;
      } else {
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data.error) {
              alert(data.error);
            }
          } else {
            const text = await res.text();
            console.error("Non-JSON leader login error:", text);
            alert(`Lỗi hệ thống (${res.status})`);
          }
        } catch (e) {
          console.error("Error parsing leader login response:", e);
          alert(`Lỗi hệ thống (${res.status})`);
        }
        return false;
      }
    } catch (err: any) {
      console.error("Network error during leader login:", err);
      alert("Lỗi kết nối máy chủ");
      return false;
    }
  };

  const handleLeaderLogout = async () => {
    if (leaderToken) {
      try {
        await fetch("/api/leader/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: leaderToken })
        });
      } catch (e) {
        console.error("Lỗi đăng xuất leader:", e);
      }
    }
    setIsLeader(false);
    setLeaderToken(null);
    setLeaderInfo(null);
    sessionStorage.removeItem("leaderToken");
    setActiveTab("dashboard");
  };

  // Update formula weights live across server & client
  const handleUpdateWeights = async (newWeights: KPIWeights) => {
    const res = await fetch("/api/weights", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(newWeights)
    });
    if (res.ok) {
      const data = await res.json();
      setWeights(data.weights);
      setTeachers(data.teachers);
    } else {
      throw new Error("Lỗi cập nhật trọng số");
    }
  };

  // Update metrics schema
  const handleUpdateMetricsSchema = async (newSchema: any[]) => {
    const res = await fetch("/api/metrics-schema", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(newSchema)
    });
    if (res.ok) {
      const data = await res.json();
      setMetricsSchema(data.schema);
      setTeachers(data.teachers);
    } else {
      throw new Error("Lỗi cập nhật cấu hình chỉ số");
    }
  };

  // Update specific teacher KPIs
  const handleUpdateTeacherKPIs = async (teacherId: string, updatedKpis: any[]) => {
    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ kpis: updatedKpis })
    });
    if (res.ok) {
      const updatedTeacher = await res.json();
      setTeachers(prev => prev.map(t => t.id === teacherId ? updatedTeacher : t));
    } else {
      throw new Error("Lỗi cập nhật chỉ số");
    }
  };

  // Update teacher general details (e.g. transfer to another department or subject)
  const handleUpdateTeacherDetails = async (teacherId: string, updatedFields: any) => {
    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(updatedFields)
    });
    if (res.ok) {
      const updatedTeacher = await res.json();
      setTeachers(prev => prev.map(t => t.id === teacherId ? updatedTeacher : t));
    } else {
      throw new Error("Lỗi cập nhật thông tin giáo viên");
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (teacherId: string) => {
    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${getAuthToken()}`
      }
    });
    if (res.ok) {
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      if (selectedTeacherId === teacherId) {
        setSelectedTeacherId(null);
      }
    } else {
      throw new Error("Lỗi khi xóa giáo viên");
    }
  };

  // Trigger Gemini AI review
  const handleTriggerAIEvaluation = async (teacherId: string, evaluatorName: string) => {
    const res = await fetch(`/api/teachers/${teacherId}/evaluate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ evaluatorName })
    });
    if (res.ok) {
      const data = await res.json();
      const newEval = data.evaluation;
      // Sync state
      setTeachers(prev => prev.map(t => {
        if (t.id === teacherId) {
          return {
            ...t,
            evaluations: [newEval, ...t.evaluations]
          };
        }
        return t;
      }));
      return newEval;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || "Lỗi AI phân tích");
    }
  };

  // Create new teacher
  const handleAddTeacher = async (newTeacherData: any) => {
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        ...newTeacherData,
        academicYear: selectedAcademicYear
      })
    });
    if (res.ok) {
      const created = await res.json();
      setTeachers(prev => [...prev, created]);
    } else {
      throw new Error("Lỗi thêm giáo viên");
    }
  };

  // Import multiple teachers in batch
  const handleImportBulkTeachers = async (teachersList: any[]) => {
    const res = await fetch("/api/teachers/bulk", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        teachers: teachersList.map(t => ({
          ...t,
          academicYear: selectedAcademicYear
        }))
      })
    });
    if (res.ok) {
      const data = await res.json();
      setTeachers(prev => [...prev, ...data.teachers]);
    } else {
      throw new Error("Lỗi thêm đồng loạt giáo viên");
    }
  };

  // Add new academic year
  const handleAddAcademicYear = (newYear: string) => {
    const trimmed = newYear.trim();
    if (!trimmed) return;
    if (academicYears.includes(trimmed)) {
      alert("Năm học này đã tồn tại!");
      return;
    }
    const updated = [...academicYears, trimmed].sort();
    setAcademicYears(updated);
    localStorage.setItem("academicYears", JSON.stringify(updated));
    setSelectedAcademicYear(trimmed);
    localStorage.setItem("selectedAcademicYear", trimmed);
    setNewYearInput("");
    setShowAddYear(false);
  };

  const handleSelectAcademicYear = (year: string) => {
    setSelectedAcademicYear(year);
    localStorage.setItem("selectedAcademicYear", year);
  };

  // Filter teachers by active academic year
  const filteredTeachers = React.useMemo(() => {
    let list = teachers.filter(t => t.academicYear === selectedAcademicYear);
    if (isLeader && leaderInfo) {
      list = list.filter(t => t.department === leaderInfo.department);
    }
    return list;
  }, [teachers, selectedAcademicYear, isLeader, leaderInfo]);

  const selectedTeacher = React.useMemo(() => {
    const teacher = teachers.find(t => t.id === selectedTeacherId) || null;
    if (teacher && isLeader && leaderInfo && teacher.department !== leaderInfo.department) {
      return null;
    }
    return teacher;
  }, [teachers, selectedTeacherId, isLeader, leaderInfo]);

  const handleSelectTeacherFromDashboard = (teacher: Teacher) => {
    setSelectedTeacherId(teacher.id);
    setActiveTab("teachers");
  };

  // Export results to Excel HTML format
  const handleExportExcel = () => {
    let tableRows = "";
    filteredTeachers.forEach((t, idx) => {
      const teachingCat = t.kpis.find(k => k.id === "teaching");
      const profCat = t.kpis.find(k => k.id === "professionalism");
      const actCat = t.kpis.find(k => k.id === "activities");
      
      const teachingScore = teachingCat ? teachingCat.metrics.reduce((sum, m) => sum + (m.actual * (m.weight / 100)), 0) : 0;
      const profScore = profCat ? profCat.metrics.reduce((sum, m) => sum + (m.actual * (m.weight / 100)), 0) : 0;
      const actScore = actCat ? actCat.metrics.reduce((sum, m) => sum + (m.actual * (m.weight / 100)), 0) : 0;

      tableRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;"><b>${t.name}</b></td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${t.email}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${t.department}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${t.subject}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">${teachingScore.toFixed(1)}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">${profScore.toFixed(1)}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9;">${actScore.toFixed(1)}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f0fdf4; color: #15803d;">${t.overallScore}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${t.status}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${t.kpiPeriod}</td>
        </tr>
      `;
    });

    const isGroupLeaderExport = isLeader && leaderInfo;
    const reportTitle = isGroupLeaderExport 
      ? `BÁO CÁO KẾT QUẢ ĐÁNH GIÁ KPI GIÁO VIÊN - TỔ ${leaderInfo.department.toUpperCase()}`
      : "BÁO CÁO KẾT QUẢ ĐÁNH GIÁ KPI GIÁO VIÊN TIỂU HỌC";
    
    const reportSubtitle = isGroupLeaderExport
      ? `Tổ chuyên môn: ${leaderInfo.department} | Tổ trưởng: ${leaderInfo.name} | Năm học: ${selectedAcademicYear} | Xuất bản lúc: ${new Date().toLocaleString('vi-VN')}`
      : `Năm học: ${selectedAcademicYear} | Xuất bản lúc: ${new Date().toLocaleString('vi-VN')}`;

    const downloadFilename = isGroupLeaderExport
      ? `Bao_cao_KPI_Giao_vien_To_${leaderInfo.department.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedAcademicYear.replace('/', '-')}.xls`
      : `Bao_cao_KPI_Giao_vien_${selectedAcademicYear.replace('/', '-')}.xls`;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>KPI Giáo Viên</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0f172a; color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
          .title { font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; color: #1e293b; }
          .subtitle { font-size: 12px; text-align: center; margin-bottom: 20px; color: #64748b; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="title">${reportTitle}</div>
        <div class="subtitle">${reportSubtitle}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; background-color: #0f172a; color: white;">STT</th>
              <th style="background-color: #0f172a; color: white;">Họ Tên Giáo Viên</th>
              <th style="background-color: #0f172a; color: white;">Email</th>
              <th style="background-color: #0f172a; color: white;">Tổ Khối / Bộ Môn</th>
              <th style="background-color: #0f172a; color: white;">Môn Giảng Dạy</th>
              <th style="background-color: #0f172a; color: white;">Điểm Giảng Dạy (Học tập)</th>
              <th style="background-color: #0f172a; color: white;">Điểm Chuyên Môn (Hồ sơ)</th>
              <th style="background-color: #0f172a; color: white;">Điểm Phong Trào (Quan hệ)</th>
              <th style="background-color: #0f172a; color: white;">Điểm Tổng Hợp KPI</th>
              <th style="background-color: #0f172a; color: white;">Xếp Loại KPI</th>
              <th style="background-color: #0f172a; color: white;">Kỳ Đánh Giá</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f1f6fa] flex flex-col font-sans">
      
      {/* School Top Branding Nav */}
      <header className="bg-gradient-to-r from-[#0d2a5c] via-[#1a3a70] to-[#254c8c] text-white border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo/Icon Title */}
            <div className="flex items-center gap-2.5">
              <div className="bg-white text-blue-900 p-2.5 rounded-xl shadow-md shrink-0 flex items-center justify-center">
                <Award size={22} className="text-blue-700" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-white block uppercase tracking-wide leading-tight">
                  TIỂU HỌC RẠCH CHÈO
                </span>
                <span className="text-[8px] sm:text-[9px] text-sky-300 font-extrabold uppercase tracking-widest block font-mono leading-none mt-0.5">
                  HỆ THỐNG ĐÁNH GIÁ KPI LMS
                </span>
              </div>
            </div>

            {/* Desktop Navigation (Hidden on mobile/tablet screens < 1024px) */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => { setActiveTab("dashboard"); setSelectedTeacherId(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === "dashboard" && !selectedTeacherId
                    ? "bg-blue-950/60 text-white shadow-inner border border-blue-800/40"
                    : "text-blue-100 hover:text-white hover:bg-blue-800/40"
                }`}
              >
                <LayoutDashboard size={14} /> Tổng quan
              </button>
              <button
                onClick={() => { setActiveTab("teachers"); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === "teachers" || selectedTeacherId
                    ? "bg-blue-950/60 text-white shadow-inner border border-blue-800/40"
                    : "text-blue-100 hover:text-white hover:bg-blue-800/40"
                }`}
              >
                <Users size={14} /> Hồ sơ Giáo viên
              </button>
              <button
                onClick={() => { setActiveTab("movements"); setSelectedTeacherId(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === "movements" && !selectedTeacherId
                    ? "bg-blue-950/60 text-white shadow-inner border border-blue-800/40"
                    : "text-blue-100 hover:text-white hover:bg-blue-800/40"
                }`}
              >
                <Trophy size={14} /> Nộp bài phong trào
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setActiveTab("weights"); setSelectedTeacherId(null); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeTab === "weights"
                      ? "bg-blue-950/60 text-white shadow-inner border border-blue-800/40"
                      : "text-blue-100 hover:text-white hover:bg-blue-800/40"
                  }`}
                >
                  <Settings size={14} /> Trọng số & Chỉ số
                </button>
              )}
            </nav>

            {/* Desktop Actions & Auth (Hidden on screens < 1024px) */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Year Dropdown */}
              <div className="flex items-center gap-1.5 bg-blue-950/40 rounded-lg px-2.5 py-1.5 border border-blue-800/80">
                <Calendar size={13} className="text-blue-300" />
                <span className="text-[11px] font-bold text-blue-200">Năm:</span>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => handleSelectAcademicYear(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer outline-none"
                >
                  {academicYears.map((year) => (
                    <option key={year} value={year} className="text-slate-800">{year}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAddYear(!showAddYear)}
                  className="text-blue-300 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                  title="Thêm năm học mới"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Excel Export */}
              {(isAdmin || isLeader) && (
                <button
                  onClick={handleExportExcel}
                  disabled={filteredTeachers.length === 0}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title={isLeader ? "Xuất kết quả của tổ mình ra Excel" : "Xuất kết quả của năm học này ra Excel"}
                >
                  <FileDown size={14} />
                  <span>Xuất Excel</span>
                </button>
              )}

              {/* Authentication Status */}
              {isAdmin ? (
                <div className="flex items-center gap-1 bg-blue-950/55 px-2.5 py-1 rounded-lg border border-blue-800">
                  <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-[10px]">
                    <ShieldCheck size={14} className="animate-pulse text-emerald-400" />
                    <span>BGH (Admin)</span>
                  </div>
                  <button
                    onClick={() => {
                      setChangePasswordUserType("admin");
                      setIsChangePasswordModalOpen(true);
                    }}
                    className="p-1 text-blue-300 hover:text-white rounded transition-colors cursor-pointer"
                    title="Đổi mật khẩu Ban Giám Hiệu"
                  >
                    <Key size={13} />
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="p-1 text-rose-400 hover:text-rose-200 rounded transition-colors cursor-pointer"
                    title="Đăng xuất quyền quản trị"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : isLeader && leaderInfo ? (
                <div className="flex items-center gap-1 bg-blue-950/55 px-2.5 py-1 rounded-lg border border-blue-800">
                  <div className="flex items-center gap-1 text-sky-300 font-extrabold text-[10px] max-w-[120px]">
                    <ShieldCheck size={14} className="animate-pulse text-sky-400" />
                    <span className="truncate">{leaderInfo.groupRole} - {leaderInfo.department}</span>
                  </div>
                  <button
                    onClick={() => {
                      setChangePasswordUserType("leader");
                      setIsChangePasswordModalOpen(true);
                    }}
                    className="p-1 text-blue-300 hover:text-white rounded transition-colors cursor-pointer"
                    title="Đổi mật khẩu Tổ"
                  >
                    <Key size={13} />
                  </button>
                  <button
                    onClick={handleLeaderLogout}
                    className="p-1 text-rose-400 hover:text-rose-200 rounded transition-colors cursor-pointer"
                    title="Đăng xuất Tổ"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setAdminLoginError("");
                      setAdminPasswordInput("");
                      setIsAdminLoginModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-blue-950 hover:bg-blue-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-blue-800"
                  >
                    <Lock size={11} />
                    <span>Admin</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLeaderLoginModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogIn size={11} />
                    <span>Tổ Trưởng</span>
                  </button>
                </div>
              )}

              <button 
                onClick={loadData}
                className="p-1.5 text-blue-200 hover:text-white bg-blue-950/40 rounded-lg border border-blue-800 cursor-pointer transition-colors shrink-0"
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Mobile Controls & Hamburger (Visible on mobile & tablets) */}
            <div className="flex lg:hidden items-center gap-2">
              <button 
                onClick={loadData}
                className="p-2 text-blue-200 hover:text-white bg-blue-950/30 rounded-lg border border-blue-800/80 cursor-pointer transition-colors"
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={14} />
              </button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-blue-100 hover:text-white bg-blue-950/40 border border-blue-800 rounded-lg cursor-pointer transition-colors"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Panel / Drawer (Expands below header) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#132d56] border-b border-blue-900 animate-in fade-in slide-in-from-top-4 duration-200 shadow-inner px-4 py-4 space-y-4">
            
            {/* Tabs List */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-blue-300 tracking-widest block mb-1">
                Danh mục ứng dụng
              </label>
              <button
                onClick={() => { setActiveTab("dashboard"); setSelectedTeacherId(null); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "dashboard" && !selectedTeacherId
                    ? "bg-blue-800 text-white border border-blue-700/60"
                    : "text-blue-100 hover:text-white hover:bg-blue-850"
                }`}
              >
                <LayoutDashboard size={15} /> 
                <span>Tổng quan hiệu suất KPI</span>
              </button>
              <button
                onClick={() => { setActiveTab("teachers"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "teachers" || selectedTeacherId
                    ? "bg-blue-800 text-white border border-blue-700/60"
                    : "text-blue-100 hover:text-white hover:bg-blue-850"
                }`}
              >
                <Users size={15} /> 
                <span>Hồ sơ năng lực Giáo viên</span>
              </button>
              <button
                onClick={() => { setActiveTab("movements"); setSelectedTeacherId(null); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "movements" && !selectedTeacherId
                    ? "bg-blue-800 text-white border border-blue-700/60"
                    : "text-blue-100 hover:text-white hover:bg-blue-850"
                }`}
              >
                <Trophy size={15} /> 
                <span>Danh sách bài phong trào</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setActiveTab("weights"); setSelectedTeacherId(null); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "weights"
                      ? "bg-blue-800 text-white border border-blue-700/60"
                      : "text-blue-100 hover:text-white hover:bg-blue-850"
                  }`}
                >
                  <Settings size={15} /> 
                  <span>Cấu hình Trọng số & Chỉ số</span>
                </button>
              )}
            </div>

            {/* Config row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-blue-900/60">
              {/* Year Dropdown */}
              <div className="flex items-center justify-between bg-blue-950/60 rounded-lg px-3 py-2 border border-blue-900/80">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-300" />
                  <span className="text-xs font-bold text-blue-200">Năm học:</span>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => handleSelectAcademicYear(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year} className="text-slate-800">{year}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setShowAddYear(!showAddYear); setIsMobileMenuOpen(false); }}
                    className="text-blue-300 hover:text-white p-1 rounded transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Excel Export Mobile */}
              {(isAdmin || isLeader) && (
                <button
                  onClick={() => { handleExportExcel(); setIsMobileMenuOpen(false); }}
                  disabled={filteredTeachers.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg border border-emerald-500 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <FileDown size={15} />
                  <span>Xuất báo cáo Excel</span>
                </button>
              )}
            </div>

            {/* Auth panel */}
            <div className="pt-3 border-t border-blue-900/60">
              {isAdmin ? (
                <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck size={15} className="animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wide">BGH (Quản trị viên)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setChangePasswordUserType("admin");
                          setIsChangePasswordModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="bg-blue-800 hover:bg-blue-750 border border-blue-700 text-blue-100 text-[11px] font-semibold py-1.5 px-2.5 rounded transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Key size={12} />
                        Đổi mật khẩu
                      </button>
                      <button
                        onClick={() => { handleAdminLogout(); setIsMobileMenuOpen(false); }}
                        className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[11px] font-semibold py-1.5 px-2.5 rounded transition-all cursor-pointer flex items-center gap-1"
                      >
                        <LogOut size={12} />
                        Thoát
                      </button>
                    </div>
                  </div>
                </div>
              ) : isLeader && leaderInfo ? (
                <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-sky-300">
                      <ShieldCheck size={15} className="animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wide truncate max-w-[150px]">{leaderInfo.groupRole} - {leaderInfo.department}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setChangePasswordUserType("leader");
                          setIsChangePasswordModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="bg-blue-800 hover:bg-blue-750 border border-blue-700 text-blue-100 text-[11px] font-semibold py-1.5 px-2.5 rounded transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Key size={12} />
                        Đổi mật khẩu
                      </button>
                      <button
                        onClick={() => { handleLeaderLogout(); setIsMobileMenuOpen(false); }}
                        className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[11px] font-semibold py-1.5 px-2.5 rounded transition-all cursor-pointer flex items-center gap-1"
                      >
                        <LogOut size={12} />
                        Thoát
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAdminLoginError("");
                      setAdminPasswordInput("");
                      setIsAdminLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg border border-blue-900"
                  >
                    <Lock size={12} />
                    <span>Đăng nhập BGH</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLeaderLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-450 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg"
                  >
                    <LogIn size={12} />
                    <span>Đăng nhập Tổ</span>
                  </button>
                </div>
              )}
            </div>
            
          </div>
        )}
      </header>
      {/* Add Academic Year Inline Input Card */}
      {showAddYear && (
        <div className="bg-slate-900/5 backdrop-blur-xs py-3 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Thêm năm học mới:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="VD: 2026-2027"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-slate-500 font-bold"
              />
              <button
                onClick={() => handleAddAcademicYear(newYearInput)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer transition-colors"
              >
                Thêm
              </button>
              <button
                onClick={() => setShowAddYear(false)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-2 py-1 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Leader Guidance Banner */}
      {isLeader && leaderInfo && (
        <div className="bg-blue-50 border-b border-blue-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 animate-pulse" />
              <p className="text-xs font-semibold text-blue-800">
                Chào thầy/cô <strong className="font-bold text-blue-900">{leaderInfo.name}</strong> ({leaderInfo.groupRole}). 
                Bạn đang quản lý chuyên môn <strong className="font-bold text-blue-900">{leaderInfo.department}</strong>. 
                Bạn có toàn quyền cập nhật chỉ số KPI và Đánh giá AI cho các giáo viên thuộc tổ của mình.
              </p>
            </div>
            <button
              onClick={handleLeaderLogout}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer hover:no-underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-900 border-t-transparent"></div>
            <p className="text-xs text-slate-400 font-medium">Đang tải dữ liệu hồ sơ KPI...</p>
          </div>
        ) : selectedTeacher ? (
          // Drilldown Profile Detail View
          <TeacherProfileDetail
            teacher={selectedTeacher}
            onBack={() => setSelectedTeacherId(null)}
            onUpdateTeacherKPIs={handleUpdateTeacherKPIs}
            onTriggerAIEvaluation={handleTriggerAIEvaluation}
            onUpdateTeacherDetails={handleUpdateTeacherDetails}
            onDeleteTeacher={handleDeleteTeacher}
            isAdmin={isAdmin}
            isLeader={isLeader}
            leaderInfo={leaderInfo}
            departments={departments}
          />
        ) : (
          // Tabs Navigation Content
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                teachers={filteredTeachers}
                weights={weights}
                onSelectTeacher={handleSelectTeacherFromDashboard}
              />
            )}

            {activeTab === "teachers" && (
              <TeacherList
                teachers={filteredTeachers}
                onSelectTeacher={(t) => setSelectedTeacherId(t.id)}
                onAddTeacherClick={() => setIsAddModalOpen(true)}
                onDeleteTeacher={handleDeleteTeacher}
                isAdmin={isAdmin}
                isLeader={isLeader}
                leaderInfo={leaderInfo}
                departments={departments}
              />
            )}

            {activeTab === "weights" && (
              <KPIFormulaWeights
                weights={weights}
                onUpdateWeights={handleUpdateWeights}
                metricsSchema={metricsSchema}
                onUpdateMetricsSchema={handleUpdateMetricsSchema}
                isAdmin={isAdmin}
                departments={departments}
                onRefreshDepartments={loadData}
                adminToken={adminToken}
              />
            )}

            {activeTab === "movements" && (
              <MovementSubmissions
                teachers={teachers}
                onRefreshTeachers={loadData}
                isAdmin={isAdmin}
                adminToken={adminToken}
                isLeader={isLeader}
                leaderInfo={leaderInfo}
                departments={departments}
              />
            )}
          </>
        )}
      </main>

      {/* School Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-400 text-center text-[11px] font-medium space-y-1">
        <div>HỆ THỐNG ĐÁNH GIÁ CHỈ SỐ KPI GIÁO VIÊN TOÀN DIỆN & MINH BẠCH</div>
        <div className="text-slate-300 uppercase font-mono tracking-widest text-[9px]">
          Phiên bản 1.3.0 • Được bảo chứng bởi AI đánh giá sư phạm thông minh
        </div>
      </footer>

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <AddTeacherModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTeacher}
          onAddBulk={handleImportBulkTeachers}
          departments={departments}
        />
      )}

      {/* Admin Login Modal */}
      {isAdminLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                  <Lock size={15} />
                </div>
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                  Đăng nhập Ban Giám Hiệu
                </h3>
              </div>
              <button
                onClick={() => setIsAdminLoginModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer transition-colors p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wide">
                  Mật khẩu xác thực (Mật khẩu Admin)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu để truy cập..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-mono"
                  />
                </div>
                {adminLoginError && (
                  <p className="text-rose-500 text-[11px] font-bold mt-1">
                    ⚠️ {adminLoginError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Leader Login Modal */}
      {isLeaderLoginModalOpen && (
        <GroupLeaderLoginModal
          teachers={teachers}
          onSubmit={handleLeaderLoginSubmit}
          onClose={() => setIsLeaderLoginModalOpen(false)}
        />
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          userType={changePasswordUserType}
          onSubmit={handleChangePasswordSubmit}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </div>
  );
}
