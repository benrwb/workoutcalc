<style>
    .prev-container {
        font-size: smaller;
    }
    .prev-table {
        border-collapse: collapse;
        margin-right: 20px;
    }
    .prev-table th,
    .prev-table td {
        padding: 3px 0;
        border: ridge 2px #ddd;
    }
    .prev-table th {
        background-color: #D2DBEE;
    }
    .prev-table td {
        text-align: center;
        min-width: 70px;
    }
    .prev-table tr.deload {
        background-color: #eee;
        font-style: italic;
        color: gray;
    }
    .prev-table tr:hover td {
        background-color: #fe9;
        /* color: black; */
    }
    .prev-table span.not-max {
        color: silver;
        font-style: italic;
    }
    .prev-table span.ordinal {
        font-size: 67%; 
        color: gray; 
        vertical-align: top; 
        padding-left: 1px;
    }
    .prev-table span.days {
        color: silver;
        font-size: 70%; 
    }

    span.rir {
        display: inline-block;
        min-width: 21px;
    }
    .rir-1 {
        background-color: firebrick;
        color: white;
        text-decoration: line-through;
    }
    .rir0 {
        background-color: red;
    }
    .rir1 {
        background-color: orange;
    }
    .rir2 {
        background-color: yellow;
    }
    .rir3 {
        background-color: yellowgreen;
    }
    .rir4,
    .rir5 {
        background-color: green; /* possibly change to skyblue */
    }

    /* .rir-1bw {
        background-color: firebrick;
        color: white;
        text-decoration: line-through;
    }
    .rir0bw {
        background-color: red;
        color: #fc0;
    }
    .rir1bw {
        background-color: orange;
    }
    .rir2bw {
        background-color: #fe9;
    }
    .rir3bw {
        background-color: #afe;
    }
    .rir4bw,
    .rir5bw {
        background-color: lightcyan;
        color: darkgray;
    } */

    .rir-1bw {
        background-color: #a20;
        color: white;
    }
    .rir0bw {
        background-color: #f60;
    }
    .rir1bw {
        background-color: #fa0;
    }
    .rir2bw {
        background-color: #fca;
    }
    .rir3bw {
        background-color: #fec;
    }
    .rir4bw,
    .rir5bw {
        background-color: #fff;
    }

    .days-since {
        margin-bottom: 13px;
        font-weight: bold;
        width: fit-content; /* alternative to display: inline-block */
        padding: 0 3px;
    }
    .days-since-orange {
        color: darkgoldenrod;
    }
    .days-since-red {
        background-color: crimson;
        color: white;
    }
</style>

<template>
    <div class="prev-container">
        
        <h3 style="color: #aaa">{{ currentExerciseName }}</h3>

        <div v-if="daysSinceLastWorked > 8"
             class="days-since"
            :class="daysSinceLastWorked > 16 ? 'days-since-red' : 'days-since-orange'">
            <!-- see also presets.ts / extractGoalFromPreviousComment(), 
                 where goals are discarded after 16 days -->
            {{ daysSinceLastWorked }} days since last worked
        </div>

        <label>
            <input type="checkbox" v-model="colourRir"> Colour RIR
        </label>
        <label v-if="colourRir">
            <input type="checkbox" v-model="colourRirBW"> B&amp;W
        </label>

        <table border="1" class="prev-table">
            <thead>
                <tr>
                    <th colspan="4">Previous workouts</th>
                </tr>
                <tr>
                    <th @click="dateDisplayType++">Date</th>
                    <th>Load</th>
                    <th>Reps</th>
                    <th>Volume</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in table"
                    v-on:mousemove="showTooltip(row.idx, $event)" v-on:mouseout="hideTooltip"
                    v-bind:class="row.isDeload ? 'deload' : ''">
                    <td :style="row.borderStyle">
                        <template v-if="dateDisplayType % 3 == 0">
                            {{ row.date }}<span class="ordinal">{{ row.ordinal }}</span>
                        </template>
                        <template v-else-if="dateDisplayType % 3 == 1">
                            {{ row.weeksRounded }}w <span class="days">{{ row.daysOffset }}d</span>
                        </template>
                        <template v-else-if="dateDisplayType % 3 == 2">
                            {{ row.daysSinceLastWorked }}
                        </template>
                    </td>
                    <td :style="row.borderStyle">{{ row.load }}</td>
                    <td :style="row.borderStyle">
                        <span v-for="(rep, idx) in row.reps"
                            v-bind:class="[
                                colourRir && rep.rir != null && 'rir',
                                colourRir && 'rir' + rep.rir + (colourRirBW ? 'bw' : ''),
                                rep.isMaxWeight ? null : 'not-max'
                            ]"
                            >{{ rep.reps }}{{ idx != row.reps.length - 1 && (!colourRir || rep.rir == null) ? ', ' : ''}}</span>
                    </td>
                    <td :style="row.borderStyle">{{ row.volume.toLocaleString() }}</td>
                </tr>
            </tbody>
        </table>
        <pre style="color: #bbb">
