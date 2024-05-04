<template>

Filter:
<label title="Current exercises only"><input type="radio" v-model="filter" value="current" />Current ex. only</label>
<label title="Same weekday"          ><input type="radio" v-model="filter" value="weekday" />Same wkday</label>
<label title="Week total"            ><input type="radio" v-model="filter" value="all"     />All</label>
<br />
Show:
<label><input type="radio" v-model="whatToShow" value="volume" />Volume</label>
<label><input type="radio" v-model="whatToShow" value="numex"  />No. exercises</label>

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
        <td v-for="col in row">
            {{ col.volume > 0 ? col.volume.toLocaleString() : "" }}
        </td>
    </tr>
</table>

</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { RecentWorkout, VolumeTableCell, Exercise } from './types/app'
import { _calculateTotalVolume } from './supportFunctions';
import * as moment from "moment";

export default defineComponent({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentWorkout: Array as PropType<Exercise[]>
    },
    setup(props) {

        const filter = ref("current");
        const whatToShow = ref("volume");

        const currentExeciseNames = computed(
            () => props.currentWorkout.map(z => z.name)
        );

        const currentWeekday = moment().weekday();

        const table = computed(() => {
            var columnHeadings = [] as string[];
            var tableRows = [] as VolumeTableCell[][];

            function merge(rowIdx: number, colIdx: number, exerciseIdx: number) {
                var headline = (whatToShow.value == "volume") 
                    ? _calculateTotalVolume(props.recentWorkouts[exerciseIdx])
                    : 1; // count number of exercises
                if (!tableRows[rowIdx][colIdx]) {
                    // create new cell
                    tableRows[rowIdx][colIdx] = { volume: headline };
                } else {
                    // add volume to existing cell
                    tableRows[rowIdx][colIdx].volume += headline;
                }
            }

            function emptyCell(): VolumeTableCell { return { volume: 0 } }

            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (filter.value == "current" && !currentExeciseNames.value.includes(exercise.name)) return;
                if (filter.value == "weekday" && moment(exercise.date).weekday() != currentWeekday) return;
                //if (exercise.name != self.currentExerciseName) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned

                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
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
        });

        return { table, filter, whatToShow };
    }
});
</script>