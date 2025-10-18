type Props = {
    params: { slug: string }
}

export default function LegislatorPage2({ params }: Props) {
    return <div>Legi Page {params.slug}</div>
}
