import Image from "next/image";
import { Legislator } from "@/types/Legislator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockFour, faFileAlt } from "@fortawesome/free-regular-svg-icons"
import UserIcon from "@/components/userIcon";
import Link from "next/link";

export default function LegislatorCard(params: Legislator) {
  return (
    <div className="card m-0 p-4 w-full">
      {/*Profile header*/}
      <div className="flex items-center">
        {params.photo_url ? (
          <Image
            src={params.photo_url}
            alt="avatar for legislator"
            height={75}
            width={75}
          />
        ) : (
          <UserIcon />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{params.display_name}</h3>
            {params.is_active === false && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                Former
              </span>
            )}
          </div>
          <p className="text-gray-600">{params.title}</p>
          <p className="text-xs text-gray-600">{params.district}</p>
        </div>
      </div>
      <div className="p-2 flex flex-col my-2">
        <div className="flex justify-between">
          <span>Party</span>
          <span>{params.party_affiliation}</span>
        </div>
        <div className="flex justify-between my-2">
          <div>
            <FontAwesomeIcon icon={faClockFour} />
            <span className="ml-1">Speaking Time</span>
          </div>
          <span>{}</span>
        </div>
        <div className="flex justify-between my-2">
          <div>
            <FontAwesomeIcon icon={faFileAlt} />
            <span className="ml-1">Bills Sponsored</span>
          </div>
          <span>{}</span>
        </div>
        <div className="my-2">
          <span>Committees</span>
          <ul className="flex">
            {params.committees?.length ? (
              params.committees.map((committee, idx) => {
                return (
                  <li key={idx} className="border px-1 mr-1 rounded-full">
                    {committee}
                  </li>
                );
              })
            ) : (
              <p>-</p>
            )}
          </ul>
          
        </div>
        <Link href={`/legislators/${params.id}`} className="link-button">View Profile</Link>
      </div>
    </div>
  );
}
