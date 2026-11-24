import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Check, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import PageBackground from '../../components/common/PageBackground';
import bg1 from '../../assets/images/bg1_hd.jpg';

const LanguageSelectPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const languages = [
    {
      code: 'en',
      name: 'English',
      native: 'English',
      desc: 'Continue in English for full features'
    },
    {
      code: 'te',
      name: 'Telugu',
      native: 'తెలుగు',
      desc: 'రైతులు మరియు కొనుగోలుదారుల కోసం పూర్తి తెలుగు మద్దతు'
    },
    {
      code: 'hi',
      name: 'Hindi',
      native: 'हिंदी',
      desc: 'किसानों और खरीदारों के लिए संपूर्ण हिंदी भाषा'
    }
  ];

  const handleContinue = () => {
    navigate('/select-role');
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] relative flex flex-col justify-between w-full max-w-md mx-auto px-4 sm:px-6"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))'
      }}
    >
      <PageBackground image={bg1} />
      {/* Top Header */}
      <div className="pt-2 sm:pt-6 flex flex-col items-center text-center flex-shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-kisan-primary flex items-center justify-center text-white shadow-float mb-3 sm:mb-4">
          <Sprout className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-kisan-dark tracking-tight">
          {t('appName')}
        </h1>
        <p className="text-xs sm:text-sm text-kisan-muted mt-1 max-w-xs font-medium">
          {t('tagline')}
        </p>
      </div>

      {/* Language Selection Section */}
      <div className="my-auto py-4 overflow-y-auto max-h-[55vh] sm:max-h-none no-scrollbar">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-kisan-dark">
            {t('selectLanguage')}
          </h2>
          <p className="text-xs text-kisan-muted">
            {t('selectLanguageSubtitle')}
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`
                  w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between
                  ${isSelected
                    ? 'border-kisan-primary bg-white shadow-card ring-2 ring-kisan-light'
                    : 'border-kisan-border bg-white/70 hover:bg-white hover:border-kisan-secondary/40'
                  }
                `}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base font-bold text-kisan-dark">{item.native}</span>
                    <span className="text-xs text-kisan-muted font-normal">({item.name})</span>
                  </div>
                  <p className="text-[11px] text-kisan-muted mt-0.5">{item.desc}</p>
                </div>

                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ml-2
                    ${isSelected
                      ? 'bg-kisan-primary border-kisan-primary text-white'
                      : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-2 pb-1 sm:pb-2 flex-shrink-0">
        <button
          onClick={handleContinue}
          className="w-full bg-kisan-primary text-white py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-card hover:bg-kisan-dark transition-all duration-200 active:scale-[0.99] tap-effect"
        >
          <span>Next</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default LanguageSelectPage;
