import { getLegislator } from "@/lib/data/legislator"
// import Image from "next/image";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import * as regIcons from "@fortawesome/free-regular-svg-icons";
// import UserIcon from "@/components/userIcon";
import { notFound } from "next/navigation";

type Props = {
    params: {slug: string}
}

export default async function LegislatorPage({ params }: Props) {
    const legislator = await getLegislator(params.slug);

    if (!legislator) {
        notFound();
    }

    return (
        <>
        
        <section className="card flex ">
            Profile Card on left

        </section>
        
        </>
    );
}