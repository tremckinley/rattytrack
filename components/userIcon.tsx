import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserAlt } from "@fortawesome/free-regular-svg-icons";
import clsx from "clsx";

interface UserIconProps {
  height?: number | undefined;
  width?: number | undefined;
}

//Figure out media sizes

export default function UserIcon({ height, width }: UserIconProps) {
  const heightValue = height ? "h-"+height : "auto";
  const widthValue = width ? "w-"+width : "auto";

  return (
    <div className={clsx("flex justify-center items-center rounded-full p-3 m-1 bg-gray-300", heightValue, widthValue)}>
      <FontAwesomeIcon icon={faUserAlt} className="text-3xl py-1 text-capyred"/>
    </div>
  );
}
