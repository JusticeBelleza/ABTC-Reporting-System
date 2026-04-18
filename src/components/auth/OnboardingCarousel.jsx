import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ActivitySquare, WifiOff, LockKeyhole, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

const SLIDES = [
  // --- Slide 0: The Formal PHO Welcome ---
  {
    id: 0,
    isIntro: true,
    title: "Welcome to the ABTC Reporting System",
    subtitle: "OFFICIAL GOVERNMENT PLATFORM",
    description: "Administered by the Provincial Health Office of Abra"
  },
  // --- Feature Slides ---
  {
    id: 1,
    title: "ABTC Reporting System",
    description: "Modernized data collection, submission, and validation for authorized public Animal Bite Treatment Centers and private Animal Bite Centers.",
    icon: ShieldCheck,
    iconBg: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600"
  },
  {
    id: 2,
    title: "Predictive Analytics",
    description: "Utilize adaptive statistical models to forecast patient volume and detect outbreak anomalies.",
    icon: ActivitySquare,
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-500"
  },
  {
    id: 3,
    title: "Offline Resilience",
    description: "Securely save reports locally to your device and automatically sync when connectivity is restored.",
    icon: WifiOff,
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600"
  },
  {
    id: 4,
    title: "Strict Data Privacy",
    description: "Engineered with a Zero-Patient Data architecture ensuring 100% compliance with RA 10173.",
    icon: LockKeyhole,
    iconBg: "bg-slate-100 border-slate-200",
    iconColor: "text-slate-700"
  }
];

export default function OnboardingCarousel({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  
  // Animation Lock to prevent spam-clicking
  const [isFading, setIsFading] = useState(false);

  // Initial mount fade-in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Intro slide staggered animations
  useEffect(() => {
    if (currentSlide === 0) {
      const logoTimer = setTimeout(() => setShowLogo(true), 300);
      const textTimer = setTimeout(() => setShowText(true), 900);
      return () => { clearTimeout(logoTimer); clearTimeout(textTimer); };
    }
  }, [currentSlide]);

  const finishOnboarding = useCallback(() => {
    localStorage.setItem('abtc_has_seen_onboarding', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 400); 
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (isFading) return;
    if (currentSlide === SLIDES.length - 1) {
      finishOnboarding();
    } else {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsFading(false);
      }, 200);
    }
  }, [currentSlide, isFading, finishOnboarding]);

  const handlePrev = useCallback(() => {
    if (isFading || currentSlide === 0) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1);
      setIsFading(false);
    }, 200);
  }, [currentSlide, isFading]);

  const handleJumpToSlide = (index) => {
    if (isFading || index === currentSlide) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsFading(false);
    }, 200);
  };

  // --- NEW: Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const isIntroSlide = currentSlide === 0;
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const SlideIcon = SLIDES[currentSlide].icon;

  return (
    <div 
      className={`min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-all duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      role="region" 
      aria-roledescription="carousel" 
      aria-label="System Features Overview"
    >
      
      {/* Background Orbs */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-900/40 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 relative z-10 flex flex-col min-h-[480px] overflow-hidden transform transition-all duration-500 hover:border-slate-300">
        
        {/* Top Header / Skip Button */}
        <div className="flex justify-end p-5 pb-0 h-12">
          {!isLastSlide && !isIntroSlide && (
            <button 
              onClick={finishOnboarding}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 hover:bg-slate-100 transition-colors px-3 py-1.5 rounded-lg active:scale-95"
              aria-label="Skip onboarding"
            >
              Skip
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col items-center justify-center p-8 pt-2 text-center transition-opacity duration-200 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          
          {isIntroSlide ? (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-8 w-full flex justify-center">
                <img 
                  src="/images/pho-logo.png" 
                  alt="PHO Abra Official Logo" 
                  className={`w-36 h-36 object-contain drop-shadow-xl transform transition-all duration-700 ease-out ${
                    showLogo ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
                  }`}
                />
              </div>

              <div className={`transform transition-all duration-700 ease-out ${
                showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 shadow-sm bg-blue-50 px-3 py-1 rounded-full inline-block">
                  {SLIDES[currentSlide].subtitle}
                </p>
                <h2 className="text-[26px] leading-tight font-black text-slate-900 mb-3 tracking-tighter">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {SLIDES[currentSlide].description}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className={`w-20 h-20 rounded-2xl ${SLIDES[currentSlide].iconBg} border flex items-center justify-center mb-6 shadow-sm transform transition-transform duration-500 hover:scale-105`}>
                {SlideIcon && <SlideIcon size={32} className={SLIDES[currentSlide].iconColor} strokeWidth={2.5} />}
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                {SLIDES[currentSlide].title}
              </h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm mb-4">
                {SLIDES[currentSlide].description}
              </p>
            </div>
          )}
        </div>

        {/* --- REVAMPED BOTTOM NAVIGATION BAR --- */}
        <div className="p-6 pt-0 mt-auto bg-slate-50/50 border-t border-slate-100 grid grid-cols-3 items-center">
          
          {/* 1. Left: Back Button */}
          <div className="flex justify-start">
            {!isIntroSlide && (
              <button 
                onClick={handlePrev}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors px-2 py-2 rounded-lg active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} strokeWidth={2.5} /> Back
              </button>
            )}
          </div>

          {/* 2. Center: Interactive Dots */}
          <div className="flex justify-center gap-2">
            {SLIDES.map((_, index) => (
              <button 
                key={index} 
                onClick={() => handleJumpToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out cursor-pointer hover:bg-blue-400 ${
                  index === currentSlide ? 'w-6 bg-slate-800' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* 3. Right: Next / Get Started Button */}
          <div className="flex justify-end">
            <button 
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
              aria-label={isLastSlide ? "Finish onboarding" : "Next slide"}
            >
              {isLastSlide ? (
                <>Get Started <ArrowRight size={16} strokeWidth={2.5} /></>
              ) : (
                <>{isIntroSlide ? 'Explore' : 'Next'} <ChevronRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}