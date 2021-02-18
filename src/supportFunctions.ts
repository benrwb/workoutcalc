import { Exercise, Set } from './types/app'

export function _calculateOneRepMax(set: Set, formula: string) {
    // This function is used by "grid-row" component and by main Vue instance.
    if (!set.weight || !set.reps) return -1; // no data
    //if (set.reps > 12) return -2; // can't calculate if >12 reps

    if (formula == 'Brzycki') {
        if (set.reps > 12) return -2; // can't calculate if >12 reps
        return set.weight / (1.0278 - 0.0278 * set.reps);
    }
    else if (formula == 'Brzycki 12+') {
        // same as above but not limited to max 12 reps
        return set.weight / (1.0278 - 0.0278 * set.reps);
    }
    else if (formula == 'Epley') {
        return set.weight * (1 + (set.reps / 30));
    }
    else if (formula == 'McGlothin') {
        return (100 * set.weight) / (101.3 - 2.67123 * set.reps);
    }
    else if (formula == 'Lombardi') {
        return set.weight * Math.pow(set.reps, 0.10);
    }
    else if (formula == 'Mayhew et al.') {
        return (100 * set.weight) / (52.2 + 41.9 * Math.pow(Math.E, -0.055 * set.reps));
    }
    else if (formula == 'O\'Conner et al.') {
        return set.weight * (1 + (set.reps / 40));
    }
    else if (formula == 'Wathan') {
        return (100 * set.weight) / (48.8 + 53.8 * Math.pow(Math.E, -0.075 * set.reps));
    }
    else if (formula == 'Brzycki/Epley') {
        // uses Brzycki for fewer than 10 reps
        // and Epley for more than 10 reps
        // (for 10 reps they are the same)
        if (set.reps <= 10)
            return set.weight / (1.0278 - 0.0278 * set.reps); // Brzycki
        else
            return set.weight * (1 + (set.reps / 30)); // Epley
    }
    else 
        return -3; // unknown formula
}


export function _roundOneRepMax (oneRepMax: number) {
    // This function is used by "grid-row" component and by main Vue instance.
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
    var list = [];
    for (var p = 0; p < 3; p++) { // for each page (3 in total)
        list.push(_newExercise());
    }
    return list;
}

export function _newExercise(): Exercise {
    var sets = [];
    for (var s = 0; s < 8; s++) { // for each set (8 in total)
        sets.push(_newSet());
    }
    return {
        name: '',
        sets: sets,
        ref1RM: 0,
        comments: '',
        etag: 0, // exercise tag
        guideType: ''
    };
}

export function _newSet(): Set {
    return {
        weight: 0,
        reps: 0,
        gap: 0
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
    // format an exercise ready to be copied to the clipboard
    var weights = [] as string[];
    var reps = [] as string[];
    var gaps = [] as string[];
    var exerciseVolume = 0;
    
    exercise.sets.forEach(function (set, setIdx) {
        var score = _volumeForSet(set);
        if (score > 0) {
            var w = set.weight.toString();
            var r = set.reps.toString();
            var g = set.gap.toString();
            var len = Math.max(w.length, r.length, g.length);

            weights.push(pad(w, len));
            reps.push(pad(r, len));
            if (setIdx > 0) // skip first gap (will always be zero)
                gaps.push(pad(g, len));

            exerciseVolume += score;
            //totalVolume += score;
        }
    });

    if (exerciseVolume > 0) {
        return "  " + ("kg  " + weights.join("  ")).trim() + "\n"
             + "  " + ("x   " + reps.join("  ")).trim() + "\n"
             + "  " + ("🕘    " + gaps.join("  ")).trim(); // + "\n"
              //+ "  Volume: " + exerciseVolume;
    } else { 
        return "";
    }
}