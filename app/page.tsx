import Link from "next/link"

const features = [
  {
    title: "Student Management",
    description: "Manage student records, classes, parent links, and academic history from one dashboard.",
  },
  {
    title: "Attendance Tracking",
    description: "Record daily attendance and help parents stay informed about their child’s presence.",
  },
  {
    title: "Results & Report Cards",
    description: "Upload results, calculate averages, generate reports, and give parents real-time access.",
  },
  {
    title: "Fees & Billing",
    description: "Create invoices, track payments, manage balances, and organize financial records.",
  },
  {
    title: "Parent Portal",
    description: "Parents can view results, attendance, and child progress from their mobile app.",
  },
  {
    title: "Analytics for PRO Schools",
    description: "Unlock school insights, performance trends, attendance charts, and smarter decisions.",
  },
]

const steps = [
  "Create your school account",
  "Add students, teachers, and classes",
  "Start managing results, attendance, and fees",
  "Parents log in and follow progress instantly",
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              E
            </div>
            <div>
              <p className="text-lg font-bold">EduNerve</p>
              <p className="text-xs text-slate-500">by TechNerve Inc.</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-600">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-600">
              How it works
            </a>
            <a href="#pricing" className="hover:text-blue-600">
              Pricing
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Smart School Management System
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Run your entire school from one smart platform.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            EduNerve helps schools manage students, teachers, results,
            attendance, fees, and parent communication — all in one secure
            system built for Nigerian and African schools.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              See Features
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
            <div>
              <p className="text-2xl font-bold text-slate-950">100%</p>
              <p className="text-sm text-slate-500">Digital records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">24/7</p>
              <p className="text-sm text-slate-500">Parent access</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">PRO</p>
              <p className="text-sm text-slate-500">Analytics ready</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">School Dashboard</p>
                <h2 className="mt-1 text-2xl font-bold">Welcome, Admin</h2>
              </div>
              <div className="rounded-xl bg-white/20 px-3 py-2 text-sm">
                Live
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                ["Students", "1,240"],
                ["Teachers", "48"],
                ["Classes", "32"],
                ["Results", "860"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/15 p-4">
                  <p className="text-sm text-blue-100">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Attendance
              </p>
              <div className="mt-4 h-24 rounded-xl bg-white p-3">
                <div className="flex h-full items-end gap-2">
                  <div className="h-12 flex-1 rounded bg-blue-200" />
                  <div className="h-20 flex-1 rounded bg-blue-500" />
                  <div className="h-16 flex-1 rounded bg-blue-300" />
                  <div className="h-24 flex-1 rounded bg-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Parent Updates
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white p-3 text-sm text-slate-600">
                  Result uploaded
                </div>
                <div className="rounded-xl bg-white p-3 text-sm text-slate-600">
                  Attendance marked
                </div>
                <div className="rounded-xl bg-white p-3 text-sm text-slate-600">
                  Invoice created
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-blue-600">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything your school needs in one place
            </h2>
            <p className="mt-4 text-slate-600">
              EduNerve replaces paper records, scattered spreadsheets, and
              manual stress with a simple digital system.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-600">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-semibold text-blue-600">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Start managing your school digitally in simple steps.
              </h2>
              <p className="mt-4 text-slate-600">
                EduNerve is designed to be easy for school owners,
                administrators, teachers, and parents to use.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-2 font-medium text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-blue-300">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Flexible plans for growing schools
            </h2>
            <p className="mt-4 text-slate-300">
              Start with core school tools and upgrade to PRO when you need
              advanced analytics and automation.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-bold">Starter</h3>
              <p className="mt-2 text-slate-300">
                For schools starting their digital journey.
              </p>
              <ul className="mt-8 space-y-3 text-slate-200">
                <li>✓ Student management</li>
                <li>✓ Teacher management</li>
                <li>✓ Attendance</li>
                <li>✓ Results</li>
                <li>✓ Parent access</li>
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950"
              >
                Start Now
              </Link>
            </div>

            <div className="rounded-3xl border border-blue-400 bg-blue-600 p-8 shadow-2xl">
              <div className="mb-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                Recommended
              </div>
              <h3 className="text-2xl font-bold">PRO</h3>
              <p className="mt-2 text-blue-100">
                For schools that want deeper insights and automation.
              </p>
              <ul className="mt-8 space-y-3 text-white">
                <li>✓ Everything in Starter</li>
                <li>✓ Analytics dashboard</li>
                <li>✓ Attendance trends</li>
                <li>✓ Subject performance insights</li>
                <li>✓ Advanced reporting</li>
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-blue-700"
              >
                Upgrade to PRO
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ready to manage your school the smart way?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            EduNerve gives your school the digital backbone it needs to save
            time, improve communication, and make better decisions.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Get Started
            </Link>
            <a
              href="mailto:technavetech@gmail.com"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Contact TechNerve
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              TN
            </div>
            <span className="font-semibold text-slate-700">TechNerve Inc.</span>
          </div>
          <p>
            © {new Date().getFullYear()} EduNerve. Build by TechNerve.
          </p>
        </div>
      </footer>
    </main>
  )
}