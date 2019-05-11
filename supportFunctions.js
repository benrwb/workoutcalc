export function _calculateOneRepMax(set, formula) {
    // This function is used by "grid-row" component and by main Vue instance.
    if (!set.weight || !set.reps) return -1; // no data
    if (set.reps > 12) return -2; // can't calculate if >12 reps

    if (formula == 'Brzycki') {
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
    else 
        return -3; // unknown formula
}


export function _roundOneRepMax(oneRepMax) {
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



 
export function _newWorkout() {
    // create an empty workout (3 exercises, 5 sets in each)
    var list = [];
    for (var p = 0; p < 3; p++) { // for each page (3 in total)
        list.push(newExercise());
    }
    return list;
}

function newExercise() {
    var sets = [];
    for (var s = 0; s < 5; s++) { // for each set (5 in total)
        sets.push(_newSet());
    }
    return {
        name: '',
        sets: sets,
        ref1RM: '',
        comments: '',
        etag: 0 // exercise tag
    };
}

export function _newSet() {
    return {
        weight: '',
        reps: '',
        gap: ''
    };
}

export function _volumeForSet(set) {
    var weight = Number(set.weight);
    var reps = Number(set.reps);
    var volume = weight * reps;
    return volume == 0 ? "" : Math.round(volume);
}

