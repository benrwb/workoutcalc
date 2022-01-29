import { Guide } from './types/app'

export function _getGuides(): Guide[] {
    var guides = [] as Guide[];
    guides.push({
        name: "", // default (no guide)
        category: "",
        referenceWeight: "",
        warmUp: [],
        workSets: []
    });
    // ========================================================
    guides.push({
        name: "6-8",
        category: "MEDIUM",
        referenceWeight: "WORK",
        warmUp: [0.50, 0.50, 0.70, 0.85], // warm-up 2x50%, 1x70%, 1x85%
        workSets: [1, 1, 1]
    });
    guides.push({
        name: "8-10",
        category: "MEDIUM",
        referenceWeight: "WORK",
        warmUp: [0.50, 0.50, 0.75], // warm-up 2x50%, 1x75%
        workSets: [1, 1, 1]
    });
    guides.push({
        name: "12-14",
        category: "HIGH",
        referenceWeight: "WORK",
        warmUp: [0.67, 0.67], // warm-up 2x67%
        workSets: [1, 1, 1]
    });
    // ========================================================
    guides.push({
        name: "12-15", // high reps = 60% 1RM
        category: "HIGH",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 2, 0.60, 0),
        workSets: [0.60, 0.60, 0.60]
        // OLD VERSION: '12-15': generateGuide(0.35, 3, 0.65, 4), // high reps = 65% 1RM
    });
    guides.push({
        name: "8-12", // medium reps = 72.5% 1RM (halfway between 60% and 85%)
        category: "MEDIUM",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 3, 0.725, 0),
        workSets: [0.725, 0.725, 0.725]
        // OLD VERSION: '8-10': generateGuide(0.35, 4, 0.75, 4), // medium reps = 75% 1RM
    });
    guides.push({
        name: "5-7", // low reps = 85% 1RM
        category: "LOW",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 4, 0.85, 0),
        workSets: [0.85, 0.85, 0.85]
    });
    // ========================================================
    // OLD 'Deload': [0.35, 0.50, 0.50, 0.50],
    // OLD 'old': [0.45, 0.5, 0.55, 0.62, 0.68, 0.76, 0.84, 0.84, 0.84]
    // OLD "15+"  : "HIGH"

    return guides;
}


export function _getGuidePercentages (exerciseName: string, guide: Guide): number[] {
    // used by <grid-row>
    var percentages = [] as number[];
    var warmUp = exerciseName.indexOf("1") == 0; // .startsWith('1')
    if (warmUp) {
        percentages = percentages.concat(guide.warmUp);
    }
    percentages = percentages.concat(guide.workSets);
    return percentages;
}

function generatePercentages(startWeight: number, numWarmUpSets: number, workWeight: number, numWorkSets: number) {
    var sets = [];
    var increment = (workWeight - startWeight) / numWarmUpSets;
    for (var i = 0; i < numWarmUpSets; i++) {
        sets.push(startWeight + (increment * i));
    }
    for (var i = 0; i < numWorkSets; i++) {
        sets.push(workWeight);
    }
    return sets;
}

