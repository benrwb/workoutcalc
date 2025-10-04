<template>

<div style="text-align: left">
    Filter:
    <label title="Current exercises only"><input type="radio" v-model="filter" value="current" />Current exs. only</label>
    <label title="Same weekday"          ><input type="radio" v-model="filter" value="weekday" />{{ currentWeekdayString }}s</label>
    <label title="Week total"            ><input type="radio" v-model="filter" value="all"     />All</label>
    <br />
    Show:
    <label><input type="radio" v-model="whatToShow" value="volume" />Volume</label>
    <label><input type="radio" v-model="whatToShow" value="numex"  />Exercises</label>
    <label><input type="radio" v-model="whatToShow" value="numsets"/>Sets</label>
    <label><input type="radio" v-model="whatToShow" value="rest"   />Rest</label>
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
            <td v-for="col in row">
                {{ col.values.length == 0  
                    ? "" 
                    : Math.round(arrayAverage(col.values)).toLocaleString() 
                }}
            </td>
        </tr>
    </tbody>
</table>

</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { RecentWorkout, VolumeTableCell, Exercise } from './types/app'
import { _calculateTotalVolume, _arrayAverage, _getWeekNumber } from './supportFunctions';
import * as moment from "moment";

export default defineComponent({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentWorkout: Array as PropType<Exercise[]>,
        workoutDate: String
    },
    setup(props) {

        const filter = ref("weekday");
        const whatToShow = ref("volume");

        const currentExeciseNames = computed(() => props.currentWorkout.map(z => z.name));
        const currentWeekday = computed(() => moment(props.workoutDate).weekday()); // returns NaN for invalid dates
        const currentWeekdayString = computed(() => moment(props.workoutDate).format("dddd")); // returns "Invalid date" for invalid dates
        
        const table = computed(() => {
            var columnHeadings = [] as string[];
            var tableRows = [] as VolumeTableCell[][];

            function merge(rowIdx: number, colIdx: number, exercise: RecentWorkout) {
                let tableCell = tableRows[rowIdx][colIdx];
                function addToCell(value: number) {
                    if (tableCell.values.length == 0) tableCell.values.push(value); else tableCell.values[0] += value 
                }
                if (whatToShow.value == "volume") 
                    addToCell(_calculateTotalVolume(exercise));
                else if (whatToShow.value == "numex")
                    addToCell(1); // count number of exercises
                else if (whatToShow.value == "numsets")
                    addToCell(exercise.sets.length); // count number of sets
                    // possible future todo: filter to only include work sets:
                    // // headline = exercise.sets.filter(z=>z.type == "WK").length; // number of work sets
                else if (whatToShow.value == "rest")
                    exercise.sets.forEach((set, setIdx) => {
                        if (setIdx == 0) return; // 1st set rest time is always zero
                        tableCell.values.push(set.gap); // these will be averaged
                    });
            }

            function emptyCell(): VolumeTableCell { return { values: [] } } // values will be averaged

            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (filter.value == "current" && !currentExeciseNames.value.includes(exercise.name)) return;
                if (filter.value == "weekday" && moment(exercise.date).weekday() != currentWeekday.value) return;
                //if (exercise.name != self.currentExerciseName) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned

                let { weekNumber } = _getWeekNumber(exercise.blockStart, exercise.date);
                if (weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = weekNumber - 1; // e.g. week 1 is [0]

                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length <= colIdx)
                        //tableRows[rowIdx].push({ value: "", tooltip: "" }); // create cells as necessary
                        tableRows[rowIdx].push(emptyCell()); // create cells as necessary

                    // merge() - if more than 1 occurence for the same week
                    //           then show multiple values
                    merge(rowIdx, colIdx, props.recentWorkouts[exerciseIdx])
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


        return { table, filter, whatToShow, currentWeekdayString, currentWeekday,
            arrayAverage: _arrayAverage // remove underscore to avoid vue warning
         };
    }
});
</script>