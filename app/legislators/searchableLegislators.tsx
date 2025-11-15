"use client"

import { Legislator } from "@/types/Legislator";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LegislatorCard from "./legislatorCard/legislatorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { LegislatorStatusFilter } from "@/lib/data/legislators/legislator_card";

interface SearchableLegislatorsProps {
    legislators: Legislator[];
    initialStatus: LegislatorStatusFilter;
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

export default function SearchableLegislators({ legislators, initialStatus }: SearchableLegislatorsProps) {
    const [searchValue, setSearchValue] = useState("");
    const router = useRouter();
    const filtered = legislators.filter((legislator) => isIncluded(searchValue, legislator));
    
    const handleStatusChange = (status: LegislatorStatusFilter) => {
        if (status === 'active') {
            router.push('/legislators');
        } else {
            router.push(`/legislators?status=${status}`);
        }
    };
    
    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6">
                <div className="flex-1 max-w-90">
                    <Label className="ml-3" htmlFor="legislator_search">Filter profiles</Label>
                    <Input
                        id="legislator_search"
                        type="text"
                        placeholder="Search by name, position, etc."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}   
                    />
                </div>
                
                <div className="flex gap-2 bg-card rounded-lg p-1 border border-border">
                    <button
                        onClick={() => handleStatusChange('active')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            initialStatus === 'active'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Current
                    </button>
                    <button
                        onClick={() => handleStatusChange('inactive')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            initialStatus === 'inactive'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Former
                    </button>
                    <button
                        onClick={() => handleStatusChange('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            initialStatus === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        All
                    </button>
                </div>
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
