import * as React from "react";
import { ArrowRight, CheckCircle2, Shield, MessageSquare, Users, Sparkles, Zap, Mail, Phone, MapPin, Globe, ChevronUp } from "lucide-react";
import { Button, cn, Modal, Input } from "../components/ui-components";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "../components/Logo";

export function LandingPage() {
  const [typedText, setTypedText] = React.useState("");
  const [showGhostText, setShowGhostText] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);
  const [cursorY, setCursorY] = React.useState(30);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  const placeholderBase = "Type something";
  const ghostSuggestion = " amazing together...";

  // Simulated typing effect
  React.useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= placeholderBase.length) {
        setTypedText(placeholderBase.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowGhostText(true), 500);
        setTimeout(() => setShowNotification(true), 1500);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top listener
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="aurora-bg grain-texture min-h-screen">
      {/* ——— Hero: Editor-First Experience ——— */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden doodle-accents">
        {/* Floating aurora orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-[100px] animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-[#6EE7B7]/8 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-48 h-48 bg-[#FB7185]/6 rounded-full blur-[80px] animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

        {/* Mini tagline above editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full text-sm font-medium text-[#6366F1] dark:text-[#C4B5FD]">
            <Sparkles className="w-4 h-4" />
            <span>Real-time Collaboration · Live Sync · Instant Chat</span>
          </div>
        </motion.div>

        {/* ——— The Editor Canvas ——— */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="w-full max-w-4xl z-10"
        >
          <div className="glass-panel-strong rounded-[24px] overflow-hidden relative glow-border">
            {/* Editor title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(139,92,246,0.1)]">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[#FB7185]/70 rounded-full" />
                  <div className="w-3 h-3 bg-[#FBBF24]/70 rounded-full" />
                  <div className="w-3 h-3 bg-[#6EE7B7]/70 rounded-full" />
                </div>
                <div className="ml-3 text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Untitled Document
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Avatar cluster */}
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] ring-2 ring-white/50 dark:ring-[#1E1B4B]/50 flex items-center justify-center text-[10px] font-bold text-white">
                    You
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#34D399] ring-2 ring-white/50 dark:ring-[#1E1B4B]/50 flex items-center justify-center text-[10px] font-bold text-white">
                    J
                  </div>
                </div>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium ml-1">2 online</span>
              </div>
            </div>

            {/* Editor body */}
            <div className="p-5 sm:p-8 md:p-12 min-h-[240px] sm:min-h-[320px] relative" style={{ fontFamily: 'var(--font-body)' }}>
              {/* Typed text */}
              <div className="text-base sm:text-xl md:text-2xl text-[#1E1B4B] dark:text-[#E8E6F0] leading-relaxed">
                {typedText}
                {/* Blinking cursor */}
                <span className="inline-block w-[2px] h-7 bg-[#8B5CF6] ml-0.5 animate-cursor-blink align-text-bottom" />
                {/* Ghost AI suggestion */}
                {showGhostText && (
                  <span className="text-[#8B5CF6]/40 dark:text-[#C4B5FD]/30 animate-ghost-text">
                    {ghostSuggestion}
                  </span>
                )}
              </div>

              {/* Second line — simulated content */}
              <div className="mt-6 space-y-3">
                <div className="h-3.5 bg-[rgba(139,92,246,0.06)] dark:bg-[rgba(139,92,246,0.1)] rounded-full w-4/5" />
                <div className="h-3.5 bg-[rgba(139,92,246,0.04)] dark:bg-[rgba(139,92,246,0.07)] rounded-full w-full" />
                <div className="h-3.5 bg-[rgba(139,92,246,0.03)] dark:bg-[rgba(139,92,246,0.05)] rounded-full w-3/5" />
              </div>

              {/* Bhumi's cursor — animated */}
              {/* John's cursor — animated */}
              <motion.div
                animate={{ top: `${cursorY}%`, left: '55%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                className="absolute z-10 pointer-events-none"
              >
                <div className="w-[2px] h-6 bg-[#34D399]" />
                <div className="bg-[#34D399] text-white text-[10px] px-2 py-0.5 rounded-md ml-0.5 mt-0.5 font-semibold shadow-lg shadow-[#34D399]/30 whitespace-nowrap">
                  John
                </div>
              </motion.div>

              {/* Typing indicator for John */}
              <div className="absolute bottom-4 sm:bottom-6 left-5 sm:left-8 md:left-12 flex items-center gap-2">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-typing-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-typing-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-typing-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">John is typing...</span>
              </div>
            </div>

            {/* Notification bubble — slides in */}
            {showNotification && (
              <div className="absolute top-14 right-3 sm:top-16 sm:right-5 animate-slide-in max-w-[calc(100%-1.5rem)]">
                <div className="glass-panel rounded-[14px] px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6EE7B7] to-[#34D399] flex items-center justify-center text-[9px] font-bold text-white">
                    J
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#1E1B4B] dark:text-[#E8E6F0]">John joined the document</p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Just now</p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA integrated inside editor bottom */}
            <div className="border-t border-[rgba(139,92,246,0.08)] px-5 sm:px-8 md:px-12 py-4 sm:py-6 flex flex-col xs:flex-row items-center justify-between gap-3 sm:gap-4">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                ✨ Create your own workspace
              </p>
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="glass" size="md" className="group">
                    Sign Up
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="md">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subtext below editor */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-[#6B7280] dark:text-[#9CA3AF] text-sm max-w-md z-10"
        >
          Collaborate with your team in real-time. No setup needed.
        </motion.p>
      </section>

      {/* ——— Features Section ——— */}
      <section id="features" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6 text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full text-sm font-medium text-[#6366F1] dark:text-[#C4B5FD] mb-6">
              <Zap className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>
              Everything you need to <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">collaborate</span>
            </h2>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] max-w-2xl mx-auto text-lg">
              Build, share, and scale your team's knowledge with tools designed for modern teams.
            </p>
          </motion.div>
        </div>
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-6 relative z-10">
          <FeatureCard
            icon={Users}
            title="Real-Time Editing"
            description="See changes as they happen. Multi-cursor support ensures seamless teamwork without conflicts."
            accent="from-[#6366F1] to-[#8B5CF6]"
            delay={0}
          />
          <FeatureCard
            icon={Shield}
            title="Secure Role-Based Sharing"
            description="Control exactly who can view, comment, or edit your documents with granular permission settings."
            accent="from-[#6EE7B7] to-[#34D399]"
            delay={0.1}
          />
          <FeatureCard
            icon={MessageSquare}
            title="Real-time Team Chat"
            description="Discuss ideas, share feedback, and coordinate with your team without leaving the document editor."
            accent="from-[#FB7185] to-[#F43F5E]"
            delay={0.2}
          />
        </div>
      </section>

      {/* ——— How It Works Section ——— */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>
              Simple as <span className="bg-gradient-to-r from-[#6EE7B7] to-[#34D399] bg-clip-text text-transparent">1-2-3</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[#6366F1]/20 via-[#8B5CF6]/20 to-[#6EE7B7]/20 rounded-full" />
            <Step num="1" title="Login" desc="Securely sign in with your email or Google account." delay={0} />
            <Step num="2" title="Create Document" desc="Start from scratch with a clean collaborative workspace." delay={0.1} />
            <Step num="3" title="Collaborate Live" desc="Share the link and start building together in real-time." delay={0.2} />
          </div>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="glass-panel rounded-[20px] px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <Logo height={28} linkTo="/" />
            <div className="flex items-center gap-8 text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#6366F1] dark:hover:text-[#C4B5FD] transition-colors">GitHub</a>
              <button 
                onClick={() => setIsContactModalOpen(true)} 
                className="hover:text-[#6366F1] dark:hover:text-[#C4B5FD] transition-colors"
              >
                Contact
              </button>
            </div>
            <p className="text-[#9CA3AF] text-sm">&copy; 2026 CollabSpace Inc.</p>
          </div>
        </div>
      </footer>

      {/* ——— Floating Scroll to Top ——— */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-colors group"
          >
            <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ——— Contact Modal ——— */}
      <Modal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        title="Contact Us"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-500">We'd love to hear from you! Reach out via any of the channels below.</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Email</p>
                <p className="text-sm font-medium text-gray-700">support@collabspace.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Phone</p>
                <p className="text-sm font-medium text-gray-700">+1 (555) 000-COLAB</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Headquarters</p>
                <p className="text-sm font-medium text-gray-700">123 Collab Way, Silicon Valley, CA</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => setIsContactModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, accent, delay }: { icon: any; title: string; description: string; accent: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group glass-panel rounded-[20px] p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className={cn("w-12 h-12 rounded-[14px] bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg", accent)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-3 text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p className="text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed text-[15px]">
        {description}
      </p>
    </motion.div>
  );
}

function Step({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center text-center relative z-10"
    >
      <div className="w-16 h-16 glass-panel-strong rounded-full flex items-center justify-center text-2xl font-bold mb-6 glow-border" style={{ fontFamily: 'var(--font-heading)' }}>
        <span className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">{num}</span>
      </div>
      <h3 className="text-lg font-bold mb-2 text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px]">{desc}</p>
    </motion.div>
  );
}
