<style>
    .weekreps {
        background-color: #eee; /* so the background of the "set" column matches div.leftline.weekreps0 (defined in workout-calc) */
    }
    .weekreps1,
    .weekreps2,
    .weekreps3,
    .weekreps4,
    .weekreps5 {
        background-color: crimson;
        color: white;
    }
    .weekreps6,
    .weekreps7,
    .weekreps8 {
        background-color: purple;
        color: white;
    }
    .weekreps9,
    .weekreps10,
    .weekreps11 {
        background-color: orange;
        color: white;
    }
    .weekreps12,
    .weekreps13,
    .weekreps14 {
        background-color: #fff1ab
    }
    .weekreps15,
    .weekreps16,
    .weekreps17,
    .weekreps18,
    .weekreps19,
    .weekreps20 {
        background-color: #d5efda; /* #e0d694; */
    }





    .weekreps1-faded,
    .weekreps2-faded,
    .weekreps3-faded,
    .weekreps4-faded,
    .weekreps5-faded {
        background-color: rgba(220, 20, 60, 0.5); /* crimson, 50% opacity */
        color: white;
    }
    .weekreps6-faded,
    .weekreps7-faded,
    .weekreps8-faded {
        background-color: rgba(128, 0, 128, 0.5); /* purple, 50% opacity */
        color: white;
    }
    .weekreps9-faded,
    .weekreps10-faded,
    .weekreps11-faded {
        background-color: rgba(255, 165, 0, 0.5); /* orange, 50% opacity */
        color: white;
    }
    .weekreps12-faded,
    .weekreps13-faded,
    .weekreps14-faded {
        background-color: rgba(255, 241, 171, 0.3); /* #fff1ab, 30% opacity */
    }
    .weekreps15-faded,
    .weekreps16-faded,
    .weekreps17-faded,
    .weekreps18-faded,
    .weekreps19-faded,
    .weekreps20-faded {
        background-color: rgba(213, 239, 218, 0.3); /* #d5efda, 30% opacity */
    }




    .gap6 {
        background-color: crimson;
        color: white;
    }
    .gap5,
    .gap4 {
        background-color: purple;
        color: white;
    }
    .gap3 {
        background-color: orange;
        color: white;
    }
    .gap2 {
        background-color: #fff1ab
    }
    .gap1 {
        background-color: #d5efda;
    }
</style>

<template>
<div>

    <div style="text-align: left">
        <span>🔢</span>
        <label><input type="radio" v-model="valueToDisplay" value="weight" />Weight</label>
        <label><input type="radio" v-model="valueToDisplay" value="volume" />Volume</label>
        <label><input type="radio" v-model="valueToDisplay" value="reps"   />Reps</label>
        <!-- <label><input type="radio" v-model="valueToDisplay" value="Avg1RM" />Avg <span style="font-size: smaller">1RM</span></label> -->
        <label><input type="radio" v-model="valueToDisplay" value="Max1RM" />Max 1RM</label>
        <br />

        <span>🎨</span>
        <label><input type="radio" v-model="colourCoding" value=""       />N/A</label>
        <label><input type="radio" v-model="colourCoding" value="guide"  />Guide reps</label>
        <label><input type="radio" v-model="colourCoding" value="actual" />Actual reps</label>
        <label><input type="radio" v-model="colourCoding" value="heatmap"/>Value</label>
    </div>

    <table border="1" class="weektable">
        <thead>
            <tr>
                <!-- Table heading -->
                <td></td>
                <td v-for="heading in table.columnHeadings"
                    style="width: 40px">
                    {{ heading }}
                </td>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, rowIdx) in table.rows">
                <!-- Table body -->
                <td>{{ rowIdx + 1 }}</td>
                <td v-for="col in row"
                    v-bind:class="[colourCoding == 'actual' && ('weekreps' + col.reps),
                                    colourCoding == 'guide' && ('weekreps' + col.guideMiddle)]"
                    v-bind:style="[{ 'opacity': col.singleSetOnly && colourCoding == 'actual' ? '0.5' : null },
                                colourCoding == 'heatmap' ? getHeatmapStyle(col.value) : null ]"
                    v-bind:title="col.headlineString"
                    v-on:mousemove="showTooltip(col.idx, $event)" v-on:mouseout="hideTooltip">
                    {{ formatValue(col.value) }}
                </td>
            </tr>
        </tbody>
    </table>

    <table v-if="colourCoding == 'guide' || colourCoding == 'actual'">
        <tbody>
            <tr>
                <td>KEY:</td>
                <td v-for="number in 15"
                    v-bind:class="'weekreps' + (16 - number)">{{ 16 - number }}</td>
            </tr>
        </tbody>
    </table>



