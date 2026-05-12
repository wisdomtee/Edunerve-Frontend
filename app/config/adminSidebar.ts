import {
  LayoutDashboard,
  School,
  Users,
  FileText,
  Video,
  CreditCard,
} from "lucide-react";

export const adminSidebarLinks = [
  {
    label: "Dashboard",
    path: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Schools",
    path: "/dashboard/super-admin/schools",
    icon: School,
  },
  {
    label: "Students",
    path: "/dashboard/students",
    icon: Users,
  },
  {
    label: "Lesson Notes",
    path: "/dashboard/admin/lesson-notes",
    icon: FileText,
  },
  {
    label: "CBT",
    path: "/dashboard/admin/cbt",
    icon: FileText,
  },
  {
    label: "Zoom",
    path: "/dashboard/admin/zoom",
    icon: Video,
  },
  {
    label: "Billing",
    path: "/dashboard/school-admin/billing",
    icon: CreditCard,
  },
];