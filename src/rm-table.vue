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
    <table border="1" class="rmtable">
        <tr>
            <th>Reps</th>
            <th>Weight</th>
            <th style="min-width: 53px">Percent</th>
        </tr>
        <tr v-for="(row, idx) in tableRows"
            v-bind:class="row.reps >= guideParts[0] && row.reps <= guideParts[1] ? 'weekreps' + row.reps : ''">
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
import { defineComponent, computed, ref } from "vue"
import { globalState } from "./globalState";

export default defineComponent({
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String
    },
    setup(props) {

        const tableRows = computed(() => {
            var rows = [] as RmTableRow[];
            for (var reps = 1; reps <= 15; reps++) {
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
        
        const guideParts = computed(() => {
            // returns [guideLowReps,guideHighReps]
            // e.g. "12-14" --> [12,14]
            if (props.guideType && props.guideType.includes('-')) {
                let parts = props.guideType.split('-');
                if (parts.length == 2) {
                    return parts.map(z => Number(z));
                }
            }
            return [0,0];
        });

        return { tableRows, guideParts, globalState };
    }
});
</script>