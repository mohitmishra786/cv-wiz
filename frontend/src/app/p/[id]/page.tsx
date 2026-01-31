'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/public/profile/${id}`);
                if (res.status === 404) throw new Error('Profile not found');
                if (res.status === 403) throw new Error('This profile is private');
                if (!res.ok) throw new Error('Failed to load profile');
                
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {error === 'This profile is private' ? 'Private Profile' : 'Profile Unavailable'}
                    </h1>
                    <p className="text-gray-500">
                        {error === 'This profile is private' 
                            ? 'The user has restricted access to this profile.' 
                            : 'The profile you are looking for does not exist or has been removed.'}
                    </p>
                    <Link href="/" className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-4">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                                {profile.image ? (
                                    <Image 
                                        src={profile.image} 
                                        alt={profile.name || 'Profile'} 
                                        width={128} 
                                        height={128} 
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-500">
                                        {profile.name?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                        <p className="text-gray-500 mt-1">CV-Wiz Profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Experience */}
                        {profile.experiences?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Experience
                                </h2>
                                <div className="space-y-8">
                                    {profile.experiences.map((exp, i) => (
                                        <div key={exp.id || i} className="relative pl-8 border-l-2 border-gray-100 last:border-0 pb-0">
                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-100 border-2 border-indigo-500"></div>
                                            <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                                            <div className="text-indigo-600 font-medium mb-1">{exp.company}</div>
                                            <div className="text-sm text-gray-500 mb-3">
                                                {new Date(exp.startDate).getFullYear()} - 
                                                {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                                            </div>
                                            {exp.description && (
                                                <p className="text-gray-600 text-sm whitespace-pre-line">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {profile.projects?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Projects
                                </h2>
                                <div className="grid gap-4">
                                    {profile.projects.map((proj, i) => (
                                        <div key={proj.id || i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                                            <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                                            <p className="text-gray-600 text-sm mt-2 line-clamp-3">{proj.description}</p>
                                            {proj.technologies && proj.technologies.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {proj.technologies.map((tech, j) => (
                                                        <span key={j} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Skills */}
                        {profile.skills?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Skills
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, i) => (
                                        <span key={skill.id || i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {profile.educations?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14z" />
                                    </svg>
                                    Education
                                </h2>
                                <div className="space-y-6">
                                    {profile.educations.map((edu, i) => (
                                        <div key={edu.id || i}>
                                            <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                                            <div className="text-sm text-indigo-600">{edu.degree} in {edu.field}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(edu.startDate).getFullYear()} - 
                                                {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="text-center">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
                                <Image src="/logo.png" alt="CV-Wiz" width={20} height={20} className="rounded" />
                                Powered by CV-Wiz
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}