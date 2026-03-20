"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface SearchBarProps {
    variant?: 'compact' | 'hero';
}

export default function SearchBar({ variant = 'compact' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    if (variant === 'hero') {
        return (
            <section id="dashboard-search" className="mb-6">
                <form onSubmit={handleSearch} className="relative w-full">
                    <div className="relative flex items-center w-full">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search across all meetings, transcripts, and legislators..."
                            className="w-full pl-12 pr-6 py-4 border border-foreground bg-white text-foreground text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-capyred focus:border-transparent transition-all placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-capyred transition-colors"
                        >
                            <FontAwesomeIcon icon={faSearch} className="text-lg" />
                        </button>
                        <button
                            type="submit"
                            className="absolute right-0 top-0 bottom-0 px-6 bg-capyred text-white font-bold hover:bg-rose-900 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </section>
        );
    }

    // Default: compact variant (navbar)
    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-[200px] md:max-w-xs lg:max-w-md">
            <div className="relative flex items-center w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search all meetings..."
                    className="w-full pl-10 pr-4 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-black text-sm transition-all"
                />
                <button
                    type="submit"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                    <FontAwesomeIcon icon={faSearch} className="text-base" />
                </button>
            </div>
        </form>
    );
}
