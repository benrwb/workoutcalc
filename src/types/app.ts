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
    // contains all fields from Exercise, plus extras below:
    // (this is what gets saved to the JSON file)
    id: number;
    date: string;
    blockStart: string; // date
    weekNumber: number;
}


export interface RecentWorkoutSummary {
    idx: number;
    exercise: RecentWorkout; // Exercise plus 'id' and 'date'

    //warmUpWeight: number;
    //maxFor12: string; // string because it might be "-"
    //numSets12: number;
    maxAttempted: string; // string because it might be "-"
    maxAttemptedReps: string;

    headlineWeight: string;
    headlineReps: string; // might contain non-digit characters such as "-", e.g. "9-"
    headlineNumSets: number;
    repRangeExceeded: boolean;

    totalVolume: number;
    volumePerSet: number;
    totalReps: number;
    highestWeight: number;
    maxEst1RM: number;

    daysSinceLastWorked: number;
    relativeDateString: string;
}

export interface TooltipData {
    //sets: Set[];
    totalVolume: number;
    //volumePerSet: number;
    //highestWeight: number;
    maxEst1RM: number;
    ref1RM: number;
    //totalReps: number;
    guideType: string;
    exercise: Exercise;
}

export interface RmTableRow {
    reps: number;
    weight: number;
    percentage: number;
}

export interface Guide {
    name: string; // e.g. "6-8"
    category: 'LOW'|'MEDIUM'|'HIGH'|'';
        // "category" is used for "Filter 2" in Recent Workouts Panel
        // to combine similar guides together, 
        // e.g. if the currently-selected guide is "8-10", 
        //      then it will show "8-12" as well
    referenceWeight: '1RM'|'WORK'|''; // is reference weight 1RM or work sets weight?
    warmUp: number[],
    workSets: number[]
}

export interface PresetExercise {
    number: string;
    name: string;
    guide: string;
}
export interface Preset {
    name: string;
    exercises: PresetExercise[];
}


export interface WeekTableCell {
    weight: number;
    reps: number;
}

export interface WeekTable {
    columnHeadings: string[];
    rows: WeekTableCell[][];
}

