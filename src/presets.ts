
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

export function _applyPreset(preset: Preset, weekNumber: number): Exercise[] {
    var exercises = [] as Exercise[];
    preset.exercises.forEach(function (preset) {
        var exercise = _newExercise(preset.number);
        exercise.name = preset.name;
        var guide = preset.guide;
        if (preset.guide == "MAIN") { // Main lift, rep range depends on week
            if (weekNumber <= 3)
                guide = "12-14";
            else if (weekNumber <= 6)
                guide = "8-10";
            else
                guide = "6-8";
        }
        if (preset.guide == "ACES") { // Accessory lift, rep range depends on week
            if (weekNumber <= 5)
                guide = "12-14";
            else
                guide = "8-10";
        }
        exercise.guideType = guide;
        exercises.push(exercise);
    });
    return exercises;
}