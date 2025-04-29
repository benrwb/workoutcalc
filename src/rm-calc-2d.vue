<style>
    .higher-1rm {
        background-color: #dff8ec;
        font-weight: bold;
    }
</style>
<template>
    Calculate one rep max from weight
    <div style="font-style: italic; font-size: 87%; color: silver">How can I beat my 1RM score?</div>
    <table border="1" class="rmtable">
        <thead>
            <tr>
                <th style="background-color: white; border-top-color: white; border-left-color: white"></th>
                <th colspan="3">Weight</th>
            </tr>
            <tr>
                <th>Reps</th>
                <th style="padding: 0"><input size="4" style="text-align: right" v-model.number="lowerWeight" /></th>
                <th style="padding: 0"><input size="4" style="text-align: right" v-model.number="globalState.calcWeight" /></th>
                <th style="padding: 0"><input size="4" style="text-align: right" v-model.number="higherWeight" /></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, idx) in tableRows">
                <td>{{ row.reps }}</td>
                <td v-bind:class="{ 'higher-1rm': row.lo_RM > globalState.calc1RM }">{{ row.lo_RM.toFixed(1) }}</td>
                <td v-bind:class="{ 'higher-1rm': row.oneRM > globalState.calc1RM }">{{ row.oneRM.toFixed(1) }}</td>
                <td v-bind:class="{ 'higher-1rm': row.hi_RM > globalState.calc1RM }">{{ row.hi_RM.toFixed(1) }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts">
import { defineComponent, toRef, computed, ref, watch } from 'vue';
import { _calculateOneRepMax, _getIncrement } from './supportFunctions'
import { _useGuideParts } from './guide';
import { globalState } from "./globalState";

export default defineComponent({
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String,
        currentExerciseName: String
    },
    setup(props) {

        // Alternative (Vue 3.3+): //     toRef(() => props.guideType);
        const guideParts = _useGuideParts(toRef(props, "guideType"));

        const lowerWeight = ref(0);
        const higherWeight = ref(0);
        watch(() => globalState.calcWeight, () => {
            // _getIncrement: e.g. use 1 instead of 2.5 for "db" exercises
            lowerWeight.value = globalState.calcWeight - _getIncrement(props.currentExerciseName, globalState.calcWeight);
            higherWeight.value = globalState.calcWeight + _getIncrement(props.currentExerciseName, globalState.calcWeight);
        });


        const tableRows = computed(function() {
            let replist = [] as number[];
            if (globalState.calcWeight > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps -1; i <= guideParts.value.guideHighReps + 3; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            return replist.map(function(reps) {
                let oneRM = _calculateOneRepMax(globalState.calcWeight, reps, props.oneRmFormula);
                let lo_RM = _calculateOneRepMax(lowerWeight.value, reps, props.oneRmFormula);
                let hi_RM = _calculateOneRepMax(higherWeight.value, reps, props.oneRmFormula);
                return {
                    reps: reps,
                    oneRM: oneRM < 0 ? 0 : oneRM, // change negative values (error codes) to zero.
                    lo_RM: lo_RM,
                    hi_RM: hi_RM
                };
            });
        });
        
        return { tableRows, globalState, lowerWeight, higherWeight };
    }
});
</script>