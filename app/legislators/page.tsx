"use client"
import LegislatorCard from "./legislatorCard/legislatorCard"
import legislators from "@/testData/Legislators"

export default function Legislators() {

    return (
    <>
        <div className="w-6xl mb-8">
            <h2>Legislators</h2>
            <p>Discover individual legislator activity, issue focus, and legislative history. </p>
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {legislators.map((leg)=> {
                return <LegislatorCard key={leg.id} {...leg} />
            })}
        </section>
    </>
    )
}