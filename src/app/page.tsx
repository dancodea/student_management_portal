import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import UniversityEmblem from '@/components/ui/UniversityEmblem';
import { getSession } from '@/lib/auth';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Award,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
  Download,
  Search,
  ExternalLink,
  ChevronRight,
  Building,
  School,
  Database,
  Cloud,
} from 'lucide-react';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-surface-subtle text-slate-900 selection:bg-univ-100 selection:text-univ-900">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 overflow-hidden bg-white">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-univ-50 border border-univ-200 text-univ-800 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-univ-600 animate-pulse" />
                <span>Federal University of Technology, Minna</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
                Your Academic Journey,{' '}
                <span className="text-univ-800 underline decoration-univ-300 decoration-wavy decoration-2">
                  Simplified.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                A unified digital platform for student registration, course management, academic
                records and result processing. Engineered with institutional accuracy, 5.0 CGPA
                computation and cloud-grade security.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-univ-800 hover:bg-univ-900 text-white font-semibold text-sm transition shadow-card"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                  <span>Access Student Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 transition shadow-subtle"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Administrator Login</span>
                </Link>
              </div>

              {/* Institutional Assurance Badges */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-univ-700" />
                  <span>Senate Moderated Grading</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-univ-700" />
                  <span>AWS RDS &amp; S3 Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-univ-700" />
                  <span>Official Statement of Results</span>
                </div>
              </div>
            </div>

            {/* Right Column: Sophisticated Dashboard Preview Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white border border-slate-200/90 rounded-2xl p-5 shadow-elevated">
                {/* Window Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-400 ml-2">portal.futminna.edu.ng</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-univ-100 text-univ-800">
                    Live Demo
                  </span>
                </div>

                {/* Student Preview Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                    <GraduationCap className="w-7 h-7 text-univ-800" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">Musa Ibrahim</h3>
                    <p className="text-xs font-mono font-semibold text-univ-800">UG/20/1042</p>
                    <p className="text-[11px] text-slate-500 truncate">Computer Engineering &bull; 300L</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Current CGPA</span>
                    <span className="text-xl font-black text-amber-600 font-mono">4.63</span>
                  </div>
                </div>

                {/* Quick Academic Metric Row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Enrolled</span>
                    <span className="text-sm font-bold text-slate-900">18 Units</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Semester GPA</span>
                    <span className="text-sm font-bold text-univ-800">4.80 / 5.0</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Standing</span>
                    <span className="text-[11px] font-bold text-amber-700">1st Class</span>
                  </div>
                </div>

                {/* Courses Snapshot */}
                <div className="pt-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Recent Examination Scores</span>
                    <span className="text-[10px] font-mono text-univ-700">2024/2025 First Sem</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">CPE311</span>
                        <span className="text-[11px] text-slate-500 font-sans ml-2">Microprocessors</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">84%</span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-bold">
                          A (5.0)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">CPE313</span>
                        <span className="text-[11px] text-slate-500 font-sans ml-2">Signals &amp; Systems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">72%</span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-bold">
                          A (5.0)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-900">CSC311</span>
                        <span className="text-[11px] text-slate-500 font-sans ml-2">Database Systems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">67%</span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-800 font-bold">
                          B (4.0)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Callout */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Senate Published Record
                  </span>
                  <Link
                    href="/login"
                    className="font-semibold text-univ-800 hover:text-univ-950 flex items-center gap-0.5"
                  >
                    <span>View Result Slip</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-20 bg-surface-subtle border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-univ-800 font-mono">
              Comprehensive Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mt-2">
              Engineered for Nigerian Higher Education
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Every workflow has been carefully structured to meet university senate guidelines,
              departmental regulations, and official grading policies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-univ-50 border border-univ-200 text-univ-800 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Student Portal Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enrolled undergraduates sign in using their institutional matriculation number
                to access a personalised academic dashboard, course list and result history.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-univ-50 border border-univ-200 text-univ-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Course Registration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Semester enrollment from pre-accredited departmental curricula with strict
                credit load validation (15–24 units limit) and printable course slips.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-univ-50 border border-univ-200 text-univ-800 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Academic Results</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous assessment (CA capped at 40) and semester exam (capped at 60) scoring
                with automated total computation, letter grading, and grade point allocation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-gold-50 border border-gold-200 text-gold-800 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">4. GPA and CGPA Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standard Nigerian 5.0 CGPA weighted credit computation with instantaneous degree
                classification (First Class, Second Class Upper, Lower, Third Class, Pass).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-univ-50 border border-univ-200 text-univ-800 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">5. Statement of Results</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Formal A4 printable examination transcripts carrying the university seal, student
                passport photograph, digital verification watermark, and registrar signoff slots.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card hover:border-univ-400 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">6. Administrative Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Master gradebook with bulk CSV upload, departmental broadsheet matrices,
                competitive class position rankings, session switches, and audit trail logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about-portal" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-univ-800 font-mono">
              Workflow Lifecycle
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mt-2">
              How the Portal Operates
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A transparent, two-way interaction between students and the academic registry.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Student Flow */}
            <div className="bg-surface-subtle border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-univ-800 text-white flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Undergraduate Student Flow</h3>
                  <p className="text-xs text-slate-500">From enrollment to graduation transcript</p>
                </div>
              </div>

              <ol className="space-y-4 text-xs">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-univ-100 text-univ-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Profile Self-Registration</strong>
                    <span className="text-slate-600">
                      Submit biodata, program, matriculation number, and upload an official passport photograph.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-univ-100 text-univ-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Semester Course Enrollment</strong>
                    <span className="text-slate-600">
                      Select courses for the active session, verify credit limits (15–24 units), and generate the course registration slip.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-univ-100 text-univ-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Result Slip Generation</strong>
                    <span className="text-slate-600">
                      Track semester GPA and cumulative CGPA, then print or download official A4 statements of results.
                    </span>
                  </div>
                </li>
              </ol>
            </div>

            {/* Administrator Flow */}
            <div className="bg-surface-subtle border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Academic Registry &amp; Admin Flow</h3>
                  <p className="text-xs text-slate-500">School operational control and grade processing</p>
                </div>
              </div>

              <ol className="space-y-4 text-xs">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Session &amp; Registration Control</strong>
                    <span className="text-slate-600">
                      Open or close registration windows, set current academic year, and moderate result publication states.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Score Scoring &amp; Bulk CSV</strong>
                    <span className="text-slate-600">
                      Enter continuous assessment and exam marks directly or import complete course gradebooks via CSV spreadsheets.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-sm mb-0.5">Senate Broadsheet &amp; Rankings</strong>
                    <span className="text-slate-600">
                      Generate class-wide broadsheet matrices with student performance rankings for departmental board meetings.
                    </span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Services Section */}
      <section id="academic-services" className="py-20 bg-surface-subtle border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-univ-800 font-mono">
              Academic Services
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mt-2">
              Institutional Standards &amp; Accreditation
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Serving the academic registry across science and engineering disciplines.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <School className="w-7 h-7 text-univ-800 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm mb-1">Pre-Seeded Curricula</h4>
              <p className="text-xs text-slate-500">
                Complete 100L through 500L engineering and technology program courses.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <Award className="w-7 h-7 text-gold-700 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm mb-1">5-Point CGPA Scale</h4>
              <p className="text-xs text-slate-500">
                Formula compliant with National Universities Commission (NUC) standards.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <Cloud className="w-7 h-7 text-sky-700 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm mb-1">AWS Cloud Native</h4>
              <p className="text-xs text-slate-500">
                Decoupled Amazon EC2, managed RDS MySQL, and S3 passport object storage.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
              <FileText className="w-7 h-7 text-amber-700 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 text-sm mb-1">Authentic Transcripts</h4>
              <p className="text-xs text-slate-500">
                Clean printable layouts with institutional seal and registrar signature blocks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UniversityEmblem size="md" />
                <div className="flex flex-col text-white font-bold leading-tight">
                  <span>FUTMINNA</span>
                  <span className="text-[10px] text-univ-400 font-mono uppercase">University Portal</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Federal University of Technology, Minna. Technology for Self Reliance.
                Official academic records and student registration infrastructure.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Portal Portals
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Undergraduate Student Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Academic Registry Login
                  </Link>
                </li>
                <li>
                  <Link href="/student/print-result" className="hover:text-white transition">
                    Statement of Results Printout
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Campuses &amp; Addresses
              </h4>
              <address className="not-italic space-y-1 text-[11px] text-slate-400 leading-relaxed">
                <p><strong>Main Campus:</strong> Gidan Kwano, KM 10, Bida Road, Minna, Niger State.</p>
                <p><strong>Bosso Campus:</strong> Bosso Road, Minna, Niger State, Nigeria.</p>
                <p><strong>Postal Address:</strong> P.M.B. 65, Minna.</p>
              </address>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                Infrastructure &amp; Security
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Three-tier architecture deployed on Amazon Web Services (AWS EC2, RDS MySQL, S3) with encrypted session cookies and bcrypt password hashing.
              </p>
              <span className="inline-block px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-univ-400 font-mono text-[10px]">
                System Online &bull; v1.2 Production
              </span>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Federal University of Technology, Minna. All rights reserved.
            </div>
            <div className="flex gap-4">
              <span>Academic Affairs Division</span>
              <span>&bull;</span>
              <span>Information Technology Services (ITS)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
