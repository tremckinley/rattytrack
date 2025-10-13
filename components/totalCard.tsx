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
        <div className="bg-card card max-w-64 w-64 flex items-center p-6">
            <div className="h-full p-2 flex items-center">
                <FontAwesomeIcon icon={icon} className="text-3xl" />
            </div>
            <div className="p-2">
                <p className="text-gray-600 font-semibold">{title}</p>
                <p className="text-3xl font-bold">{total}</p>
                <p className="text-gray-600 text-xs">{subtotal}</p>
            </div>
        </div>
    )
}