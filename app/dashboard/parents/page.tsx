"use client"

import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  Megaphone,
  School,
  UserRound,
} from "lucide-react"
import { getSelectedChild } from "@/lib/parent"

type Child = {
  id: number
  name: string
  className: string
  admissionNo: string
  attendance: string
  averageScore: string
  feeStatus: string
}

const children: Child[] = [
  {
    id: 1,
    name: "David Johnson",
    className: "JSS 2",
    admissionNo: "EDU-1024",
    attendance: "92%",
    averageScore: "78%",
    feeStatus: "Paid",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    className: "Primary 5",
    admissionNo: "EDU-1025",
    attendance: "96%",
    averageScore: "84%",
    feeStatus: "Pending",
  },
]

const resultsByChild: Record<
  string,
  { subject: string; score: number; grade: string }[]
> = {
  "David Johnson": [
    { subject: "Mathematics", score: 85, grade: "A" },
    { subject: "English", score: 76, grade: "B" },
    { subject: "Basic Science", score: 81, grade: "A" },
    { subject: "Social Studies", score: 72, grade: "B" },
  ],
  "Sarah Johnson": [
    { subject: "Mathematics", score: 90, grade: "A" },
    { subject: "English", score: 84, grade: "A" },
    { subject: "Basic Science", score: 79, grade: "B" },
    { subject: "Social Studies", score: 83, grade: "A" },
  ],
}

const announcements = [
  {
    id: 1,
    title: "PTA Meeting",
    message: "The PTA meeting will hold on Friday by 10:00 AM in the school hall.",
    date: "March 29, 2026",
  },
  {
    id: 2,
    title: "Second Term Examination",
    message: "Second term examinations will begin on April 8, 2026.",
    date: "March 27, 2026",
  },
  {
    id: 3,
    title: "School Fees Reminder",
    message: "Parents are advised to complete outstanding fee payments before April 5.",
    date: "March 25, 2026",
  },
]

const upcomingEvents = [
  { title: "Open Day", date: "April 2, 2026", time: "10:00 AM" },
  { title: "Inter-house Sports", date: "April 10, 2026", time: "9:00 AM" },
  { title: "Exam Begins", date: "April 8, 2026", time: "8:00 AM" },
]

export default function ParentPortalPage() {
  const selectedChild = getSelectedChild()

  const selectedChildData =
    children.find((child) => child.id === selectedChild?.id) || null

  const selectedResults = selectedChildData
    ? resultsByChild[selectedChildData.name] || []
    : []

  const totalChildren = children.length
  const pendingFees = children.filter((child) => child.feeStatus === "Pending").length
  const avgAttendance =
    Math.round(
      children.reduce((sum, child) => sum + Number(child.attendance.replace("%", "")), 0) /
        children.length
    ) + "%"

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-blue-100">Welcome back</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">Parent Portal</h1>
              <p className="mt-2 text-sm text-blue-100">
                Track your child&apos;s attendance, results, payments, and school updates.
              </p>
              <p className="mt-3 text-sm font-semibold text-white/90">
                Selected Child: {selectedChildData?.name || "No child selected"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-3">
                  <UserRound size={22} />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Logged in as</p>
                  <p className="font-semibold">Mr. / Mrs. Johnson</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!selectedChildData ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
            Select a child from the top dashboard selector to view the parent portal.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Children"
                value={String(totalChildren)}
                icon={<UserRound size={20} />}
                subtitle="Linked to your account"
              />
              <StatCard
                title="Average Attendance"
                value={selectedChildData.attendance}
                icon={<CheckCircle2 size={20} />}
                subtitle="For selected child"
              />
              <StatCard
                title="Fee Status"
                value={selectedChildData.feeStatus}
                icon={<CreditCard size={20} />}
                subtitle="Current payment state"
              />
              <StatCard
                title="Announcements"
                value={String(announcements.length)}
                icon={<Megaphone size={20} />}
                subtitle="Recent school updates"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Selected Child Overview
                      </h2>
                      <p className="text-sm text-slate-500">
                        Current summary for your selected child
                      </p>
                    </div>
                    <Link
                      href="/dashboard/students"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Students
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {selectedChildData.name}
                        </h3>
                        <p className="text-sm text-slate-500">{selectedChildData.className}</p>
                      </div>
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {selectedChildData.admissionNo}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <InfoBadge label="Attendance" value={selectedChildData.attendance} />
                      <InfoBadge label="Average Score" value={selectedChildData.averageScore} />
                      <InfoBadge label="Fee Status" value={selectedChildData.feeStatus} />
                      <InfoBadge label="Class" value={selectedChildData.className} />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/dashboard/students/${selectedChildData.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Profile
                      </Link>
                      <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Message School
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Recent Results</h2>
                      <p className="text-sm text-slate-500">
                        Latest academic performance for {selectedChildData.name}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-left text-sm text-slate-500">
                          <th className="pb-2">Subject</th>
                          <th className="pb-2">Score</th>
                          <th className="pb-2">Grade</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResults.length > 0 ? (
                          selectedResults.map((result, index) => (
                            <tr key={index} className="rounded-xl bg-slate-50">
                              <td className="rounded-l-xl px-4 py-3 font-medium text-slate-800">
                                {result.subject}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{result.score}%</td>
                              <td className="px-4 py-3 text-slate-700">{result.grade}</td>
                              <td className="rounded-r-xl px-4 py-3">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                  Good
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                            >
                              No results found for the selected child.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">School Announcements</h2>
                      <p className="text-sm text-slate-500">Important notices from the school</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {announcements.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <span className="text-sm text-slate-500">{item.date}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-green-100 p-2 text-green-700">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Upcoming Events</h2>
                      <p className="text-sm text-slate-500">School calendar highlights</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="rounded-xl bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={14} />
                          <span>{event.date}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                          <Clock3 size={14} />
                          <span>{event.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-red-100 p-2 text-red-700">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Fee Summary</h2>
                      <p className="text-sm text-slate-500">Payment overview</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Total Children</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{totalChildren}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Selected Child Status</p>
                      <p
                        className={`mt-1 text-xl font-bold ${
                          selectedChildData.feeStatus === "Paid"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedChildData.feeStatus}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Pending Accounts</p>
                      <p className="mt-1 text-xl font-bold text-red-600">{pendingFees}</p>
                    </div>
                  </div>

                  <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                    Pay School Fees
                  </button>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <School size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
                      <p className="text-sm text-slate-500">Fast parent access</p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Link
                      href="/dashboard/attendance"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Attendance
                    </Link>
                    <Link
                      href="/dashboard/results"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Results
                    </Link>
                    <Link
                      href="/dashboard/fees"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Check Fees
                    </Link>
                    <Link
                      href="/dashboard/messages"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Contact School
                    </Link>
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">My Children</h2>
                    <p className="text-sm text-slate-500">
                      Other children linked to your account
                    </p>
                  </div>

                  <div className="space-y-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className={`rounded-xl border p-4 ${
                          selectedChildData.id === child.id
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{child.name}</p>
                        <p className="text-sm text-slate-500">{child.className}</p>
                        <p className="mt-2 text-xs text-slate-600">
                          Attendance: {child.attendance} • Score: {child.averageScore}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  )
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  )
}