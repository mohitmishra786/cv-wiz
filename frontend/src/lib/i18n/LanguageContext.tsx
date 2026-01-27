'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './dictionaries/en.json';
import es from './dictionaries/es.json';

type Dictionary = typeof en;
type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, Dictionary> = { en, es };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'es')) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        const dict = dictionaries[language];
        const keys = key.split('.');
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = dict;
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        if (typeof value !== 'string') return key;

        if (params) {
            let result = value;
            for (const [pKey, pValue] of Object.entries(params)) {
                result = result.replace(`{${pKey}}`, String(pValue));
            }
            return result;
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}