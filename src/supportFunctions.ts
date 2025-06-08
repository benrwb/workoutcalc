import { globalState } from './globalState';
import { Exercise, Set, RecentWorkout } from './types/app'
import * as moment from "moment"

export function _calculateOneRepMax(weight: number, reps: number, formula: string, repsInReserve?: number) {
    if (repsInReserve && globalState.includeRirInEst1RM)
        reps += repsInReserve; // added Jan'25

    // This function is used by "grid-row" and "rm-table" components.
    if (!weight || !reps) return -1; // no data
    if (weight == 1) return -1; // `1` is a special value reserved for bodyweight exercises, so 1RM is N/A
    //if (reps > 12) return -2; // can't calculate if >12 reps

    if (formula == 'Brzycki') {
        if (reps > 12) return -2; // can't calculate if >12 reps
        return weight / (1.0278 - 0.0278 * reps);
    }
    else if (formula == 'Brzycki 12+') {
        // same as above but not limited to max 12 reps
        return weight / (1.0278 - 0.0278 * reps);
    }
    else if (formula == 'Epley') {
        return weight * (1 + (reps / 30));
    }
    else if (formula == 'McGlothin') {
        return (100 * weight) / (101.3 - 2.67123 * reps);
    }
    else if (formula == 'Lombardi') {
        return weight * Math.pow(reps, 0.10);
    }
    else if (formula == 'Mayhew et al.') {
        return (100 * weight) / (52.2 + 41.9 * Math.pow(Math.E, -0.055 * reps));
    }
    else if (formula == 'O\'Conner et al.') {
        return weight * (1 + (reps / 40));
    }
    else if (formula == 'Wathan') {
        return (100 * weight) / (48.8 + 53.8 * Math.pow(Math.E, -0.075 * reps));
    }
    else if (formula == 'Brzycki/Epley') {
        // uses Brzycki for fewer than 10 reps
        // and Epley for more than 10 reps
        // (for 10 reps they are the same)
        if (reps <= 10)
            return weight / (1.0278 - 0.0278 * reps); // Brzycki
        else
            return weight * (1 + (reps / 30)); // Epley
    }
    else 
        return -3; // unknown formula
}

export function _calculateMax1RM(sets: Set[], oneRmFormula: string): number {
    var maxEst1RM = sets.map(set => _calculateOneRepMax(set.weight, set.reps, oneRmFormula, set.rir))
        .filter(val => val > 0) // filter out error conditions
        .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
    // OLD // maxEst1RM = _roundOneRepMax(maxEst1RM); // OLD
    maxEst1RM = Math.round(maxEst1RM * 10) / 10; // NEW: round to 1 decimal place
    return maxEst1RM;
}

export function _calculateAvg1RM(sets: Set[], oneRmFormula: string): number {
    var oneRepMaxes = sets.filter(set => set.type == "WK") // work sets only
        .map(set => _calculateOneRepMax(set.weight, set.reps, oneRmFormula, set.rir))
        .filter(val => val > 0); // filter out error conditions
    return _arrayAverage(oneRepMaxes); // possible todo: round to 1 d.p.?
}

export function _arrayAverage(array: number[]) {
    // calculate the average value of an array of numbers
    if (array.length == 0) return 0; // avoid divide by zero
    return array.reduce((a, b) => a + b, 0) / array.length;
}

export function _oneRmToRepsWeight(oneRepMax: number, reps: number, oneRmFormula: string) {
    // Uses `oneRmFormula` to convert `oneRepMax` into a working weight
    // for the desired number of `reps`.
    // For example, if `oneRepMax` is 40kg, then using the Brzycki `oneRmFormula`,
    // we can find out the working weight for 10 `reps`, which is 31.1kg.
    let tempWeight = 100; // this can be any weight, it's just used to calculate the percentage.
    let tempRM = _calculateOneRepMax(tempWeight, reps, oneRmFormula);
    if (tempRM > 0) {
        let percentage = tempWeight / tempRM;
        return oneRepMax * percentage;
    }
    return -1; // error (e.g. `oneRmFormula` does not support this number of reps)
}


// OLD // export function _roundOneRepMax (oneRepMax: number) {
// OLD //     // This function is used by "grid-row" component.
// OLD //     //
// OLD //     // Round *up* 1 d.p. to ensure that 12 reps always gives 69% not 70%.
// OLD //     // e.g. 11 x 12 = 15.84557...
// OLD //     // Standard[1] = 15.8;  11/15.8 = 0.696 = 70% when displayed (bright orange)
// OLD //     // Round up[2] = 15.9;  11/15.9 = 0.692 = 69% when displayed (pale orange)
// OLD //     // [1] = (Math.round(number * 10) / 10) or number.toFixed(1)
// OLD //     // [2] = Math.ceil (see below)
// OLD //     return Math.ceil(oneRepMax * 10) / 10;
// OLD // }

export function _getIncrement(exerciseName: string, guideWeight: number): number {
    if ((exerciseName || '').includes('db ')) {
        if (guideWeight < 20)
            return 1; // d.b. less than 20kg - round to nearest 1
        else
            return 2; // d.b. greater than 20kg - round to nearest 2
    } else if ((exerciseName || '').startsWith('leg '))
        return 1.25; // leg ext/curl - round to nearest 1.25
    else
        return 2.5; // b.b. - round to nearest 2.5
}

