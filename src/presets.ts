
import { Preset, Exercise, GuideWeek, Guide, RecentWorkout } from "./types/app";
import { _newExercise } from './supportFunctions';
import * as moment from "moment";

// Note that at the moment, presets must be created 
// as tab-separated text, and saved as a text file "presets.txt"
// in the same folder as "workouts.json"

export function _parsePresets(str: string): Preset[] {
    var presets = [] as Preset[];

    if (!str) return [];

    var lines = str.split(/\r?\n/); // optional \r followed by \n (to handle both Unix \n and Windows \r\n newlines)
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

export function _applyPreset(preset: Preset, weekNumber: number, guides: Guide[], recentWorkouts: RecentWorkout[]): Exercise[] {
    let exercises = [] as Exercise[];
    preset.exercises.forEach(function (preset) {
        let guideName = preset.guide; // e.g. a guide like "12-14"
        
        // Guide weeks (i.e. where the rep range varies according to `weekNumber`)
        // OLD // let guideWeeks = _getGuideWeeks(preset.guide);
        // OLD // let currentWeek = guideWeeks.find(z => weekNumber >= z.fromWeek && weekNumber <= z.toWeek);
        // OLD // if (currentWeek) {
        // OLD //     guideName = currentWeek.guide;
        // OLD // }

        // Expand guide name
        // e.g. if the preset says "D8-12",
        //      then expand this to "Double 8-12"
        guideName = guideName.replace(/^D/, "Double ");
        guideName = guideName.replace(/^W/, "Wave ");
        guideName = guideName.replace(/^L/, "Linear "); // not currently used but might be in future
        
        // Guide - used to determine number of sets (i.e. how many rows to create)
        let exercise;
        let guide = guides.find(g => g.name == guideName);
        if (guide) {
            let warmUpSets = preset.number.startsWith("1") ? guide.warmUp.length : 0; // warmup on 1st exercise only
            exercise = _newExercise(preset.number, warmUpSets, guide.workSets.length);
        } else {
            // if guide isn't found (e.g. if the preset guide is blank),
            // then default to 3 work sets and 0 warmup sets
            exercise = _newExercise(preset.number, 0, 3);
        }

        exercise.name = preset.name;
        exercise.guideType = guideName;
        exercise.goal = extractGoalFromPreviousComment(recentWorkouts, exercise.name)
        exercises.push(exercise);
    });
    return exercises;
}

function extractGoalFromPreviousComment(recentWorkouts: RecentWorkout[], exerciseName: string) {
    // See also <exercise-container> / lastWeeksComment
    // See also <exercise-container> / goalNumbers
    // See also <exercise-container> / getNextWeight
    
    let found = recentWorkouts.find(z => z.name == exerciseName);
    if (found) {
        let daysDiff = moment().diff(found.date, "days");
        if (daysDiff < 14) { // Oct'25: only apply the goal if the previous workout was less than 14 days ago
                             // (see "Suggested reductions in weight after a break from lifting" table below)
            if (found.next) {
                return found.next; // 22/06/25 added new field `next` to use instead of `comments`
            } else if (found.etag == "DL" && found.goal) {
                // if previous week was a deload, then re-use last week's goal
                return found.goal;
            }
        }
    }
    return null;
}

// Suggested reductions in weight after a break from lifting:
// -----------------------------------------------------------------------------------------------------------------
// Time Off       | Effect on Strength                              | Recommendation
// ---------------|-------------------------------------------------|-----------------------------------------------
// Up to 1 week   | Minimal loss (neural adaptations remain intact) | Resume as normal or slightly under previous load
// 1–2 weeks      | Slight decline in performance                   | Drop weight by ~5–10%, ramp up within a week
// 2–4 weeks      | Noticeable strength/endurance loss              | Reduce weight by ~10–20%, fewer sets initially
// 4+ weeks       | Significant detraining, loss in strength & form | Return at ~50–70% of previous weight, rebuild over 2–4 weeks
// -----------------------------------------------------------------------------------------------------------------


// OLD //export function _getGuideWeeks(presetType: string): GuideWeek[] {
// OLD //    // used by _applyPreset (above) and by workout-calc.vue/guideInformationTable
// OLD //    if (presetType == "MAIN") { // Main lift, rep range depends on week
// OLD //        return [
// OLD //            // { fromWeek: 1, toWeek: 2, guide: "15-20" },
// OLD //            // { fromWeek: 3, toWeek: 4, guide: "12-14" },
// OLD //            // { fromWeek: 5, toWeek: 6, guide: "9-11" },
// OLD //            // { fromWeek: 7, toWeek: 8, guide: "6-8" },
// OLD //            // { fromWeek: 9, toWeek: 99, guide: "15-20" },
// OLD //
// OLD //            // Weekly undulating periodization:
// OLD //            // { fromWeek: 1, toWeek: 1, guide: "15-20" },
// OLD //            // { fromWeek: 2, toWeek: 2, guide: "12-14" },
// OLD //            // { fromWeek: 3, toWeek: 3, guide: "9-11" },
// OLD //            // { fromWeek: 4, toWeek: 4, guide: "6-8" },
// OLD //            // { fromWeek: 5, toWeek: 5, guide: "15-20" },
// OLD //            // { fromWeek: 6, toWeek: 6, guide: "12-14" },
// OLD //            // { fromWeek: 7, toWeek: 7, guide: "9-11" },
// OLD //            // { fromWeek: 8, toWeek: 8, guide: "6-8" },
// OLD //            // { fromWeek: 9, toWeek: 99, guide: "15-20" },
// OLD //
// OLD //            // Weekly undulating periodization, pyramid:
// OLD //            //{ fromWeek: 1, toWeek: 1, guide: "15-20" },
// OLD //            //{ fromWeek: 2, toWeek: 2, guide: "12-14" },
// OLD //            //{ fromWeek: 3, toWeek: 3, guide: "9-11" },
// OLD //            //{ fromWeek: 4, toWeek: 4, guide: "6-8" },
// OLD //            //{ fromWeek: 5, toWeek: 5, guide: "9-11" },
// OLD //            //{ fromWeek: 6, toWeek: 99, guide: "12-14" }
// OLD //            ////{ fromWeek: 7, toWeek: 99, guide: "15-20" }
// OLD //            
// OLD //            // MAIN
// OLD //            { fromWeek: 1, toWeek: 2, guide: "12-14" },
// OLD //            { fromWeek: 3, toWeek: 4, guide: "9-11" },
// OLD //            { fromWeek: 5, toWeek: 6, guide: "6-8" },
// OLD //            { fromWeek: 7, toWeek: 99, guide: "12-14" }
// OLD //        ];
// OLD //    }
// OLD //    if (presetType == "ACES") { // Accessory lift, rep range depends on week
// OLD //        return [
// OLD //            //{ fromWeek: 1, toWeek: 2, guide: "15-20" },
// OLD //            //{ fromWeek: 3, toWeek: 5, guide: "12-14" },
// OLD //            //{ fromWeek: 6, toWeek: 99, guide: "9-11" },
// OLD //
// OLD //            // { fromWeek: 1, toWeek: 1, guide: "15-20" },
// OLD //            // { fromWeek: 2, toWeek: 2, guide: "15-20" },
// OLD //            // { fromWeek: 3, toWeek: 3, guide: "12-14" },
// OLD //            // { fromWeek: 4, toWeek: 4, guide: "9-11" },
// OLD //            // { fromWeek: 5, toWeek: 5, guide: "15-20" },
// OLD //            // { fromWeek: 6, toWeek: 6, guide: "15-20" },
// OLD //            // { fromWeek: 7, toWeek: 7, guide: "12-14" },
// OLD //            // { fromWeek: 8, toWeek: 8, guide: "9-11" },
// OLD //            // { fromWeek: 9, toWeek: 99, guide: "15-20" },
// OLD //
// OLD //            // Weekly undulating periodization, pyramid:
// OLD //            //{ fromWeek: 1, toWeek: 1, guide: "15-20" },
// OLD //            //{ fromWeek: 2, toWeek: 2, guide: "12-14" },
// OLD //            //{ fromWeek: 3, toWeek: 3, guide: "9-11" },
// OLD //            //{ fromWeek: 4, toWeek: 4, guide: "6-8" },
// OLD //            //{ fromWeek: 5, toWeek: 5, guide: "9-11" },
// OLD //            //{ fromWeek: 6, toWeek: 99, guide: "12-14" }
// OLD //            ////{ fromWeek: 7, toWeek: 99, guide: "15-20" }
// OLD //
// OLD //            // ACES
// OLD //            { fromWeek: 1, toWeek: 3, guide: "12-14" },
// OLD //            { fromWeek: 4, toWeek: 6, guide: "9-11" },
// OLD //            { fromWeek: 7, toWeek: 99, guide: "12-14" }
// OLD //        ]
// OLD //    }
// OLD //    if (presetType == "M129") { // 12- and 9- rep ranges; deload every 4 weeks (main)
// OLD //        return [
// OLD //            { fromWeek: 1, toWeek: 2, guide: "12-14" },
// OLD //            { fromWeek: 3, toWeek: 4, guide: "9-11" },
// OLD //            { fromWeek: 5, toWeek: 5, guide: "Deload" },
// OLD //            { fromWeek: 6, toWeek: 7, guide: "12-14" },
// OLD //            { fromWeek: 8, toWeek: 9, guide: "9-11" },
// OLD //            { fromWeek: 10, toWeek: 99, guide: "Deload" },
// OLD //        ]
// OLD //    }
// OLD //    if (presetType == "A129") { // 12- and 9- rep ranges; deload every 4 weeks (accessory)
// OLD //        return [
// OLD //            { fromWeek: 1, toWeek: 3, guide: "12-14" },
// OLD //            { fromWeek: 4, toWeek: 4, guide: "9-11" },
// OLD //            { fromWeek: 5, toWeek: 5, guide: "Deload" },
// OLD //            { fromWeek: 6, toWeek: 8, guide: "12-14" },
// OLD //            { fromWeek: 9, toWeek: 9, guide: "9-11" },
// OLD //            { fromWeek: 10, toWeek: 99, guide: "Deload" },
// OLD //        ]
// OLD //    }
// OLD //    return []; // unknown preset type
// OLD //}