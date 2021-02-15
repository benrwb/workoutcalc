export interface RmTableRow {
    reps: number;
    weight: number;
    percentage: number;
}

export interface Exercise {
    name: string;
    sets: Set[];
    ref1RM: string;
    comments: string;
    etag: number;
    guideType: string;
}

export interface Set {
    weight: string;
    reps: string;
    gap: string;
}

export interface RecentWorkoutSummary {
    idx: number;
    exercise: Exercise;

    "warmUpWeight": number;
    "maxFor12": number;
    "numSets12": number;
    "maxAttempted": number;

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