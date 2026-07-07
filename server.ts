/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Path to data store
let DATA_DIR = path.join(process.cwd(), "data");
let UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Detect if we are on Vercel or a read-only environment
let isReadOnly = false;
try {
  // Try writing to data directory to see if writable
  const testFile = path.join(DATA_DIR, ".write_test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
} catch (e) {
  isReadOnly = true;
}

if (isReadOnly || process.env.VERCEL) {
  const TMP_DATA_DIR = path.join("/tmp", "data");
  const TMP_UPLOADS_DIR = path.join("/tmp", "uploads");

  if (!fs.existsSync(TMP_DATA_DIR)) {
    fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TMP_UPLOADS_DIR)) {
    fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
  }

  // Copy original data files to /tmp/data if they don't exist there yet
  const originalDataDir = path.join(process.cwd(), "data");
  if (fs.existsSync(originalDataDir)) {
    const files = fs.readdirSync(originalDataDir);
    for (const file of files) {
      const src = path.join(originalDataDir, file);
      const dest = path.join(TMP_DATA_DIR, file);
      if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
        try {
          fs.copyFileSync(src, dest);
        } catch (copyErr) {
          console.error(`Failed to copy ${file} to /tmp/data:`, copyErr);
        }
      }
    }
  }

  DATA_DIR = TMP_DATA_DIR;
  UPLOADS_DIR = TMP_UPLOADS_DIR;
}

const DATA_FILE = path.join(DATA_DIR, "teachers.json");
const WEIGHTS_FILE = path.join(DATA_DIR, "weights.json");
const SCHEMA_FILE = path.join(DATA_DIR, "metrics_schema.json");
const MOVEMENTS_FILE = path.join(DATA_DIR, "movements.json");
const DEPARTMENTS_FILE = path.join(DATA_DIR, "departments.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Function to remove Vietnamese diacritics/accents to convert text to unsigned
function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  
  // Normalize combining characters
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result;
}

// Serve uploads folder as static files
app.use("/uploads", express.static(UPLOADS_DIR));

// Default Weights
const DEFAULT_WEIGHTS = {
  teaching: 40,
  professionalism: 30,
  activities: 30
};

