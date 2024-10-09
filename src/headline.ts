import { Exercise, Set } from "./types/app"
import { _volumeForSet, _arrayAverage } from './supportFunctions'

export function _getHeadline(exercise: Exercise): [number,string,number,number] {
    let completedSets = exercise.sets.filter(set => _volumeForSet(set) > 0);
    let hasSetType = completedSets.filter(z => !!z.type).length > 0;
    return hasSetType ? getHeadlineFromWorkSets(completedSets)
                      : exercise.guideType ? getHeadlineFromGuide(exercise.guideType, completedSets)
                                           : getHeadlineWithoutGuide(completedSets);
}

function getHeadlineFromGuide(guideName: string, allSets: Set[]): [number,string,number,number] {
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

function getHeadlineWithoutGuide(allSets: Set[]): [number,string,number,number] {
    var weights = allSets.map(set => set.weight);
    var mostFrequentWeight = weights.sort((a, b) =>
        weights.filter(v => v === a).length
        - weights.filter(v => v === b).length
     ).pop();
    var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
    return getHeadline_internal(mostFrequentWeight, reps);
}

function getHeadlineFromWorkSets(allSets: Set[]) {
    let workSets = allSets.filter(z => z.type == "WK");

    // Find the highest weight used within these sets
    var maxWeight = workSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array

    // Get list of reps
    var reps = workSets.filter(set => set.weight == maxWeight).map(set => set.reps);

    // Find average number of reps
    return getHeadline_internal(maxWeight, reps);
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
    
    let exactAverage = _arrayAverage(reps); // average including decimal
    let showTilde = exactAverage != maxReps;
    let roundedAverage = Math.round(exactAverage); // average rounded to nearest whole number
    let repsDisplayString = roundedAverage + (showTilde ? "~" : "");

    return [roundedAverage, repsDisplayString, reps.length, weight];
}
