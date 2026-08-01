<style>
    .clickable-1rm {
        cursor: pointer;
    }
    .lower-1rm {
        background-color: #dff8ec;
        font-weight: bold;
    }
    .selected-1rm {
        outline: solid 2px gray;
    }
    .rmtable .topleft-checkbox-cell {
        background-color: white;
        border-top-color: white;
        border-left-color: white;
        color: black;
        font-weight: normal;
        padding: 0px 5px 1px 0px;
    }
</style>
<template>
    Calculate one rep max from weight
    <div style="font-style: italic; font-size: 87%; color: silver">Compare 1RM for different weights/reps</div>

    <table border="1" class="rmtable">
        <thead>
            <tr>
                <th class="topleft-checkbox-cell">
                    <label><input type="checkbox" v-model="extendRange" /> Extend</label>
                </th>
                <th colspan="3">Weight</th>
            </tr>
            <tr>
                <th>Reps</th>
                <th style="padding: 0"><input size="4" style="text-align: center" v-model.number="lowerWeight" /></th>
                <th style="padding: 0"><input size="4" style="text-align: center" v-model.number="globalState.calcWeight" /></th>
                <th style="padding: 0"><input size="4" style="text-align: center" v-model.number="higherWeight" /></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, idx) in tableRows">
                <td>{{ row.reps }}</td>
                <td v-for="columnValue in [row.lo_RM, row.oneRM, row.hi_RM]"
                    class="clickable-1rm" 
                    :class="{ 'lower-1rm': columnValue <= globalState.calc1RM, 'selected-1rm': globalState.calc1RM == columnValue }" 
                    @click="globalState.calc1RM = columnValue"
                >{{ columnValue }}</td>
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
            lowerWeight.value = globalState.calcWeight - _getIncrement(props.currentExerciseName, globalState.calcWeight, { direction: 'down' });
            higherWeight.value = globalState.calcWeight + _getIncrement(props.currentExerciseName, globalState.calcWeight, { direction: 'up' });
        });


        function roundTo1dp(num: number) { 
            return Math.round(num * 10) / 10; 
        }

        const extendRange = ref(false);

        const tableRows = computed(function() {
            let replist = [] as number[];
            if (globalState.calcWeight > 0) {
                if (extendRange.value) {
                    for (let i = 1; i <= 25; i++) {
                        replist.push(i); // 1-25
                    }
                }
                else if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps - 3; i <= guideParts.value.guideHighReps + 3; i++) {
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
                    oneRM: oneRM < 0 ? 0 : roundTo1dp(oneRM), // change negative values (error codes) to zero.
                    lo_RM: roundTo1dp(lo_RM),
                    hi_RM: roundTo1dp(hi_RM)
                };
            });
        });
        
        return { tableRows, globalState, lowerWeight, higherWeight, extendRange };
    }
});
</script>