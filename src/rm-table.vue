<style>
    .rmtable {
        border-collapse: collapse;
        color: #666;
        /* font-family: verdana; */
        font-size: 12px;
    }
    .rmtable th {
        background-color: darkgray;
        color: white;
    }
    .rmtable td,
    .rmtable th {
        padding: 3px 8px 3px 15px;
        border: solid 1px darkgray;
    }
    .rmtable td {
        text-align: right;
    }
</style>

<template>
    Calculate weight/% from one rep max
    <div style="font-style: italic; font-size: 87%; color: silver">How much weight am I capable of lifting?</div>
    <table border="1" class="rmtable">
        <tr>
            <th>Reps</th>
            <th>Weight</th>
            <th style="min-width: 53px">Percent</th>
        </tr>
        <tr v-for="(row, idx) in tableRows"
            v-bind:class="row.reps >= guideParts.guideLowReps && row.reps <= guideParts.guideHighReps ? 'weekreps' + row.reps : ''">
            <td>{{ row.reps }}</td>
            <td>
                <template v-if="idx == 0">
                    One rep max:<br />
                    <input v-model="globalState.calc1RM" size="4" style="text-align: right" />
                </template>
                <template v-else>
                    {{ row.weight.toFixed(1) }}
                </template>
            </td>
            <td>{{ row.percentage.toFixed(1) }}%</td>
        </tr>
    </table>
</template>

<script lang="ts">
import { _calculateOneRepMax, _oneRmToRepsWeight } from './supportFunctions'
import { RmTableRow } from './types/app'
import { defineComponent, computed, toRef } from "vue"
import { globalState } from "./globalState";
import { _useGuideParts } from './guide';

export default defineComponent({
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String
    },
    setup(props) {

        // Alternative (Vue 3.3+): //     toRef(() => props.guideType);
        const guideParts = _useGuideParts(toRef(props, "guideType"));

        const tableRows = computed(() => {
            let replist = [1]; // first row = 1 rep (for <input> to enter 1RM)
            if (guideParts.value.guideLowReps != 0) {
                for (let i = guideParts.value.guideLowReps - 2; i <= guideParts.value.guideHighReps + 2; i++) {
                    replist.push(i); // e.g. [12,13,14]
                }
            } else if (globalState.calc1RM > 0) {
                replist = [1,10,11,12,13,14,15]; // e.g. for "Deload" guide
            }
            var rows = [] as RmTableRow[];
            //for (var reps = 1; reps <= 15; reps++) {
            for (let reps of replist) {
                let weight = _oneRmToRepsWeight(globalState.calc1RM, reps, props.oneRmFormula);
                if (weight != -1) {
                    rows.push({
                        reps: reps,
                        weight: weight,
                        percentage: !globalState.calc1RM ? 0 : ((weight * 100) / globalState.calc1RM)
                    });
                }
            }
            return rows;
        });

        return { tableRows, guideParts, globalState };
    }
});
</script>