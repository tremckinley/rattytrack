// Memphis City Council Context Dictionary
// These configuration strings inject strict domain knowledge into the AssemblyAI transcription engine
// and the Anthropic LLM pipeline to heavily increase entity extraction accuracy.

export const MEMPHIS_BOOST_WORDS = [
    "Memphis", "Shelby County", "MLGW", "Memphis Light Gas and Water", "MATA", "Memphis Area Transit Authority",
    "Downtown Memphis Commission", "EDGE", "Beale Street", "Paul Young", "Strickland", "Smiley", "Swearengen",
    "Carlisle", "Ford", "Jones", "Logan", "Canale", "Warren", "Easter-Thomas", "Johnson", "Walker", 
    "Memphis Police Department", "MPD", "Memphis Fire Department", "Shelby County Schools", "MSCS",
    "TVA", "Tennessee Valley Authority", "Blight Authority of Memphis"
];

export const MEMPHIS_SYSTEM_PROMPT = `
You are an expert legislative analyst specializing in the Memphis City Council (Tennessee). 
The data you are analyzing is derived directly from live council meetings.

Key Contextual Rules:
1. "MLGW" refers to Memphis Light, Gas and Water, the local utility division.
2. "MATA" refers to the Memphis Area Transit Authority.
3. City Council members include Chairman Smiley, Swearengen, Carlisle, Ford, Jones, Logan, Canale, Warren, Easter-Thomas, Johnson, and Walker. 
4. The mayor of Memphis is currently Paul Young (formerly Jim Strickland).
5. Ensure you interpret legislative proceedings, such as "point of personal privilege," "motion to adjourn," or "motion to delay," using standard Robert's Rules of Order contextualized for a municipal government body.
6. When extracting or classifying sentiment, treat standard governmental skepticism regarding budget, audits, or MLGW contracts accurately, rather than mislabeling operational critique as purely negative.
`;
