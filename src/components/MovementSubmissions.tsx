import React, { useState, useEffect } from "react";
import { Teacher } from "../types";
import { 
  Award, 
  Trophy, 
  Sparkles, 
  Plus, 
  Calendar, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Send, 
  Info, 
  User, 
  Flame,
  Check,
  AlertCircle,
  FileDown,
  FolderDown,
  ToggleLeft,
  ToggleRight,
  Edit2
} from "lucide-react";

interface MovementSubmissionProps {
  teachers: Teacher[];
  onRefreshTeachers: () => void;
  isAdmin?: boolean;
  adminToken?: string | null;
  isLeader?: boolean;
  leaderInfo?: { id: string; name: string; department: string; groupRole: string } | null;
  departments?: string[];
}

interface Submission {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  title: string;
  description: string;
  link: string;
  submittedAt: string;
  status: string;
}

interface Movement {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  deadline: string;
  reward: string;
  driveLink?: string;
  submissions: Submission[];
  active?: boolean;
}

export default function MovementSubmissions({ 
  teachers, 
  onRefreshTeachers, 
  isAdmin = false, 
  adminToken = null,
  isLeader = false,
  leaderInfo = null,
  departments = []
}: MovementSubmissionProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedMovId, setSelectedMovId] = useState<string>("");
  const [filterMovId, setFilterMovId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasDefaultedFilter, setHasDefaultedFilter] = useState(false);

  // Form states for teacher submission
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDesc, setEntryDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Admin state for creating a new exam/movement
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newMovTitle, setNewMovTitle] = useState("");
  const [newMovDesc, setNewMovDesc] = useState("");
  const [newMovStart, setNewMovStart] = useState("");
  const [newMovEnd, setNewMovEnd] = useState("");
  const [newMovReward, setNewMovReward] = useState("");
  const [newMovDriveLink, setNewMovDriveLink] = useState("");
  const [isCreatingMov, setIsCreatingMov] = useState(false);

  // Admin state for editing an existing exam/movement
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editMovTitle, setEditMovTitle] = useState("");
  const [editMovDesc, setEditMovDesc] = useState("");
  const [editMovStart, setEditMovStart] = useState("");
  const [editMovEnd, setEditMovEnd] = useState("");
  const [editMovReward, setEditMovReward] = useState("");
  const [editMovDriveLink, setEditMovDriveLink] = useState("");
  const [isUpdatingMov, setIsUpdatingMov] = useState(false);

  // Status helper based on dates
  const getMovStatus = (mov: Movement) => {
    if (mov.active === false) {
      return {
        text: "Đã tắt",
        color: "bg-slate-100 text-slate-500 border-slate-300",
        isOpen: false
      };
    }
    const today = new Date().toISOString().split("T")[0];
    if (today < mov.startDate) {
      return {
        text: "Sắp diễn ra",
        color: "bg-slate-50 text-slate-500 border-slate-200",
        isOpen: false
      };
    } else if (today > mov.endDate) {
      return {
        text: "Đã kết thúc",
        color: "bg-rose-50 text-rose-600 border-rose-200",
        isOpen: false
      };
    } else {
      return {
        text: "Đang mở",
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
        isOpen: true
      };
    }
  };

  // Sort movements: currently open ("Đang mở") first, then upcoming/others, then ended/disabled
  const sortedMovements = React.useMemo(() => {
    return [...movements].sort((a, b) => {
      const statusA = getMovStatus(a);
      const statusB = getMovStatus(b);
      
      // 1. "Đang mở" (isOpen: true) comes first
      if (statusA.isOpen && !statusB.isOpen) return -1;
      if (!statusA.isOpen && statusB.isOpen) return 1;
      
      // 2. Active ones (active !== false) before inactive (Đã tắt)
      const activeA = a.active !== false;
      const activeB = b.active !== false;
      if (activeA && !activeB) return -1;
      if (!activeA && activeB) return 1;
      
      // 3. Newer start date first
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [movements]);

  // Dynamically synchronize selected/filter movement IDs based on sorted movements
  useEffect(() => {
    if (sortedMovements.length > 0) {
      const firstOpen = sortedMovements.find(m => getMovStatus(m).isOpen);
      
      // Default choice for the entry submission form
      const isValidSelected = sortedMovements.some(m => m.id === selectedMovId);
      if (!selectedMovId || !isValidSelected) {
        setSelectedMovId(firstOpen ? firstOpen.id : sortedMovements[0].id);
      }
      
      // Default choice for viewing submissions filter
      const isValidFilter = filterMovId === "all" || sortedMovements.some(m => m.id === filterMovId);
      if (!isValidFilter) {
        setFilterMovId(firstOpen ? firstOpen.id : "all");
      } else if (filterMovId === "all" && firstOpen && !hasDefaultedFilter) {
        // Auto-focus on currently running competition by default on initial load
        setFilterMovId(firstOpen.id);
        setHasDefaultedFilter(true);
      }
    }
  }, [sortedMovements, selectedMovId, filterMovId, hasDefaultedFilter]);

  // Load movements from backend
  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/movements");
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      } else {
        setErrorMessage("Lỗi khi tải danh sách phong trào.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Không thể kết nối tới máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovTitle.trim() || !newMovStart || !newMovEnd) {
      setErrorMessage("Vui lòng điền đầy đủ Tên kì thi, Ngày bắt đầu và Ngày kết thúc.");
      return;
    }

    setIsCreatingMov(true);
    setErrorMessage("");
    setSuccessMessage("");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newMovTitle.trim(),
          description: newMovDesc.trim(),
          startDate: newMovStart,
          endDate: newMovEnd,
          reward: newMovReward.trim() || "Điểm cộng KPI Chuyên môn & Phong trào.",
          driveLink: newMovDriveLink.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage(`Đã mở thành công đợt thi mới: "${newMovTitle.trim()}"!`);
        
        // Reset Admin form
        setNewMovTitle("");
        setNewMovDesc("");
        setNewMovStart("");
        setNewMovEnd("");
        setNewMovReward("");
        setNewMovDriveLink("");
        
        // Select newly created movement
        const created = data.movements.find((m: any) => m.title === newMovTitle.trim());
        if (created) {
          setSelectedMovId(created.id);
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Có lỗi xảy ra khi tạo đợt thi mới.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối máy chủ khi tạo đợt thi.");
    } finally {
      setIsCreatingMov(false);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setErrorMessage("");
    setSuccessMessage("");

    if (!teacherId) return;

    const targetMov = movements.find(m => m.id === selectedMovId);
    if (targetMov && targetMov.submissions) {
      const alreadySubmitted = targetMov.submissions.some((sub: any) => sub.teacherId === teacherId);
      if (alreadySubmitted) {
        setErrorMessage("Giáo viên này đã nộp bài minh chứng cho phong trào thi đua này rồi. Không thể nộp lại lần 2.");
        // Reset uploaded file to prevent cross-submission
        setUploadedFileName("");
        setUploadedFileUrl("");
        setEntryTitle("");
      }
    }
  };

  const handleMovementChange = (movId: string) => {
    setSelectedMovId(movId);
    setErrorMessage("");
    setSuccessMessage("");

    if (!movId || !selectedTeacherId) return;

    const targetMov = movements.find(m => m.id === movId);
    if (targetMov && targetMov.submissions) {
      const alreadySubmitted = targetMov.submissions.some((sub: any) => sub.teacherId === selectedTeacherId);
      if (alreadySubmitted) {
        setErrorMessage("Giáo viên đã chọn đã nộp bài minh chứng cho phong trào thi đua này rồi. Không thể nộp lại lần 2.");
        // Reset uploaded file to prevent cross-submission
        setUploadedFileName("");
        setUploadedFileUrl("");
        setEntryTitle("");
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedTeacherId) {
      setErrorMessage("Vui lòng chọn giáo viên nộp bài trước khi tải lên file minh chứng (*).");
      return;
    }

    const targetMov = movements.find(m => m.id === selectedMovId);
    if (targetMov && targetMov.submissions) {
      const alreadySubmitted = targetMov.submissions.some((sub: any) => sub.teacherId === selectedTeacherId);
      if (alreadySubmitted) {
        setErrorMessage("Giáo viên này đã nộp bài minh chứng cho phong trào thi đua này rồi. Không thể tải thêm file.");
        return;
      }
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);

    setUploadingFile(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData: base64Data,
              teacherName: teacher?.name || ""
            })
          });

          if (res.ok) {
            const data = await res.json();
            setUploadedFileName(data.name);
            setUploadedFileUrl(data.url);
            setEntryTitle(`Bài dự thi - ${teacher?.name || ""}`); // Store standard title
            setSuccessMessage(`Đã tải lên tệp minh chứng thành công.`);
          } else {
            const errData = await res.json();
            setErrorMessage(errData.error || "Không thể tải lên tệp tin.");
          }
        } catch (err) {
          console.error(err);
          setErrorMessage("Lỗi kết nối khi tải tệp lên máy chủ.");
        } finally {
          setUploadingFile(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage("Lỗi đọc dữ liệu tệp tin.");
        setUploadingFile(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setErrorMessage("Có lỗi xảy ra khi xử lý tệp.");
      setUploadingFile(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleStartEditMovement = (mov: Movement) => {
    setEditingMovement(mov);
    setEditMovTitle(mov.title);
    setEditMovDesc(mov.description || "");
    setEditMovStart(mov.startDate);
    setEditMovEnd(mov.endDate);
    setEditMovReward(mov.reward || "");
    setEditMovDriveLink(mov.driveLink || "");
  };

  const handleUpdateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    
    if (!editMovTitle || !editMovStart || !editMovEnd) {
      setErrorMessage("Vui lòng điền đầy đủ tiêu đề, ngày bắt đầu và ngày kết thúc.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdatingMov(true);

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`/api/movements/${editingMovement.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editMovTitle,
          description: editMovDesc,
          startDate: editMovStart,
          endDate: editMovEnd,
          reward: editMovReward,
          driveLink: editMovDriveLink.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage("Đã cập nhật thông tin kì thi/phong trào thành công.");
        setEditingMovement(null); // Close modal
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Có lỗi xảy ra khi cập nhật đợt thi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối máy chủ khi cập nhật đợt thi.");
    } finally {
      setIsUpdatingMov(false);
    }
  };

  const handleDeleteMovement = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phong trào/kì thi này không? Tất cả bài dự thi đi kèm sẽ bị xóa hoàn toàn.")) return;
    
    setErrorMessage("");
    setSuccessMessage("");
    
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`/api/movements/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage("Đã xóa kì thi/phong trào thành công.");
        if (selectedMovId === id) {
          setSelectedMovId(data.movements[0]?.id || "");
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Lỗi khi xóa kì thi/phong trào.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối khi xóa kì thi/phong trào.");
    }
  };

  const handleToggleMovement = async (id: string) => {
    setErrorMessage("");
    setSuccessMessage("");
    
    const headers: Record<string, string> = {};
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`/api/movements/${id}/toggle`, {
        method: "PUT",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage("Đã thay đổi trạng thái hoạt động của phong trào/cuộc thi thành công.");
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Lỗi khi thay đổi trạng thái hoạt động.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối khi thay đổi trạng thái hoạt động.");
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const activeMovement = movements.find(m => m.id === selectedMovId);

  // Get all submissions across all movements to present a single unified list!
  const allSubmissions = React.useMemo(() => {
    let list = movements.flatMap(mov => {
      const status = getMovStatus(mov);
      return mov.submissions.map(sub => ({
        ...sub,
        movId: mov.id,
        movTitle: mov.title,
        movReward: mov.reward || "",
        movActive: mov.active !== false,
        movIsOpen: status.isOpen
      }));
    });

    if (isLeader && leaderInfo) {
      list = list.filter(sub => sub.department === leaderInfo.department);
    }

    return list.sort((a, b) => {
      // 1. Prioritize submissions belonging to open/active competitions (isOpen === true)
      if (a.movIsOpen && !b.movIsOpen) return -1;
      if (!a.movIsOpen && b.movIsOpen) return 1;

      // 2. Prioritize active competitions
      if (a.movActive && !b.movActive) return -1;
      if (!a.movActive && b.movActive) return 1;

      // 3. Within that, sort by date submitted (newer first)
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [movements, isLeader, leaderInfo]);

  // Filter submissions based on user selection for easy monitoring and exporting
  const filteredSubmissions = React.useMemo(() => {
    if (filterMovId === "all") {
      return allSubmissions;
    }
    return allSubmissions.filter(sub => sub.movId === filterMovId);
  }, [allSubmissions, filterMovId]);

  // Filter teachers selectable in submission form based on leader department, sorted by department order then name
  const filteredTeachersForSubmission = React.useMemo(() => {
    let list = [...teachers];
    if (isLeader && leaderInfo) {
      list = list.filter(t => t.department === leaderInfo.department);
    }

    const deptOrder: Record<string, number> = {};
    const deptsList = departments && departments.length > 0 
      ? departments 
      : ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Ban Giám Hiệu"];
      
    deptsList.forEach((dept, index) => {
      deptOrder[dept] = index + 1;
    });

    return list.sort((a, b) => {
      const orderA = deptOrder[a.department] || 99;
      const orderB = deptOrder[b.department] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
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

      return a.name.localeCompare(b.name, "vi");
    });
  }, [teachers, isLeader, leaderInfo, departments]);

  // Export movements list to Excel in the exact format requested
  const handleExportMovementExcel = () => {
    const selectedMov = movements.find(m => m.id === filterMovId);
    const currentMovTitle = filterMovId === "all" ? "Tất cả cuộc thi" : (selectedMov ? selectedMov.title : "Cuộc thi hiện tại");
    const submissionsToExport = filteredSubmissions;

    let tableRows = "";
    submissionsToExport.forEach((sub, idx) => {
      let formattedDate = "";
      try {
        if (sub.submittedAt) {
          const dateObj = new Date(sub.submittedAt);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString("vi-VN", {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            formattedDate = sub.submittedAt;
          }
        }
      } catch (err) {
        formattedDate = sub.submittedAt || "";
      }

      const note = sub.movReward || sub.title || "";
      const absoluteLink = sub.link 
        ? (sub.link.startsWith("http") ? sub.link : `${window.location.origin}${sub.link}`)
        : "";

      tableRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt;">${idx + 1}</td>
          <td style="border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold;">${sub.teacherName}</td>
          <td style="border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt; color: #0000EE; text-decoration: underline;">
            ${absoluteLink ? `<a href="${absoluteLink}">${absoluteLink}</a>` : ""}
          </td>
          <td style="text-align: center; border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt;">${formattedDate}</td>
          <td style="border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt;">${note}</td>
        </tr>
      `;
    });

    const isGroupLeaderExport = isLeader && leaderInfo;
    const departmentLine = isGroupLeaderExport 
      ? `<div style="font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; text-align: left;">TỔ CHUYÊN MÔN: ${leaderInfo.department.toUpperCase()}</div>`
      : "";
    const downloadFilename = isGroupLeaderExport
      ? `Ket_qua_danh_sach_cuoc_thi_${currentMovTitle.replace(/[^a-zA-Z0-9]/g, "_")}_To_${leaderInfo.department.replace(/[^a-zA-Z0-9]/g, "_")}.xls`
      : `Ket_qua_danh_sach_cuoc_thi_${currentMovTitle.replace(/[^a-zA-Z0-9]/g, "_")}.xls`;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Danh Sach Tham Gia</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #3ca8a6; color: #000000; border: 1px solid #000000; padding: 10px; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; text-align: center; }
          td { border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div style="font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; text-align: left;">ỦY BND XÃ NGUYỄN VIỆT KHÁI</div>
        <div style="font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; text-align: left;">TRƯỜNG TIỂU HỌC RẠCH CHÈO</div>
        ${departmentLine}
        <br/>
        <div style="font-family: 'Times New Roman'; font-size: 16pt; font-weight: bold; text-align: center;">KẾT QUẢ DANH SÁCH CUỘC THI TRỰC TUYẾN: ${currentMovTitle.toUpperCase()}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; background-color: #3ca8a6; color: black; border: 1px solid #000000;">STT</th>
              <th style="background-color: #3ca8a6; color: black; border: 1px solid #000000; width: 250px;">HỌ VÀ TÊN NGƯỜI THAM GIA DỰ THI</th>
              <th style="background-color: #3ca8a6; color: black; border: 1px solid #000000; width: 300px;">LINK XEM DANH SÁCH THAM GIA</th>
              <th style="background-color: #3ca8a6; color: black; border: 1px solid #000000; width: 150px;">THỜI GIAN NỘP</th>
              <th style="background-color: #3ca8a6; color: black; border: 1px solid #000000; width: 200px;">GHI CHÚ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="5" style="text-align: center; border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman';">Chưa có bài thi nào được nộp cho cuộc thi này.</td></tr>`}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) {
      setErrorMessage("Vui lòng chọn giáo viên nộp bài.");
      return;
    }

    if (!uploadedFileUrl) {
      setErrorMessage("Vui lòng tải lên file bài dự thi / sáng kiến để làm minh chứng (*).");
      return;
    }

    // Determine the title of the submission. Use the uploaded file name, custom title, or fallback to name.
    const finalTitle = entryTitle.trim() || uploadedFileName || `Bài dự thi - ${teacher.name}`;

    if (!selectedMovId || !selectedTeacherId || !finalTitle) {
      setErrorMessage("Vui lòng chọn phong trào thi đua và giáo viên nộp bài.");
      return;
    }

    const targetMov = movements.find(m => m.id === selectedMovId);
    if (targetMov) {
      if (targetMov.active === false) {
        setErrorMessage("Phong trào thi đua này hiện đã tắt/đóng, không thể nộp bài dự thi mới.");
        return;
      }
      if (targetMov.submissions) {
        const alreadySubmitted = targetMov.submissions.some((sub: any) => sub.teacherId === selectedTeacherId);
        if (alreadySubmitted) {
          setErrorMessage("Giáo viên này đã nộp bài minh chứng cho phong trào thi đua này rồi. Không thể nộp lại lần 2.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/movements/${selectedMovId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.name,
          department: teacher.department,
          title: finalTitle,
          description: entryDesc.trim(),
          link: uploadedFileUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage(`Nộp bài thành công! Điểm phong trào của giáo viên ${teacher.name} đã được cộng thêm (+5 điểm) vào KPI.`);
        
        // Reset form fields but keep selectedMovId
        setEntryTitle("");
        setEntryDesc("");
        setSelectedTeacherId("");
        setUploadedFileName("");
        setUploadedFileUrl("");
        
        // Trigger teacher reload in App.tsx to see updated scores
        onRefreshTeachers();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Có lỗi xảy ra khi nộp bài.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối mạng khi nộp bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin function to delete submission
  const handleDeleteSubmission = async (movId: string, subId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài dự thi này không?")) return;

    const headers: Record<string, string> = {};
    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    try {
      const res = await fetch(`/api/movements/${movId}/submissions/${subId}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
        setSuccessMessage("Đã xóa bài dự thi thành công.");
      } else {
        setErrorMessage("Lỗi khi xóa bài dự thi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Lỗi kết nối.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đạt giải Nhất":
        return "bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-xs animate-pulse";
      case "Đạt giải Nhì":
        return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
      case "Đạt giải Ba":
        return "bg-orange-100 text-orange-800 border-orange-300 font-bold";
      case "Đạt giải Khuyến khích":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold";
      case "Đã duyệt":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
      case "Đã nộp":
      default:
        return "bg-sky-50 text-sky-700 border-sky-100 font-medium";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper Jumbotron Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 py-1 px-3 rounded-full border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
              <Flame size={12} className="animate-bounce" /> PHONG TRÀO THI ĐUA NĂM HỌC
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Cổng Đăng Ký & Nộp Bài Dự Thi Phong Trào
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-medium leading-relaxed">
              Khuyến khích giáo viên tích cực tham gia các phong trào thi đua dạy tốt, thiết kế bài giảng, và nghiên cứu sáng kiến kinh nghiệm. Việc tham gia và đạt giải sẽ được cộng thưởng trực tiếp vào chỉ số điểm KPI Chuyên môn & Phong trào.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-lg">
              <Trophy size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">KPI REWARD</span>
              <span className="text-xs font-black text-white">+5 Điểm khi tham gia</span>
              <span className="text-[10px] text-emerald-400 block font-bold">+10 Điểm khi đạt giải</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-start gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs font-semibold">{successMessage}</div>
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-emerald-400 hover:text-emerald-700 text-xs font-bold font-mono">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start gap-2.5 shadow-2xs animate-fade-in">
          <AlertCircle size={16} className="text-rose-600 mt-0.5 shrink-0" />
          <div className="text-xs font-semibold">{errorMessage}</div>
          <button onClick={() => setErrorMessage("")} className="ml-auto text-rose-400 hover:text-rose-700 text-xs font-bold font-mono">×</button>
        </div>
      )}

      {/* Main Grid: Movements List on left, form on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width) - All Submissions */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={16} className="text-slate-500" />
                  Danh sách kết quả bài dự thi phong trào
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {filterMovId === "all" 
                    ? `Tổng số: ${allSubmissions.length} bài dự thi đã nộp` 
                    : `Tìm thấy ${filteredSubmissions.length} bài dự thi cho cuộc thi này`
                  }
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Xem cuộc thi:</span>
                  <select
                    className="bg-transparent border-none text-[10px] font-extrabold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] md:max-w-[200px]"
                    value={filterMovId}
                    onChange={(e) => setFilterMovId(e.target.value)}
                  >
                    <option value="all">Tất cả cuộc thi</option>
                    {sortedMovements.map(mov => (
                      <option key={mov.id} value={mov.id}>{mov.title}</option>
                    ))}
                  </select>
                </div>
                {(isAdmin || isLeader) && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleExportMovementExcel}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-md border border-emerald-500 cursor-pointer shadow-xs transition-colors"
                      title={isLeader ? "Xuất danh sách cuộc thi của tổ ra Excel" : "Xuất kết quả danh sách cuộc thi ra Excel"}
                    >
                      <FileDown size={11} />
                      <span>Xuất Excel</span>
                    </button>
                    {isAdmin && (
                      <a
                        href={`/api/movements/${filterMovId}/export-zip`}
                        className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-md border border-indigo-500 cursor-pointer shadow-xs transition-colors"
                        title="Tải toàn bộ tệp tin minh chứng đã tải lên (.zip)"
                      >
                        <FolderDown size={11} />
                        <span>Tải Minh Chứng (ZIP)</span>
                      </a>
                    )}
                  </div>
                )}
                <span className="text-[9px] bg-slate-100 text-slate-600 font-bold font-mono px-2 py-1 rounded-md">LIVE MONITOR</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-slate-100">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-950 border-t-transparent"></div>
              </div>
            ) : allSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-400">Chưa có bài thi nào được nộp.</p>
                <p className="text-[10px] text-slate-400">Hãy dùng biểu mẫu bên phải để tiến hành nộp bài dự thi phong trào mới!</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-400">Chưa có bài nộp nào cho cuộc thi này.</p>
                <p className="text-[10px] text-slate-400">Hãy chọn một cuộc thi khác hoặc nộp bài mới.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3 text-center w-12">STT</th>
                      <th className="px-4 py-3">Giáo viên dự thi</th>
                      <th className="px-4 py-3">Tên bài dự thi & Giải pháp</th>
                      <th className="px-4 py-3">Phong trào / Cuộc thi</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                      {(isAdmin || isLeader) && <th className="px-4 py-3 text-center">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredSubmissions.map((sub, index) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* STT */}
                        <td className="px-3 py-3 text-center font-bold text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        {/* Teacher Name */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-black uppercase font-mono">
                              {sub.teacherName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold leading-tight">{sub.teacherName}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{sub.department}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Title & Link */}
                        <td className="px-4 py-3 space-y-1 max-w-xs">
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">{sub.title}</div>
                          {sub.link && (
                            <a 
                              href={sub.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download={sub.link.startsWith("/uploads/") ? true : undefined}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold hover:underline pt-0.5 ${
                                sub.link.startsWith("/uploads/") ? "text-emerald-600" : "text-blue-600"
                              }`}
                            >
                              {sub.link.startsWith("/uploads/") ? <FileDown size={11} /> : <LinkIcon size={10} />}
                              <span>{sub.link.startsWith("/uploads/") ? "Tải tệp dữ liệu" : "Liên kết minh chứng"}</span>
                            </a>
                          )}
                        </td>

                        {/* Movement / Contest */}
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-[10px] text-slate-600 font-bold block line-clamp-2 leading-snug">
                            {sub.movTitle}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-[10px] ${getStatusBadge(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>

                        {/* Actions (Delete only) */}
                        {(isAdmin || isLeader) && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteSubmission(sub.movId, sub.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                              title="Xóa bài nộp"
                            >
                              <Trash2 size={12} />
                              <span>Xóa</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Panel for managing Exams/Movements */}
          {(isAdmin || isLeader) && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" />
                    Quản lý Kì thi & Phong trào
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Mở kì thi nộp bài mới, đặt thời gian bắt đầu & kết thúc cụ thể</p>
                </div>
                <button 
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  {isAdminOpen ? "Ẩn công cụ" : "Hiện công cụ quản lý"}
                </button>
              </div>

              {isAdminOpen && (
                <div className="space-y-6 animate-fade-in pt-2">
                  {/* Form to Create a New Exam */}
                  <form onSubmit={handleCreateMovement} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                      + Tạo / Mở đợt thi & phong trào mới
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Tên kì thi / phong trào (*):</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ví dụ: Hội thi thiết kế bài giảng số cấp trường"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 font-semibold"
                          value={newMovTitle}
                          onChange={(e) => setNewMovTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Cơ chế KPI / Phần thưởng:</label>
                        <input 
                          type="text" 
                          placeholder="Ví dụ: +10 Điểm KPI Chuyên môn & Chứng nhận"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 font-medium"
                          value={newMovReward}
                          onChange={(e) => setNewMovReward(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Thời gian bắt đầu nộp (*):</label>
                        <input 
                          type="date" 
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 font-semibold"
                          value={newMovStart}
                          onChange={(e) => setNewMovStart(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Thời gian kết thúc (Hạn nộp) (*):</label>
                        <input 
                          type="date" 
                          required
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 font-semibold"
                          value={newMovEnd}
                          onChange={(e) => setNewMovEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Link Thư mục Google Drive nộp bài / nhận minh chứng:</label>
                      <input 
                        type="url" 
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-400 font-semibold text-blue-600 font-mono"
                        value={newMovDriveLink}
                        onChange={(e) => setNewMovDriveLink(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingMov}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <Plus size={13} />
                      <span>{isCreatingMov ? "Đang xử lý..." : "Mở đợt thi nộp bài mới"}</span>
                    </button>
                  </form>

                  {/* Table/List of movements with start/end and delete */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                      Danh sách các kì thi đang có trong hệ thống:
                    </span>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-2.5">Tên kì thi / phong trào</th>
                            <th className="px-4 py-2.5">Thời gian nhận bài</th>
                            <th className="px-4 py-2.5 text-center">Trạng thái</th>
                            <th className="px-4 py-2.5 text-center">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                          {sortedMovements.map((mov) => {
                            const status = getMovStatus(mov);
                            return (
                              <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800 leading-snug">{mov.title}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                  <div className="font-semibold text-[10px]">Bắt đầu: {mov.startDate}</div>
                                  <div className="font-bold text-[10px] text-slate-900">Kết thúc: {mov.endDate}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-[9px] font-bold ${status.color}`}>
                                    {status.text}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleToggleMovement(mov.id)}
                                      className={`p-1 rounded-md cursor-pointer transition-all ${
                                        mov.active === false
                                          ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                          : "text-emerald-600 hover:text-slate-400 hover:bg-slate-50"
                                      }`}
                                      title={mov.active === false ? "Bật / Mở cuộc thi" : "Tắt / Đóng cuộc thi"}
                                    >
                                      {mov.active === false ? (
                                        <ToggleLeft size={18} />
                                      ) : (
                                        <ToggleRight size={18} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleStartEditMovement(mov)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer transition-colors"
                                      title="Chỉnh sửa cuộc thi"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMovement(mov.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                                      title="Xóa kì thi này"
                                    >
                                      <Trash2 size={13} />
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
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column (1/3 width) - Form to Submit Entry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 text-slate-900 p-2 rounded-xl border border-slate-200">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">
                Nộp Bài Dự Thi Phong Trào
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Dành cho giáo viên thuộc trường</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Movement Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Chọn Phong Trào / Cuộc Thi (*):
              </label>
              <select
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold cursor-pointer"
                value={selectedMovId}
                onChange={(e) => handleMovementChange(e.target.value)}
              >
                <option value="">-- Chọn phong trào thi đua --</option>
                {sortedMovements.map((mov) => {
                  const status = getMovStatus(mov);
                  const todayStr = new Date().toISOString().split("T")[0];
                  let statusLabel = status.isOpen ? " (ĐANG MỞ)" : todayStr > mov.endDate ? " (ĐÃ ĐÓNG)" : " (SẮP MỞ)";
                  if (mov.active === false) {
                    statusLabel = " (ĐÃ TẮT)";
                  }
                  return (
                    <option key={mov.id} value={mov.id}>
                      {mov.title}{statusLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Render selected movement guidelines dynamically in an elegant way */}
            {selectedMovId && (() => {
              const selectedMov = movements.find(m => m.id === selectedMovId);
              if (!selectedMov) return null;
              const status = getMovStatus(selectedMov);
              
              return (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80 space-y-2 text-[10px] text-slate-500 leading-relaxed animate-fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400">Thời gian nhận bài:</span>
                      <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-extrabold ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Calendar size={12} className="text-blue-500" />
                      <span>{selectedMov.startDate} đến {selectedMov.endDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 font-bold text-amber-600 border-t border-slate-200/60 pt-1.5">
                    <Sparkles size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>{selectedMov.reward}</span>
                  </div>

                  {selectedMov.active === false ? (
                    <div className="bg-slate-100 border border-slate-200 text-slate-700 p-2.5 rounded-lg text-[9px] font-bold space-y-0.5 mt-2">
                      <p className="uppercase text-slate-800">⚠️ CUỘC THI ĐÃ TẮT</p>
                      <p className="font-semibold text-slate-600 leading-tight">Cuộc thi này hiện đang tạm dừng hoạt động hoặc đã được quản trị viên tắt.</p>
                    </div>
                  ) : !status.isOpen ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-[9px] font-bold space-y-0.5 mt-2">
                      <p className="uppercase text-rose-800">⚠️ Kì thi đang đóng</p>
                      <p className="font-semibold text-rose-600 leading-tight">Hiện tại không trong khoảng thời gian cho phép nộp bài (Từ {selectedMov.startDate} đến {selectedMov.endDate}).</p>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            {/* Select Teacher Profile */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Chọn Giáo Viên Nộp Bài (*):
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold cursor-pointer"
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {filteredTeachersForSubmission.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department} - {t.subject})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Tải Lên File Bài Dự Thi / Sáng Kiến (*):
              </label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-upload-input")?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  dragOver 
                    ? "border-slate-900 bg-slate-50" 
                    : uploadedFileUrl 
                      ? "border-emerald-300 bg-emerald-50/30" 
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                
                {uploadingFile ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent"></div>
                    <span className="text-[10px] font-bold text-slate-600">Đang tải tệp lên hệ thống...</span>
                  </>
                ) : uploadedFileUrl ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-extrabold text-emerald-800 line-clamp-1">{uploadedFileName}</p>
                      <p className="text-[9px] text-slate-400 font-medium">Kéo thả hoặc click để thay đổi tệp khác</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                      <FileDown size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-extrabold text-slate-700">Kéo & thả file dự thi vào đây</p>
                      <p className="text-[9px] text-slate-400 font-medium">hoặc click để chọn file từ máy tính</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Link Attachment Removed as per user request to use direct file upload only */}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || (selectedMovId ? !getMovStatus(movements.find(m => m.id === selectedMovId)!).isOpen : true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              <span>{isSubmitting ? "Đang Gửi Bài Dự Thi..." : "Xác Nhận Nộp Bài"}</span>
            </button>
          </form>

          {/* Quick Notice about rewards */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 text-[10px] leading-relaxed text-slate-500 font-medium space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-bold uppercase tracking-wide">
              <Info size={12} className="text-slate-500 shrink-0" /> Cơ chế liên thông KPI:
            </div>
            <p>1. Giáo viên khi nộp bài dự thi hợp lệ sẽ lập tức được ghi nhận và <span className="text-emerald-600 font-extrabold">+5 điểm chuyên cần/phong trào ngoại khóa</span>.</p>
            <p>2. Kết quả phong trào và kì thi sẽ được cập nhật trực tiếp bởi Hội đồng Thi đua Nhà trường để làm cơ sở đánh giá chất lượng dạy và học.</p>
          </div>
        </div>

      </div>

      {/* Edit Movement Modal */}
      {editingMovement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Edit2 size={16} className="text-blue-400" />
                <h5 className="font-bold text-xs uppercase tracking-wider">Chỉnh sửa thông tin cuộc thi</h5>
              </div>
              <button 
                type="button"
                onClick={() => setEditingMovement(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMovement} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tên kì thi / phong trào (*):</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Hội thi thiết kế bài giảng số cấp trường"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-semibold"
                  value={editMovTitle}
                  onChange={(e) => setEditMovTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cơ chế KPI / Phần thưởng:</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: +10 Điểm KPI Chuyên môn & Chứng nhận"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-semibold"
                  value={editMovReward}
                  onChange={(e) => setEditMovReward(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Thời gian bắt đầu (*):</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-semibold"
                    value={editMovStart}
                    onChange={(e) => setEditMovStart(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Thời gian kết thúc (*):</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-semibold"
                    value={editMovEnd}
                    onChange={(e) => setEditMovEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Link Thư mục Google Drive cuộc thi:</label>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-semibold text-blue-600 font-mono"
                  value={editMovDriveLink}
                  onChange={(e) => setEditMovDriveLink(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mô tả chi tiết:</label>
                <textarea 
                  rows={3}
                  placeholder="Mô tả tóm tắt nội dung cuộc thi, yêu cầu tài liệu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 focus:bg-white font-medium"
                  value={editMovDesc}
                  onChange={(e) => setEditMovDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMovement(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingMov}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {isUpdatingMov ? "Đang lưu..." : "Cập nhật cuộc thi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
