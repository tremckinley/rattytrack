"use client"

import Legislator from "@/types/Legislator";
import { useState } from "react";
import LegislatorCard from "./legislatorCard/legislatorCard";

interface SearchableLegislatorsProps {
    legislators: Legislator[];
}

function isIncluded(value: string, context: Legislator) {
    if (value.length <= 2 ||(value.length > 2 && context.display_name?.toLowerCase().includes(value.toLowerCase())
        || context.first_name?.toLowerCase().includes(value.toLowerCase())
        || context.last_name?.toLowerCase().includes(value.toLowerCase())
        || context.title?.toLowerCase().includes(value.toLowerCase())
        || context.district?.toLowerCase().includes(value.toLowerCase())
        || context.party_affiliation?.toLowerCase().includes(value.toLowerCase())
        || context.committees?.some((committee) => committee.toLowerCase().includes(value.toLowerCase())))
    ) {
        return true;
    }
    return false;
}

export default function SearchableLegislators({ legislators }: SearchableLegislatorsProps) {
    const [searchValue, setSearchValue] = useState("");
    const filtered = legislators.filter((legislator) => isIncluded(searchValue, legislator));
    
    return (
        <>
            <div className="mt-4">
                <input
                    type="text"
                    placeholder="Search legislator profiles"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {filtered.map((legislator) => (
                    <LegislatorCard 
                        key={legislator.id}
                        {...legislator}
                    />
                ))}
            </section>
        </>
    );
}
