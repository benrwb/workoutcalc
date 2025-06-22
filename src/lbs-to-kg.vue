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
        <input type="radio" :value="10" v-model="increment"> 
        10 lbs
    </label>
    <label>
        <input type="radio" :value="15" v-model="increment">
        15 lbs
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

import { defineComponent, ref, computed } from 'vue';
import { globalState } from "./globalState";

export default defineComponent({
    setup() {
        const increment = ref(15);

        function lbsToKg(lbs: number) {
            return Math.round(lbs * 0.453592);
        }

        const rows = computed(() => {
            let output = [];
            let startingWeight = 10; // start at 10lbs
            for (let i = 0; i < 10; i++) {
                let baseWeight = startingWeight + (i * increment.value);
                let kgWeights = [
                    lbsToKg(baseWeight),
                    lbsToKg(baseWeight + 2.5),
                    lbsToKg(baseWeight + 5),
                    lbsToKg(baseWeight + 7.5)
                ];
                if (increment.value == 15)
                    kgWeights.push(lbsToKg(baseWeight + 10));
            
                let thisKgWeight = lbsToKg(baseWeight); // for highlight
                let nextKgWeight = lbsToKg(baseWeight + increment.value); // for highlight
                output.push({
                    weightLbs: baseWeight,
                    kgWeights,
                    highlight: globalState.calcWeight >= thisKgWeight && globalState.calcWeight < nextKgWeight
                });
            }
            return output;
        });

        return { rows, increment, globalState };
    }
});
</script>