// Default Metrics Schema
const DEFAULT_METRICS_SCHEMA = [
  {
    catId: "teaching",
    name: "Giảng dạy & Chăm sóc học sinh",
    metrics: [
      { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học sinh tiểu học đi học đều đặn, chuyên cần", target: 98, weight: 30 },
      { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, weight: 30 },
      { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, weight: 40 }
    ]
  },
  {
    catId: "professionalism",
    name: "Hồ sơ & Chuyên môn Tiểu học",
    metrics: [
      { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật hồ sơ lớp chủ nhiệm, kế hoạch tuần đúng hạn", target: 100, weight: 40 },
      { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn, tập huấn đổi mới phương pháp giảng dạy", target: 90, weight: 30 },
      { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Đánh giá sự giữ gìn sách vở và tiến bộ chữ viết của học sinh", target: 85, weight: 30 }
    ]
  },
  {
    catId: "activities",
    name: "Phong trào & Kết nối Phụ huynh",
    metrics: [
      { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, weight: 40 },
      { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Tổ chức hoạt động trải nghiệm, sinh hoạt tập thể, nề nếp Sao Nhi đồng", target: 80, weight: 30 },
      { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Mức độ tự lập của học sinh trong ăn uống, ngủ trưa và giữ vệ sinh", target: 85, weight: 30 }
    ]
  }
];

// Default Teachers Seed Data
const DEFAULT_TEACHERS = [
  {
    id: "t1",
    name: "Nguyễn Minh Anh",
    email: "minhanh.c1@school.edu.vn",
    subject: "Chủ nhiệm (Khối 1)",
    department: "Tổ Khối 1",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: "Tháng 06/2026",
    academicYear: "2025-2026",
    overallScore: 94.6,
    status: "Xuất sắc",
    kpis: [
      {
        id: "teaching",
        name: "Giảng dạy & Chăm sóc học sinh",
        weight: 40,
        metrics: [
          { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học sinh tiểu học đi học đều đặn, chuyên cần", target: 98, actual: 99.2, weight: 30 },
          { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, actual: 98, weight: 30 },
          { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, actual: 100, weight: 40 }
        ]
      },
      {
        id: "professionalism",
        name: "Hồ sơ & Chuyên môn Tiểu học",
        weight: 30,
        metrics: [
          { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật hồ sơ lớp chủ nhiệm, kế hoạch tuần đúng hạn", target: 100, actual: 100, weight: 40 },
          { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn khối 1, bồi dưỡng SGK mới", target: 90, actual: 95, weight: 30 },
          { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Đánh giá sự giữ gìn sách vở và tiến bộ chữ viết của học sinh", target: 85, actual: 90, weight: 30 }
        ]
      },
      {
        id: "activities",
        name: "Phong trào & Kết nối Phụ huynh",
        weight: 30,
        metrics: [
          { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, actual: 96, weight: 40 },
          { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Tổ chức hoạt động trải nghiệm, sinh hoạt tập thể, nề nếp Sao Nhi đồng", target: 80, actual: 90, weight: 30 },
          { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Mức độ tự lập của học sinh trong ăn uống, ngủ trưa và giữ vệ sinh", target: 85, actual: 92, weight: 30 }
        ]
      }
    ],
    evaluations: [
      {
        id: "e1_1",
        period: "Tháng 05/2026",
        overallScore: 93.1,
        status: "Xuất sắc",
        evaluator: "Hiệu trưởng Lê Thị Thanh",
        evaluatedAt: "2026-05-31",
        feedback: "Cô Minh Anh là giáo viên cốt cán khối 1 cực kỳ tâm huyết. Cô rèn nếp rất tốt cho các con vừa bước vào tiểu học, phối hợp rất mật thiết với phụ huynh lớp 1A. Sổ sách và nhận xét học bạ chuẩn mực theo Thông tư 27."
      }
    ]
  },
  {
    id: "t2",
    name: "Lê Văn Nam",
    email: "namle.c1@school.edu.vn",
    subject: "Giáo dục thể chất",
    department: "Tổ Bộ môn",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: "Tháng 06/2026",
    academicYear: "2025-2026",
    overallScore: 83.2,
    status: "Khá",
    kpis: [
      {
        id: "teaching",
        name: "Giảng dạy & Chăm sóc học sinh",
        weight: 40,
        metrics: [
          { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học student tiểu học đi học đều đặn, chuyên cần", target: 98, actual: 95, weight: 30 },
          { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, actual: 90, weight: 30 },
          { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, actual: 92, weight: 40 }
        ]
      },
      {
        id: "professionalism",
        name: "Hồ sơ & Chuyên môn Tiểu học",
        weight: 30,
        metrics: [
          { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật sổ bộ môn và nhật ký giảng dạy", target: 100, actual: 90, weight: 40 },
          { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn bộ môn, tập huấn chuyên đề thể thao học đường", target: 90, actual: 92, weight: 30 },
          { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Rèn nề nếp tập thể dục giữa giờ và thói quen thể chất lành mạnh", target: 85, actual: 80, weight: 30 }
        ]
      },
      {
        id: "activities",
        name: "Phong trào & Kết nối Phụ huynh",
        weight: 30,
        metrics: [
          { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, actual: 85, weight: 40 },
          { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Tổ chức hoạt động trải nghiệm, giải đấu thể thao, câu lạc bộ bóng rổ/bóng đá tiểu học", target: 80, actual: 95, weight: 30 },
          { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Hỗ trợ học sinh rèn luyện tinh thần tự quản, thể lực khỏe mạnh", target: 85, actual: 80, weight: 30 }
        ]
      }
    ],
    evaluations: [
      {
        id: "e2_1",
        period: "Tháng 05/2026",
        overallScore: 82.5,
        status: "Khá",
        evaluator: "Phó Hiệu trưởng Lê Hồng Phong",
        evaluatedAt: "2026-05-30",
        feedback: "Thầy Nam rất tích cực tổ chức các phong trào thể dục thể thao, hội khỏe Phù Đổng cấp trường cho học sinh tiểu học. Cần chú ý hoàn thiện sổ sách theo dõi đúng hạn hơn."
      }
    ]
  },
  {
    id: "t3",
    name: "Trần Thị Hương",
    email: "huongtran.c1@school.edu.vn",
    subject: "Chủ nhiệm (Khối 5)",
    department: "Tổ Khối 5",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: "Tháng 06/2026",
    academicYear: "2025-2026",
    overallScore: 88.5,
    status: "Khá",
    kpis: [
      {
        id: "teaching",
        name: "Giảng dạy & Chăm sóc học sinh",
        weight: 40,
        metrics: [
          { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học sinh tiểu học đi học đều đặn, chuyên cần", target: 98, actual: 98.5, weight: 30 },
          { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, actual: 94, weight: 30 },
          { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, actual: 95, weight: 40 }
        ]
      },
      {
        id: "professionalism",
        name: "Hồ sơ & Chuyên môn Tiểu học",
        weight: 30,
        metrics: [
          { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật hồ sơ lớp chủ nhiệm, kế hoạch tuần đúng hạn", target: 100, actual: 95, weight: 40 },
          { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn khối 5, hỗ trợ ôn thi chuyển cấp THCS", target: 90, actual: 90, weight: 30 },
          { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Đánh giá sự giữ gìn sách vở và tiến bộ chữ viết của học sinh", target: 85, actual: 86, weight: 30 }
        ]
      },
      {
        id: "activities",
        name: "Phong trào & Kết nối Phụ huynh",
        weight: 30,
        metrics: [
          { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, actual: 92, weight: 40 },
          { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Tổ chức hoạt động trải nghiệm, sinh hoạt tập thể, nề nếp Đội viên", target: 80, actual: 82, weight: 30 },
          { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Mức độ tự lập của học sinh trong ăn uống, ngủ trưa và giữ vệ sinh", target: 85, actual: 88, weight: 30 }
        ]
      }
    ],
    evaluations: []
  },
  {
    id: "t4",
    name: "Phạm Thu Thảo",
    email: "thaopham.c1@school.edu.vn",
    subject: "Chủ nhiệm (Khối 2)",
    department: "Tổ Khối 2",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: "Tháng 06/2026",
    academicYear: "2025-2026",
    overallScore: 72.3,
    status: "Trung bình",
    kpis: [
      {
        id: "teaching",
        name: "Giảng dạy & Chăm sóc học sinh",
        weight: 40,
        metrics: [
          { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học sinh tiểu học đi học đều đặn, chuyên cần", target: 98, actual: 94, weight: 30 },
          { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, actual: 80, weight: 30 },
          { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, actual: 85, weight: 40 }
        ]
      },
      {
        id: "professionalism",
        name: "Hồ sơ & Chuyên môn Tiểu học",
        weight: 30,
        metrics: [
          { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật hồ sơ lớp chủ nhiệm, kế hoạch tuần đúng hạn", target: 100, actual: 80, weight: 40 },
          { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn khối 2", target: 90, actual: 85, weight: 30 },
          { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Đánh giá sự giữ gìn sách vở và tiến bộ chữ viết của học sinh", target: 85, actual: 78, weight: 30 }
        ]
      },
      {
        id: "activities",
        name: "Phong trào & Kết nối Phụ huynh",
        weight: 30,
        metrics: [
          { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, actual: 80, weight: 40 },
          { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Tổ chức hoạt động trải nghiệm, sinh hoạt tập thể, nề nếp Sao Nhi đồng", target: 80, actual: 70, weight: 30 },
          { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Mức độ tự lập của học sinh trong ăn uống, ngủ trưa và giữ vệ sinh", target: 85, actual: 75, weight: 30 }
        ]
      }
    ],
    evaluations: [
      {
        id: "e4_1",
        period: "Tháng 05/2026",
        overallScore: 69.5,
        status: "Trung bình",
        evaluator: "Hiệu trưởng Lê Thị Thanh",
        evaluatedAt: "2026-05-31",
        feedback: "Cô Thảo cần đầu tư hơn vào thiết kế bài giảng sinh động, thu hút học sinh tiểu học. Công tác chấm nhận xét học bạ định kỳ còn một vài chỗ bị chậm so với quy định tổ khối."
      }
    ]
  },
  {
    id: "t5",
    name: "Đỗ Bảo Vy",
    email: "vydo.c1@school.edu.vn",
    subject: "Tiếng Anh",
    department: "Tổ Bộ môn",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: "Tháng 06/2026",
    academicYear: "2025-2026",
    overallScore: 58.1,
    status: "Yếu",
    kpis: [
      {
        id: "teaching",
        name: "Giảng dạy & Chăm sóc học sinh",
        weight: 40,
        metrics: [
          { id: "attendance", name: "Tỉ lệ chuyên cần của học sinh", description: "Tỉ lệ học sinh tiểu học đi học đều đặn, chuyên cần", target: 98, actual: 80, weight: 30 },
          { id: "lesson_plan", name: "Thiết kế bài giảng sinh động", description: "Sử dụng đồ dùng trực quan, học cụ, bài giảng số tương tác", target: 95, actual: 70, weight: 30 },
          { id: "observation", name: "Đánh giá nhận xét định kỳ (TT 27)", description: "Đánh giá thường xuyên, nhận xét năng lực, phẩm chất học sinh trên học bạ điện tử", target: 100, actual: 65, weight: 40 }
        ]
      },
      {
        id: "professionalism",
        name: "Hồ sơ & Chuyên môn Tiểu học",
        weight: 30,
        metrics: [
          { id: "grading_time", name: "Hoàn thiện Sổ chủ nhiệm đúng hạn", description: "Cập nhật sổ bộ môn và nhật ký giảng dạy", target: 100, actual: 60, weight: 40 },
          { id: "training", name: "Tham gia bồi dưỡng Tổ Khối", description: "Tham gia sinh hoạt chuyên môn khối bộ môn tiếng Anh", target: 90, actual: 70, weight: 30 },
          { id: "test_design", name: "Vở sạch - Chữ đẹp & Rèn nếp", description: "Giữ thói quen giữ gìn tập vở viết tiếng Anh cho học sinh", target: 85, actual: 60, weight: 30 }
        ]
      },
      {
        id: "activities",
        name: "Phong trào & Kết nối Phụ huynh",
        weight: 30,
        metrics: [
          { id: "parent_feedback", name: "Liên lạc & Đồng thuận từ Phụ huynh", description: "Điểm phản hồi hài lòng từ phụ huynh qua nhóm lớp, họp cha mẹ học sinh", target: 90, actual: 65, weight: 40 },
          { id: "extracurricular", name: "Sinh hoạt Sao & Ngoại khóa", description: "Hỗ trợ CLB Tiếng Anh và ngày hội ngôn ngữ", target: 80, actual: 55, weight: 30 },
          { id: "student_progress", name: "Rèn nếp bán trú & tự phục vụ", description: "Quản nề nếp xếp hàng lên lớp của học sinh", target: 85, actual: 60, weight: 30 }
        ]
      }
    ],
    evaluations: []
  }
];

// Helper functions for reading/writing data
const loadTeachers = (): any[] => {
  try {
    let teachers;
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      teachers = JSON.parse(content);
    } else {
      teachers = DEFAULT_TEACHERS;
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_TEACHERS, null, 2), "utf-8");
    }

    // Auto-migrate: ensure every teacher has a groupRole, teachingRole and assignedClass fields
    let migrated = false;
    teachers.forEach((t: any) => {
      let isLocalMigrated = false;
      if (!t.groupRole) {
        if (t.id === "t1" || t.id === "t3") {
          t.groupRole = "Tổ trưởng";
        } else if (t.id === "t2") {
          t.groupRole = "Tổ phó";
        } else {
          t.groupRole = "Thành viên";
        }
        isLocalMigrated = true;
      }
      if (!t.teachingRole) {
        if (t.department === "Tổ Bộ môn" || t.id === "t2" || t.id === "t5" || t.subject.includes("Tiếng Anh") || t.subject.includes("Âm nhạc") || t.subject.includes("Mỹ thuật") || t.subject.includes("thể chất") || t.subject.includes("Tin học")) {
          t.teachingRole = "Giáo viên bộ môn";
        } else {
          t.teachingRole = "Giáo viên chủ nhiệm";
        }
        isLocalMigrated = true;
      }
      if (!t.assignedClass) {
        if (t.id === "t1") {
          t.assignedClass = "Lớp 1A";
        } else if (t.id === "t2") {
          t.assignedClass = "Khối 1, 2, 3";
        } else if (t.id === "t3") {
          t.assignedClass = "Lớp 5B";
        } else if (t.id === "t4") {
          t.assignedClass = "Lớp 2C";
        } else if (t.id === "t5") {
          t.assignedClass = "Khối 4, 5";
        } else {
          const m = t.subject.match(/Khối\s*(\d)/i) || t.department.match(/Khối\s*(\d)/i);
          if (m) {
            t.assignedClass = `Lớp ${m[1]}A`;
          } else {
            t.assignedClass = "Cả trường";
          }
        }
        isLocalMigrated = true;
      }
      if (isLocalMigrated) {
        migrated = true;
      }
    });

    if (migrated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(teachers, null, 2), "utf-8");
    }

    return teachers;
  } catch (error) {
    console.error("Error loading teachers, falling back to seed:", error);
    return DEFAULT_TEACHERS;
  }
};

const saveTeachers = (teachers: any[]) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(teachers, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving teachers:", error);
  }
};

const loadWeights = () => {
  try {
    if (fs.existsSync(WEIGHTS_FILE)) {
      const content = fs.readFileSync(WEIGHTS_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      fs.writeFileSync(WEIGHTS_FILE, JSON.stringify(DEFAULT_WEIGHTS, null, 2), "utf-8");
      return DEFAULT_WEIGHTS;
    }
  } catch (error) {
    console.error("Error loading weights, falling back to default:", error);
    return DEFAULT_WEIGHTS;
  }
};

const saveWeights = (weights: any) => {
  try {
    fs.writeFileSync(WEIGHTS_FILE, JSON.stringify(weights, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving weights:", error);
  }
};

const DEFAULT_MOVEMENTS = [
  {
    id: "mov_1",
    title: "Hội thi Giáo viên dạy giỏi cấp Trường năm học 2026 - 2027",
    description: "Hội thi nhằm phát hiện, công nhận, tôn vinh giáo viên đạt danh hiệu giáo viên dạy giỏi và nhân rộng những điển hình tiên tiến. Giáo viên nộp báo cáo giải pháp sư phạm sáng tạo kèm theo liên kết minh chứng bài giảng.",
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    deadline: "2026-11-30",
    reward: "Giấy chứng nhận danh hiệu GVDG cấp trường và điểm cộng KPI Chuyên môn (+10 điểm).",
    submissions: [
      {
        id: "sub_1",
        teacherId: "t1",
        teacherName: "Nguyễn Minh Anh",
        department: "Tổ Khối 1",
        title: "Sáng kiến nâng cao tính chuyên cần cho học sinh lớp 1 thông qua trò chơi tương tác",
        description: "Giải pháp áp dụng các trò chơi vận động và thi đua ngắn đầu giờ giúp học sinh thích đi học hơn, giảm tỷ lệ đi muộn và nghỉ học không lý do.",
        link: "https://drive.google.com/drive/folders/gvdg-minhanh-2026",
        submittedAt: "2026-06-15T08:30:00.000Z",
        status: "Đạt giải Nhì"
      }
    ]
  },
  {
    id: "mov_2",
    title: "Phong trào Thiết kế bài giảng điện tử và Học liệu số",
    description: "Khuyến khích giáo viên ứng dụng công nghệ thông tin, chuyển đổi số trong dạy học; xây dựng kho học liệu số dùng chung có chất lượng cao. Nộp bài giảng E-learning hoặc học liệu số tự làm.",
    startDate: "2026-06-15",
    endDate: "2026-12-15",
    deadline: "2026-12-15",
    reward: "Cộng trực tiếp vào KPI Phong trào & Kết nối Phụ huynh (+15 điểm) và đề cử giải thưởng cấp Quận.",
    submissions: [
      {
        id: "sub_2",
        teacherId: "t2",
        teacherName: "Lê Hoàng Nam",
        department: "Tổ Bộ môn",
        title: "Thiết kế giáo án điện tử tương tác môn Thể dục lớp 4",
        description: "Ứng dụng sơ đồ hình họa 3D và video hướng dẫn trực quan để các em học sinh dễ dàng thực hành các động tác nhảy cao tại nhà.",
        link: "https://drive.google.com/drive/folders/the-duc-so-lehoangnam",
        submittedAt: "2026-06-20T10:15:00.000Z",
        status: "Đã duyệt"
      }
    ]
  },
  {
    id: "mov_3",
    title: "Sáng kiến kinh nghiệm sư phạm và Nghiên cứu khoa học cấp Cơ sở",
    description: "Trình bày giải pháp mới, sáng tạo, cải tiến phương pháp giáo dục nhằm nâng cao năng lực tự học, rèn luyện nếp sống kỷ luật bán trú cho học sinh tiểu học.",
    startDate: "2026-09-01",
    endDate: "2027-01-10",
    deadline: "2027-01-10",
    reward: "Căn cứ xét thi đua Chiến sĩ thi đua cấp cơ sở và điểm KPI Chuyên môn.",
    submissions: []
  }
];

const loadMovements = () => {
  try {
    let movements;
    if (fs.existsSync(MOVEMENTS_FILE)) {
      const content = fs.readFileSync(MOVEMENTS_FILE, "utf-8");
      movements = JSON.parse(content);
    } else {
      movements = DEFAULT_MOVEMENTS;
      fs.writeFileSync(MOVEMENTS_FILE, JSON.stringify(movements, null, 2), "utf-8");
    }
    
    let changed = false;
    const normalized = movements.map((m: any) => {
      const updated = { ...m };
      if (!updated.startDate) {
        updated.startDate = "2026-06-01";
        changed = true;
      }
      if (!updated.endDate) {
        updated.endDate = updated.deadline || "2026-12-31";
        changed = true;
      }
      return updated;
    });

    if (changed) {
      fs.writeFileSync(MOVEMENTS_FILE, JSON.stringify(normalized, null, 2), "utf-8");
    }
    return normalized;
  } catch (error) {
    console.error("Error loading movements, falling back to default:", error);
    return DEFAULT_MOVEMENTS;
  }
};

const saveMovements = (movements: any[]) => {
  try {
    fs.writeFileSync(MOVEMENTS_FILE, JSON.stringify(movements, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving movements:", error);
  }
};

// Calculate teacher score based on current weights & metrics
const recalculateScore = (teacher: any, weights: typeof DEFAULT_WEIGHTS) => {
  let teachingScore = 0;
  let profScore = 0;
  let actScore = 0;

  teacher.kpis.forEach((category: any) => {
    let catSum = 0;
    category.metrics.forEach((m: any) => {
      catSum += (m.actual * (m.weight / 100));
    });

    if (category.id === "teaching") {
      teachingScore = catSum;
      category.weight = weights.teaching;
    } else if (category.id === "professionalism") {
      profScore = catSum;
      category.weight = weights.professionalism;
    } else if (category.id === "activities") {
      actScore = catSum;
      category.weight = weights.activities;
    }
  });

  const totalWeight = weights.teaching + weights.professionalism + weights.activities;
  const overall = (
    (teachingScore * weights.teaching) +
    (profScore * weights.professionalism) +
    (actScore * weights.activities)
  ) / totalWeight;

  teacher.overallScore = parseFloat(overall.toFixed(1));

  if (teacher.overallScore >= 90) {
    teacher.status = "Xuất sắc";
  } else if (teacher.overallScore >= 80) {
    teacher.status = "Khá";
  } else if (teacher.overallScore >= 65) {
    teacher.status = "Trung bình";
  } else {
    teacher.status = "Yếu";
  }
};

const loadSchema = () => {
  try {
    if (fs.existsSync(SCHEMA_FILE)) {
      const content = fs.readFileSync(SCHEMA_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      fs.writeFileSync(SCHEMA_FILE, JSON.stringify(DEFAULT_METRICS_SCHEMA, null, 2), "utf-8");
      return DEFAULT_METRICS_SCHEMA;
    }
  } catch (error) {
    console.error("Error loading schema, falling back to default:", error);
    return DEFAULT_METRICS_SCHEMA;
  }
};

const saveSchema = (schema: any) => {
  try {
    fs.writeFileSync(SCHEMA_FILE, JSON.stringify(schema, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving schema:", error);
  }
};

const syncTeachersWithSchema = (teachers: any[], schema: any[], weights: any) => {
  teachers.forEach(teacher => {
    schema.forEach((schemaCat: any) => {
      let teacherCat = teacher.kpis.find((c: any) => c.id === schemaCat.catId);
      if (!teacherCat) {
        teacherCat = {
          id: schemaCat.catId,
          name: schemaCat.name,
          weight: weights[schemaCat.catId] || 30,
          metrics: []
        };
        teacher.kpis.push(teacherCat);
      }

      teacherCat.name = schemaCat.name;

      const newMetrics: any[] = [];
      schemaCat.metrics.forEach((schemaMetric: any) => {
        const existingMetric = teacherCat.metrics.find((m: any) => m.id === schemaMetric.id);
        if (existingMetric) {
          newMetrics.push({
            ...existingMetric,
            name: schemaMetric.name,
            description: schemaMetric.description,
            target: schemaMetric.target,
            weight: schemaMetric.weight
          });
        } else {
          newMetrics.push({
            id: schemaMetric.id,
            name: schemaMetric.name,
            description: schemaMetric.description,
            target: schemaMetric.target,
            weight: schemaMetric.weight,
            actual: 80
          });
        }
      });
      teacherCat.metrics = newMetrics;
    });

    recalculateScore(teacher, weights);
  });
};

// In-memory set to store secure admin sessions
const activeSessions = new Set<string>();

// In-memory map to store active Group Leader/Deputy sessions: token -> { teacherId, department, groupRole, name }
const activeLeaderSessions = new Map<string, { teacherId: string; department: string; groupRole: string; name: string }>();

// Middleware to enforce admin authorization on sensitive write/edit operations
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Yêu cầu quyền quản trị (Thiếu token)" });
    return;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!activeSessions.has(token)) {
    res.status(403).json({ error: "Phiên đăng nhập quản trị hết hạn hoặc không hợp lệ" });
    return;
  }
  next();
};

// Middleware to support either Admin OR Group Leader
const requireAdminOrGroupLeader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Yêu cầu quyền đăng nhập (Thiếu token)" });
    return;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  
  if (activeSessions.has(token)) {
    (req as any).user = { type: "admin" };
    return next();
  }

  const leaderSession = activeLeaderSessions.get(token);
  if (leaderSession) {
    (req as any).user = {
      type: "leader",
      teacherId: leaderSession.teacherId,
      department: leaderSession.department,
      groupRole: leaderSession.groupRole,
      name: leaderSession.name
    };
    return next();
  }

  res.status(403).json({ error: "Không có quyền thực hiện hành động này" });
};

// REST APIs

const ADMIN_CONFIG_FILE = path.join(DATA_DIR, "admin.json");

function getAdminPassword(): string {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, "utf-8"));
      if (config && config.password) {
        return config.password;
      }
    }
  } catch (err) {
    console.error("Error reading admin config:", err);
  }
  return process.env.ADMIN_PASSWORD || "1231987Dat";
}

function saveAdminPassword(password: string) {
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify({ password }, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving admin config:", err);
  }
}

// POST secure admin login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = getAdminPassword();
  
  if (password === ADMIN_PASSWORD) {
    // Generate a secure, hard-to-guess token
    const token = "admin_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeSessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: "Mật khẩu đăng nhập quản trị không đúng!" });
  }
});

// POST change admin password
app.post("/api/admin/change-password", requireAdmin, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || !newPassword.trim()) {
    res.status(400).json({ error: "Mật khẩu mới không được để trống" });
    return;
  }

  const currentPassword = getAdminPassword();
  if (oldPassword !== currentPassword) {
    res.status(400).json({ error: "Mật khẩu cũ không chính xác!" });
    return;
  }

  saveAdminPassword(newPassword.trim());
  res.json({ success: true, message: "Đổi mật khẩu quản trị thành công!" });
});

// POST change group leader password
app.post("/api/leader/change-password", requireAdminOrGroupLeader, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || !newPassword.trim()) {
    res.status(400).json({ error: "Mật khẩu mới không được để trống" });
    return;
  }

  const user = (req as any).user;
  if (user.type === "leader") {
    const teachers = loadTeachers();
    const foundTeacher = teachers.find(t => t.id === user.teacherId);
    if (!foundTeacher) {
      res.status(404).json({ error: "Không tìm thấy thông tin giáo viên" });
      return;
    }

    const currentPassword = foundTeacher.password || "123456";
    if (oldPassword !== currentPassword) {
      res.status(400).json({ error: "Mật khẩu cũ không chính xác!" });
      return;
    }

    foundTeacher.password = newPassword.trim();
    saveTeachers(teachers);
    res.json({ success: true, message: "Đổi mật khẩu tổ trưởng thành công!" });
  } else {
    res.status(400).json({ error: "Yêu cầu quyền đăng nhập Tổ trưởng/Tổ phó để thực hiện hành động này" });
  }
});

// POST verify token validity (useful on client refresh)
app.post("/api/admin/verify-token", (req, res) => {
  const { token } = req.body;
  if (token && activeSessions.has(token)) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

// POST logout admin
app.post("/api/admin/logout", (req, res) => {
  const { token } = req.body;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// POST secure Group Leader login (Tổ trưởng / Tổ phó)
app.post("/api/leader/login", (req, res) => {
  const { teacherId, password } = req.body;
  if (!teacherId) {
    res.status(400).json({ error: "Thiếu thông tin mã số giáo viên" });
    return;
  }

  const teachers = loadTeachers();
  const foundTeacher = teachers.find(t => t.id === teacherId);
  if (!foundTeacher) {
    res.status(404).json({ error: "Không tìm thấy thông tin giáo viên" });
    return;
  }

  const role = foundTeacher.groupRole || "Thành viên";
  if (role !== "Tổ trưởng" && role !== "Tổ phó") {
    res.status(403).json({ error: "Giáo viên này không phải là Tổ trưởng hoặc Tổ phó" });
    return;
  }

  // Validate password
  const expectedPassword = foundTeacher.password || "123456";
  if (password !== expectedPassword) {
    res.status(401).json({ error: "Mật khẩu đăng nhập không chính xác!" });
    return;
  }

  // Generate session token
  const token = "leader_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  activeLeaderSessions.set(token, {
    teacherId: foundTeacher.id,
    department: foundTeacher.department,
    groupRole: role,
    name: foundTeacher.name
  });

  res.json({
    success: true,
    token,
    leader: {
      id: foundTeacher.id,
      name: foundTeacher.name,
      department: foundTeacher.department,
      groupRole: role
    }
  });
});

// POST verify Group Leader token
app.post("/api/leader/verify-token", (req, res) => {
  const { token } = req.body;
  if (token && activeLeaderSessions.has(token)) {
    const session = activeLeaderSessions.get(token);
    res.json({ valid: true, leader: session });
  } else {
    res.json({ valid: false });
  }
});

// POST logout Group Leader
app.post("/api/leader/logout", (req, res) => {
  const { token } = req.body;
  if (token) {
    activeLeaderSessions.delete(token);
  }
  res.json({ success: true });
});

app.get("/api/weights", (req, res) => {
  res.json(loadWeights());
});

app.get("/api/departments", (req, res) => {
  try {
    let depts = ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Tổ Văn phòng"];
    if (fs.existsSync(DEPARTMENTS_FILE)) {
      depts = JSON.parse(fs.readFileSync(DEPARTMENTS_FILE, "utf-8"));
    } else {
      fs.writeFileSync(DEPARTMENTS_FILE, JSON.stringify(depts, null, 2), "utf-8");
    }
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách tổ chuyên môn" });
  }
});

app.post("/api/departments", requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Tên tổ không hợp lệ" });
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      res.status(400).json({ error: "Tên tổ không được để trống" });
      return;
    }

    let depts = ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Tổ Văn phòng"];
    if (fs.existsSync(DEPARTMENTS_FILE)) {
      depts = JSON.parse(fs.readFileSync(DEPARTMENTS_FILE, "utf-8"));
    }

    if (depts.map(d => d.toLowerCase()).includes(cleanName.toLowerCase())) {
      res.status(400).json({ error: "Tổ chuyên môn này đã tồn tại" });
      return;
    }

    depts.push(cleanName);
    fs.writeFileSync(DEPARTMENTS_FILE, JSON.stringify(depts, null, 2), "utf-8");
    res.json({ success: true, departments: depts });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi thêm tổ chuyên môn" });
  }
});

app.delete("/api/departments", requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Tên tổ không hợp lệ" });
      return;
    }
    let depts = ["Tổ Khối 1", "Tổ Khối 2", "Tổ Khối 3", "Tổ Khối 4", "Tổ Khối 5", "Tổ Bộ môn", "Tổ Văn phòng"];
    if (fs.existsSync(DEPARTMENTS_FILE)) {
      depts = JSON.parse(fs.readFileSync(DEPARTMENTS_FILE, "utf-8"));
    }
    const filtered = depts.filter(d => d !== name);
    fs.writeFileSync(DEPARTMENTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    res.json({ success: true, departments: filtered });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xóa tổ chuyên môn" });
  }
});

app.put("/api/weights", requireAdmin, (req, res) => {
  const { teaching, professionalism, activities } = req.body;
  if (
    typeof teaching !== "number" ||
    typeof professionalism !== "number" ||
    typeof activities !== "number"
  ) {
    res.status(400).json({ error: "Trọng số phải là số" });
    return;
  }

  const weights = { teaching, professionalism, activities };
  saveWeights(weights);

  // Recalculate all teacher scores based on new weights
  const teachers = loadTeachers();
  teachers.forEach(t => recalculateScore(t, weights));
  saveTeachers(teachers);

  res.json({ message: "Cập nhật trọng số thành công", weights, teachers });
});

app.get("/api/metrics-schema", (req, res) => {
  res.json(loadSchema());
});

app.put("/api/metrics-schema", requireAdmin, (req, res) => {
  const newSchema = req.body;
  if (!Array.isArray(newSchema)) {
    res.status(400).json({ error: "Schema phải là một mảng" });
    return;
  }

  saveSchema(newSchema);

  const teachers = loadTeachers();
  const weights = loadWeights();
  syncTeachersWithSchema(teachers, newSchema, weights);
  saveTeachers(teachers);

  res.json({ message: "Cập nhật và đồng bộ chỉ số mẫu thành công", schema: newSchema, teachers });
});

app.get("/api/teachers", (req, res) => {
  res.json(loadTeachers());
});

app.get("/api/teachers/:id", (req, res) => {
  const teachers = loadTeachers();
  const teacher = teachers.find(t => t.id === req.params.id);
  if (!teacher) {
    res.status(404).json({ error: "Không tìm thấy giáo viên" });
    return;
  }
  res.json(teacher);
});

// Helper to determine start of the school year period based on academic year format "YYYY-YYYY"
const getDefaultPeriodForYear = (academicYearStr: string) => {
  const yearStr = academicYearStr || "2025-2026";
  const match = yearStr.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    return `Tháng 09/${match[1]}`;
  }
  return "Tháng 09/2025";
};

app.post("/api/teachers", requireAdmin, (req, res) => {
  const { name, email, subject, department, avatarUrl, academicYear, kpiPeriod, groupRole, teachingRole, assignedClass, password } = req.body;
  if (!name || !email || !subject || !department) {
    res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    return;
  }

  const weights = loadWeights();
  const schema = loadSchema();
  const finalYear = academicYear || "2025-2026";
  const newTeacher = {
    id: "t_" + Date.now(),
    name,
    email,
    subject,
    department,
    groupRole: groupRole || "Thành viên",
    password: password || "123456",
    teachingRole: teachingRole || (department === "Tổ Bộ môn" ? "Giáo viên bộ môn" : "Giáo viên chủ nhiệm"),
    assignedClass: assignedClass || "Chưa phân lớp",
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    kpiPeriod: kpiPeriod || getDefaultPeriodForYear(finalYear),
    academicYear: finalYear,
    overallScore: 0,
    status: "Trung bình" as const,
    kpis: schema.map((schemaCat: any) => ({
      id: schemaCat.catId,
      name: schemaCat.name,
      weight: weights[schemaCat.catId] || 30,
      metrics: schemaCat.metrics.map((schemaMetric: any) => ({
        id: schemaMetric.id,
        name: schemaMetric.name,
        description: schemaMetric.description,
        target: schemaMetric.target,
        weight: schemaMetric.weight,
        actual: 80
      }))
    })),
    evaluations: []
  };

  recalculateScore(newTeacher, weights);

  const teachers = loadTeachers();
  teachers.push(newTeacher);
  saveTeachers(teachers);

  res.status(201).json(newTeacher);
});

app.post("/api/teachers/bulk", requireAdmin, (req, res) => {
  const { teachers: bulkTeachers } = req.body;
  if (!Array.isArray(bulkTeachers) || bulkTeachers.length === 0) {
    res.status(400).json({ error: "Danh sách giáo viên không hợp lệ hoặc rỗng" });
    return;
  }

  const weights = loadWeights();
  const schema = loadSchema();
  const teachers = loadTeachers();
  const addedTeachers = [];

  for (let i = 0; i < bulkTeachers.length; i++) {
    const item = bulkTeachers[i];
    let { name, email, subject, department, avatarUrl, academicYear, kpiPeriod, groupRole, teachingRole, assignedClass } = item;
    if (!name) {
      continue;
    }

    if (!email) {
      const cleanName = name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "");
      email = `gv.${cleanName || "temp"}.${Math.floor(1000 + Math.random() * 9000)}@school.edu.vn`;
    }

    const finalYear = academicYear || "2025-2026";
    const newTeacher = {
      id: "t_" + (Date.now() + i),
      name,
      email,
      subject: subject || "Chưa phân công",
      department: department || "Chưa phân công",
      groupRole: groupRole || "Thành viên",
      teachingRole: teachingRole || (department === "Tổ Bộ môn" ? "Giáo viên bộ môn" : "Giáo viên chủ nhiệm"),
      assignedClass: assignedClass || "Chưa phân lớp",
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      kpiPeriod: kpiPeriod || getDefaultPeriodForYear(finalYear),
      academicYear: finalYear,
      overallScore: 0,
      status: "Trung bình" as const,
      kpis: schema.map((schemaCat: any) => ({
        id: schemaCat.catId,
        name: schemaCat.name,
        weight: weights[schemaCat.catId] || 30,
        metrics: schemaCat.metrics.map((schemaMetric: any) => ({
          id: schemaMetric.id,
          name: schemaMetric.name,
          description: schemaMetric.description,
          target: schemaMetric.target,
          weight: schemaMetric.weight,
          actual: 80
        }))
      })),
      evaluations: []
    };

    recalculateScore(newTeacher, weights);
    teachers.push(newTeacher);
    addedTeachers.push(newTeacher);
  }

  saveTeachers(teachers);
  res.status(201).json({ message: `Đã thêm thành công ${addedTeachers.length} giáo viên`, teachers: addedTeachers });
});

app.put("/api/teachers/:id", requireAdminOrGroupLeader, (req, res) => {
  const teachers = loadTeachers();
  const index = teachers.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Không tìm thấy giáo viên" });
    return;
  }

  const weights = loadWeights();
  const current = teachers[index];
  const user = (req as any).user;

  // Check permissions if the user is a Group Leader
  if (user && user.type === "leader") {
    // Group Leaders can only manage teachers in their own department
    if (current.department !== user.department) {
      res.status(403).json({ error: "Bạn chỉ có quyền quản lý thành viên trong tổ của mình" });
      return;
    }
    // Group Leaders cannot change core details or leadership roles
    if (
      req.body.name || 
      req.body.email || 
      req.body.subject || 
      req.body.department || 
      req.body.groupRole || 
      req.body.academicYear ||
      req.body.password !== undefined
    ) {
      res.status(403).json({ error: "Chỉ Ban Giám Hiệu mới có quyền thay đổi thông tin cơ bản, mật khẩu hoặc luân chuyển tổ" });
      return;
    }
  }

  // Merge text fields
  if (req.body.name) current.name = req.body.name;
  if (req.body.email) current.email = req.body.email;
  if (req.body.subject) current.subject = req.body.subject;
  if (req.body.department) current.department = req.body.department;
  if (req.body.avatarUrl) current.avatarUrl = req.body.avatarUrl;
  if (req.body.academicYear) current.academicYear = req.body.academicYear;
  if (req.body.groupRole) current.groupRole = req.body.groupRole;
  if (req.body.teachingRole) current.teachingRole = req.body.teachingRole;
  if (req.body.assignedClass !== undefined) current.assignedClass = req.body.assignedClass;
  if (req.body.password !== undefined) current.password = req.body.password;

  // Setup periodKPIs storage if it doesn't exist
  if (!current.periodKPIs) {
    current.periodKPIs = {};
  }

  // Handle KPI Period change / setup
  const isPeriodChanging = req.body.kpiPeriod && req.body.kpiPeriod !== current.kpiPeriod;
  const isKpisUpdating = !!req.body.kpis;

  if (req.body.kpiPeriod) {
    const targetPeriod = req.body.kpiPeriod;

    // If period is changing and we're NOT passing new KPIs (just switching period in UI),
    // we load the KPIs from that period if they exist.
    if (isPeriodChanging && !isKpisUpdating) {
      if (current.periodKPIs[targetPeriod]) {
        current.kpis = JSON.parse(JSON.stringify(current.periodKPIs[targetPeriod].kpis));
      }
    }
    
    current.kpiPeriod = targetPeriod;
  }

  // Merge KPIs if provided
  if (req.body.kpis) {
    req.body.kpis.forEach((catUpdate: any) => {
      const category = current.kpis.find((c: any) => c.id === catUpdate.id);
      if (category) {
        catUpdate.metrics.forEach((metricUpdate: any) => {
          const metric = category.metrics.find((m: any) => m.id === metricUpdate.id);
          if (metric) {
            if (typeof metricUpdate.actual === "number") {
              metric.actual = Math.min(100, Math.max(0, metricUpdate.actual));
            }
          }
        });
      }
    });
  }

  // Merge evaluations if provided (e.g. adding a manually submitted assessment)
  if (req.body.evaluations) {
    current.evaluations = req.body.evaluations;
  }

  recalculateScore(current, weights);

  // Save the state of current KPIs for the selected period
  current.periodKPIs[current.kpiPeriod] = {
    kpis: JSON.parse(JSON.stringify(current.kpis)),
    overallScore: current.overallScore,
    status: current.status
  };

  saveTeachers(teachers);

  res.json(current);
});

app.delete("/api/teachers/:id", requireAdmin, (req, res) => {
  const teachers = loadTeachers();
  const filtered = teachers.filter(t => t.id !== req.params.id);
  if (filtered.length === teachers.length) {
    res.status(404).json({ error: "Không tìm thấy giáo viên" });
    return;
  }
  saveTeachers(filtered);
  res.json({ message: "Xóa giáo viên thành công" });
});

// GET all movements
app.get("/api/movements", (req, res) => {
  res.json(loadMovements());
});

// POST create a new movement (exam)
app.post("/api/movements", requireAdmin, (req, res) => {
  const { title, description, startDate, endDate, reward, driveLink } = req.body;
  if (!title || !startDate || !endDate) {
    res.status(400).json({ error: "Thiếu thông tin tiêu đề hoặc thời gian" });
    return;
  }

  const movements = loadMovements();
  const newMovement = {
    id: "mov_" + Date.now(),
    title,
    description: description || "",
    startDate,
    endDate,
    deadline: endDate, // sync for backwards compatibility
    reward: reward || "Điểm cộng KPI Chuyên môn & Phong trào.",
    driveLink: driveLink || "",
    submissions: []
  };

  movements.push(newMovement);
  saveMovements(movements);
  res.json({ message: "Tạo kì thi/phong trào thành công", movements });
});

// DELETE a movement (exam)
app.delete("/api/movements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const movements = loadMovements();
  const filtered = movements.filter((m: any) => m.id !== id);
  if (movements.length === filtered.length) {
    res.status(404).json({ error: "Không tìm thấy kì thi/phong trào" });
    return;
  }
  saveMovements(filtered);
  res.json({ message: "Xóa kì thi/phong trào thành công", movements: filtered });
});

// PUT update a movement (exam/competition)
app.put("/api/movements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, endDate, reward, driveLink } = req.body;
  if (!title || !startDate || !endDate) {
    res.status(400).json({ error: "Thiếu thông tin tiêu đề hoặc thời gian" });
    return;
  }

  const movements = loadMovements();
  const movement = movements.find((m: any) => m.id === id);
  if (!movement) {
    res.status(404).json({ error: "Không tìm thấy kì thi/phong trào" });
    return;
  }

  movement.title = title;
  movement.description = description || "";
  movement.startDate = startDate;
  movement.endDate = endDate;
  movement.deadline = endDate; // sync for backwards compatibility
  if (reward !== undefined) {
    movement.reward = reward;
  }
  if (driveLink !== undefined) {
    movement.driveLink = driveLink;
  }

  saveMovements(movements);
  res.json({ message: "Cập nhật kì thi/phong trào thành công", movements });
});

// PUT toggle movement active status
app.put("/api/movements/:id/toggle", requireAdmin, (req, res) => {
  const { id } = req.params;
  const movements = loadMovements();
  const movement = movements.find((m: any) => m.id === id);
  if (!movement) {
    res.status(404).json({ error: "Không tìm thấy kì thi/phong trào" });
    return;
  }

  // Toggle active status (default to true if undefined, so toggle sets to false)
  movement.active = movement.active === false ? true : false;
  saveMovements(movements);
  res.json({ message: "Cập nhật trạng thái phong trào thành công", movements });
});

// GET export movement submissions proof files as a ZIP archive
app.get("/api/movements/:id/export-zip", (req, res) => {
  try {
    const { id } = req.params;
    const movements = loadMovements();
    
    let submissions: any[] = [];
    let titlePrefix = "Tat_ca_phong_trao";

    if (id === "all") {
      movements.forEach((mov: any) => {
        if (mov.submissions && Array.isArray(mov.submissions)) {
          mov.submissions.forEach((sub: any) => {
            submissions.push({
              ...sub,
              movTitle: mov.title
            });
          });
        }
      });
    } else {
      const movement = movements.find((m: any) => m.id === id);
      if (!movement) {
        res.status(404).send("<script>alert('Không tìm thấy phong trào thi đua.'); window.close();</script>");
        return;
      }
      titlePrefix = movement.title.replace(/[^a-zA-Z0-9]/g, "_");
      if (movement.submissions && Array.isArray(movement.submissions)) {
        submissions = movement.submissions.map((sub: any) => ({
          ...sub,
          movTitle: movement.title
        }));
      }
    }

    const zip = new AdmZip();
    let filesAdded = 0;

    submissions.forEach((sub: any) => {
      if (sub.link && sub.link.startsWith("/uploads/")) {
        const fileNameOnDisk = path.basename(sub.link);
        const filePath = path.join(UPLOADS_DIR, fileNameOnDisk);
        
        if (fs.existsSync(filePath)) {
          // Construct a nice, legible file name for the zip, like "NguyenVanA_BaiDuThi_sang_kien_12345.pdf"
          const originalExt = path.extname(fileNameOnDisk);
          const unsignedTeacherName = removeVietnameseTones(sub.teacherName);
          const sanitizedTeacherName = unsignedTeacherName.replace(/[^a-zA-Z0-9_]/g, "_");
          const unsignedTitle = removeVietnameseTones(sub.title);
          const sanitizedTitle = unsignedTitle.replace(/[^a-zA-Z0-9_]/g, "_");
          
          const zipFileName = `${sanitizedTeacherName}_${sanitizedTitle.substring(0, 50)}${originalExt}`;
          
          zip.addLocalFile(filePath, "", zipFileName);
          filesAdded++;
        }
      }
    });

    if (filesAdded === 0) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(404).send("<script>alert('Không tìm thấy tệp tin minh chứng nào để tải.'); window.history.back();</script>");
      return;
    }

    const zipBuffer = zip.toBuffer();
    
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="Minh_chung_${titlePrefix}.zip"`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("Export zip error:", err);
    res.status(500).send("Lỗi xuất tệp tin minh chứng: " + err.message);
  }
});

// POST upload file
app.post("/api/upload", (req, res) => {
  try {
    const { fileName, fileType, fileData, teacherName } = req.body;
    if (!fileName || !fileData) {
      res.status(400).json({ error: "Thiếu dữ liệu tệp hoặc tên tệp" });
      return;
    }

    // Decode base64 file data
    const buffer = Buffer.from(fileData, 'base64');
    
    // Create a unique name to prevent collisions, naming it after the teacher if available
    const fileExt = path.extname(fileName);
    let finalFileName = "";

    if (teacherName) {
      const unsignedTeacherName = removeVietnameseTones(teacherName);
      // Replace unsafe characters with underscore and strip extra whitespaces
      const sanitizedTeacherName = unsignedTeacherName
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_")
        .trim();
      
      let uniqueFileName = `${sanitizedTeacherName}${fileExt}`;
      let counter = 1;
      while (fs.existsSync(path.join(UPLOADS_DIR, uniqueFileName))) {
        uniqueFileName = `${sanitizedTeacherName}_${counter}${fileExt}`;
        counter++;
      }
      finalFileName = uniqueFileName;
    } else {
      const uniqueBaseName = path.basename(fileName, fileExt).replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now();
      finalFileName = `${uniqueBaseName}${fileExt}`;
    }
    
    const filePath = path.join(UPLOADS_DIR, finalFileName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${finalFileName}`;
    res.json({ message: "Tải lên tệp thành công", url: fileUrl, name: finalFileName });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Lỗi lưu trữ tệp tin: " + error.message });
  }
});

// POST submit a movement entry
app.post("/api/movements/:id/submissions", (req, res) => {
  const { id } = req.params;
  const { teacherId, teacherName, department, title, description, link } = req.body;

  if (!teacherId || !teacherName || !title) {
    res.status(400).json({ error: "Thiếu thông tin người nộp hoặc tên bài dự thi" });
    return;
  }

  const movements = loadMovements();
  const movement = movements.find(m => m.id === id);
  if (!movement) {
    res.status(404).json({ error: "Không tìm thấy phong trào thi đua" });
    return;
  }

  if (movement.active === false) {
    res.status(400).json({ error: "Phong trào thi đua này hiện đã tắt, không thể nộp bài dự thi." });
    return;
  }

  // Ensure movement.submissions is initialized
  if (!movement.submissions || !Array.isArray(movement.submissions)) {
    movement.submissions = [];
  }

  // Duplicate submission check: "nếu giáo viên đó đã được gủi lên hệ thống thì không gủi được lần 2"
  const existingSub = movement.submissions.find((sub: any) => sub.teacherId === teacherId);
  if (existingSub) {
    res.status(400).json({ error: "Giáo viên này đã nộp bài minh chứng cho phong trào thi đua này rồi. Không thể nộp lại lần 2." });
    return;
  }

  // File renaming function to name file after the submitting teacher: "tên file minh chứng là họ tên của giáo viên đó gửi"
  let finalLink = link || "";
  if (finalLink && finalLink.startsWith("/uploads/")) {
    const fileNameOnDisk = path.basename(finalLink);
    const oldPath = path.join(UPLOADS_DIR, fileNameOnDisk);
    if (fs.existsSync(oldPath)) {
      const fileExt = path.extname(fileNameOnDisk);
      // Convert teacher's name to unsigned ("không dấu") and sanitize for filesystem
      const unsignedTeacherName = removeVietnameseTones(teacherName);
      const sanitizedTeacherName = unsignedTeacherName.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_").trim();
      const newFileName = `${sanitizedTeacherName}${fileExt}`;

      let uniqueNewFileName = newFileName;
      let counter = 1;
      while (fs.existsSync(path.join(UPLOADS_DIR, uniqueNewFileName))) {
        uniqueNewFileName = `${sanitizedTeacherName}_${counter}${fileExt}`;
        counter++;
      }

      const finalPath = path.join(UPLOADS_DIR, uniqueNewFileName);
      try {
        fs.renameSync(oldPath, finalPath);
        finalLink = `/uploads/${uniqueNewFileName}`;
      } catch (renameErr) {
        console.error("Error renaming uploaded file to teacher name:", renameErr);
      }
    }
  }

  const newSubmission = {
    id: "sub_" + Date.now(),
    teacherId,
    teacherName,
    department: department || "Chưa rõ",
    title,
    description: description || "",
    link: finalLink,
    submittedAt: new Date().toISOString(),
    status: "Đã nộp"
  };

  movement.submissions.push(newSubmission);
  saveMovements(movements);

  // Auto-reward KPI Bonus: Participating in extracurricular movements boosts the 'activities' -> 'extracurricular' metric
  const teachers = loadTeachers();
  const teacher = teachers.find(t => t.id === teacherId);
  if (teacher) {
    const actCat = teacher.kpis.find(c => c.id === "activities");
    if (actCat) {
      const m = actCat.metrics.find(metric => metric.id === "extracurricular");
      if (m) {
        m.actual = Math.min(100, m.actual + 5); // Reward +5 points
      }
    }
    
    // Save state of current KPIs for the selected period
    recalculateScore(teacher, loadWeights());
    if (teacher.periodKPIs && teacher.kpiPeriod) {
      teacher.periodKPIs[teacher.kpiPeriod] = {
        kpis: JSON.parse(JSON.stringify(teacher.kpis)),
        overallScore: teacher.overallScore,
        status: teacher.status
      };
    }
    saveTeachers(teachers);
  }

  res.json({ message: "Nộp bài dự thi thành công!", movements });
});

// PUT update movement submission status (review / grade / award)
app.put("/api/movements/:movId/submissions/:subId", (req, res) => {
  const { movId, subId } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: "Thiếu trạng thái phê duyệt" });
    return;
  }

  const movements = loadMovements();
  const movement = movements.find(m => m.id === movId);
  if (!movement) {
    res.status(404).json({ error: "Không tìm thấy phong trào" });
    return;
  }

  const submission = movement.submissions.find(s => s.id === subId);
  if (!submission) {
    res.status(404).json({ error: "Không tìm thấy bài nộp" });
    return;
  }

  submission.status = status;
  saveMovements(movements);

  // Extra KPI Bonus: If the teacher wins an award, reward their Professionalism -> Training metric
  if (status.startsWith("Đạt giải")) {
    const teachers = loadTeachers();
    const teacher = teachers.find(t => t.id === submission.teacherId);
    if (teacher) {
      const profCat = teacher.kpis.find(c => c.id === "professionalism");
      if (profCat) {
        const m = profCat.metrics.find(metric => metric.id === "training");
        if (m) {
          m.actual = Math.min(100, m.actual + 10); // Reward +10 points
        }
      }
      
      recalculateScore(teacher, loadWeights());
      if (teacher.periodKPIs && teacher.kpiPeriod) {
        teacher.periodKPIs[teacher.kpiPeriod] = {
          kpis: JSON.parse(JSON.stringify(teacher.kpis)),
          overallScore: teacher.overallScore,
          status: teacher.status
        };
      }
      saveTeachers(teachers);
    }
  }

  res.json({ message: "Cập nhật trạng thái bài dự thi thành công!", movements });
});

// DELETE a movement submission
app.delete("/api/movements/:movId/submissions/:subId", requireAdmin, (req, res) => {
  const { movId, subId } = req.params;
  const movements = loadMovements();
  const movement = movements.find(m => m.id === movId);
  if (!movement) {
    res.status(404).json({ error: "Không tìm thấy phong trào" });
    return;
  }

  const initialLen = movement.submissions.length;
  movement.submissions = movement.submissions.filter(s => s.id !== subId);
  if (movement.submissions.length === initialLen) {
    res.status(404).json({ error: "Không tìm thấy bài nộp" });
    return;
  }

  saveMovements(movements);
  res.json({ message: "Xóa bài nộp thành công", movements });
});

// AI Evaluation Endpoint
app.post("/api/teachers/:id/evaluate", requireAdminOrGroupLeader, async (req, res) => {
  const teachers = loadTeachers();
  const teacher = teachers.find(t => t.id === req.params.id);
  if (!teacher) {
    res.status(404).json({ error: "Không tìm thấy giáo viên" });
    return;
  }

  const user = (req as any).user;
  if (user && user.type === "leader") {
    if (teacher.department !== user.department) {
      res.status(403).json({ error: "Bạn chỉ có quyền đánh giá thành viên trong tổ của mình" });
      return;
    }
  }

  const { evaluatorName } = req.body;
  const evaluator = evaluatorName || "Hệ thống Đánh giá AI";

  try {
    // Format KPI details for Gemini
    let kpiDetails = `HỒ SƠ GIÁO VIÊN:
Họ tên: ${teacher.name}
Môn dạy: ${teacher.subject}
Tổ chuyên môn: ${teacher.department}
Tổng điểm KPI hiện tại: ${teacher.overallScore}/100 (${teacher.status})
Kỳ đánh giá: ${teacher.kpiPeriod}

CHI TIẾT CHỈ SỐ KPI (Target là Mục tiêu, Actual là Thực tế đạt được):
`;

    teacher.kpis.forEach((cat: any) => {
      kpiDetails += `\n* Nhóm KPI: ${cat.name} (Trọng số ${cat.weight}%):\n`;
      cat.metrics.forEach((m: any) => {
        kpiDetails += `  - ${m.name} [Mục tiêu: ${m.target}, Thực tế đạt: ${m.actual}, Trọng số trong nhóm: ${m.weight}%] - ${m.description}\n`;
      });
    });

    const prompt = `Bạn là một chuyên gia khảo thí, kiểm định giáo dục và hiệu trưởng trường phổ thông dày dặn kinh nghiệm tại Việt Nam.
Hãy phân tích dữ liệu KPI thực tế của giáo viên sau đây một cách cực kỳ minh bạch, khách quan và khoa học.

${kpiDetails}

Yêu cầu đầu ra bằng Tiếng Việt chuẩn mực sư phạm và gửi lại cấu trúc JSON chứa các trường sau:
1. "strengths": Mảng chứa ít nhất 3 ưu điểm nổi bật (ghi rõ dựa trên số liệu thực tế nào của KPI).
2. "weaknesses": Mảng chứa ít nhất 2 điểm còn hạn chế hoặc chỉ số chưa đạt mục tiêu đề ra (ghi rõ dựa trên số liệu thực tế nào của KPI).
3. "actionPlan": Mảng chứa ít nhất 3 đề xuất/kế hoạch hành động chi tiết, thực tế và có tính khả thi cao giúp giáo viên nâng cao các chỉ số còn yếu kém trong tháng tiếp theo.
4. "suggestedRating": Xếp loại khuyến nghị dựa trên điểm số (Một trong các giá trị: "Xuất sắc" nếu >=90, "Khá" nếu từ 80-89, "Trung bình" nếu từ 65-79, "Yếu" nếu dưới 65).
5. "summary": Đoạn văn tổng hợp (khoảng 150-200 từ) nhận xét tổng thể về tinh thần, hiệu suất giảng dạy và đóng góp chuyên môn của giáo viên một cách mang tính khích lệ nhưng vẫn thẳng thắn, chính xác.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là trợ lý AI chuyên gia đánh giá hiệu suất giáo viên (Teacher KPI Analysis Engine) của Sở/Trường học Việt Nam. Hãy phản hồi hoàn toàn bằng định dạng JSON phù hợp với Schema được chỉ định.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách ưu điểm nổi bật sư phạm dựa trên số liệu KPI"
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách hạn chế hoặc chỉ số chưa đạt mục tiêu"
            },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Kế hoạch hành động cụ thể cho tháng tới"
            },
            suggestedRating: {
              type: Type.STRING,
              description: "Xếp loại khuyến nghị dựa trên kết quả tính toán"
            },
            summary: {
              type: Type.STRING,
              description: "Nhận xét tổng hợp mang tính sư phạm và chính xác"
            }
          },
          required: ["strengths", "weaknesses", "actionPlan", "suggestedRating", "summary"]
        }
      }
    });

    const textResult = response.text || "{}";
    const parsedResult = JSON.parse(textResult.trim());

    // Assemble new evaluation item
    const newEvaluation = {
      id: "eval_" + Date.now(),
      period: teacher.kpiPeriod,
      overallScore: teacher.overallScore,
      status: teacher.status,
      evaluator: evaluator,
      evaluatedAt: new Date().toISOString().split('T')[0],
      feedback: `**Nhận xét tổng thể:** ${parsedResult.summary}\n\n` +
                `**Ưu điểm nổi bật:**\n${parsedResult.strengths.map((s: string) => `- ${s}`).join('\n')}\n\n` +
                `**Điểm cần cải thiện:**\n${parsedResult.weaknesses.map((w: string) => `- ${w}`).join('\n')}\n\n` +
                `**Kế hoạch hành động đề xuất:**\n${parsedResult.actionPlan.map((p: string) => `- ${p}`).join('\n')}`
    };

    teacher.evaluations.unshift(newEvaluation);
    saveTeachers(teachers);

    res.json({
      evaluation: newEvaluation,
      rawAI: parsedResult
    });

  } catch (error: any) {
    console.error("AI Evaluation error:", error);
    res.status(500).json({ error: "Lỗi trong quá trình xử lý đánh giá AI: " + error.message });
  }
});

// Serve Vite in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
