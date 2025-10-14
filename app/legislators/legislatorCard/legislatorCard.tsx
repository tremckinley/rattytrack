import Image from "next/image"
import Legislator from "@/types/Legislator"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as solidIcons from "@fortawesome/free-solid-svg-icons";
import * as regIcons from "@fortawesome/free-regular-svg-icons"



export default function LegislatorCard(params: Legislator) {
    return (
        <div className="card p-4 w-full">
            {/*Profile header*/}
            <div className="flex items-center">
                <Image
                    src={params.avatarURL || "/avatar.png"}
                    alt="profile picture"
                    width={75}
                    height={75}
                />
                <div>
                <h3 className="font-bold text-lg">{params.displayName}</h3>
                <p className="text-gray-600">{params.position}</p>
                <p className="text-xs text-gray-600">{params.jurisdiction}</p>
                </div>
            </div>
            <div className="p-2 flex flex-col my-2">
                <div className="flex justify-between">
                    <span>Party</span>
                    <span>{params.party}</span>
                </div>
                <div className="flex justify-between my-2">
                    <div><FontAwesomeIcon icon={regIcons.faClockFour}/><span className="ml-1">Speaking Time</span></div>
                    <span>{}</span>
                </div>
                <div className="flex justify-between my-2">
                    <div><FontAwesomeIcon icon={regIcons.faFileAlt}/><span className="ml-1">Bills Sponsored</span></div>
                    <span>{}</span>
                </div>
                <div className="my-2">
                    <span>Committees</span>
                    <ul className="flex"> 
                    {params.committees.map((committee, idx) => {
                        return (
                            <li key={idx} className="border px-1 mr-1 rounded-full">{committee}</li>
                        )
                    })}
                    </ul>
                </div>
            </div>
        </div>
    )

}