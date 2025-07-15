// Components/shared/AnalyticsSidebar.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const AnalyticsSidebar = () => {
    const pathname = usePathname();

    const sidebarItems: SidebarItem[] = [
        {
            href: '/sathya/analytics',
            label: 'session Analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            href: '/sathya/usage',
            label: 'Usage Analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            href: '/sathya/orderanalytics',
            label: 'Order Analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        }
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="w-64 bg-black min-h-screen shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Analytics</h2>
                <p className="text-gray-600 text-sm mt-1">Dashboard & Reports</p>
            </div>

            {/* Navigation */}
            <nav className="mt-6">
                <ul className="space-y-2 px-4">
                    {sidebarItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                    isActive(item.href)
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <span className={`${isActive(item.href) ? 'text-white' : 'text-gray-600'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Analytics</p>
                        <p className="text-xs text-gray-600">Dashboard</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSidebar;