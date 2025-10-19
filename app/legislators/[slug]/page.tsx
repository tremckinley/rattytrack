import { getLegislator } from "@/lib/data/legislator"
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as regIcons from "@fortawesome/free-regular-svg-icons";
import UserIcon from "@/components/userIcon";
import { notFound } from "next/navigation";

type Props = {
    params: { slug: string }
}

export default async function LegislatorPage({ params }: Props) {
    const legislator = await getLegislator(params.slug);

    if (!legislator) {
        notFound();
    }

    return (
        <main className="grid grid-cols-[1fr_2fr]">
            <section id="profile-card" className="card py-8 flex flex-col items-center">
                {/*Profile header*/}
                <div className="flex flex-col items-center">
                    {legislator.photo_url ? (
                        <Image
                            src={legislator.photo_url}
                            alt="avatar for legislator"
                            height={75}
                            width={75}
                        />
                    ) : (
                        <UserIcon height={24} width={24} />
                    )}
                    <h3 className="font-bold text-lg">{legislator.display_name}</h3>
                    <p className="text-gray-600">{legislator.title}</p>
                    <p className="text-xs text-gray-600">{legislator.district}</p>
                </div>



            </section>
        </main>
    );
}