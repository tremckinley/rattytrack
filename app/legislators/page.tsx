"use client"

import { useState } from "react"
import LegislatorCard from "./legislatorCard/legislatorCard"
import legislators from "@/testData/Legislators"



export default function Legislators() {

    const [ legislatorSearchValue, setLegislatorSearchValue ] = useState("")
    function inFilter(value: string, context: string) {
        return context.toLowerCase().includes(value.toLowerCase())
    }

    return (
    <>
        <div className="w-6xl mb-8">
            <h2>Legislators</h2>
            <p>Discover individual legislator activity, issue focus, and legislative history. </p>
             <input 
          type="text"
          className="border-2 rounded-lg px-2 bg-white"
          placeholder="Search legislator profiles"
          value={legislatorSearchValue}
          onChange={ (e: React.ChangeEvent<HTMLInputElement>) => setLegislatorSearchValue(e.target.value) }
            
          />
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {legislators.filter((leg) => inFilter(legislatorSearchValue, leg.displayName)).map((leg)=> {
                return <LegislatorCard key={leg.id} {...leg} />
            })}
        </section>
    </>
    )
}