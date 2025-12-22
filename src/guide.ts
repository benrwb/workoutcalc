import { computed, Ref } from "vue";
import { Guide } from "./types/app";

export function _getGuides(): Guide[] {
    var guides = [] as Guide[];
    guides.push({
        name: "", // default (no guide)
        category: "",
        weightType: "",
        warmUp: [],
        workSets: [1, 1, 1] // default to 3 sets for exercises without a rep guide (used by _applyPreset)
    });
    // ========================================================

    // BEGIN Apr 2025
    guides.push({ name: "Wave 4-6", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.70, 0.85], workSets: [1,1,1] });
    guides.push({ name: "Wave 6-8", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.75], workSets: [1,1,1] });
    guides.push({ name: "Wave 8-10", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Wave 8-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "Wave 10-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "Double 6-8", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.75], workSets: [1,1,1] });
    guides.push({ name: "Double 8-10", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 8-12", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 10-12", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 12-15", category: "HIGH", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    // possible todo: add Linear
    // END Apr 2025


    return guides;
}




export function _getGuidePercentages (exerciseNumber: string, guide: Guide): number[] {
    // used by <grid-row>
    var percentages = [] as number[];
    var warmUp = exerciseNumber == "1" || exerciseNumber == "1A";
    //           ^^^ see also supportFunctions.ts / _newExercise()
    if (warmUp) {
        percentages = percentages.concat(guide.warmUp);
    }
    percentages = percentages.concat(guide.workSets);
    return percentages;
}


export function _useGuideParts(guideType: Ref<string>) {
    // e.g. `guideType.value == "12-14"` --> { guideLowReps: 12, guideHighReps: 14 }
    return computed(() => {
        if (guideType.value) {
            // Regular expression to match the pattern of numbers before and after the dash
            const regex = /(\d+)-(\d+)/;
            const match = guideType.value.match(regex);
            if (match) {
                return {
                    guideLowReps: parseInt(match[1]),
                    guideHighReps: parseInt(match[2])
                }
            }
        }
        return {
            guideLowReps: 0,
            guideHighReps: 0
        }
    });
}
