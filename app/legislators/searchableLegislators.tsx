"use client"

import { Legislator } from "@/types/Legislator";
import { useState } from "react";
import LegislatorCard from "./legislatorCard/legislatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

interface SearchableLegislatorsProps {
    legislators: Legislator[];
}

function isIncluded(value: string, context: Legislator) {
if (value.length < 2 || (value.length >= 2 && (
    context.display_name?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.first_name?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.last_name?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.title?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.district?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.party_affiliation?.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    || context.committees?.some((committee) => 
        committee.toLowerCase().split(/[\s-]+/).some(word => word.startsWith(value.toLowerCase()))
    )
)))
    {
        return true;
    }
    return false;
}

export default function SearchableLegislators({ legislators }: SearchableLegislatorsProps) {
    const [searchValue, setSearchValue] = useState("");
    const filtered = legislators.filter((legislator) => isIncluded(searchValue, legislator));
    
    return (
        <>
            <div className="max-w-90">
                <Label className="ml-3" htmlFor="legislator_search">Filter profiles</Label>
                <Input
                    id="legislator_search"
                    type="text"
                    placeholder="Search by name, position, etc."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}   
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
