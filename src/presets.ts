
import { Preset, Exercise, GuideWeek, Guide } from "./types/app";
import { _getGuidePercentages } from "./guide";
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

export function _applyPreset(preset: Preset, weekNumber: number, guides: Guide[]): Exercise[] {
    let exercises = [] as Exercise[];
    preset.exercises.forEach(function (preset) {
        let guideType = preset.guide; // e.g. "MAIN"/"ACES" or a guide like "12-14"
        
        // Guide weeks (i.e. where the rep range varies according to `weekNumber`)
        let guideWeeks = _getGuideWeeks(preset.guide);
        let currentWeek = guideWeeks.find(z => weekNumber >= z.fromWeek && weekNumber <= z.toWeek);
        if (currentWeek) {
            guideType = currentWeek.guide;
        }
        
        // Guide type - used to determine number of sets (i.e. how many rows to create)
        let exercise;
        let guide = guides.find(g => g.name == guideType);
        if (guide) {
            let warmUpSets = preset.number == "1" ? guide.warmUp.length : 0;
            exercise = _newExercise(preset.number, warmUpSets, guide.workSets.length);
        } else {
            exercise = _newExercise(preset.number, 0, 3);
        }

        exercise.name = preset.name;
        exercise.guideType = guideType;
        exercises.push(exercise);
    });
    return exercises;
}

export function _getGuideWeeks(presetType: string): GuideWeek[] {
    // used by _applyPreset (above) and by workout-calc.vue/guideInformationTable
    if (presetType == "MAIN") { // Main lift, rep range depends on week
        return [
            // { fromWeek: 1, toWeek: 2, guide: "15-20" },
            // { fromWeek: 3, toWeek: 4, guide: "12-14" },
            // { fromWeek: 5, toWeek: 6, guide: "9-11" },
            // { fromWeek: 7, toWeek: 8, guide: "6-8" },
            // { fromWeek: 9, toWeek: 99, guide: "15-20" },

            // Weekly undulating periodization:
            // { fromWeek: 1, toWeek: 1, guide: "15-20" },
            // { fromWeek: 2, toWeek: 2, guide: "12-14" },
            // { fromWeek: 3, toWeek: 3, guide: "9-11" },
            // { fromWeek: 4, toWeek: 4, guide: "6-8" },
            // { fromWeek: 5, toWeek: 5, guide: "15-20" },
            // { fromWeek: 6, toWeek: 6, guide: "12-14" },
            // { fromWeek: 7, toWeek: 7, guide: "9-11" },
            // { fromWeek: 8, toWeek: 8, guide: "6-8" },
            // { fromWeek: 9, toWeek: 99, guide: "15-20" },

            // Weekly undulating periodization, pyramid:
            //{ fromWeek: 1, toWeek: 1, guide: "15-20" },
            //{ fromWeek: 2, toWeek: 2, guide: "12-14" },
            //{ fromWeek: 3, toWeek: 3, guide: "9-11" },
            //{ fromWeek: 4, toWeek: 4, guide: "6-8" },
            //{ fromWeek: 5, toWeek: 5, guide: "9-11" },
            //{ fromWeek: 6, toWeek: 99, guide: "12-14" }
            ////{ fromWeek: 7, toWeek: 99, guide: "15-20" }
            
            // MAIN
            { fromWeek: 1, toWeek: 2, guide: "12-14" },
            { fromWeek: 3, toWeek: 4, guide: "9-11" },
            { fromWeek: 5, toWeek: 6, guide: "6-8" },
            { fromWeek: 7, toWeek: 99, guide: "12-14" }
        ];
    }
    if (presetType == "ACES") { // Accessory lift, rep range depends on week
        return [
            //{ fromWeek: 1, toWeek: 2, guide: "15-20" },
            //{ fromWeek: 3, toWeek: 5, guide: "12-14" },
            //{ fromWeek: 6, toWeek: 99, guide: "9-11" },

            // { fromWeek: 1, toWeek: 1, guide: "15-20" },
            // { fromWeek: 2, toWeek: 2, guide: "15-20" },
            // { fromWeek: 3, toWeek: 3, guide: "12-14" },
            // { fromWeek: 4, toWeek: 4, guide: "9-11" },
            // { fromWeek: 5, toWeek: 5, guide: "15-20" },
            // { fromWeek: 6, toWeek: 6, guide: "15-20" },
            // { fromWeek: 7, toWeek: 7, guide: "12-14" },
            // { fromWeek: 8, toWeek: 8, guide: "9-11" },
            // { fromWeek: 9, toWeek: 99, guide: "15-20" },

            // Weekly undulating periodization, pyramid:
            //{ fromWeek: 1, toWeek: 1, guide: "15-20" },
            //{ fromWeek: 2, toWeek: 2, guide: "12-14" },
            //{ fromWeek: 3, toWeek: 3, guide: "9-11" },
            //{ fromWeek: 4, toWeek: 4, guide: "6-8" },
            //{ fromWeek: 5, toWeek: 5, guide: "9-11" },
            //{ fromWeek: 6, toWeek: 99, guide: "12-14" }
            ////{ fromWeek: 7, toWeek: 99, guide: "15-20" }

            // ACES
            { fromWeek: 1, toWeek: 2, guide: "12-14" },
            { fromWeek: 3, toWeek: 4, guide: "9-11" },
            { fromWeek: 5, toWeek: 6, guide: "9-11" },
            { fromWeek: 7, toWeek: 99, guide: "12-14" }
        ]
    }
    return []; // unknown preset type
}