<template>
    Calculate one rep max from weight
    <table border="1" class="rmtable">
        <tr>
            <th>Reps</th>
            <th>Weight<br />
                <input size="4" style="text-align: right" v-model="weight" />

            </th>
            <th>1RM</th>
        </tr>
        <tr v-for="(row, idx) in rows">
            <td>{{ row.reps }}</td>
            <td>{{ weight }}</td>
            <td>{{ row.oneRM.toFixed(1) }}</td>
        </tr>
    </table>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { _calculateOneRepMax } from './supportFunctions'
import { _useGuideParts } from './guide'

export default defineComponent({
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String
    },
    setup(props) {
        const weight = ref(0);

        const guideParts = _useGuideParts(props);

        const rows = computed(function() {
            let replist = [];
            for (let i = guideParts.value.guideLowReps; i <= guideParts.value.guideHighReps; i++) {
                replist.push(i); // e.g. [12,13,14]
            }
            return replist.map(function(reps) {
                return {
                    reps: reps,
                    oneRM: _calculateOneRepMax(weight.value, reps, props.oneRmFormula)
                };
            });
        });
        
        return { weight, rows };
    }
});
</script>