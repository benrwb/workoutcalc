<style>
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
</style>

<template>
<div>

Colour-code
<label><input type="radio" v-model="colourCodeReps" value=""      />None</label>
<label><input type="radio" v-model="colourCodeReps" value="guide" />Guide</label>
<label><input type="radio" v-model="colourCodeReps" value="actual"/>Actual</label>



<table border="1" class="weektable">
    <tr>
        <!-- Table heading -->
        <td></td>
        <td v-for="heading in table.columnHeadings"
            style="width: 40px">
            {{ heading }}
        </td>
    </tr>
    <tr v-for="(row, rowIdx) in table.rows">
        <!-- Table body -->
        <td>{{ rowIdx + 1 }}</td>
        <td v-for="col in row"
            v-bind:class="[colourCodeReps == 'actual' && ('weekreps' + col.reps),
                           colourCodeReps == 'guide' && ('weekreps' + col.guideMiddle)]"
            v-bind:style="{ 'opacity': col.singleSetOnly && colourCodeReps == 'actual' ? '0.5' : null }"
            v-bind:title="col.headlineString"
            v-on:mousemove="showTooltip(col.idx, $event)" v-on:mouseout="hideTooltip">
            {{ showVolume 
                ? col.volume > 0 ? col.volume.toLocaleString() : ""
                : col.weight > 0 ? col.weight.toString() : "" }}
        </td>
    </tr>
</table>

<br />
<table v-if="colourCodeReps">
    <tr>
        <td>KEY:</td>
        <td v-for="number in 15"
            v-bind:class="'weekreps' + (16 - number)">{{ 16 - number }}</td>
    </tr>
</table>

<tool-tip 
    v-bind:recent-workouts="recentWorkouts"
    v-bind:show1-r-m="show1RM"
    v-bind:show-volume="showVolume"
    v-bind:one-rm-formula="oneRmFormula"
    v-bind:guides="guides"
    ref="tooltip"
></tool-tip>

</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"
import { RecentWorkout, Set, WeekTableCell, WeekTable } from './types/app'
import ToolTip from "./tool-tip.vue"
import { _calculateTotalVolume } from "./supportFunctions"
import { getHeadlineFromGuide, getHeadlineWithoutGuide } from "./headline";

export default defineComponent({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String,
        show1RM: Boolean, // for tooltip
        showVolume: Boolean, // for tooltip
        oneRmFormula: String, // for tooltip
        guides: Array, // for tooltip
    },
    data: function () {
        return {
            colourCodeReps: "actual"
        }
    },
    methods: {
        getHeadline: function (exerciseIdx: number): WeekTableCell {
            let exercise = this.recentWorkouts[exerciseIdx];

            let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = exercise.guideType
                    ? getHeadlineFromGuide(exercise.guideType, exercise.sets)
                    : getHeadlineWithoutGuide(exercise.sets);

            return {
                weight: headlineWeight,
                reps: headlineReps,
                headlineString: headlineWeight + " x " + repsDisplayString,
                singleSetOnly: headlineNumSets == 1,
                idx: exerciseIdx, // for tooltip
                volume: _calculateTotalVolume(this.recentWorkouts[exerciseIdx]),
                guideMiddle: this.guideMiddleNumber(this.recentWorkouts[exerciseIdx].guideType)
            };
          
        },
        // OLD // getHeadline: function (exerciseIdx: number): WeekTableCell {
		// OLD // 
        // OLD //     // POSSIBLE FUTURE TODO: Use getHeadline/getHeadlineFromGuide functions
        // OLD //     //                       from <recent-workouts-panel> instead.
        // OLD //     
        // OLD //     // ~~Only look at sets where the number of reps is *at least* 6~~
        // OLD //     // include all sets // var matchingSets = allSets.filter(set => set.reps >= 6);
        // OLD //     var matchingSets = this.recentWorkouts[exerciseIdx].sets; // include all sets
		// OLD // 
        // OLD //     // Then look at the set(s) with the highest weight
        // OLD //     var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
		// OLD // 
        // OLD //     // Get highest number of reps at that weight
        // OLD //     var maxWeightSets = matchingSets.filter(set => set.weight == maxWeight);
        // OLD //     var maxReps = maxWeightSets.reduce((acc, set) => Math.max(acc, set.reps), 0); // highest value in array
		// OLD // 
        // OLD //     return {
        // OLD //         weight: maxWeight,
        // OLD //         reps: maxWeightSets.length < 2 ? 0 // don't colour-code reps if there was only 1 set at this weight
        // OLD //             : maxReps,
        // OLD //         idx: exerciseIdx, // for tooltip
        // OLD //         volume: _calculateTotalVolume(this.recentWorkouts[exerciseIdx]),
        // OLD //         guideMiddle: this.guideMiddleNumber(this.recentWorkouts[exerciseIdx].guideType)
        // OLD //     };
        // OLD // },
        guideMiddleNumber: function (guide: string) {
            // e.g. "6-8" --> 7
            //      "12-14" --> 13
            // (used to map guides to `weekreps` styles, for colour-coding)
            if (!guide) return 0;
            var parts = guide.split('-');
            if (parts.length != 2) return 0;
            var first = Number(parts[0]);
            var second = Number(parts[1]);
            return Math.round(second - ((second - first) / 2));
        },
        showTooltip: function (recentWorkoutIdx: number, e: MouseEvent) {
            var tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.show(recentWorkoutIdx, e);
        },
        hideTooltip: function () {
            var tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.hide();
        },
    },
    computed: {
        table: function (): WeekTable {
            var columnHeadings = [] as string[];
            var tableRows = [] as WeekTableCell[][];

            function merge(rowIdx: number, colIdx: number, exerciseIdx: number) {
                var headline = self.getHeadline(exerciseIdx);
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
            }

            function emptyCell(): WeekTableCell { return { weight: 0, reps: 0, headlineString: "", singleSetOnly: false, idx: -1, volume: 0, guideMiddle: 0 } }

            var self = this;
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != self.currentExerciseName) return;
                if (exerciseIdx > 500) return; // don't go back too far
                // POSSIBLE FUTURE TODO: add multiple "stop" conditions,
                //     i.e. stop when either (a) ~500 items have been scanned,
                //     or (b) when 4 columns have been added to the table
                //     (this is to avoid adding a half-populated column
                //      or adding an excessive number of columns)

                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) {
                        columnHeadings.push(exercise.blockStart);
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = exercise.weekNumber - 1; // e.g. week 1 is [0]

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
        }
    }
});
</script>