<!-- Gray background = Deload week -->
<!-- POSSIBLE TODO: highlight rows in gray which have only 2 work sets (instead of the usual 3) -->
Deloads:
* Every 4 weeks
* Lowest reps in range x 2 sets

Example 1 (wave loading):
Week 1: 100 x 6 (3 sets)
Week 2: 105 x 5 (3 sets)
Week 3: 110 x 4 (3 sets)
Week 4: 100 x 4 (2 sets, deload)
Week 5: 105 x 6 (3 sets)

Example 2 (double progression):
Week 1: 18 x 12,12,12
Week 2: 18 x 13,13,13
Week 2: 18 x 14,13,14
Week 3: 18 x 14,14,14
Week 4: 18 x 12,12 (deload)
Week 5: 18 x 15,14,14
        </pre>


    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { PrevTableRow, RecentWorkout } from "./types/app";
import { _calculateTotalVolume, _volumeForSet, _formatDate } from "./supportFunctions";
import * as moment from "moment";

export default defineComponent({
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String
    },
    setup: function(props, context) {

        const table = computed(() => {
            let numberDone = 0;
            let data = [] as PrevTableRow[];
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != props.currentExerciseName) return;
                if (numberDone++ > 11) return;
                // ^^^ Note: This is one extra than the number of items that will be shown.
                //           The extra one is used to calculate "days since last worked" (gap)
                //           for the last-but-one item. The last item is then removed using `.pop()`.

                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
                let maxWeight = workSets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight

                // Relative date:
                // * This is rounded so that for example "9w 6d ago"
                //   will be converted to "10w -1d" (i.e. "one day shy of 10 weeks")
                // * This is to account for workouts sometimes being done on different days,
                //   e.g. a Tuesday workout might occasionally be done on a Wednesday.
                // -------------------------------------------
                //    Without rounding     With rounding
                //         8w 0d                8w 0d
                //         9w 0d                9w 0d
                //         9w 6d               10w -1d
                //        11w 0d               11w 0d
                //    (it looks like       (there's an entry
                //     wk10 is missing)     for every week)
                // -------------------------------------------
                const daysAgo = moment().diff(exercise.date, 'days'); // example: 9 weeks and 6 days
                const weeksRounded = Math.round(daysAgo / 7); // rounds to 10 weeks
                const daysOffset = daysAgo - (weeksRounded * 7); // 69 - (10 * 7) = -1

                data.push({
                    idx: exerciseIdx, // needed for displaying tooltip
                    date: _formatDate(exercise.date, "MMM D"),
                    ordinal: _formatDate(exercise.date, "Do").replace(/\d+/g, ''), // remove digits from string, e.g. change "21st" to "st"
                    weeksRounded: weeksRounded,
                    daysOffset: daysOffset,
                    daysSinceLastWorked: null, // set below
                    borderStyle: {}, // set below
                    load: maxWeight,
                    reps: workSets.map(z => ({ 
                        reps: z.reps, 
                        isMaxWeight: z.weight == maxWeight, 
                        rir: z.rir })),
                    volume: volume,
                    isDeload: exercise.guideType == 'Deload' || workSets.length == 2 || exercise.etag == "DL"
                })
            });

            // BEGIN add `daysSinceLastWorked` (gap) and `borderStyle`.
            // (this is done outside the main loop above
            //  because the list needs to be traversed in *reverse* order)
            let prevDate = "";
            for (let i = data.length - 1; i >= 0; i--) {
                if (prevDate) {
                    let date1 = moment(data[i].date).startOf("day");
                    let date2 = moment(prevDate).startOf("day");
                    data[i].daysSinceLastWorked = date1.diff(date2, "days");
                    data[i].borderStyle = { 'border-bottom-width': Math.round(data[i].daysSinceLastWorked / 3.5) + 'px' };
                }
                prevDate = data[i].date;
            }
            // END gap

            if (data.length > 10)
                data.pop(); // remove extra item (see `numberDone` note above)

            return data;
        });

        function showTooltip(recentWorkoutIdx: number, e: MouseEvent) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }

        function hideTooltip() {
            context.emit("hide-tooltip");
        }

        const colourRir = ref(false);
        const colourRirBW = ref(false);
        const dateDisplayType = ref(0);


        const daysSinceLastWorked = computed(() => {
            if (table.value.length == 0)
                return 0;
            let firstRow = table.value[0];
            let exercise = props.recentWorkouts[firstRow.idx];
            let date1 = moment().startOf("day"); // today's date
            let date2 = moment(exercise.date).startOf("day");
            return date1.diff(date2, "days");
        });

        return { table, showTooltip, hideTooltip, colourRir, colourRirBW, 
            dateDisplayType, daysSinceLastWorked
         };
    }
})
</script>