import { Exercise, Set } from "./types/app"
import { _volumeForSet, _arrayAverage } from './supportFunctions'

export function _getHeadline(exercise: Exercise): [number,string,number,number] {
    let completedSets = exercise.sets.filter(set => _volumeForSet(set) > 0);
    let hasSetType = completedSets.filter(z => !!z.type).length > 0;
    return hasSetType ? getHeadline(completedSets, true) // "WK" sets only
                      : exercise.guideType ? getHeadlineFromGuide(exercise.guideType, completedSets)
                                           : getHeadline(completedSets, false);
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

function getHeadline(allSets: Set[], filterByWorkSets: boolean) {
    let sets = filterByWorkSets
        ? allSets.filter(z => z.type == "WK")
        : allSets;

    // Find the most frequently occuring weight within these sets
    var modeWeight = _getMostFrequentNumber(sets.map(s => s.weight));

    // Get list of reps
    var reps = sets.filter(set => set.weight == modeWeight).map(set => set.reps);

    // Find average number of reps
    return getHeadline_internal(modeWeight, reps);
}

export function _getMostFrequentNumber(numbers: number[]): number {
    if (!numbers.length) return 0;

    const counts = new Map() as Map<number, number>;
    let mode = numbers[0];
    let maxCount = 0;

    for (const num of numbers) {
        const count = (counts.get(num) || 0) + 1;
        counts.set(num, count);

        if (count > maxCount || (count === maxCount && num > mode)) { // favour higher numbers
            maxCount = count;
            mode = num;
        }
    }

    return mode;
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
