// app/legislators/loading.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHourglass } from "@fortawesome/free-solid-svg-icons";

export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
        <FontAwesomeIcon className="text-3xl animate-spin text-capyred" icon={faHourglass}/>
      <p className="ml-4 text-lg text-gray-600">One moment...</p>
    </div>
  );
}