import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from './notifications';
import { 
  Mail, Phone, Send, GraduationCap, 
  Menu, Award, Users, BookOpen, Clock, 
  Calendar, ArrowRight, CheckCircle2, ChevronRight, 
  MessageSquare, Sparkles, Newspaper, X,
  Stethoscope, HeartPulse, Activity, ShieldPlus, MapPin, Building2, UserCheck, Microscope,
  Search
} from 'lucide-react';
import { Course, NewsPost, Testimony, Lecturer, CourseReview } from '../types';
import { subjectMap } from '../data';
import { institution } from '../config/institution';

interface LandingPageProps {
  courses: Course[];
  lecturers: Lecturer[];
  reviews?: CourseReview[];
  news: NewsPost[];
  testimonies: Testimony[];
  totalStudentsCount: number;
  onOpenLogin: () => void;
  onOpenApplication: () => void;
  onOpenConsultation?: () => void;
  onSelectCourse: (course: Course) => void;
  onReturnToDashboard?: (role: string, id: string) => void;
}

export default function LandingPage({ 
  courses, 
  lecturers,
  reviews = [],
  news, 
  testimonies, 
  totalStudentsCount, 
  onOpenLogin,
  onOpenApplication,
  onOpenConsultation,
  onSelectCourse,
  onReturnToDashboard
}: LandingPageProps) {
  const { showInfo } = useNotification();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const landingScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const targetId = id.startsWith('#') ? id.slice(1) : id;
    const element = document.getElementById(targetId);
    if (!element || !landingScrollRef.current) return;

    const container = landingScrollRef.current;
    const left = element.offsetLeft - (container.clientWidth - element.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  };

  useEffect(() => {
    const container = landingScrollRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      if (Math.abs(event.deltaY) === 0) return;

      event.preventDefault();
      container.scrollLeft += event.deltaY;
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // Hero carousel slider state
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Session detection for Return to Dashboard logic
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<{ role: string; id: string } | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('zenti_current_user_role');
    const id = localStorage.getItem('zenti_current_user_id');
    if (role && id) {
      setHasActiveSession(true);
      setActiveSession({ role, id });
    } else {
      setHasActiveSession(false);
      setActiveSession(null);
    }
  }, []);

  useEffect(() => {
    const panels = Array.from(document.querySelectorAll('[data-animate-panel]')) as HTMLElement[];
    if (!panels.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.25, root: document.querySelector('.landing-horizontal-shell') }
    );

    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  const handleReturnToDashboard = () => {
    if (onReturnToDashboard && activeSession) {
      onReturnToDashboard(activeSession.role, activeSession.id);
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Faculty contact modal states
  const [selectedLecturerForContact, setSelectedLecturerForContact] = useState<Lecturer | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Custom states for counters
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);

  // Filter for news category
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Triggering count increments upon component mount
  useEffect(() => {
    const activeCount = courses.filter(c => c.active !== false).length;
    const studentsTarget = Math.max(totalStudentsCount, 120);

    const studentsInterval = setInterval(() => {
      setStudentsCount(prev => {
        if (prev >= studentsTarget) {
          clearInterval(studentsInterval);
          return studentsTarget;
        }
        return prev + Math.ceil(studentsTarget / 20);
      });
    }, 40);

    const coursesInterval = setInterval(() => {
      setCoursesCount(prev => {
        if (prev >= activeCount) {
          clearInterval(coursesInterval);
          return activeCount;
        }
        return prev + 1;
      });
    }, 100);

    return () => {
      clearInterval(studentsInterval);
      clearInterval(coursesInterval);
    };
  }, [courses, totalStudentsCount]);

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  const filteredNews = activeNewsCategory === 'all' 
    ? news 
    : news.filter(n => n.category.toLowerCase() === activeNewsCategory.toLowerCase());

  // Slides configuration preserving original authentic healthcare copy
  const heroSlides = [
    {
      id: 0,
      badge: 'Medical Training College & Outpatient Medical Center',
      headline: 'WE PROVIDE BEST HEALTHCARE',
      subheadline: 'Alika Medical Training College & Medical Center',
      description:
        'Professional healthcare education combined with direct outpatient community medical services in Wangige, Kiambu County, Kenya. Practical learning, certified clinical attachments, and dedicated outpatient support.',
      primaryCta: { label: 'Read More', action: () => scrollToSection('departments') },
      secondaryLink: '#departments',
    },
    {
      id: 1,
      badge: 'Certified Vocational Programs',
      headline: 'ADVANCED PRACTICAL TRAINING',
      subheadline: 'Caregiver, Nurse Assistant & Homecare Assistant',
      description:
        'Intensive 4-month vocational certificate curricula covering 10 structured modules, patient care foundations, infection prevention, vital signs monitoring, and hospital attachment.',
      primaryCta: { label: 'Read More', action: () => scrollToSection('courses') },
      secondaryLink: '#courses',
    },
    {
      id: 2,
      badge: 'Community Clinical Services',
      headline: 'ACCESSIBLE OUTPATIENT CARE',
      subheadline: 'Primary Consultations & Preventive Health',
      description:
        'General outpatient consultations, family planning, chronic care management, and triage monitoring delivered by certified healthcare practitioners in Wangige Town.',
      primaryCta: { label: 'Read More', action: () => scrollToSection('departments') },
      secondaryLink: '#contact',
    },
  ];

  const currentHeroSlide = heroSlides[heroSlideIndex];

  // 4 Primary Department Cards mapped to Alika medical brand style s1-s4 icons
  const departmentCards = [
    {
      id: 'outpatient',
      title: 'General Consultation',
      icon: '/images/s1.png',
      description: 'Comprehensive primary healthcare consultations, clinical evaluations, and routine community health diagnoses.',
      tag: 'Primary Care',
      href: '#medical-center',
    },
    {
      id: 'diagnostics',
      title: 'Triage & Diagnostics',
      icon: '/images/s2.png',
      description: 'Rapid clinical assessment, digital vitals logging (blood pressure, pulse, SpO2, BMI), and stabilization protocols.',
      tag: 'Diagnostics',
      href: '#medical-center',
    },
    {
      id: 'maternal',
      title: 'Family Planning',
      icon: '/images/s3.png',
      description: 'Reproductive healthcare counseling, maternal wellness guidance, and supportive reproductive health services.',
      tag: 'Maternal Care',
      href: '#medical-center',
    },
    {
      id: 'infection-control',
      title: 'Infection Control & Care',
      icon: '/images/s4.png',
      description: 'Sterile clinical procedures, routine immunizations, antiseptic wound dressings, and chronic condition monitoring.',
      tag: 'Clinical Safety',
      href: '#medical-center',
    },
  ];

  return (
    <div
      ref={landingScrollRef}
      className="landing-horizontal-shell bg-[#f8fafc] text-slate-800 font-sans selection:bg-teal-700 selection:text-white"
    >
      {/* 1. HERO SECTION WITH ALIKA MEDICAL LAYOUT & VISUAL STYLING */}
      <section
        id="home"
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 relative flex flex-col justify-between bg-[#178066] font-sans select-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(23, 128, 102, 0.95) 0%, rgba(23, 128, 102, 0.7) 45%, rgba(23, 128, 102, 0.1) 75%, transparent 100%), url('/images/hero-bg.png')`,
          backgroundPosition: 'right center',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top Quick Contact Bar */}
        <div className="bg-slate-950/80 backdrop-blur-xs text-slate-300 text-xs py-2 px-4 shadow-inner shrink-0" id="top-contact-bar">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href={`mailto:${institution.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{institution.email}</span>
              </a>
              <a href={`tel:${institution.phonePrimary.replace(/\s+/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{institution.phonePrimary}</span>
              </a>
              <span className="hidden md:flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>{institution.location}</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-slate-400 font-medium">Hours: {institution.operatingHours.weekdays}</span>
              <span className="text-teal-300 font-semibold hidden lg:inline">{institution.phoneSecondary}</span>
            </div>
          </div>
        </div>

        {/* Top Header / Navigation Bar Pinned to Top */}
        <header
          className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-4 shrink-0"
          style={{ paddingTop: '1.5rem' }}
        >
          <div className="flex items-center justify-between">
            {/* Brand Logo with High Letter-Spacing */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
              className="flex items-center gap-3 group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 bg-white text-[#178066] rounded-xl flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6 text-[#178066]" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-white uppercase block leading-none">
                  {institution.shortName.split(' ')[0].toUpperCase()}
                </span>
                <span className="text-[9px] text-teal-200 font-bold uppercase tracking-wider block mt-1">
                  {institution.portalName.toUpperCase()}
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links + Search Icon */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('home');
                }}
                className="text-xs font-bold text-white uppercase tracking-wider border-b-2 border-white pb-1 transition-colors cursor-pointer"
              >
                HOME
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('about');
                }}
                className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-wider pb-1 border-b-2 border-transparent hover:border-white/50 transition-colors cursor-pointer"
              >
                ABOUT
              </a>
              <a
                href="#departments"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('departments');
                }}
                className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-wider pb-1 border-b-2 border-transparent hover:border-white/50 transition-colors cursor-pointer"
              >
                DEPARTMENTS
              </a>
              <a
                href="#courses"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('courses');
                }}
                className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-wider pb-1 border-b-2 border-transparent hover:border-white/50 transition-colors cursor-pointer"
              >
                PROGRAMS
              </a>
              <a
                href="#faculty"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('faculty');
                }}
                className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-wider pb-1 border-b-2 border-transparent hover:border-white/50 transition-colors cursor-pointer"
              >
                DOCTORS
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('contact');
                }}
                className="text-xs font-bold text-white/85 hover:text-white uppercase tracking-wider pb-1 border-b-2 border-transparent hover:border-white/50 transition-colors cursor-pointer"
              >
                CONTACT US
              </a>

              {/* Interactive Search Bar Toggle */}
              <div className="relative flex items-center pl-2">
                {searchOpen && (
                  <input
                    type="text"
                    placeholder="Search programs, departments..."
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                    className="w-48 bg-white/20 backdrop-blur-md text-white placeholder-white/70 text-xs px-3 py-1.5 rounded-full border border-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-all mr-2"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Search"
                  className="text-white hover:text-[#62d2a2] p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Portal Sign In / Return to Dashboard */}
              <div className="pl-2">
                {hasActiveSession ? (
                  <button
                    onClick={handleReturnToDashboard}
                    className="bg-white text-[#178066] hover:bg-teal-50 text-xs font-bold px-4 py-2 rounded-lg shadow uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onOpenLogin}
                    className="bg-white/15 hover:bg-white text-white hover:text-[#178066] border border-white/30 text-xs font-bold px-4 py-2 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Login
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile Actions & Menu Hamburger */}
            <div className="flex items-center space-x-2 lg:hidden">
              {hasActiveSession ? (
                <button
                  onClick={handleReturnToDashboard}
                  className="bg-white text-[#178066] text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
                >
                  Portal
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="bg-white text-[#178066] text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
                >
                  Login
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white p-2 rounded-lg hover:bg-white/10 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 bg-[#126651]/95 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl space-y-4">
              <nav className="flex flex-col space-y-3">
                <a
                  href="#home"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('home');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  HOME
                </a>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  ABOUT
                </a>
                <a
                  href="#departments"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('departments');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  DEPARTMENTS
                </a>
                <a
                  href="#courses"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('courses');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  PROGRAMS
                </a>
                <a
                  href="#faculty"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('faculty');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  DOCTORS
                </a>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('contact');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold tracking-wider text-white hover:text-teal-200 py-1 cursor-pointer"
                >
                  CONTACT US
                </a>
              </nav>
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => { onOpenApplication(); setMobileMenuOpen(false); }}
                  className="w-full bg-white text-[#178066] font-bold text-xs py-2.5 rounded-lg uppercase tracking-wider cursor-pointer"
                >
                  Apply for Admission
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Main Content Area: Left-aligned ~50% width group */}
        <main className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-12 flex-1 flex flex-col justify-center">
          <div className="w-full max-w-lg text-white">
            {/* Sub-pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-bold tracking-wider uppercase text-white">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {currentHeroSlide.badge}
            </div>

            {/* Main Upper Headline */}
            <h1 className="landing-panel-title text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[1.15] drop-shadow-sm transition-all duration-300">
              {currentHeroSlide.headline}
            </h1>

            {/* Description Paragraph */}
            <p className="landing-panel-copy mt-5 text-sm sm:text-base text-white/90 font-normal leading-relaxed transition-opacity duration-300">
              {currentHeroSlide.description}
            </p>

            {/* Call to Action Button: White Rectangular with rounded corners & hover lift */}
            <div className="landing-panel-cta mt-8 sm:mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={currentHeroSlide.primaryCta.action}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#178066] hover:bg-transparent hover:text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-md border border-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{currentHeroSlide.primaryCta.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#courses"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('courses');
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-transparent text-white hover:bg-white/10 font-bold text-sm px-6 py-3.5 rounded-md border border-white/40 transition-colors cursor-pointer"
              >
                <span>Academic Programs</span>
              </a>
            </div>

            {/* Quick Pillars */}
            <div className="pt-8 mt-8 border-t border-white/20 grid grid-cols-3 gap-4 text-left">
              <div>
                <span className="block text-lg sm:text-xl font-extrabold text-white">4 Months</span>
                <span className="text-[11px] text-teal-100">Certificate Duration</span>
              </div>
              <div className="border-x border-white/20 px-3">
                <span className="block text-lg sm:text-xl font-extrabold text-white">10 Modules</span>
                <span className="text-[11px] text-teal-100">Caregiver Curriculum</span>
              </div>
              <div>
                <span className="block text-lg sm:text-xl font-extrabold text-white">Wangige</span>
                <span className="text-[11px] text-teal-100">Kiambu County</span>
              </div>
            </div>
          </div>
        </main>

        {/* Carousel Indicators & Bottom Wave Container */}
        <div className="relative z-20 w-full shrink-0">
          {/* Centered 3-Dot Pagination Indicators */}
          <div className="flex items-center justify-center space-x-3 pb-8 sm:pb-12">
            {heroSlides.map((slide, index) => {
              const isActive = heroSlideIndex === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroSlideIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer ${
                    isActive
                      ? 'w-5 h-5 bg-white shadow-md'
                      : 'w-3 h-3 bg-white/60 hover:bg-white'
                  }`}
                />
              );
            })}
          </div>

          {/* Organic Wave Divider Pinned to Bottom */}
          <div className="relative w-full leading-none pointer-events-none overflow-hidden">
            <svg
              className="relative block w-full h-12 sm:h-16 lg:h-20 text-[#f8fafc]"
              viewBox="0 0 1440 120"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,48 C240,96 480,120 720,84 C960,48 1200,12 1440,48 L1440,120 L0,120 Z"
                fill="#f8fafc"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* 2. DEPARTMENTS SECTION (4-COLUMN RESPONSIVE GRID MATCHING ALIKA MEDICAL HIERARCHY) */}
      <section 
        id="departments" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 bg-[#f8fafc] py-12 px-6 sm:px-8 lg:px-12 flex flex-col justify-center"
      >
        <div className="max-w-7xl mx-auto w-full my-auto">
          {/* Section Header */}
          <div className="landing-panel-content text-center max-w-2xl mx-auto mb-10 lg:mb-14">
            <h2 className="landing-panel-title text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              Our Departments
            </h2>
            <div className="w-16 h-1 bg-[#178066] mx-auto mt-3 mb-4 rounded-full" />
            <p className="landing-panel-copy text-slate-600 text-sm sm:text-base leading-relaxed">
              Comprehensive outpatient clinical services, specialized diagnostics, and practical medical training units in Wangige Town, Kiambu County.
            </p>
          </div>

          {/* 4-Column Responsive Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {departmentCards.map((card) => (
              <div
                key={card.id}
                className="landing-panel-card group bg-white rounded-2xl p-7 text-center border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between items-center hover:-translate-y-1.5"
              >
                {/* Department Icon Container */}
                <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-[#178066]/10 group-hover:bg-[#178066] transition-colors duration-300">
                  <img
                    src={card.icon}
                    alt={`${card.title} icon`}
                    className="w-10 h-10 object-contain group-hover:brightness-0 group-hover:invert transition-all duration-300"
                  />
                </div>

                {/* Card Title & Content */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#178066] bg-[#178066]/10 px-2.5 py-0.5 rounded-full mb-2">
                    {card.tag}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#178066] transition-colors mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>

                {/* View Details Action */}
                <a
                  href={card.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(card.href);
                  }}
                  className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#178066] group-hover:text-[#126651] transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>

          {/* Bottom View All Button */}
          <div className="mt-10 lg:mt-14 text-center">
            <a
              href="#medical-center"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('medical-center');
              }}
              className="inline-block px-8 py-3.5 bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              View All Services
            </a>
          </div>
        </div>
      </section>

      {/* 3. ADMISSIONS CTA BANNER */}
      <section 
        id="admissions" 
        className="w-screen h-screen flex-shrink-0 snap-start overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-gradient-to-r from-[#178066] to-[#126651] text-white flex flex-col justify-center"
      >
        <div className="max-w-7xl mx-auto w-full my-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intakes Ongoing</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">Applications for Healthcare Certificate Programs</h3>
            <p className="text-sm mt-2 text-teal-100 leading-relaxed">
              Enroll in Caregiver, Nurse Assistant, or Homecare Assistant certificate courses. Minimum entry: KCSE Certificate / High School Equivalent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenApplication}
              className="bg-white text-[#178066] hover:bg-teal-50 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Apply Online
            </button>
            <a
              href="#courses"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('courses');
              }}
              className="bg-white/10 text-white border border-white/25 px-5 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors cursor-pointer"
            >
              View Programs
            </a>
          </div>
        </div>
      </section>

      {/* 4. ABOUT INSTITUTION SECTION */}
      <section 
        id="about" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-white flex flex-col justify-center border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto w-full my-auto grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>About Our Institution</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Integrated Medical Training &amp; Community Healthcare
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Alika Medical Training College &amp; Medical Center is an integrated medical training institution and outpatient healthcare facility located in Wangige, Kiambu County, Kenya.
            </p>
            <p className="text-slate-600 text-sm leading-relaxed">
              The institution serves two vital, connected roles:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-[#178066] font-bold text-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span>Medical Training Students</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Providing students with intensive theoretical foundations and practical bedside clinical training.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-[#178066] font-bold text-sm">
                  <Stethoscope className="w-4 h-4" />
                  <span>The Community</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Serving the surrounding Wangige and Kiambu community with accessible outpatient healthcare services.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Physical Campus: ACK St. Peters Church Ndunyu Compound, Wangige</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Operating Monday – Saturday: 9:00 AM – 5:00 PM</span>
              </span>
            </div>

            {/* Accreditation Badges */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Accreditation:</span>
              <div className="flex flex-wrap gap-2">
                {institution.accreditationBodies.map((body) => (
                  <span key={body} className="inline-flex items-center gap-1.5 bg-teal-50 text-[#178066] text-xs font-bold px-3 py-1 rounded-lg border border-teal-200">
                    <Award className="w-3.5 h-3.5 text-[#178066]" />
                    <span>{body}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-gradient-to-br from-[#178066] to-[#0f4b3d] text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-200 block">Institution Details</span>
                <h3 className="text-xl font-bold">{institution.name}</h3>
                <p className="text-xs text-teal-100 leading-relaxed">{institution.address}</p>
              </div>

              <div className="border-t border-white/15 pt-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Primary Phone:</span>
                  <span className="font-semibold text-white">{institution.phonePrimary}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Secondary Phone:</span>
                  <span className="font-semibold text-white">{institution.phoneSecondary}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Official Email:</span>
                  <span className="font-semibold text-teal-100">{institution.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Website:</span>
                  <span className="font-semibold text-teal-100">{institution.website}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-teal-200">Working Days:</span>
                  <span className="font-semibold text-white">Mon – Sat (Sun Closed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEDICAL CENTER EXPANDED SERVICES SECTION */}
      <section 
        id="medical-center" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-slate-50 flex flex-col justify-center border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto w-full my-auto space-y-8 lg:space-y-10">
          <div className="landing-panel-content text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Outpatient Healthcare Services</span>
            </div>
            <h2 className="landing-panel-title text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Alika Medical Center Services
            </h2>
            <p className="landing-panel-copy text-sm text-slate-600 leading-relaxed">
              Our outpatient healthcare facility delivers patient-centered medical consultations, maternal health support, and clinical monitoring to the community while providing authentic clinical environments for student training.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {institution.medicalCenterServices.map((service, idx) => (
              <div 
                key={service.id || idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#178066] flex items-center justify-center font-bold">
                      {idx === 0 && <UserCheck className="w-5 h-5" />}
                      {idx === 1 && <HeartPulse className="w-5 h-5" />}
                      {idx === 2 && <ShieldPlus className="w-5 h-5" />}
                      {idx === 3 && <Activity className="w-5 h-5" />}
                      {idx === 4 && <Microscope className="w-5 h-5" />}
                      {idx >= 5 && <Stethoscope className="w-5 h-5" />}
                    </div>
                    {service.badge && (
                      <span className="text-[10px] uppercase font-bold text-[#178066] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{service.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-[#178066] font-medium flex items-center gap-1">
                  <span>Available during outpatient hours</span>
                </div>
              </div>
            ))}

            {/* Distinction Box */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#178066] block">Facility Integration</span>
                <h3 className="font-bold text-base text-slate-900">Medical Care &amp; Clinical Training</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Medical services are provided by certified clinical staff. Student trainees participate in supervised practical attachments adhering strictly to professional healthcare protocols.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('contact');
                  }}
                  className="text-xs font-bold text-[#178066] hover:text-[#126651] flex items-center gap-1 cursor-pointer"
                >
                  <span>Visit or Inquire at Medical Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ACADEMIC PROGRAMS SECTION */}
      <section 
        id="courses" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-white flex flex-col justify-center border-b border-slate-150"
      >
        <div className="max-w-7xl mx-auto w-full my-auto space-y-8 lg:space-y-10">
          <div className="landing-panel-content flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block mb-1">HEALTHCARE CERTIFICATES</span>
              <h2 className="landing-panel-title text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Academic Training Programs</h2>
              <p className="landing-panel-copy text-sm text-slate-500 max-w-lg mt-1">
                Vocational and technical medical training programs designed for practical competence and direct career pathways.
              </p>
            </div>
            <button 
              onClick={onOpenApplication}
              className="text-xs text-white bg-[#178066] hover:bg-[#126651] px-5 py-2.5 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Apply for Program</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {courses.filter((course) => course.active !== false).length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No courses have been published yet.
              </div>
            ) : (
              courses
                .filter((course) => course.active !== false)
                .map((course) => (
                  <div 
                    key={course.id}
                    className="landing-panel-card bg-white rounded-2xl border border-slate-200 hover:border-[#178066] overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-teal-100 text-[#178066]">
                          {course.code}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#178066]" />
                          {course.duration}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#178066] transition-colors">
                          {course.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-light">
                        {course.description || 'No programme description is published yet.'}
                      </p>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty</span>
                        <p className="font-semibold text-slate-800">{course.faculty || 'Academic Affairs'}</p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Duration: {course.duration}</span>
                      <button
                        type="button"
                        onClick={onOpenApplication}
                        className="bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* 7. CURRICULUM SECTION (database-driven) */}
      <section 
        id="curriculum" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-slate-50 flex flex-col justify-center border-b border-slate-150"
      >
        <div className="max-w-7xl mx-auto w-full my-auto space-y-8 lg:space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">STRUCTURED LEARNING</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Published Academic Curriculum
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Course content and programme structure are loaded from the live PostgreSQL-backed course catalogue.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {courses.filter((course) => course.active !== false).length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-5 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                No courses have been published.
              </div>
            ) : (
              courses
                .filter((course) => course.active !== false)
                .map((course, idx) => (
                  <div 
                    key={course.id}
                    className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#178066] transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold bg-teal-50 text-[#178066] px-2 py-0.5 rounded border border-teal-100">
                          {course.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {course.duration}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{course.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{course.description || 'No course description has been published yet.'}</p>
                    </div>
                    <div className="text-[10px] text-[#178066] font-semibold pt-1 border-t border-slate-50">
                      Course {idx + 1} of {courses.filter((item) => item.active !== false).length}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* 8. FACULTY & DOCTORS DIRECTORY SECTION */}
      <section 
        id="faculty" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-white flex flex-col justify-center border-b border-slate-150"
      >
        <div className="max-w-7xl mx-auto w-full my-auto space-y-8 lg:space-y-10">
          <div className="landing-panel-content text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block mb-1">INSTRUCTION &amp; CLINICAL MENTORSHIP</span>
            <h2 className="landing-panel-title text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Meet Our Healthcare Faculty &amp; Doctors
            </h2>
            <p className="landing-panel-copy text-sm text-slate-500">
              Experienced medical educators, clinical officers, and healthcare specialists dedicated to student training.
            </p>
          </div>

          {lecturers.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center max-w-2xl mx-auto space-y-3">
              <UserCheck className="w-10 h-10 text-[#178066] mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Certified Healthcare Instructors &amp; Clinical Supervisors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Academic training modules are delivered by certified medical educators, clinical instructors, and healthcare specialists. Registered faculty members can access course registers and assessment workflows via the staff workstation.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Faculty &amp; Staff Gateway
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {lecturers.map((lecturer) => (
                <div 
                  key={lecturer.id}
                  className="landing-panel-card bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[#178066] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-20 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center justify-center">
                      <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md font-mono">
                        {lecturer.designatorCode}
                      </span>
                    </div>

                    <div className="flex justify-center -mt-10 relative z-10">
                      <img 
                        src={lecturer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                        alt={lecturer.name} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-5 text-center space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#178066] transition-colors">
                          {lecturer.name}
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-[#178066] mt-0.5">
                          {lecturer.contractLength || 'Faculty'} Lecturer
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-light">
                        {lecturer.bio || "Healthcare instructor dedicated to nursing, patient care training, and clinical skill development at Alika Medical."}
                      </p>

                      <div className="space-y-1 text-left pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Instruction Units:</span>
                        <div className="flex flex-wrap gap-1 min-h-[36px]">
                          {(lecturer.subjects ?? []).length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Caregiver Training Program</span>
                          ) : (
                            (lecturer.subjects ?? []).map(code => (
                              <span 
                                key={code}
                                className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 truncate max-w-full"
                                title={subjectMap[code] || code}
                              >
                                {subjectMap[code] || code}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLecturerForContact(lecturer);
                        setSenderName('');
                        setSenderEmail('');
                        setSubject(`Inquiry regarding ${lecturer.name}'s units`);
                        setMessage('');
                        setSubmitSuccess(false);
                        setIsSubmitting(false);
                      }}
                      className="w-full bg-teal-50 hover:bg-teal-100 text-[#178066] font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Contact Instructor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. NEWS & BULLETINS */}
      <section 
        id="news" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto py-12 px-6 sm:px-8 lg:px-12 bg-slate-50 flex flex-col justify-center border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto w-full my-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block mb-1">NOTICES &amp; UPDATES</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Institutional Bulletins</h2>
              <p className="text-sm text-slate-500 mt-1">
                Stay updated with intake dates, clinical attachment schedules, and college announcements.
              </p>
            </div>

            <div className="flex gap-2 bg-slate-200/60 p-1 rounded-xl text-xs font-medium self-end">
              {['all', 'academic', 'announcement', 'event'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveNewsCategory(cat)}
                  className={`py-1.5 px-3 rounded-lg capitalize transition-all ${
                    activeNewsCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {filteredNews.map((post) => (
              <div key={post.id} className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-44 bg-slate-100">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 right-2 bg-[#178066] text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-semibold">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 hover:text-[#178066] transition-colors line-clamp-2 leading-snug">{post.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{post.content}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-50 mt-4">
                  <button 
                    onClick={() => showInfo(post.title, post.content)}
                    className="text-xs text-[#178066] hover:text-[#126651] font-bold flex items-center gap-1 group/btn cursor-pointer"
                  >
                    <span>Read Full Notice</span>
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CONTACT & INQUIRIES SECTION WITH FOOTER */}
      <section 
        id="contact" 
        data-animate-panel
        className="landing-panel w-screen h-screen flex-shrink-0 overflow-y-auto bg-white flex flex-col justify-between pt-12"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full my-auto py-6">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="landing-panel-content md:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location &amp; Inquiries</span>
              </div>
              <h2 className="landing-panel-title text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Get in Touch with Alika Medical
              </h2>
              <p className="landing-panel-copy text-slate-600 text-sm leading-relaxed">
                We welcome prospective students, patients, and community members. Contact our admissions or medical center desk directly.
              </p>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Physical Address</p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{institution.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Phone className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Telephone Lines</p>
                    <p className="text-slate-600 mt-0.5">{institution.phonePrimary} / {institution.phoneSecondary}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Mail className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Official Email &amp; Web</p>
                    <p className="text-slate-600 mt-0.5">{institution.email} | {institution.website}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <Clock className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Operating Hours</p>
                    <p className="text-slate-600 mt-0.5">{institution.operatingHours.weekdays}</p>
                    <p className="text-slate-500 mt-0.5">Sunday: {institution.operatingHours.sunday}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-6 space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
                <h3 className="text-lg font-bold">Admissions &amp; Consultation Inquiries</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Need guidance on program requirements or would like to schedule a visit? Reach our team directly.
                </p>
                
                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={onOpenApplication}
                    className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Start Online Application</span>
                  </button>
                  {onOpenConsultation && (
                    <button
                      type="button"
                      onClick={onOpenConsultation}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-teal-400" />
                      <span>Book Institutional Consultation</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Access Student &amp; Staff Portal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 11. FOOTER */}
        <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-6 sm:px-8 lg:px-12 border-t border-slate-900 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="flex items-center gap-2">
                <div className="bg-[#178066] text-white p-1.5 rounded-lg text-xs">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white block">
                  {institution.shortName}
                </span>
              </span>
              <p className="leading-relaxed text-[11px] text-slate-400">
                {institution.name}. Integrated medical training institution and outpatient healthcare center in Wangige, Kiambu County, Kenya.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Academic Programs</h4>
              <ul className="space-y-2 text-[11px]">
                {institution.programs.map((p) => (
                  <li key={p.id}>
                    <a
                      href="#courses"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('courses');
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {p.name} ({p.duration})
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#curriculum"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('curriculum');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Caregiver Curriculum (10 Modules)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Medical Center</h4>
              <ul className="space-y-2 text-[11px]">
                {institution.medicalCenterServices.map((s) => (
                  <li key={s.id}>
                    <a
                      href="#medical-center"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('medical-center');
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Contact Administration</h4>
              <p className="leading-relaxed text-[11px] text-slate-300">
                {institution.address}
              </p>
              <p className="text-slate-300 text-[11px]">
                {institution.phonePrimary} / {institution.phoneSecondary}
              </p>
              <p className="text-teal-400 text-[11px]">
                {institution.email}
              </p>
              <p className="text-slate-400 text-[10px]">
                {institution.operatingHours.summary}
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} {institution.name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={onOpenLogin} className="text-teal-400 hover:text-teal-300 transition-colors cursor-pointer">
                Portal Login
              </button>
              <span>•</span>
              <button onClick={onOpenApplication} className="text-teal-400 hover:text-teal-300 transition-colors cursor-pointer">
                Online Admissions
              </button>
            </div>
          </div>
        </footer>
      </section>

      {/* 13. INSTRUCTOR EMAIL INQUIRY MODAL */}
      {selectedLecturerForContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100 dark:border-slate-700 flex flex-col transition-all max-h-[90vh]">
            
            <div className="bg-slate-50 dark:bg-slate-750 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#178066] flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">
                    Faculty Inquiry: {selectedLecturerForContact.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight font-medium">
                    {institution.shortName} • Academic Department
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLecturerForContact(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {submitSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-[#178066] border border-teal-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">Message Sent Successfully</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your inquiry has been routed to {selectedLecturerForContact.name} at {institution.shortName}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLecturerForContact(null)}
                    className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Close Dialog
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    setTimeout(() => {
                      setIsSubmitting(false);
                      setSubmitSuccess(true);
                    }, 1000);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Your Full Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="John Doe"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Your Email</label>
                      <input 
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Subject</label>
                    <input 
                      type="text"
                      required
                      placeholder="Course enrollment inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Message</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Enter your message regarding programs, timetable or entry requirements..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-teal-500/10 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Sending Inquiry...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
