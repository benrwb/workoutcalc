import { Exercise, Set, RecentWorkout } from './types/app'
import * as moment from "moment"

export function _calculateOneRepMax(weight: number, reps: number, formula: string) {
    // This function is used by "grid-row" and "rm-table" components.
    if (!weight || !reps) return -1; // no data
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
    var maxEst1RM = sets.map(function(set) { return _calculateOneRepMax(set.weight, set.reps, oneRmFormula) })
        .filter(function(val) { return val > 0 }) // filter out error conditions
        .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
    maxEst1RM = _roundOneRepMax(maxEst1RM);
    return maxEst1RM;
}

export function _roundOneRepMax (oneRepMax: number) {
    // This function is used by "grid-row" component.
    //
    // Round up 1 d.p. to ensure that 12 reps always gives 69% not 70%.
    // e.g. 11 x 12 = 15.84557...
    // Standard[1] = 15.8;  11/15.8 = 0.696 = 70% when displayed (bright orange)
    // Round up[2] = 15.9;  11/15.9 = 0.692 = 69% when displayed (pale orange)
    // [1] = (Math.round(number * 10) / 10) or number.toFixed(1)
    // [2] = Math.ceil (see below)
    return Math.ceil(oneRepMax * 10) / 10;
}

 

export function _newWorkout(): Exercise[] {
    // create an empty workout
    return ["1", "2", "3"].map(function (number) {
        return _newExercise(number, 0, 3);
    });
}

export function _newExercise(exerciseNumber: string, warmUpSets: number, workSets: number): Exercise {
    var sets = [];
    if (exerciseNumber.startsWith("1")) { // warm up only applies for the first exercise
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
        guideType: ''
    };
}

export function _newSet(type: string): Set {
    return {
        weight: 0,
        reps: 0,
        gap: 0,
        type: type
    };
}

export function _volumeForSet (set: Set): number {
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

export function _formatDate (datestr: string) { // dateformat?: string
    if (!datestr) return "";
    /*if (!dateformat) */var dateformat = "DD/MM/YYYY";
    return moment(datestr).format(dateformat);
} 

export function _calculateTotalVolume (exercise: RecentWorkout) {
    return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
}