/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KPIMetric {
  id: string;
  name: string;
  description: string;
  target: number; // percentage or scale
  actual: number; // current value
  weight: number; // weight of this metric within the category (0-100)
}

export interface KPICategory {
  id: string;
  name: string;
  weight: number; // weight of this category in the overall KPI (0-100, e.g. 40, 30, 30)
  metrics: KPIMetric[];
}

export interface EvaluationItem {
  id: string;
  period: string; // e.g., "Tháng 05/2026", "Tháng 06/2026"
  overallScore: number;
  status: string;
  evaluator: string;
  evaluatedAt: string;
  feedback: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  department: string;
  avatarUrl: string;
  kpiPeriod: string;
  academicYear: string; // e.g., "2025-2026"
  kpis: KPICategory[];
  overallScore: number;
  status: 'Xuất sắc' | 'Khá' | 'Trung bình' | 'Yếu';
  evaluations: EvaluationItem[];
  groupRole?: "Tổ trưởng" | "Tổ phó" | "Thành viên";
  teachingRole?: "Giáo viên chủ nhiệm" | "Giáo viên bộ môn";
  assignedClass?: string;
  password?: string;
  periodKPIs?: Record<string, {
    kpis: KPICategory[];
    overallScore: number;
    status: 'Xuất sắc' | 'Khá' | 'Trung bình' | 'Yếu';
  }>;
}

export interface KPIWeights {
  teaching: number; // Default 40
  professionalism: number; // Default 30
  activities: number; // Default 30
}

export interface DashboardStats {
  averageKPI: number;
  totalTeachers: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  needsImprovementCount: number;
  departmentAverages: { department: string; average: number }[];
  monthlyTrend: { month: string; average: number }[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  bio: string;
  avatarColor: string;
  role: 'member' | 'admin';
  tier: 'Platinum' | 'Gold' | 'Silver' | string;
  points: number;
  joinedDate: string;
  checkInStreak: number;
  lastCheckIn: string;
  password?: string;
}

export interface Activity {
  id: string;
  userId: string;
  title: string;
  description: string;
  pointsGained: number;
  timestamp: string;
}
