<style>
    .lbstokg-table  {
        border-collapse: collapse;
        font-size: 14px;
    }
    .lbstokg-table th {
        background-color: darkgray;
        color: white;
        padding: 2px 0;
    }
    .lbstokg-table td {
        padding: 3px 8px 3px 15px;
        border: solid 1px darkgray;
        min-width: 20px;
    }
    .lbstokg-table td {
        text-align: right;
    }

    tr.lbstokg-highlight { 
        background-color: yellow;
    }
    td.lbstokg-highlight {
        background-color: gold;
    }
</style>

<template>
    Convert lbs to kg<br />

    Increment
    <label>
        <input type="radio" :value="10" v-model="increment">10 lbs
    </label>
    <label>
        <input type="radio" :value="15" v-model="increment">15 lbs
    </label>
    <label>
        <input type="radio" value="combo" v-model="increment">10/15
    </label>

    <table class="lbstokg-table">
        <thead>
            <tr>
                <th rowspan="2">lbs</th>
                <th rowspan="2">kg</th>
                <th colspan="4">Add lbs</th>
            </tr>
            <tr>
                <th>+2.5</th>
                <th>+5.0</th>
                <th>+7.5</th>
                <template v-if="increment == 15">
                    <th>+10</th>
                </template>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in rows"
                :class="{ 'lbstokg-highlight': row.highlight }">
                <td>{{ row.weightLbs }}</td>
                <td v-for="(kgWeight, idx) in row.kgWeights"
                    :style="{ 'font-weight': idx == 0 ? 'bold' : null }"
                    :class="{ 'lbstokg-highlight': kgWeight == globalState.calcWeight }">
                    {{ kgWeight }}
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts">

import { defineComponent, ref, computed, watch, Ref } from 'vue';
import { globalState } from "./globalState";
import { MACHINE_LOOKUP } from "./gym";
import { IncrementType } from './types/app';

export default defineComponent({
    props: {
        currentExerciseName: String
    },
    setup(props) {
        const increment = ref(15) as Ref<IncrementType>;
		
        watch(() => props.currentExerciseName, newName => {
            const stackType = MACHINE_LOOKUP[newName];
            if (stackType == "step15")
                increment.value = 15;
            else if (stackType == "step10")
                increment.value = 10;
            else if (stackType === "scombo")
                increment.value = 'combo';
        });

        function lbsToKg(lbs: number) {
            return Math.round(lbs * 0.453592);
        }

        const rows = computed(() => {
            let output = [];
            let currentWeight = 10; // start at 10lbs
			
            for (let i = 0; i < 15; i++) {
				// Determine step size for current row
                let step = (increment.value === 'combo')
                    ? (currentWeight < 100 ? 10 : 15)
                    : increment.value;
					
                let kgWeights = [
                    lbsToKg(currentWeight),
                    lbsToKg(currentWeight + 2.5),
                    lbsToKg(currentWeight + 5),
                    lbsToKg(currentWeight + 7.5)
                ];
				
				// If step is 15, include the +10 column
                if (increment.value == 15)
                    kgWeights.push(lbsToKg(currentWeight + 10));
            
                let thisKgWeight = lbsToKg(currentWeight); // for highlight
                let nextKgWeight = lbsToKg(currentWeight + step); // for highlight
				
                output.push({
                    weightLbs: currentWeight,
                    kgWeights,
                    highlight: globalState.calcWeight >= thisKgWeight && globalState.calcWeight < nextKgWeight
                });
				
                // Advance weight sequence by step
                currentWeight += step;
            }
			
            return output;
        });

        return { rows, increment, globalState };
    }
});
</script>