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

export default defineComponent({
    props: {
        oneRmFormula: { type: String, required: true }
    },
    setup(props) {
        const weight = ref(0);

        const rows = computed(function() {
            return [12, 13, 14].map(function(reps) {
                // TODO add support for other rep ranges
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