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
        background-color: red;
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

</style>

<template>
    <div class="prev-container">
        
        <h3 style="color: #ccc">{{ currentExerciseName }}</h3>

        <label>
            <input type="checkbox" v-model="colourRir"> Colour RIR
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
                                  colourRir && 'rir' + rep.rir,
                                  rep.isMaxWeight ? null : 'not-max'
                              ]"
                            >{{ rep.reps }}{{ idx != row.reps.length - 1 && (!colourRir || rep.rir == null) ? ', ' : ''}}</span>
                    </td>
                    <td>{{ row.volume.toLocaleString() }}</td>
                </tr>
            </tbody>
        </table>

        <div style="color: #bbb">Gray background = Deload week</div>

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

        return { table, showTooltip, hideTooltip, colourRir };
    }
})
</script>