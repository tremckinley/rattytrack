export default interface Legislator {
    firstName: string,
    lastName: string,
    display_name: string,
    title: string,
    jurisdiction: string,
    party: string,
    committees: string[],
    avatar_url?: string

};