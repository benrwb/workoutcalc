<style>
    .weekreps1 {
        background-color: crimson;
        color: white;
    }
    .weekreps2 {
        background-color: crimson;
        color: white;
    }
    .weekreps3 {
        background-color: crimson;
        color: white;
    }
    .weekreps4 {
        background-color: crimson;
        color: white;
    }
    .weekreps5 {
        background-color: purple;
        color: white;
    }
    .weekreps6 {
        background-color: purple;
        color: white;
    }
    .weekreps7 {
        background-color: purple;
        color: white;
    }
    .weekreps8 {
        background-color: orange;
        color: white;
    }
    .weekreps9 {
        background-color: orange;
        color: white;
    }
     .weekreps10 {
        background-color: orange;
        color: white;
    }
    .weekreps11 {
        background-color: #fff1ab;
    }
    .weekreps12 {
        background-color: #fff1ab
    }
    .weekreps13 {
        background-color: #fff1ab
    }
    .weekreps14 {
        background-color: #fff1ab
    }
    /* 15+ reps = white background */

</style>

<template>
<div>

<label>
    <input type="checkbox" v-model="colourCodeReps" />
    Colour-code reps
</label>



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
            v-bind:class="colourCodeReps && ('weekreps' + col.reps)"
            v-bind:title="tooltip(col)">
            {{ col.weight > 0 ? col.weight.toString() : "" }}
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

</div>
</template>

<script lang="ts">
import Vue, { PropType } from './types/vue'
import { RecentWorkout, Set, WeekTableCell, WeekTable } from './types/app'

export default Vue.extend({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String
    },
    data: function () {
        return {
            colourCodeReps: false
        }
    },
    methods: {
        getHeadline: function (allSets: Set[]): WeekTableCell {

            // POSSIBLE FUTURE TODO: Use getHeadline/getHeadlineFromGuide functions
            //                       from <recent-workouts-panel> instead.
            
            // ~~Only look at sets where the number of reps is *at least* 6~~
            // include all sets // var matchingSets = allSets.filter(set => set.reps >= 6);
            var matchingSets = allSets; // include all sets

            // Then look at the set(s) with the highest weight
            var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array

            // Get highest number of reps at that weight
            var maxWeightSets = matchingSets.filter(set => set.weight == maxWeight);
            var maxReps = maxWeightSets.reduce((acc, set) => Math.max(acc, set.reps), 0); // highest value in array

            return {
                weight: maxWeight,
                reps: maxWeightSets.length < 2 ? 0 // don't colour-code reps if there was only 1 set at this weight
                    : maxReps
            };
            // return { 
            //     value: maxWeight.toString(),
            //     tooltip: maxWeight + " x " + maxReps
            // };
        },
        tooltip: function (cell: WeekTableCell) {
            if (cell.weight && cell.reps) 
                return cell.weight.toString() + " x " + cell.reps.toString();
            else 
                return null;
        }
    },
    computed: {
        table: function (): WeekTable {
            var columnHeadings = [] as string[];
            var tableRows = [] as WeekTableCell[][];

            function merge(rowIdx: number, colIdx: number, exerciseSets: Set[]) {
                var headline = self.getHeadline(exerciseSets);
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
                        tableRows[rowIdx].push({ weight: 0, reps: 0 }); // create cells as necessary

                    // merge() - if more than 1 occurence for the same week
                    //           then show multiple values
                    merge(rowIdx, colIdx, exercise.sets)
                }
            });

            // Make sure that every row contains the same
            // number of columns (this needs to be done 
            // before reversing, otherwise the numbers
            // won't line up properly)
            tableRows.forEach(function (row) {
                while (row.length < columnHeadings.length) {
                    //row.push({ value: "", tooltip: "" }); // create cells as necessary
                    row.push({ weight: 0, reps: 0 }); // create cells as necessary
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