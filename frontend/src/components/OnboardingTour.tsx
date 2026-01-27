'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function OnboardingTour() {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('cv_wiz_tour_seen');
        if (hasSeenTour) return;

        const driverObj = driver({
            showProgress: true,
            steps: [
                { 
                    element: '#main-content h1', 
                    popover: { 
                        title: 'Welcome to CV-Wiz!', 
                        description: 'Your AI-powered career assistant. Let\'s show you around.', 
                        side: "bottom", 
                        align: 'start' 
                    } 
                },
                { 
                    element: '.relative.w-32.h-32', 
                    popover: { 
                        title: 'Profile Completeness', 
                        description: 'This shows how much of your profile is ready for AI generation. Aim for 100%!', 
                        side: "left", 
                        align: 'start' 
                    } 
                },
                { 
                    element: 'a[href="/profile"]', 
                    popover: { 
                        title: 'Manage Your Profile', 
                        description: 'Add your experience, skills, and projects here. You can also import them from GitHub or LinkedIn.', 
                        side: "bottom", 
                        align: 'start' 
                    } 
                },
                { 
                    element: 'a[href="/interview-prep"]', 
                    popover: { 
                        title: 'AI Interview Prep', 
                        description: 'Ready for an interview? Generate practice questions tailored to your background.', 
                        side: "bottom", 
                        align: 'start' 
                    } 
                },
                { 
                    element: '.lg\\:col-span-2.bg-white.p-6', 
                    popover: { 
                        title: 'Activity Tracking', 
                        description: 'Keep track of your application activity and resume generation history.', 
                        side: "top", 
                        align: 'start' 
                    } 
                }
            ],
            onDestroyed: () => {
                localStorage.setItem('cv_wiz_tour_seen', 'true');
            }
        });

        // Small delay to ensure everything is rendered
        const timer = setTimeout(() => {
            driverObj.drive();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}