</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref, computed } from "vue"
import { RecentWorkout, Set, WeekTableCell, WeekTable } from './types/app'
import { _volumeForSet, _calculateMax1RM, _calculateAvg1RM, _getWeekNumber } from "./supportFunctions"
import { _getHeadline } from "./headline";
import * as moment from "moment";

export default defineComponent({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String,
        oneRmFormula: String
    },
    setup: function (props, context) {

        const valueToDisplay = ref("weight");
        const colourCoding = ref("actual");

        function showTooltip(recentWorkoutIdx: number, e: MouseEvent) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }
        function hideTooltip() {
            context.emit("hide-tooltip");
        }


        function guideMiddleNumber(guide: string) {
            // e.g. "6-8" --> 7
            //      "12-14" --> 13
            // (used to map guides to `weekreps` styles, for colour-coding)
            if (!guide) return 0;
            const regex = /(\d+)-(\d+)/; // Regular expression to match the pattern of numbers before and after the dash
            const match = guide.match(regex);
            if (match) {
                const guideLowReps = parseInt(match[1]);
                const guideHighReps = parseInt(match[2]);
                return Math.round(guideHighReps - ((guideHighReps - guideLowReps) / 2));
            }
            return 0;
        }

        let maxValue = 0;
        let minValue = 999999;

        const table = computed(() => {
            maxValue = 0;
            minValue = 999999;

            function getHeadline(exerciseIdx: number): WeekTableCell {
                let exercise = props.recentWorkouts[exerciseIdx];

                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(exercise);
                
                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);

                return {
                    weight: headlineWeight,
                    reps: headlineReps,
                    headlineString: headlineWeight + " x " + repsDisplayString,
                    singleSetOnly: headlineNumSets == 1,
                    idx: exerciseIdx, // for tooltip
                    guideMiddle: guideMiddleNumber(exercise.guideType),
                    value: valueToDisplay.value == "volume" ? volume
                         : valueToDisplay.value == "weight" ? headlineWeight
                         : valueToDisplay.value == "Avg1RM" ? _calculateAvg1RM(exercise.sets, props.oneRmFormula)
                         : valueToDisplay.value == "Max1RM" ? _calculateMax1RM(exercise.sets, props.oneRmFormula)
                         : valueToDisplay.value == "reps"   ? headlineReps
                         : 0
                };
            }


            var columnHeadings = [] as string[];
            var tableRows = [] as WeekTableCell[][];

            function merge(rowIdx: number, colIdx: number, exerciseIdx: number) {
                var headline = getHeadline(exerciseIdx);
                if (!tableRows[rowIdx][colIdx]) {
                    // create new cell
                    tableRows[rowIdx][colIdx] = headline;
                } else {
                    // overwrite existing cell if weight is higher
                    if (headline.weight > tableRows[rowIdx][colIdx].weight) {
                        tableRows[rowIdx][colIdx] = headline;
                    }
                    // ~~append to existing cell~~
                    // tableRows[rowIdx][colIdx] = { 
                    //     value: tableRows[rowIdx][colIdx].value + "/" + headline.value,
                    //     tooltip: tableRows[rowIdx][colIdx].tooltip + "/" + headline.tooltip
                    // }
                }
                // update max value
                if (headline.value > maxValue) {
                    maxValue = headline.value;
                }
                if (headline.value < minValue) {
                    minValue = headline.value;
                }
            }

            function emptyCell(): WeekTableCell { return { weight: 0, reps: 0, headlineString: "", singleSetOnly: false, idx: -1, guideMiddle: 0, value: null } }

            // idea // var oneYearAgo = moment().add(-1, "years");
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != props.currentExerciseName) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned

                let { weekNumber } = _getWeekNumber(exercise.blockStart, exercise.date);
                if (weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        // idea // if (oneYearAgo.isAfter(exercise.blockStart)) { // stop condition idea: next block is over a year ago
                        // idea //     return;
                        // idea // }
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = weekNumber - 1; // e.g. week 1 is [0]

                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length < colIdx)
                        //tableRows[rowIdx].push({ value: "", tooltip: "" }); // create cells as necessary
                        tableRows[rowIdx].push(emptyCell()); // create cells as necessary

                    // merge() - if more than 1 occurence for the same week
                    //           then show multiple values
                    merge(rowIdx, colIdx, exerciseIdx)
                }
            });

            // Make sure that every row contains the same
            // number of columns (this needs to be done 
            // before reversing, otherwise the numbers
            // won't line up properly)
            tableRows.forEach(function (row) {
                while (row.length < columnHeadings.length) {
                    //row.push({ value: "", tooltip: "" }); // create cells as necessary
                    row.push(emptyCell()); // create cells as necessary
                }
            });
            // Reverse the order of the columns
            // so that the earliest date is on the left
            columnHeadings.reverse();
            for (var i = 0; i < tableRows.length; i++) {
                tableRows[i].reverse();
            }

            return {
                columnHeadings: columnHeadings,
                rows: tableRows
            };
        });

        function getHeatmapStyle(value: number) {
            if (!value || !maxValue) return null;
            let divideBy = maxValue - minValue;
            if (divideBy == 0) return null; // avoid returning NaN
            // 👇Colour:
            //let hue = ((value - minValue) * 220) / divideBy;
            //return `hsl(${hue},100%,50%)`;
            // 👇Greyscale:
            // let brightness = ((value - minValue) * 150) / divideBy;
            // brightness = 255 - brightness;
            // return `rgb(${brightness},${brightness},${brightness})`
            // 👇Red:
            //let gb = ((value - minValue) * 5.5) / divideBy; // (5.5 because `Math.exp(5.5)` is 244.69, which is just under 255)
            //gb = 255 - Math.exp(gb); // scale exponentially and invert
            // 👇Red (attempt 2)

            // Scale the input value into a 0–1 range relative to min and max
            let normalizedValue = (value - minValue) / divideBy;

            // Apply a non-linear curve (exponent 2.2) to emphasize higher values
            // (`intensity` will still be in the range 0-1)
            let intensity = Math.pow(normalizedValue, 2.2);

            // Convert intensity into a green/blue channel value (inverted from 255 for shading)
            let gb = 255 - Math.round(intensity * 255);

            return {
                'background-color': `rgb(255,${gb},${gb})`,
                'color': gb < 150 ? 'white' : 'black'
            };
        }

        function formatValue(colValue: number) {
            // format value (e.g. rounding) depending on what is being shown
            return colValue == null ? ""
                : valueToDisplay.value == 'Avg1RM' ? colValue.toFixed(1) /* 1 d.p. */
                : valueToDisplay.value == 'Max1RM' ? colValue.toFixed(1) /* 1 d.p. */
                : valueToDisplay.value == 'volume' ? colValue.toLocaleString() /* thousands separator */
                : colValue;
        }

        return { valueToDisplay, colourCoding, table, getHeatmapStyle,
            showTooltip, hideTooltip, formatValue };
    }
});
</script>