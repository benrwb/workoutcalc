<template>
    Calculate one rep max from weight
    <table border="1" class="rmtable">
        <tr>
            <th>Reps</th>
            <th>Weight<br />
                <input size="4" style="text-align: right" v-model="globalState.calcWeight" />

            </th>
            <th>1RM</th>
        </tr>
        <tr v-for="(row, idx) in tableRows">
            <td>{{ row.reps }}</td>
            <td>{{ globalState.calcWeight }}</td>
            <td>{{ row.oneRM.toFixed(1) }}</td>
        </tr>
    </table>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { _calculateOneRepMax } from './supportFunctions'
import { _useGuideParts } from './guide'
import { globalState } from "./globalState";

export default defineComponent({
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String
    },
    setup(props) {

        const guideParts = _useGuideParts(props);

        const tableRows = computed(function() {
            let replist = [];
            for (let i = guideParts.value.guideLowReps; i <= guideParts.value.guideHighReps; i++) {
                replist.push(i); // e.g. [12,13,14]
            }
            return replist.map(function(reps) {
                return {
                    reps: reps,
                    oneRM: _calculateOneRepMax(globalState.calcWeight, reps, props.oneRmFormula)
                };
            });
        });
        
        return { tableRows, globalState };
    }
});
</script>