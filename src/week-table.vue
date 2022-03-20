<template>
<div>

<table border="1" class="weektable">
    <tr v-for="(row, rowIdx) in table">
    <template v-if="rowIdx == 0">
        <!-- Table heading -->
        <td></td>
        <td v-for="heading in row"
            style="width: 40px">
            {{ heading }}
        </td>
    </template>
    <template v-else>
        <!-- Table body -->
        <td>{{ rowIdx }}</td>
        <td v-for="col in row">
            {{ col }}
        </td>
    </template>
    </tr>
</table>

</div>
</template>

<script lang="ts">
import Vue, { PropType } from './types/vue'
import { RecentWorkout, Set } from './types/app'

export default Vue.extend({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String
    },
    methods: {
        getHeadlineWeight: function (allSets: Set[]) {

            // POSSIBLE FUTURE TODO: Use getHeadline/getHeadlineFromGuide functions
            //                       from <recent-workouts-panel> instead.
            
            // Only look at sets where the number of reps is *at least* 6
            var matchingSets = allSets.filter(set => set.reps >= 6);
            
            // Then look at the set(s) with the highest weight
            var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array

            return maxWeight;
        }
    },
    computed: {
        table: function () {
            var columnHeadings = [] as string[];
            var tableRows = [] as string[][];

            var self = this;
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != self.currentExerciseName) return;
                if (exerciseIdx > 100) return; // don't go back too far

                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) {
                        columnHeadings.push(exercise.blockStart);
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = exercise.weekNumber - 1; // e.g. week 1 is [0]

                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length < colIdx)
                        tableRows[rowIdx].push(""); // create cells as necessary

                    // POSSIBLE FUTURE TODO: if more than 1 occurence for the same week
                    //                       then show the highest value
                    tableRows[rowIdx][colIdx] = self.getHeadlineWeight(exercise.sets).toString();
                }
            });
            tableRows.unshift(columnHeadings); // add headings to top of table

            // POSSIBLE FUTURE TODO reverse the order of the columns
            //                      so that the earliest date is on the left
            return tableRows;
        }
    }
});
</script>