import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface TotalCardProps {
  title: string;
  total: number | string;
  subtotal?: number | string;
  icon: IconProp
}

export default function TotalCard({title, total, subtotal, icon}: TotalCardProps) {
    
    return(
        <div className="text-background grid-cols-1 flex flex-row items-center p-6">
            <div className="md:h-full md:p-2 flex md:flex justify-center items-center">
                <FontAwesomeIcon icon={icon} className="text-3xl" />
            </div> 
            <div className="p-2">
                <p className="font-semibold">{title}</p>
                <p className="text-3xl font-bold">{total}</p>
                <p className="text-xs">{subtotal}</p>
            </div>
        </div>
    )
}