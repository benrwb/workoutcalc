import { Set } from "./types/app"

export function getHeadlineFromGuide(guideName: string, allSets: Set[]): [string,number,number,boolean] {
    if (!guideName) return ['', 0, 0, false];
    var guideParts = guideName.split('-');
    if (guideParts.length != 2) return ['', 0, 0, false];

    var guideLowReps = Number(guideParts[0]);
    var guideHighReps = Number(guideParts[1]);

    // Only look at sets where the number of reps is *at least* what the guide says
    var matchingSets = allSets.filter(set => set.reps >= guideLowReps);
    
    // Then look at the set(s) with the highest weight
    var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
    matchingSets = matchingSets.filter(set => set.weight == maxWeight);

    // Get reps for matching sets
    var reps = matchingSets.map(set => set.reps);
    var repRangeExceeded = Math.max(...reps) >= guideHighReps;
    return getHeadline_internal(maxWeight, reps, repRangeExceeded);
}

export function getHeadlineWithoutGuide(allSets: Set[]): [string,number,number,boolean] {
    var weights = allSets.map(set => set.weight);
    var mostFrequentWeight = weights.sort((a, b) =>
        weights.filter(v => v === a).length
        - weights.filter(v => v === b).length
     ).pop();
    var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
    return getHeadline_internal(mostFrequentWeight, reps, false);
}

function getHeadline_internal(weight: number, reps: number[], repRangeExceeded: boolean): [string,number,number,boolean] {
    reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
    //reps = reps.slice(0, 3); // take top 3 items

    var maxReps = reps[0];
    var minReps = reps[reps.length - 1];
    //var showPlus = maxReps != minReps;
    //var displayString = this.padx(weight, minReps + (showPlus ? "+" : ""));
    var showMinus = maxReps != minReps;
    //var displayString = this.padx(weight, maxReps + (showMinus ? "-" : ""));
    var displayReps = maxReps + (showMinus ? "-" : "");

    return [displayReps, reps.length, weight, repRangeExceeded];
}