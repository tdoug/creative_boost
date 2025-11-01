import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', nativeLabel: t('language.english') },
    { code: 'hi', label: 'हिंदी', nativeLabel: t('language.hindi') },
    { code: 'zh', label: '中文', nativeLabel: t('language.mandarin') },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        <Languages size={20} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {languages.find(lang => lang.code === i18n.language)?.label || 'English'}
        </span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors first:rounded-t-md last:rounded-b-md ${
              i18n.language === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{lang.label}</span>
              {i18n.language === lang.code && (
                <span className="text-blue-600">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
