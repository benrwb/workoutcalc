<style>
    .higher-1rm {
        background-color: #dff8ec;
        font-weight: bold;
    }
</style>
<template>
    Calculate one rep max from weight
    <!-- ================================= -->
    <!--      REPLACED BY rm-calc-2d       -->
    <!-- ================================= -->
    <div style="font-style: italic; font-size: 87%; color: silver">How can I beat my 1RM score?</div>
    <table border="1" class="rmtable">
        <thead>
            <tr>
                <th>Reps</th>
                <th>Weight<br />
                    <input size="4" style="text-align: right" v-model="globalState.calcWeight" />
                </th>
                <th>1RM</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, idx) in tableRows"
                v-bind:class="{ 'higher-1rm': row.oneRM > globalState.calc1RM }">
                <td>{{ row.reps }}</td>
                <td>{{ globalState.calcWeight }}</td>
                <td>{{ row.oneRM.toFixed(1) }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts">
import { defineComponent, toRef, computed } from 'vue';
import { _calculateOneRepMax } from './supportFunctions'
import { _useGuideParts } from './guide';
import { globalState } from "./globalState";

export default defineComponent({
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String
    },
    setup(props) {

        // Alternative (Vue 3.3+): //     toRef(() => props.guideType);
        const guideParts = _useGuideParts(toRef(props, "guideType"));

        const tableRows = computed(function() {
            let replist = [] as number[];
            if (globalState.calcWeight > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps -1; i <= guideParts.value.guideHighReps + 1; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            return replist.map(function(reps) {
                let oneRM = _calculateOneRepMax(globalState.calcWeight, reps, props.oneRmFormula);
                return {
                    reps: reps,
                    oneRM: oneRM < 0 ? 0 : oneRM // change negative values (error codes) to zero.
                };
            });
        });
        
        return { tableRows, globalState };
    }
});
</script>