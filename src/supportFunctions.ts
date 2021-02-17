import { Exercise, Set } from './types/app'

export function _calculateOneRepMax(set: Set, formula: string) {
    // This function is used by "grid-row" component and by main Vue instance.
    if (!set.weight || !set.reps) return -1; // no data
    //if (set.reps > 12) return -2; // can't calculate if >12 reps

    var weight = Number(set.weight);
    var reps = Number(set.reps);

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
        weight: '',
        reps: '',
        gap: ''
    };
}

export function _volumeForSet (set: Set): number {
    var weight = Number(set.weight);
    var reps = Number(set.reps);
    var volume = weight * reps;
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
    var weights = "kg";
    var reps = "x ";
    var gaps = "🕘  ";
    var exerciseVolume = 0;
    
    exercise.sets.forEach(function (set, setIdx) {
        var w = set.weight;
        var r = set.reps;
        var g = (setIdx == (exercise.sets.length - 1)) 
            ? "" 
            : exercise.sets[setIdx + 1].gap; // use the next one down

        var score = _volumeForSet(set);
        if (score > 0) {
            var len = Math.max(w.length, r.length, g.length);
            weights += "  " + pad(w, len);
            reps += "  " + pad(r, len);
            gaps += "  " + pad(g, len);
            exerciseVolume += score;
            //totalVolume += score;
        }
    });

    if (exerciseVolume > 0) {
        return "  " + weights.trim() + "\n"
              + "  " + reps.trim() + "\n"
              + "  " + gaps.trim(); // + "\n"
              //+ "  Volume: " + exerciseVolume;
    } else { 
        return "";
    }
}