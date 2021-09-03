
import { Preset, Exercise } from "./types/app";
import { _newExercise } from './supportFunctions';

// Note that at the moment, presets must be created 
// as tab-separated text, and then pasted into Chrome DevTools:
// Application -> Local Storage -> key is "Presets"

export function _getPresets(): Preset[] {
    var presets = [] as Preset[];

    var str = localStorage.getItem("presets");
    if (!str) return [];

    var lines = str.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split('\t');
        if (parts.length != 4) continue;

        var presetName = parts[0];
        var exerciseNumber = parts[1];
        var exerciseGuide = parts[2];
        var exerciseName = parts[3];

        // Find existing preset, or create new one it doesn't exist
        var preset = presets.find(z => z.name == presetName);
        if (!preset) {
            preset = { name: presetName, exercises: [] };
            presets.push(preset);
        }

        // Add exercise to preset
        preset.exercises.push({
            number: exerciseNumber,
            guide: exerciseGuide,
            name: exerciseName
        });
    }

    return presets;
}

export function _applyPreset(preset: Preset): Exercise[] {
    var exercises = [] as Exercise[];
    preset.exercises.forEach(function (ex) {
        var exercise = _newExercise(ex.number);
        exercise.name = ex.name;
        exercise.guideType = ex.guide;
        exercises.push(exercise);
    });
    return exercises;
}