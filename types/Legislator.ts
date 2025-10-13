export default interface Legislator {
    firstName: string,
    lastName: string,
    displayName: string,
    position: string,
    jurisdiction: string,
    party: string,
    committees: string[],
    avatarURL?: string | null

};