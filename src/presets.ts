
import { Preset, Exercise, GuideWeek } from "./types/app";
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
        exercise.guideType = preset.guide;

        var guideWeeks = _getGuideWeeks(preset.guide);
        var found = guideWeeks.find(z => weekNumber >= z.fromWeek && weekNumber <= z.toWeek);
        if (found)
            exercise.guideType = found.guide;

        exercises.push(exercise);
    });
    return exercises;
}

export function _getGuideWeeks(presetType: string): GuideWeek[] {
    // used by _applyPreset (above) and by workout-calc.vue/guideInformationTable
    if (presetType == "MAIN") { // Main lift, rep range depends on week
        return [
            { fromWeek: 1, toWeek: 2, guide: "15-20" },
            { fromWeek: 3, toWeek: 4, guide: "12-14" },
            { fromWeek: 5, toWeek: 6, guide: "9-11" },
            { fromWeek: 7, toWeek: 8, guide: "6-8" },
            { fromWeek: 9, toWeek: 99, guide: "15-20" }
        ];
    }
    if (presetType == "ACES") { // Accessory lift, rep range depends on week
        return [
            { fromWeek: 1, toWeek: 2, guide: "15-20" },
            { fromWeek: 3, toWeek: 5, guide: "12-14" },
            { fromWeek: 6, toWeek: 99, guide: "9-11" },
        ]
    }
    return []; // unknown preset type
}