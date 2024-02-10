import { Set } from "./types/app"

export function getHeadlineFromGuide(guideName: string, allSets: Set[]): [number,string,number,number] {
    if (!guideName) return [0, '', 0, 0];
    var guideParts = guideName.split('-');
    if (guideParts.length != 2) return [0, '', 0, 0];

    var guideLowReps = Number(guideParts[0]);
    //var guideHighReps = Number(guideParts[1]);

    // Get sets where the number of reps is *at least* what the guide says
    var matchingSets = allSets.filter(set => set.reps >= guideLowReps);
    
    // Then find the highest weight used within these sets
    var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
    
    // Then get all sets performed using this weight
    matchingSets = allSets.filter(set => set.weight == maxWeight);

    // Get list of reps
    var reps = matchingSets.map(set => set.reps);
    //var repRangeExceeded = Math.max(...reps) >= guideHighReps;

    // Find average number of reps
    return getHeadline_internal(maxWeight, reps);
}

export function getHeadlineWithoutGuide(allSets: Set[]): [number,string,number,number] {
    var weights = allSets.map(set => set.weight);
    var mostFrequentWeight = weights.sort((a, b) =>
        weights.filter(v => v === a).length
        - weights.filter(v => v === b).length
     ).pop();
    var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
    return getHeadline_internal(mostFrequentWeight, reps);
}

function arrayAverage(array: number[]) {
    // average the values in an array
    let sum = array.reduce((partialSum, a) => partialSum + a, 0);
    let avg = sum / array.length;
    return avg;
}

function getHeadline_internal(weight: number, reps: number[]): [number,string,number,number] {
    reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
    reps = reps.slice(0, 3); // take top 3 items

    var maxReps = reps[0];
    var minReps = reps[reps.length - 1];

    //var showPlus = maxReps != minReps;
    //var displayString = padx(weight, minReps + (showPlus ? "+" : ""));

    //var showMinus = maxReps != minReps;
    //var displayString = padx(weight, maxReps + (showMinus ? "-" : ""));
    
    let exactAverage = arrayAverage(reps); // average including decimal
    let showTilde = exactAverage != maxReps;
    let roundedAverage = Math.round(exactAverage); // average rounded to nearest whole number
    let repsDisplayString = roundedAverage + (showTilde ? "~" : "");

    return [roundedAverage, repsDisplayString, reps.length, weight];
}
