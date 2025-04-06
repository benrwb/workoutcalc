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
        background-color: green;
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
</style>

<template>
    <div class="prev-container">
        
        <h3 style="color: #ccc">{{ currentExerciseName }}</h3>

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
                    <th>Date</th>
                    <th>Load</th>
                    <th>Reps</th>
                    <th>Volume</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in table"
                    v-on:mousemove="showTooltip(row.idx, $event)" v-on:mouseout="hideTooltip"
                    v-bind:class="row.isDeload ? 'deload' : ''">
                    <td>{{ row.date }}<span class="ordinal">{{ row.ordinal }}</span></td>
                    <td>{{ row.load }}</td>
                    <td>
                        <span v-for="(rep, idx) in row.reps"
                              v-bind:class="[
                                  colourRir && rep.rir != null && 'rir',
                                  colourRir && 'rir' + rep.rir + (colourRirBW ? 'bw' : ''),
                                  rep.isMaxWeight ? null : 'not-max'
                              ]"
                            >{{ rep.reps }}{{ idx != row.reps.length - 1 && (!colourRir || rep.rir == null) ? ', ' : ''}}</span>
                    </td>
                    <td>{{ row.volume.toLocaleString() }}</td>
                </tr>
            </tbody>
        </table>

        <pre style="color: #bbb">
<!-- Gray background = Deload week -->
<!-- POSSIBLE TODO: highlight rows in gray which have only 2 work sets (instead of the usual 3) -->
Deloads:
* Every 4 weeks
* Lowest reps in range x 2 sets

Example 1 (compound):
Week 1: 100 x 6 (3 sets)
Week 2: 101 x 5 (3 sets)
Week 3: 102 x 4 (3 sets)
Week 4: 100 x 4 (2 sets, deload)
Week 5: 101 x 6 (3 sets)

Example 2 (isolation):
Week 1: 10 x 12,12,12
Week 2: 10 x 13,13,13
Week 2: 10 x 14,13,14
Week 3: 10 x 14,14,14
Week 4: 10 x 12,12 (deload)
Week 5: 10 x 15,14,14
        </pre>


    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { PrevTableRow, RecentWorkout } from "./types/app";
import { _calculateTotalVolume, _volumeForSet, _formatDate } from "./supportFunctions";

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
                if (numberDone++ > 10) return;

                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
                let maxWeight = workSets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight

                data.push({
                    idx: exerciseIdx, // needed for displaying tooltip
                    date: _formatDate(exercise.date, "MMM D"),
                    ordinal: _formatDate(exercise.date, "Do").replace(/\d+/g, ''), // remove digits from string, e.g. change "21st" to "st"
                    load: maxWeight,
                    reps: workSets.map(z => ({ 
                        reps: z.reps, 
                        isMaxWeight: z.weight == maxWeight, 
                        rir: z.rir })),
                    volume: volume,
                    isDeload: exercise.guideType == 'Deload'
                })
            });
            return data;
        });

        function showTooltip(recentWorkoutIdx: number, e: MouseEvent) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }

        function hideTooltip() {
            context.emit("hide-tooltip");
        }

        const colourRir = ref(false);
        const colourRirBW = ref(true);

        return { table, showTooltip, hideTooltip, colourRir, colourRirBW };
    }
})
</script>