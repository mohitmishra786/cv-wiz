'use client';

import { useState } from 'react';

const faqs = [
    {
        question: "How do I generate a tailored resume?",
        answer: "First, complete your profile with your experience and skills. Then, use our browser extension on any job description page to generate a perfectly tailored resume."
    },
    {
        question: "Can I share my profile with others?",
        answer: "Yes! Use the 'Share Profile' button on your profile page to generate a public link. You can toggle this on and off at any time."
    },
    {
        question: "What is AI Interview Prep?",
        answer: "Our AI analyzes your unique background and the target job description to predict the most likely questions you'll be asked, providing suggested answers and key points."
    },
    {
        question: "Is my data secure?",
        answer: "Absolutely. We encrypt sensitive data and never share your contact information on your public profile unless you choose to."
    }
];

export default function HelpFAQ() {
    const [openIndex, setOpenOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Help & Support</h2>
            <div className="grid gap-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setOpenOpenIndex(openIndex === i ? null : i)}
                            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-semibold text-gray-800">{faq.question}</span>
                            <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {openIndex === i && (
                            <div className="p-4 bg-gray-50 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-indigo-900">Still need help?</h3>
                    <p className="text-indigo-700 text-sm">We're here to help you build the best career profile.</p>
                </div>
                <a 
                    href="mailto:support@cv-wiz.com" 
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Contact Support
                </a>
            </div>
        </div>
    );
}