export function _smallIncrement(weight: number, exerciseName: string): number {
    if ((exerciseName || '').endsWith('machine')) return weight + 2; // adjust by 2kg (approx 5lbs)
    if ((exerciseName || '').includes('db ')) return weight + 1;
    if ((exerciseName || '').startsWith('leg ')) return weight + 1.25;
    // e.g. 25, 26, 27.5, 28.5, 30
    return weight + ((weight % 2.5 == 0) ? 1 : 1.5);
}

export function _smallDecrement(weight: number, exerciseName: string): number {
    if ((exerciseName || '').endsWith('machine')) return weight - 2; // adjust by 2kg (approx 5lbs)
    if ((exerciseName || '').includes('db ')) return weight - 1;
    if ((exerciseName || '').startsWith('leg ')) return weight - 1.25;
    // e.g. 25, 26, 27.5, 28.5, 30
    return weight - ((weight % 2.5 == 0) ? 1.5 : 1);
}

export function _roundGuideWeight(guideWeight: number, exerciseName: string) {
    let increment = _getIncrement(exerciseName, guideWeight);
    return Math.round(guideWeight / increment) * increment;
}
 

export function _newWorkout(): Exercise[] {
    // create an empty workout
    return ["1", "2", "3"].map(function (number) {
        return _newExercise(number, 0, 3);
    });
}

export function _newExercise(exerciseNumber: string, warmUpSets: number, workSets: number): Exercise {
    var sets = [];
    if (exerciseNumber == "1" || exerciseNumber == "1A") { // warm up only applies for the first exercise
        for (var s = 0; s < warmUpSets; s++) { // for each set (`numberOfSets` in total)
            sets.push(_newSet("WU"));
        }
    }
    for (var s = 0; s < workSets; s++) { // for each set (`numberOfSets` in total)
        sets.push(_newSet("WK"));
    }
    return {
        number: exerciseNumber, // e.g. 1/2/3, 1A/1B
        name: '',
        sets: sets,
        ref1RM: 0,
        comments: '',
        etag: 0, // exercise tag
        guideType: '',
        warmUp: undefined // applies to first exercise of workout only
    };
}

export function _newSet(type: "WU"|"WK"): Set {
    return {
        weight: 0,
        reps: 0,
        gap: 0,
        type: type,
        rir: undefined
    };
}

export function _volumeForSet (set: Set): number {
    // possible future todo: filter to only include work sets
    var volume = set.weight * set.reps;
    return Math.round(volume);
}

function pad (str: string, len: number) {
    // Pads the string so it lines up correctly
    var xtra = len - str.length;
    return " ".repeat((xtra / 2) + (xtra % 2))
        + str
        + " ".repeat(xtra / 2);
}

export function _generateExerciseText (exercise: Exercise) {
    // Format an exercise ready to be copied to the clipboard
    
    // 1. Select only the sets which have a score
    var weights = [] as string[]; // these are kept separate...
    var reps = [] as string[]; // ...because gaps will be...
    var gaps = [] as string[]; // ...moved up by one later
    var exerciseVolume = 0;
    //
    exercise.sets.forEach(function (set) {
        var score = _volumeForSet(set);
        if (score > 0) {
            weights.push(set.weight.toString());
            reps.push(set.reps.toString());
            gaps.push(set.gap.toString());  
            exerciseVolume += score;
        }
    });

    // 2. Move gap up by one
    gaps.shift(); // first set's gap isn't used
    gaps.push(""); // add extra item so array has the same no. elements as the other two

    // 3. Pad the strings so that they will line up
    var paddedWeights = [] as string[];
    var paddedReps = [] as string[];
    var paddedGaps = [] as string[];
    //
    weights.forEach(function (_, idx) {
        var len = Math.max(weights[idx].length, reps[idx].length, gaps[idx].length);
        paddedWeights.push(pad(weights[idx], len));
        paddedReps.push(pad(reps[idx], len));
        paddedGaps.push(pad(gaps[idx], len));
    });

    // 4. Join them all together into an output string
    if (exerciseVolume > 0) {
        return "  " + ("kg  " + paddedWeights.join("  ")).trim() + "\n"
             + "  " + ("x   " + paddedReps.join("  ")).trim() + "\n"
             + "  " + ("🕘    " + paddedGaps.join("  ")).trim(); // + "\n"
              //+ "  Volume: " + exerciseVolume;
    } else { 
        return "";
    }
}

export function _formatDate (datestr: string, dateformat?: string) { 
    if (!datestr) return "";
    if (!dateformat) dateformat = "DD/MM/YYYY";
    return moment(datestr).format(dateformat);
} 

export function _calculateTotalVolume (exercise: RecentWorkout) {
    return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
}

export function _generateWorkoutText(exercises: Exercise[]) {
    // Generate output text (e.g. for copying workout to clipboard)
    let output = "";
    //var totalVolume = 0;

    if (exercises.length > 0 && exercises[0].warmUp) {
        output += "Warm up:\n" + exercises[0].warmUp + "\n\n";
    }

    exercises.forEach(exercise => {
        var text = _generateExerciseText(exercise);
        if (text.length > 0) {
            output += exercise.number + ". " + exercise.name + "\n" + text + "\n\n";
        }
    });
    //if (totalVolume > 0) {
    //    output += "Total volume: " + totalVolume;
    //}

    return output;
}