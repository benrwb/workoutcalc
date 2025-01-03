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
    }
</style>

<template>
    <div class="prev-container">
        <h3 style="color: #ccc">{{ currentExerciseName }}</h3>
        <table border="1" class="prev-table">
            <tr>
                <th colspan="4">Previous workouts</th>
            </tr>
            <tr>
                <th>Date</th>
                <th>Load</th>
                <th>Reps</th>
                <th>Volume</th>
            </tr>
            <tr v-for="row in table"
                v-on:mousemove="showTooltip(row.idx, $event)" v-on:mouseout="hideTooltip"
                v-bind:class="row.isDeload ? 'deload' : ''">
                <td>{{ row.date }}</td>
                <td>{{ row.load }}</td>
                <td>
                    <span v-for="(rep, idx) in row.reps"
                        v-bind:style="{ color: rep.isMaxWeight ? 'black' : 'silver' }"
                        >{{ rep.reps }}{{ idx != row.reps.length - 1 ? ', ' : ''}}</span>
                </td>
                <td>{{ row.volume.toLocaleString() }}</td>
            </tr>
        </table>
        <div style="color: #bbb">
            Gray background = Deload week
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
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
                    date: _formatDate(exercise.date, "MM/DD"), // 0 - numberDone,
                    load: maxWeight,
                    reps: workSets.map(z => ({ reps: z.reps, isMaxWeight: z.weight == maxWeight })),
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

        return { table, showTooltip, hideTooltip };
    }
})
</script>