import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from './notifications';
import { 
  Mail, Phone, Send, GraduationCap, 
  Menu, Award, Users, BookOpen, Clock, 
  Calendar, ArrowRight, CheckCircle2, ChevronRight, 
  MessageSquare, Sparkles, Newspaper, X,
  Stethoscope, HeartPulse, Activity, ShieldPlus, MapPin, Building2, UserCheck, Microscope,
  Search, ArrowUp, Star, ChevronLeft, Check, ExternalLink, HelpCircle
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

// Curated authentic community & student testimonials for Alika Medical
const defaultTestimonies: Testimony[] = [
  {
    id: 't-1',
    name: 'Mercy Wanjiku',
    role: 'Caregiver Graduate • Placed at Care Facility',
    content: 'The 4-month intensive caregiver training at Alika Medical provided me with hands-on hospital attachment experience in vital signs, elderly care, and patient empathy. I secured employment immediately upon certification.',
    avatar: '/images/t1.jpg',
  },
  {
    id: 't-2',
    name: 'Dr. Patrick Mwangi',
    role: 'Clinical Supervisor & Outpatient Officer',
    content: 'Alika stands out because our students learn within a functioning medical center environment. Theory is matched daily with clinical procedures, triage diagnostics, and infection prevention standards.',
    avatar: '/images/t2.jpg',
  },
  {
    id: 't-3',
    name: 'Grace Nyambura',
    role: 'Nurse Assistant Certificate Graduate',
    content: 'The faculty is exceptionally patient and experienced. Learning pharmacology basics, emergency response, and physical rehabilitation gave me confidence to support patients with dignity and care.',
    avatar: '/images/t3.jpg',
  },
  {
    id: 't-4',
    name: 'James Kamau',
    role: 'Wangige Outpatient Clinic Patient',
    content: 'Alika Medical Center provides accessible, high-quality primary consultations in Wangige. The clinical team is thorough, empathetic, and professional in every diagnosis.',
    avatar: '/images/client.jpg',
  },
];

// Curated authentic institutional bulletins for Alika Medical
const defaultNews: NewsPost[] = [
  {
    id: 'news-1',
    title: 'Admissions Open: Upcoming Intake for Healthcare Certificate Programs',
    category: 'Academic',
    date: '2026-06-01',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
    content: 'Applications are currently being received for the upcoming 4-month Certificate in Caregiver, Certificate in Nurse Assistant, and Certificate in Homecare Assistant courses. Minimum entry: KCSE Certificate / High School Equivalent. Apply online or visit our admissions desk at ACK St. Peters Church Ndunyu Compound, Wangige.',
  },
  {
    id: 'news-2',
    title: 'Clinical Practical Attachments & Hospital Ward Rotation Schedule',
    category: 'Announcement',
    date: '2026-05-20',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    content: 'Enrolled caregiver students will commence their practical clinical attachments this semester. Hospital ward rotation orientations cover patient hygiene, vitals monitoring, infection control, and bedside communication.',
  },
  {
    id: 'news-3',
    title: 'Community Health Camp: Free Outpatient Triage & Vitals Screening in Wangige',
    category: 'Event',
    date: '2026-05-10',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    content: 'Alika Medical Center in conjunction with Alika Medical Training College is organizing a community wellness screening. Services include free blood pressure checks, blood sugar tests, BMI assessments, and family planning counseling.',
  },
];

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
  
  // Navigation & Scroll State
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Hero carousel state
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Category filters
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('all');
  const [activeProgramFilter, setActiveProgramFilter] = useState<string>('all');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Session detection for Return to Dashboard logic
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSession, setActiveSession] = useState<{ role: string; id: string } | null>(null);

  // Faculty contact modal states
  const [selectedLecturerForContact, setSelectedLecturerForContact] = useState<Lecturer | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Animated counters state
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);

  // Selected bulletin for detail popup
  const [selectedBulletin, setSelectedBulletin] = useState<NewsPost | null>(null);

  // Check user session
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Handle scroll events (elevation change, active section spy, back-to-top)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 40);
      setShowBackToTop(scrollY > 500);

      // Section spy
      const sections = ['home', 'departments', 'about', 'medical-center', 'courses', 'curriculum', 'faculty', 'news', 'testimonials', 'admissions', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero carousel auto-play with pause-on-hover
  useEffect(() => {
    if (isHeroPaused) return;
    const interval = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHeroPaused]);

  // Animated counters
  useEffect(() => {
    const activeCount = courses.filter((c) => c.active !== false).length || institution.programs.length;
    const studentsTarget = Math.max(totalStudentsCount, 150);

    const studentsInterval = setInterval(() => {
      setStudentsCount((prev) => {
        if (prev >= studentsTarget) {
          clearInterval(studentsInterval);
          return studentsTarget;
        }
        return prev + Math.ceil(studentsTarget / 20);
      });
    }, 35);

    const coursesInterval = setInterval(() => {
      setCoursesCount((prev) => {
        if (prev >= activeCount) {
          clearInterval(coursesInterval);
          return activeCount;
        }
        return prev + 1;
      });
    }, 80);

    return () => {
      clearInterval(studentsInterval);
      clearInterval(coursesInterval);
    };
  }, [courses, totalStudentsCount]);

  const scrollToSection = (id: string) => {
    const targetId = id.startsWith('#') ? id.slice(1) : id;
    const element = document.getElementById(targetId);
    if (!element) return;
    const yOffset = -72;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleReturnToDashboard = () => {
    if (onReturnToDashboard && activeSession) {
      onReturnToDashboard(activeSession.role, activeSession.id);
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterSubscribed(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  // Hero slides data
  const heroSlides = [
    {
      id: 0,
      badge: 'Medical Training College & Outpatient Medical Center',
      headline: 'Integrated Healthcare Education & Clinical Care',
      subheadline: 'Alika Medical Training College & Medical Center',
      description:
        'Professional healthcare certificate programs combined with direct outpatient community healthcare services in Wangige Town, Kiambu County. Hands-on clinical attachments, TVETA-aligned curricula, and caring medical mentorship.',
      primaryCta: { label: 'Apply for Admission', action: onOpenApplication },
      secondaryLink: 'courses',
      secondaryLabel: 'Explore Programs',
    },
    {
      id: 1,
      badge: 'Certified Vocational Programs',
      headline: 'Intensive Practical Medical Training',
      subheadline: 'Caregiver, Nurse Assistant & Homecare Assistant',
      description:
        'Comprehensive 4-month vocational certificate curricula covering 10 structured modules, patient care foundations, infection prevention, vital signs triage, pharmacology basics, and hospital attachment.',
      primaryCta: { label: 'Explore Curriculum', action: () => scrollToSection('curriculum') },
      secondaryLink: 'courses',
      secondaryLabel: 'View All Courses',
    },
    {
      id: 2,
      badge: 'Community Clinical Services',
      headline: 'Accessible Outpatient Medical Center',
      subheadline: 'Primary Consultations & Preventive Healthcare',
      description:
        'General outpatient consultations, family planning, chronic care monitoring, and diagnostic vitals triage delivered by certified healthcare practitioners in Wangige Town, Kiambu.',
      primaryCta: { label: 'Our Medical Services', action: () => scrollToSection('medical-center') },
      secondaryLink: 'contact',
      secondaryLabel: 'Visit Campus',
    },
  ];

  const currentHeroSlide = heroSlides[heroSlideIndex];

  // 4 Primary Department Cards mapped to Alika medical hierarchy
  const departmentCards = [
    {
      id: 'outpatient',
      title: 'General Consultation',
      icon: '/images/s1.png',
      fallbackIcon: <UserCheck className="w-8 h-8 text-[#178066]" />,
      description: 'Comprehensive primary healthcare consultations, clinical evaluations, and routine community health diagnoses.',
      tag: 'Primary Care',
      href: 'medical-center',
    },
    {
      id: 'diagnostics',
      title: 'Triage & Diagnostics',
      icon: '/images/s2.png',
      fallbackIcon: <HeartPulse className="w-8 h-8 text-[#178066]" />,
      description: 'Rapid clinical assessment, digital vitals logging (blood pressure, pulse, SpO2, BMI), and stabilization protocols.',
      tag: 'Diagnostics',
      href: 'medical-center',
    },
    {
      id: 'maternal',
      title: 'Family Planning',
      icon: '/images/s3.png',
      fallbackIcon: <ShieldPlus className="w-8 h-8 text-[#178066]" />,
      description: 'Reproductive healthcare counseling, maternal wellness guidance, and supportive reproductive health services.',
      tag: 'Maternal Care',
      href: 'medical-center',
    },
    {
      id: 'infection-control',
      title: 'Infection Control & Care',
      icon: '/images/s4.png',
      fallbackIcon: <Activity className="w-8 h-8 text-[#178066]" />,
      description: 'Sterile clinical procedures, routine immunizations, antiseptic wound dressings, and chronic condition monitoring.',
      tag: 'Clinical Safety',
      href: 'medical-center',
    },
  ];

  // Filtered news
  const activeNewsList = news && news.length > 0 ? news : defaultNews;
  const filteredNews = useMemo(() => {
    if (activeNewsCategory === 'all') return activeNewsList;
    return activeNewsList.filter((n) => n.category.toLowerCase() === activeNewsCategory.toLowerCase());
  }, [activeNewsList, activeNewsCategory]);

  // Combined program list
  const displayCourses = useMemo(() => {
    const activeDbCourses = courses.filter((c) => c.active !== false);
    if (activeDbCourses.length > 0) return activeDbCourses;
    // Map institution programs to course structure
    return institution.programs.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.name,
      description: p.description,
      duration: p.duration,
      fees: p.fees,
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
      faculty: 'Health & Social Care',
      active: true,
      courseHighlights: p.careerPathways,
    }));
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (activeProgramFilter === 'all') return displayCourses;
    return displayCourses.filter((c) => {
      const text = `${c.title} ${c.code} ${c.faculty}`.toLowerCase();
      return text.includes(activeProgramFilter.toLowerCase());
    });
  }, [displayCourses, activeProgramFilter]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: { type: string; title: string; subtitle: string; targetId: string }[] = [];

    // Search courses
    displayCourses.forEach((c) => {
      if (c.title.toLowerCase().includes(query) || c.code.toLowerCase().includes(query) || (c.description && c.description.toLowerCase().includes(query))) {
        results.push({ type: 'Program', title: c.title, subtitle: `${c.code} • ${c.duration}`, targetId: 'courses' });
      }
    });

    // Search medical services
    institution.medicalCenterServices.forEach((s) => {
      if (s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) {
        results.push({ type: 'Medical Service', title: s.title, subtitle: s.badge || 'Outpatient', targetId: 'medical-center' });
      }
    });

    // Search curriculum modules
    institution.caregiverCurriculum.forEach((m) => {
      if (m.title.toLowerCase().includes(query) || m.code.toLowerCase().includes(query)) {
        results.push({ type: 'Curriculum Module', title: `${m.code}: ${m.title}`, subtitle: `${m.credits} Credits`, targetId: 'curriculum' });
      }
    });

    return results.slice(0, 6);
  }, [searchQuery, displayCourses]);

  const activeTestimonies = testimonies && testimonies.length > 0 ? testimonies : defaultTestimonies;

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 selection:bg-[#178066] selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 1. TOP QUICK INFO BAR (DESKTOP / TABLET) */}
      <div 
        id="top-quick-info-bar"
        className="bg-slate-950 text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-900 transition-all"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <a 
              href={`mailto:${institution.email}`} 
              className="flex items-center gap-1.5 hover:text-teal-300 transition-colors py-0.5"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{institution.email}</span>
            </a>
            <a 
              href={`tel:${institution.phonePrimary.replace(/\s+/g, '')}`} 
              className="flex items-center gap-1.5 hover:text-teal-300 transition-colors py-0.5"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{institution.phonePrimary}</span>
            </a>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate max-w-[280px]">{institution.town}, Kiambu County</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400 hidden sm:inline">
              <Clock className="w-3 h-3 inline mr-1 text-teal-400" />
              {institution.operatingHours.weekdays}
            </span>
            <div className="flex items-center gap-1.5 bg-teal-950/80 text-teal-300 px-2 py-0.5 rounded border border-teal-800/40 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-teal-300" />
              <span>Intakes Ongoing</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN NAVIGATION BAR */}
      <header
        id="main-navigation-header"
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-[#178066]/95 backdrop-blur-md shadow-md py-3' 
            : 'bg-[#178066] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
              className="flex items-center gap-3 group focus:outline-none cursor-pointer"
              aria-label="Alika Medical - Home"
            >
              <div className="w-10 h-10 bg-white text-[#178066] rounded-xl flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform shrink-0">
                <HeartPulse className="w-6 h-6 text-[#178066]" />
              </div>
              <div className="text-left">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase block leading-none">
                  {institution.shortName.toUpperCase()}
                </span>
                <span className="text-[9px] text-teal-100 font-bold uppercase tracking-widest block mt-1">
                  {institution.tagline}
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-5 2xl:space-x-7" aria-label="Main Navigation">
              {[
                { id: 'home', label: 'HOME' },
                { id: 'about', label: 'ABOUT' },
                { id: 'departments', label: 'DEPARTMENTS' },
                { id: 'courses', label: 'PROGRAMS' },
                { id: 'curriculum', label: 'CURRICULUM' },
                { id: 'faculty', label: 'DOCTORS' },
                { id: 'news', label: 'BULLETINS' },
                { id: 'testimonials', label: 'REVIEWS' },
                { id: 'contact', label: 'CONTACT US' },
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }}
                    className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'text-white border-white'
                        : 'text-white/80 hover:text-white border-transparent hover:border-white/40'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  aria-label="Search college programs and services"
                  className="text-white hover:text-teal-200 p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Desktop Search Dropdown */}
                {searchOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search programs, modules, services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Results list */}
                    {searchQuery.trim() && (
                      <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                        {searchResults.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching programs or services found.
                          </div>
                        ) : (
                          searchResults.map((res, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                scrollToSection(res.targetId);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex flex-col cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{res.title}</span>
                                <span className="text-[10px] uppercase font-bold text-[#178066] bg-teal-50 px-1.5 py-0.5 rounded">{res.type}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 mt-0.5">{res.subtitle}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Online Application CTA Button (Desktop) */}
              <button
                type="button"
                onClick={onOpenApplication}
                className="hidden md:inline-flex items-center justify-center gap-1.5 bg-white text-[#178066] hover:bg-teal-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all uppercase tracking-wider cursor-pointer min-h-[44px]"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Apply Online</span>
              </button>

              {/* Portal Login / Return to Dashboard */}
              <div>
                {hasActiveSession ? (
                  <button
                    type="button"
                    onClick={handleReturnToDashboard}
                    className="bg-white/20 hover:bg-white text-white hover:text-[#178066] border border-white/40 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <span>Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="bg-white/15 hover:bg-white text-white hover:text-[#178066] border border-white/30 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer min-h-[44px]"
                  >
                    Login
                  </button>
                )}
              </div>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden text-white p-2.5 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. MOBILE NAVIGATION DRAWER (ACCESSIBLE & TOUCH-OPTIMIZED) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 xl:hidden"
              />

              {/* Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#126651] text-white z-50 xl:hidden shadow-2xl flex flex-col overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-5 border-b border-white/15 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white text-[#178066] rounded-xl flex items-center justify-center font-black">
                      <HeartPulse className="w-5 h-5 text-[#178066]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm uppercase tracking-wider block leading-none">
                        {institution.shortName}
                      </span>
                      <span className="text-[10px] text-teal-200 block mt-1">
                        Navigation Menu
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/10 text-white focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="p-5 space-y-1.5 flex-1" aria-label="Mobile Menu Navigation">
                  {[
                    { id: 'home', label: 'Home Page', icon: Building2 },
                    { id: 'about', label: 'About Institution', icon: Award },
                    { id: 'departments', label: 'Departments & Clinic', icon: Stethoscope },
                    { id: 'courses', label: 'Academic Programs', icon: GraduationCap },
                    { id: 'curriculum', label: '10-Module Curriculum', icon: BookOpen },
                    { id: 'faculty', label: 'Healthcare Doctors & Faculty', icon: UserCheck },
                    { id: 'news', label: 'Bulletins & Notices', icon: Newspaper },
                    { id: 'testimonials', label: 'Student & Patient Reviews', icon: Star },
                    { id: 'contact', label: 'Location & Inquiries', icon: MapPin },
                  ].map((link) => {
                    const isActive = activeSection === link.id;
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(link.id);
                        }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all min-h-[48px] cursor-pointer ${
                          isActive
                            ? 'bg-white text-[#178066] shadow-sm'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#178066]' : 'text-teal-200'}`} />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#178066]' : 'text-white/40'}`} />
                      </a>
                    );
                  })}
                </nav>

                {/* Drawer Actions Footer */}
                <div className="p-5 border-t border-white/15 space-y-3 bg-[#0d4f3e] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenApplication();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white text-[#178066] hover:bg-teal-50 font-black text-xs py-3.5 px-4 rounded-xl shadow-md uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Apply for Admission</span>
                  </button>

                  {onOpenConsultation && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenConsultation();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs py-3 px-4 rounded-xl border border-white/25 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                    >
                      <Calendar className="w-4 h-4 text-teal-200" />
                      <span>Book Consultation</span>
                    </button>
                  )}

                  <div className="pt-2 flex justify-between items-center text-[11px] text-teal-200">
                    <span>Wangige, Kiambu County</span>
                    <a href={`tel:${institution.phonePrimary.replace(/\s+/g, '')}`} className="underline font-bold text-white">
                      {institution.phonePrimary}
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* 4. HERO SECTION WITH RICH CAROUSEL & RESTORED ORIGINAL HERO IMAGE */}
      <section
        id="home"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        className="relative text-white py-14 sm:py-20 lg:py-24 overflow-hidden select-none bg-[#178066]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(23, 128, 102, 0.96) 0%, rgba(23, 128, 102, 0.85) 45%, rgba(23, 128, 102, 0.4) 75%, rgba(13, 79, 62, 0.85) 100%), url('/images/hero-bg.png')`,
          backgroundPosition: 'right center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Decorative Background Accents */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Hero Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Active Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold tracking-wider uppercase text-white shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-300 animate-pulse" />
                <span>{currentHeroSlide.badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.1] drop-shadow-sm transition-all duration-300">
                {currentHeroSlide.headline}
              </h1>

              {/* Subheadline / Focus Area */}
              <p className="text-teal-100 text-base sm:text-lg font-semibold tracking-wide">
                {currentHeroSlide.subheadline}
              </p>

              {/* Description Body */}
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                {currentHeroSlide.description}
              </p>

              {/* Call to Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={currentHeroSlide.primaryCta.action}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#178066] hover:bg-teal-50 font-black text-sm px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-h-[48px]"
                >
                  <span>{currentHeroSlide.primaryCta.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection(currentHeroSlide.secondaryLink)}
                  className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-6 py-4 rounded-xl border border-white/30 transition-all cursor-pointer min-h-[48px]"
                >
                  <span>{currentHeroSlide.secondaryLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Pillars Grid */}
              <div className="pt-8 border-t border-white/20 grid grid-cols-3 gap-3 sm:gap-6 text-left">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                  <span className="block text-lg sm:text-2xl font-black text-white">4 Months</span>
                  <span className="text-[11px] text-teal-100 leading-tight block mt-0.5">Certificate Duration</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                  <span className="block text-lg sm:text-2xl font-black text-white">10 Modules</span>
                  <span className="text-[11px] text-teal-100 leading-tight block mt-0.5">Caregiver Curriculum</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                  <span className="block text-lg sm:text-2xl font-black text-white">Wangige</span>
                  <span className="text-[11px] text-teal-100 leading-tight block mt-0.5">Kiambu County</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Column - Restored Original Hero Image & Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
              {/* Original Hero Image Asset Card */}
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/25 bg-teal-950/40 group">
                <img
                  src="/images/hero-bg.png"
                  alt="Alika Medical Training College & Medical Center"
                  className="w-full h-auto max-h-[340px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d4f3e]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-teal-300 text-teal-950 tracking-wider">
                      {institution.shortName}
                    </span>
                    <p className="text-xs font-bold text-white mt-1 drop-shadow-sm">
                      Medical Training College &amp; Outpatient Center
                    </p>
                  </div>
                  <span className="text-[10px] text-teal-200 font-mono font-bold bg-black/40 px-2 py-1 rounded">
                    Wangige Campus
                  </span>
                </div>
              </div>

              {/* Admissions Quick Action Card */}
              <div className="relative w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/20 shadow-2xl space-y-5">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#178066] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm uppercase tracking-wide">Admission Intake</h3>
                      <p className="text-[11px] text-teal-200">KCSE / High School Certificate</p>
                    </div>
                  </div>
                  <span className="bg-teal-300/30 text-teal-100 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-teal-300/40">
                    Open Now
                  </span>
                </div>

                {/* Core Programs Snapshot */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-teal-200 uppercase tracking-wider block">Featured Certificate Courses:</span>
                  {institution.programs.map((prog) => (
                    <div 
                      key={prog.id}
                      className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl border border-white/15 transition-all flex items-center justify-between cursor-pointer"
                      onClick={() => scrollToSection('courses')}
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white">{prog.name}</h4>
                        <p className="text-[10px] text-teal-100 mt-0.5">{prog.duration} • Practical Clinical Attachments</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-200 shrink-0" />
                    </div>
                  ))}
                </div>

                {/* Action Card Bottom */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenApplication}
                    className="w-full bg-white text-[#178066] hover:bg-teal-50 font-black text-xs py-3 px-4 rounded-xl shadow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <span>Start Online Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Carousel Slide Indicators */}
          <div className="mt-12 flex items-center justify-center gap-3">
            {heroSlides.map((slide, index) => {
              const isActive = heroSlideIndex === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroSlideIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer min-h-[24px] min-w-[24px] flex items-center justify-center ${
                    isActive ? 'scale-110' : 'hover:opacity-80'
                  }`}
                >
                  <span className={`block rounded-full transition-all ${
                    isActive
                      ? 'w-8 h-2.5 bg-white shadow-md'
                      : 'w-2.5 h-2.5 bg-white/50'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HIGHLIGHTS & STATS STRIP */}
      <section className="bg-slate-50 border-y border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="w-10 h-10 bg-teal-50 text-[#178066] rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl font-black text-slate-900">{studentsCount}+</span>
            <span className="text-xs text-slate-500 font-medium">Students &amp; Graduates</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="w-10 h-10 bg-teal-50 text-[#178066] rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl font-black text-slate-900">10 Modules</span>
            <span className="text-xs text-slate-500 font-medium">Caregiver Curriculum</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="w-10 h-10 bg-teal-50 text-[#178066] rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl font-black text-slate-900">100%</span>
            <span className="text-xs text-slate-500 font-medium">Practical Clinical Units</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="w-10 h-10 bg-teal-50 text-[#178066] rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl font-black text-slate-900">6+ Units</span>
            <span className="text-xs text-slate-500 font-medium">Outpatient Medical Services</span>
          </div>
        </div>
      </section>

      {/* 6. DEPARTMENTS & SERVICES SECTION (MOBILE SWIPEABLE + DESKTOP GRID) */}
      <section 
        id="departments" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3.5 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Our Departments</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight">
              Clinical &amp; Academic Units
            </h2>
            <div className="w-16 h-1 bg-[#178066] mx-auto rounded-full" />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Comprehensive outpatient clinical services, specialized diagnostics, and practical medical training units in Wangige Town, Kiambu County.
            </p>
          </div>

          {/* Cards: Mobile Horizontal Swipeable + Desktop 4-Column Grid */}
          <div className="mobile-snap-row no-scrollbar gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 pb-4 sm:pb-0">
            {departmentCards.map((card) => (
              <div
                key={card.id}
                className="mobile-snap-item w-[82vw] max-w-[300px] sm:w-auto sm:max-w-none group bg-white rounded-2xl p-6 sm:p-7 text-center border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between items-center hover:-translate-y-1.5"
              >
                {/* Department Icon Container */}
                <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-teal-50 group-hover:bg-[#178066] transition-colors duration-300 shadow-inner">
                  <img
                    src={card.icon}
                    alt={`${card.title} icon`}
                    onError={(e) => {
                      // Fallback if image path not available
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-10 h-10 object-contain group-hover:brightness-0 group-hover:invert transition-all duration-300"
                  />
                </div>

                {/* Card Title & Content */}
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#178066] bg-teal-50 px-2.5 py-0.5 rounded-full mb-2">
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
                <button
                  type="button"
                  onClick={() => scrollToSection(card.href)}
                  className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#178066] group-hover:text-[#126651] transition-colors cursor-pointer py-1.5 min-h-[44px]"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>

          {/* Swipe indicator helper on small screens */}
          <div className="sm:hidden mt-3 text-center text-[11px] text-slate-400 font-medium">
            <span>← Swipe horizontally to see all departments →</span>
          </div>

          {/* Bottom View All Services CTA */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => scrollToSection('medical-center')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer min-h-[44px]"
            >
              <span>Explore All Outpatient Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. ABOUT INSTITUTION & INTEGRATED HEALTHCARE MODEL SECTION */}
      <section 
        id="about" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Narrative Column */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3.5 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>About Our Institution</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Integrated Medical Training &amp; Community Healthcare
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              Alika Medical Training College &amp; Medical Center is an integrated medical training institution and outpatient healthcare facility located in Wangige, Kiambu County, Kenya.
            </p>

            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              The institution delivers two vital, seamlessly connected roles:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-[#178066] font-bold text-sm">
                  <GraduationCap className="w-5 h-5 text-[#178066]" />
                  <span>Medical Trainees</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Providing students with rigorous theoretical foundations, clinical skills lab simulations, and bedside clinical attachments.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-[#178066] font-bold text-sm">
                  <Stethoscope className="w-5 h-5 text-[#178066]" />
                  <span>The Community</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Serving Wangige and Kiambu with accessible outpatient consultations, preventive health screening, and compassionate chronic care.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Physical Campus: ACK St. Peters Church Ndunyu Compound, Wangige Town, Kiambu</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Working Days: Monday – Saturday: 9:00 AM – 5:00 PM (Sunday Closed)</span>
              </div>
            </div>

            {/* Accreditation Badges */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                Accreditation &amp; Curriculum Alignment:
              </span>
              <div className="flex flex-wrap gap-2.5">
                {institution.accreditationBodies.map((body) => (
                  <span 
                    key={body} 
                    className="inline-flex items-center gap-1.5 bg-white text-[#178066] text-xs font-extrabold px-3.5 py-1.5 rounded-xl border border-teal-200 shadow-xs"
                  >
                    <Award className="w-4 h-4 text-[#178066]" />
                    <span>{body}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Institution Details Card with Original About Image */}
          <div className="md:col-span-5 space-y-6">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white">
              <img
                src="/images/about-img.jpg"
                alt="Alika Medical Campus Facility"
                className="w-full h-48 sm:h-56 object-cover object-center"
              />
            </div>

            <div className="bg-gradient-to-br from-[#178066] to-[#0d4f3e] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-200 block">
                  Campus Quick Facts
                </span>
                <h3 className="text-2xl font-black">{institution.shortName}</h3>
                <p className="text-xs text-teal-100 leading-relaxed">{institution.address}</p>
              </div>

              <div className="border-t border-white/15 pt-4 space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Primary Phone:</span>
                  <span className="font-semibold text-white">{institution.phonePrimary}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-teal-200">Secondary Line:</span>
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
                  <span className="text-teal-200">Operating Hours:</span>
                  <span className="font-semibold text-white">Mon – Sat (9am – 5pm)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenApplication}
                  className="w-full bg-white text-[#178066] hover:bg-teal-50 font-black text-xs py-3.5 px-4 rounded-xl shadow uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Enroll in Next Intake</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. MEDICAL CENTER EXPANDED SERVICES SECTION */}
      <section 
        id="medical-center" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3.5 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Outpatient Healthcare Services</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tight">
              Alika Medical Center Services
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Our outpatient healthcare facility delivers patient-centered medical consultations, maternal health support, and clinical monitoring to the community while providing authentic clinical environments for student training.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {institution.medicalCenterServices.map((service, idx) => (
              <div 
                key={service.id || idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#178066] flex items-center justify-center font-bold">
                      {idx === 0 && <UserCheck className="w-5 h-5" />}
                      {idx === 1 && <HeartPulse className="w-5 h-5" />}
                      {idx === 2 && <ShieldPlus className="w-5 h-5" />}
                      {idx === 3 && <Activity className="w-5 h-5" />}
                      {idx === 4 && <Microscope className="w-5 h-5" />}
                      {idx >= 5 && <Stethoscope className="w-5 h-5" />}
                    </div>
                    {service.badge && (
                      <span className="text-[10px] uppercase font-extrabold text-[#178066] bg-white px-2.5 py-1 rounded-full border border-teal-200">
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{service.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[11px] text-[#178066] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Available Mon – Sat (9am – 5pm)</span>
                </div>
              </div>
            ))}

            {/* Facility Integration Highlight Box */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#178066] block">
                  Facility Integration
                </span>
                <h3 className="font-bold text-base text-slate-900">Medical Care &amp; Clinical Mentorship</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Medical services are provided by certified clinical staff. Student trainees participate in supervised practical attachments adhering strictly to professional healthcare protocols.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  className="text-xs font-bold text-[#178066] hover:text-[#126651] flex items-center gap-1.5 cursor-pointer py-1 min-h-[44px]"
                >
                  <span>Visit or Inquire at Medical Center</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ACADEMIC TRAINING PROGRAMS SECTION */}
      <section 
        id="courses" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">
                HEALTHCARE CERTIFICATES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Academic Training Programs
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Vocational and technical medical training programs designed for practical bedside competence, infection control, and direct career pathways.
              </p>
            </div>

            <button 
              type="button"
              onClick={onOpenApplication}
              className="text-xs text-white bg-[#178066] hover:bg-[#126651] px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Apply for Program</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Program Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'all', label: 'All Certificate Programs' },
              { id: 'caregiver', label: 'Caregiver' },
              { id: 'nurse', label: 'Nurse Assistant' },
              { id: 'homecare', label: 'Homecare Assistant' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveProgramFilter(f.id)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
                  activeProgramFilter === f.id
                    ? 'bg-[#178066] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Programs Grid: Mobile Horizontal Swipeable + Desktop 3-Column Grid */}
          <div className="mobile-snap-row no-scrollbar gap-4 sm:grid md:grid-cols-3 sm:gap-6 pb-4 sm:pb-0">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="mobile-snap-item w-[85vw] max-w-[340px] sm:w-auto sm:max-w-none bg-white rounded-3xl border border-slate-200 hover:border-[#178066] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-teal-100 text-[#178066]">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#178066]" />
                      {course.duration}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#178066] transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {course.description || 'Comprehensive vocational medical training with clinical attachment.'}
                  </p>

                  {/* Career Pathways */}
                  {Array.isArray(course.courseHighlights) && course.courseHighlights.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Career Pathways:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {course.courseHighlights.map((pathway: string, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                            {pathway}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Minimum Entry</span>
                    <p className="font-semibold text-slate-800">KCSE Certificate / High School Equivalent</p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Tuition</span>
                    <span className="text-xs font-black text-slate-900">
                      {course.fees ? `Ksh ${course.fees.toLocaleString()}` : 'Ksh 45,000'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenApplication}
                    className="bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="sm:hidden text-center text-[11px] text-slate-400 font-medium">
            <span>← Swipe horizontally to view all courses →</span>
          </div>
        </div>
      </section>

      {/* 10. STRUCTURED CURRICULUM SECTION (10 MODULES) */}
      <section 
        id="curriculum" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-150"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">
              10 STRUCTURED UNITS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Published Caregiver Curriculum
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our 4-month Certificate in Caregiver curriculum comprises 10 comprehensive instructional and clinical attachment modules aligned with national vocational standards.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {institution.caregiverCurriculum.map((mod, idx) => (
              <div 
                key={mod.code}
                className="bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-[#178066] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-teal-100 text-[#178066] px-2 py-0.5 rounded border border-teal-200">
                      {mod.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {mod.credits} Credits
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{mod.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{mod.description}</p>
                </div>
                <div className="text-[10px] text-[#178066] font-bold pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span>Module {idx + 1} of 10</span>
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                </div>
              </div>
            ))}
          </div>

          {/* Curriculum Callout */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-50 to-slate-50 rounded-3xl border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-black text-slate-900 text-base sm:text-lg">Need Full Syllabus &amp; Attachment Schedule?</h3>
              <p className="text-xs text-slate-600">Download program brochures or speak directly with an academic admissions advisor.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOpenApplication}
                className="bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs cursor-pointer min-h-[44px]"
              >
                Apply for Caregiver Course
              </button>
              {onOpenConsultation && (
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl border border-slate-300 cursor-pointer min-h-[44px]"
                >
                  Book Academic Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 11. FACULTY & CLINICAL DOCTORS DIRECTORY */}
      <section 
        id="faculty" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">
              INSTRUCTION &amp; CLINICAL MENTORSHIP
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Meet Our Healthcare Faculty &amp; Doctors
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Experienced medical educators, clinical officers, and healthcare specialists dedicated to student training.
            </p>
          </div>

          {lecturers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
              <UserCheck className="w-12 h-12 text-[#178066] mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">Certified Healthcare Instructors &amp; Clinical Supervisors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Academic training modules are delivered by certified medical educators, clinical instructors, and healthcare specialists. Registered faculty members can access course registers and assessment workflows via the staff workstation.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  Faculty &amp; Staff Gateway
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {lecturers.map((lecturer) => (
                <div 
                  key={lecturer.id}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#178066] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-24 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center justify-center">
                      <span className="absolute top-3 right-3 bg-slate-900/80 text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md font-mono">
                        {lecturer.designatorCode}
                      </span>
                    </div>

                    <div className="flex justify-center -mt-12 relative z-10">
                      <img 
                        src={lecturer.avatar || `/images/d${((lecturer.id ? lecturer.id.charCodeAt(0) : 0) % 3) + 1}.jpg`} 
                        alt={lecturer.name} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-6 text-center space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#178066] transition-colors">
                          {lecturer.name}
                        </h3>
                        <p className="text-[10px] uppercase font-extrabold text-[#178066] mt-0.5">
                          {lecturer.contractLength || 'Faculty'} Lecturer
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-normal">
                        {lecturer.bio || "Healthcare instructor dedicated to nursing, patient care training, and clinical skill development at Alika Medical."}
                      </p>

                      <div className="space-y-1.5 text-left pt-3 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Instruction Units:</span>
                        <div className="flex flex-wrap gap-1 min-h-[36px]">
                          {(lecturer.subjects ?? []).length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Caregiver Training Program</span>
                          ) : (
                            (lecturer.subjects ?? []).map((code) => (
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

                  <div className="px-6 pb-6">
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
                      className="w-full bg-teal-50 hover:bg-teal-100 text-[#178066] font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[44px]"
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

      {/* 12. INSTITUTIONAL BULLETINS & NEWS */}
      <section 
        id="news" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">
                NOTICES &amp; UPDATES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Institutional Bulletins
              </h2>
              <p className="text-sm text-slate-500">
                Stay updated with intake dates, clinical attachment schedules, and college announcements.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
              {['all', 'academic', 'announcement', 'event'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveNewsCategory(cat)}
                  className={`py-2 px-3.5 rounded-xl capitalize transition-all cursor-pointer min-h-[36px] ${
                    activeNewsCategory === cat
                      ? 'bg-[#178066] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredNews.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              No bulletins published under the selected category.
            </div>
          ) : (
            <div className="mobile-snap-row no-scrollbar gap-4 sm:grid md:grid-cols-3 sm:gap-6 pb-4 sm:pb-0">
              {filteredNews.map((post) => (
                <div 
                  key={post.id} 
                  className="mobile-snap-item w-[85vw] max-w-[340px] sm:w-auto sm:max-w-none bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img 
                        src={post.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600'} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        referrerPolicy="no-referrer" 
                      />
                      <span className="absolute top-3 right-3 bg-[#178066] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-5 space-y-2.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-[#178066] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-100 mt-4">
                    <button 
                      type="button"
                      onClick={() => setSelectedBulletin(post)}
                      className="text-xs text-[#178066] hover:text-[#126651] font-bold flex items-center gap-1.5 group/btn cursor-pointer py-1.5 min-h-[44px]"
                    >
                      <span>Read Full Notice</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 13. TESTIMONIALS & COMMUNITY VOICES */}
      <section 
        id="testimonials" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#178066] uppercase tracking-widest block">
              STUDENT &amp; PATIENT EXPERIENCES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Community &amp; Student Trust
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Read what graduates, healthcare clinic patients, and clinical mentors say about Alika Medical.
            </p>
          </div>

          <div className="mobile-snap-row no-scrollbar gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 pb-4 sm:pb-0">
            {activeTestimonies.map((testimony) => (
              <div
                key={testimony.id}
                className="mobile-snap-item w-[85vw] max-w-[320px] sm:w-auto sm:max-w-none bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{testimony.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <img
                    src={testimony.avatar}
                    alt={testimony.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-teal-500 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{testimony.name}</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">{testimony.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. ADMISSIONS & INTAKES BANNER */}
      <section 
        id="admissions" 
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#178066] via-[#147059] to-[#0d4f3e] text-white"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Intakes Ongoing</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Begin Your Healthcare Career at Alika
            </h3>
            <p className="text-sm sm:text-base text-teal-100 leading-relaxed">
              Enroll in Caregiver, Nurse Assistant, or Homecare Assistant certificate courses. Minimum entry: KCSE Certificate / High School Equivalent.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenApplication}
              className="bg-white text-[#178066] hover:bg-teal-50 font-black text-sm px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer min-h-[48px]"
            >
              Start Online Application
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('courses')}
              className="bg-white/15 text-white border border-white/30 px-6 py-4 rounded-xl font-bold text-sm hover:bg-white/25 transition-colors cursor-pointer min-h-[48px]"
            >
              View Program Details
            </button>
          </div>
        </div>
      </section>

      {/* 15. CONTACT & INQUIRIES SECTION */}
      <section 
        id="contact" 
        className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Contact Info Column */}
            <div className="md:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#178066] bg-[#178066]/10 px-3.5 py-1 rounded-full uppercase tracking-wider border border-[#178066]/20">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location &amp; Inquiries</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Get in Touch with Alika Medical
              </h2>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                We welcome prospective students, patients, and community members. Contact our admissions or outpatient medical center desk directly.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <MapPin className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Physical Address</p>
                    <p className="text-slate-600 mt-1 leading-relaxed">{institution.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <Phone className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Telephone Lines</p>
                    <p className="text-slate-600 mt-1">
                      <a href={`tel:${institution.phonePrimary.replace(/\s+/g, '')}`} className="font-semibold text-slate-800 hover:text-teal-600">
                        {institution.phonePrimary}
                      </a>
                      {' '} / {' '}
                      <a href={`tel:${institution.phoneSecondary.replace(/\s+/g, '')}`} className="font-semibold text-slate-800 hover:text-teal-600">
                        {institution.phoneSecondary}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <Mail className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Official Email &amp; Web</p>
                    <p className="text-slate-600 mt-1">{institution.email} • {institution.website}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <Clock className="w-5 h-5 text-[#178066] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Operating Hours</p>
                    <p className="text-slate-600 mt-1">{institution.operatingHours.weekdays}</p>
                    <p className="text-slate-500 mt-0.5">Sunday: {institution.operatingHours.sunday}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Gateway Box */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black">Direct Service Gateways</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Need guidance on program requirements, looking to book a consultation, or accessing the portal?
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={onOpenApplication}
                    className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[48px]"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Start Online Application</span>
                  </button>

                  {onOpenConsultation && (
                    <button
                      type="button"
                      onClick={onOpenConsultation}
                      className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-3.5 px-4 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                    >
                      <Calendar className="w-4 h-4 text-teal-400" />
                      <span>Book Institutional Consultation</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs py-3.5 px-4 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Access Student &amp; Staff Portal</span>
                  </button>
                </div>

                {/* Newsletter Subscription */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Subscribe to Intake Bulletins
                  </span>
                  {newsletterSubscribed ? (
                    <div className="p-3 bg-teal-950 text-teal-300 rounded-xl border border-teal-800 text-xs font-semibold">
                      ✓ Thank you! You will receive intake and medical updates.
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 w-full"
                      />
                      <button
                        type="submit"
                        className="bg-[#178066] hover:bg-[#126651] text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 min-h-[40px]"
                      >
                        Join
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 16. COMPREHENSIVE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-14 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#178066] text-white p-2 rounded-xl text-xs">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-base font-black tracking-tight text-white block">
                {institution.shortName}
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400">
              {institution.name}. Integrated medical training institution and outpatient healthcare center in Wangige, Kiambu County, Kenya.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {institution.accreditationBodies.map((b) => (
                <span key={b} className="text-[10px] bg-slate-900 text-teal-400 px-2 py-0.5 rounded border border-slate-800 font-bold">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Academic Programs</h4>
            <ul className="space-y-2 text-[11px]">
              {institution.programs.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection('courses')}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {p.name} ({p.duration})
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('curriculum')}
                  className="hover:text-white transition-colors cursor-pointer text-left py-0.5 text-teal-400"
                >
                  Caregiver Curriculum (10 Modules)
                </button>
              </li>
            </ul>
          </div>

          {/* Medical Center Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Medical Center</h4>
            <ul className="space-y-2 text-[11px]">
              {institution.medicalCenterServices.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection('medical-center')}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Administration */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Contact Administration</h4>
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

        {/* Copyright & Gateways Bottom */}
        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} {institution.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={onOpenLogin} 
              className="text-teal-400 hover:text-teal-300 transition-colors cursor-pointer min-h-[44px] flex items-center"
            >
              Portal Login
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={onOpenApplication} 
              className="text-teal-400 hover:text-teal-300 transition-colors cursor-pointer min-h-[44px] flex items-center"
            >
              Online Admissions
            </button>
          </div>
        </div>
      </footer>

      {/* 17. BACK TO TOP FLOATING BUTTON */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-30 bg-[#178066] hover:bg-[#126651] text-white p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* 18. BULLETIN DETAIL MODAL */}
      {selectedBulletin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="relative h-48 sm:h-56 bg-slate-100">
              <img 
                src={selectedBulletin.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600'} 
                alt={selectedBulletin.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setSelectedBulletin(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-3 left-3 bg-[#178066] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-lg">
                {selectedBulletin.category}
              </span>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{new Date(selectedBulletin.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedBulletin.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedBulletin.content}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBulletin(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 19. INSTRUCTOR EMAIL INQUIRY MODAL */}
      {selectedLecturerForContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 p-2 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
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
                    className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer min-h-[44px]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Your Full Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="John Doe"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Your Email</label>
                      <input 
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Subject</label>
                    <input 
                      type="text"
                      required
                      placeholder="Course enrollment inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Message</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Enter your message regarding programs, timetable or entry requirements..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#178066] hover:bg-[#126651] text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md cursor-pointer min-h-[44px]"
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
