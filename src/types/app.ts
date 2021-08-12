export interface Set {
    weight: number;
    reps: number;
    gap: number;
}

export interface Exercise {
    number: string; // e.g. 1/2/3, 1A/1B
    name: string;
    sets: Set[];
    ref1RM: number;
    comments: string;
    etag: number;
    guideType: string;
}

export interface RecentWorkout extends Exercise {
    // contains all fields from Exercise, plus 2 extra below:
    // (this is what gets saved to the JSON file)
    id: number;
    date: string;
}


export interface RecentWorkoutSummary {
    idx: number;
    exercise: RecentWorkout; // Exercise plus 'id' and 'date'

    "warmUpWeight": number;
    "maxFor12": number;
    "numSets12": number;
    "maxAttempted": string; // string because it might be "-"

    "headline": string;
    "numSetsHeadline": number;

    "totalVolume": number;
    "volumePerSet": number;
    "totalReps": number;
    "highestWeight": number;
    "maxEst1RM": number;

    "daysSinceLastWorked": number;
    "relativeDateString": string;
}

export interface TooltipData {
    sets: Set[];
    totalVolume: number;
    volumePerSet: number;
    highestWeight: number;
    maxEst1RM: number;
    ref1RM: number;
    totalReps: number;
    guideType: string;
}

export interface RmTableRow {
    reps: number;
    weight: number;
    percentage: number;
}

export interface Guide {
    [name: string]: number[]
}