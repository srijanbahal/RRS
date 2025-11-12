import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, ShieldCheck, Gauge, Users, Layers, Globe2, Github, Youtube, Twitter, ChevronRight } from "lucide-react";

// Landing page designed with a clean IIT-D style aesthetic: bold type, generous whitespace,
// soft gradients, micro-interactions, and clear hierarchy.
// TailwindCSS + Framer Motion. Drop into your React app and render <LandingPage />.

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0b0f17] text-white overflow-x-hidden">
      {/* --- Ambient Background --- */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(64,199,255,0.25),rgba(11,15,23,0))]" />
        {/* animated gradient blobs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8, scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "linear-gradient(135deg, #60A5FA55, #22D3EE33)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7, scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: "linear-gradient(135deg, #A78BFA44, #34D39933)" }}
        />
      </div>

      {/* --- Navbar --- */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/0 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-fuchsia-500 shadow-lg shadow-fuchsia-500/20" />
            <span className="text-lg font-semibold tracking-wide">TrackShift Arena</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#live" className="hover:text-white transition">Live races</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/90 hover:bg-white/5">
              <Github className="h-4 w-4" /> GitHub
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 text-sm font-medium shadow-lg shadow-sky-500/20 hover:brightness-110">
              Launch app <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold leading-tight tracking-tight"
            >
              Where AI learns to <span className="bg-gradient-to-r from-sky-400 to-fuchsia-500 bg-clip-text text-transparent">race</span> like F1.
            </motion.h1>
            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-5 text-lg text-white/80 max-w-xl"
            >
              Watch LLM and RL agents battle it out on iconic circuits. Spectate live or build your team, tune personalities, and deploy policies — all in a cinematic, low-latency 3D arena.
            </motion.p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white text-[#0b0f17] px-5 font-medium hover:-translate-y-0.5 transition will-change-transform">
                <PlayCircle className="h-5 w-5" /> Join a live race
              </button>
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-5 text-white/90 hover:bg-white/5">
                Create your team <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 grid grid-cols-3 md:grid-cols-6 gap-6 opacity-80">
              {["OpenAI", "Gemini", "Groq", "FAISS", "Three.js", "PyTorch"].map((brand) => (
                <div key={brand} className="text-xs md:text-sm text-white/60">{brand}</div>
              ))}
            </div>
          </div>

          {/* Showcase Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-3xl border border-white/10 p-2 bg-white/5 backdrop-blur-xl shadow-2xl"
          >
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
              {/* Placeholder for 3D canvas hero */}
              <div className="aspect-[16/10] w-full bg-[radial-gradient(60%_50%_at_50%_30%,#1f2937,transparent)] relative">
                <div className="absolute inset-0 grid grid-cols-3 gap-1 p-4 opacity-30">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/5" />
                  ))}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm">
                      <Sparkles className="h-4 w-4" /> Live Telemetry
                    </span>
                    <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm">
                      <Gauge className="h-4 w-4" /> 60 FPS
                    </span>
                  </div>
                  <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 text-[#0b0f17] text-sm font-semibold">
                    Watch demo <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Feature Grid --- */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Built for spectators and teams</h2>
          <p className="mt-2 text-white/70 max-w-2xl">Two complementary views: cinematic spectating and a deep, data-rich team console. Same race, different superpowers.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard icon={<Users className="h-5 w-5" />} title="Spectator View" desc="Leaderboards, camera cuts, and buttery 3D rendering. Minimal data, maximum drama."/>
          <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Team Console" desc="Private telemetry, per-car decision logs, pit strategy, and agent switching."/>
          <FeatureCard icon={<Layers className="h-5 w-5" />} title="Multi‑Model Agents" desc="Mix LLM drivers (OpenAI, Gemini, Groq) and drop‑in RL policies later."/>
          <FeatureCard icon={<Globe2 className="h-5 w-5" />} title="Rooms & Matchmaking" desc="Auto‑start when full. Up to six cars per room for tight, tactical races."/>
          <FeatureCard icon={<Gauge className="h-5 w-5" />} title="Realtime Telemetry" desc="Sub‑second updates. Smooth client physics with server authority for results."/>
          <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Designer‑grade UI" desc="IIT‑style craft: grids, micro‑interactions, and accessible, legible type."/>
        </div>
      </section>

      {/* --- How it works --- */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-14 md:py-20 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <h3 className="text-2xl md:text-3xl font-semibold">How it works</h3>
            <p className="mt-3 text-white/70">Rooms fill → race starts → agents decide → telemetry streams → you watch. Build teams, pick agents, iterate.
            </p>
          </div>
          <div className="md:col-span-2 grid gap-4">
            {[1,2,3,4].map((step) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: step * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-white/10 grid place-items-center font-semibold">{step}</div>
                  <div className="text-white/90">
                    {step === 1 && (<><h4 className="font-medium">Create or join a room</h4><p className="text-white/70">Each room caps at six cars. When full, countdown begins automatically.</p></>)}
                    {step === 2 && (<><h4 className="font-medium">Add agents & teams</h4><p className="text-white/70">Pick LLM drivers now; slot in RL policies later. Personality presets included.</p></>)}
                    {step === 3 && (<><h4 className="font-medium">Go live</h4><p className="text-white/70">Server streams decisions; client renders smooth physics at 60 FPS.</p></>)}
                    {step === 4 && (<><h4 className="font-medium">Review & iterate</h4><p className="text-white/70">Replay lines, compare telemetry, tweak prompts/policies, and race again.</p></>)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Live CTA --- */}
      <section id="live" className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-900/40 to-fuchsia-900/30 p-8 md:p-12">
          <div className="max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-semibold">Live races every hour</h3>
            <p className="mt-2 text-white/80">Jump in as a spectator or bring your team. Seats are limited per room — grab yours.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white text-[#0b0f17] px-5 font-medium">
                Watch now <Youtube className="h-5 w-5" />
              </button>
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 px-5 text-white/90 hover:bg-white/5">
                Explore rooms <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* decorative stripe */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
            <div className="absolute -right-20 top-10 h-64 w-64 rotate-12 bg-[conic-gradient(from_90deg,transparent,white)] blur-3xl" />
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="mt-10 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-500" />
              <span className="font-semibold">TrackShift Arena</span>
            </div>
            <p className="mt-3 text-white/60 max-w-md">A real‑time AI motorsport platform. Built with FastAPI, WebSockets, React‑Three‑Fiber, and a lot of intent.</p>
            <p className="mt-3 text-white/40 text-sm">© {new Date().getFullYear()} TrackShift. All rights reserved.</p>
          </div>
          <div className="flex md:justify-end gap-3">
            <FooterButton icon={<Twitter className="h-4 w-4" />} label="Twitter" />
            <FooterButton icon={<Youtube className="h-4 w-4" />} label="YouTube" />
            <FooterButton icon={<Github className="h-4 w-4" />} label="GitHub" />
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- FIXED COMPONENT 1 ---
// Define the types for the props
type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/90">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="mt-1 text-white/70 text-sm">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

// --- FIXED COMPONENT 2 ---
// Define the types for the props
type FooterButtonProps = {
  icon: React.ReactNode;
  label: string;
};

function FooterButton({ icon, label }: FooterButtonProps) {
  return (
    <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
      {icon}
      <span>{label}</span>
    </button>
  );
}