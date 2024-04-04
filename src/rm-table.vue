<template>
    <table border="1" class="rmtable">
        <tr>
            <th>Reps</th>
            <th>Weight</th>
            <th style="min-width: 53px">Percent</th>
        </tr>
        <tr v-for="(row, idx) in rows"
        v-bind:class="{ 'intensity60': guideType == '12-15' && row.reps >= 12 && row.reps <= 15,
                        'intensity70': guideType == '8-10'  && row.reps >= 8  && row.reps <= 10,
                        'intensity80': guideType == '5-7'   && row.reps >= 5  && row.reps <= 7 }">
            <td>{{ row.reps }}</td>
            <td>
                <template v-if="idx == 0">
                    <input v-model="oneRM" size="4" style="text-align: right" />
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

export default defineComponent({
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String
    },
    setup(props) {

        const oneRM = ref(0);

        const rows = computed(() => {
            var rows = [] as RmTableRow[];
            for (var reps = 1; reps <= 15; reps++) {
                let weight = _oneRmToRepsWeight(oneRM.value, reps, props.oneRmFormula);
                if (weight != -1) {
                    rows.push({
                        reps: reps,
                        weight: weight,
                        percentage: !oneRM.value ? 0 : ((weight * 100) / oneRM.value)
                    });
                }
            }
            return rows;
        });

        return { rows, oneRM };
    }
});
</script>