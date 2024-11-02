<style>
    .ri-key-box {
        padding: 0 5px;
        font-size: smaller;
    }
</style>

<template>
<b>Relative intensity</b><br />
1RM
<input type="text" v-model="globalState.calc1RM" size="4"/>
Weight
<input type="text" v-model.number="globalState.calcWeight" size="4" />

<table border="1">
    <thead>
        <tr>
            <th>Reps</th>
            <th>{{ evenLower }}</th>
            <th>{{ lowerWeight }}</th>
            <th>{{ globalState.calcWeight }}</th>
            <th>{{ higherWeight }}</th>
            <th>{{ evenHigher }}</th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="row in table">
            <td>{{ row.reps }}</td>
            <td v-bind:style="{ 'background-color': colourCode(row.evenLower) }">{{ row.evenLower.toFixed(2) }}</td>
            <td v-bind:style="{ 'background-color': colourCode(row.lower) }">{{ row.lower.toFixed(2) }}</td>
            <td v-bind:style="{ 'background-color': colourCode(row.middle) }">{{ row.middle.toFixed(2) }}</td>
            <td v-bind:style="{ 'background-color': colourCode(row.higher) }">{{ row.higher.toFixed(2) }}</td>
            <td v-bind:style="{ 'background-color': colourCode(row.evenHigher) }">{{ row.evenHigher.toFixed(2) }}</td>
        </tr>
    </tbody>
</table>

<!-- <span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.65) }">TL</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.70) }">VL</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.75) }">LI</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.80) }">MOD</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.85) }">MOD+</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.90) }">HV</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.95) }">VH</span>
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(1.00) }">MAX</span> -->

<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.65) }" title="Too light" >TL</span> <span 
      class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.70) }" title="Very light">VL</span> <span 
      class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.75) }" title="Light"     >L</span> Deload
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.80) }" title="Moderate"  >MOD</span><br />
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.85) }" title="Moderate+" >MOD+</span> Majority<br />
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.90) }" title="Heavy"     >H</span> Occasional
<span class="ri-key-box" v-bind:style="{ 'background-color': colourCode(0.95) }" title="Very heavy">VH</span> <span 
      class="ri-key-box" v-bind:style="{ 'background-color': colourCode(1.00) }" title="Maximum"   >MAX</span>
<br />

<div style="border: solid 1px red; display: inline-block; color: red; margin-top: 10px; margin-bottom: 20px; padding: 3px 10px"
     title="AMRAPS (as many reps as possible)">
    TEST 1RM EVERY 4 WKS
</div>

</template>

<script lang="ts">
    import { defineComponent, ref, computed, watch } from 'vue';
    import { _calculateOneRepMax, _getIncrement } from './supportFunctions';
    import { globalState } from "./globalState";

    export default defineComponent({
        props: {
            oneRmFormula: { type: String, required: true },
            currentExerciseName: String
        },
        setup(props) {

            const lowerWeight = ref(0);
            const higherWeight = ref(0);
            const evenLower = ref(0);
            const evenHigher = ref(0);
            watch(() => globalState.calcWeight, () => {
                // _getIncrement: e.g. use 1 instead of 2.5 for "db" exercises
                lowerWeight.value = globalState.calcWeight - _getIncrement(props.currentExerciseName, globalState.calcWeight);
                higherWeight.value = globalState.calcWeight + _getIncrement(props.currentExerciseName, globalState.calcWeight);
                evenLower.value = globalState.calcWeight - (_getIncrement(props.currentExerciseName, globalState.calcWeight) * 2);
                evenHigher.value = globalState.calcWeight + (_getIncrement(props.currentExerciseName, globalState.calcWeight) * 2);
            });

            function calculateRelativeIntensity(workWeight: number, reps: number) {
                let percentageForReps = 100 / _calculateOneRepMax(100, reps, props.oneRmFormula);
                return workWeight / (globalState.calc1RM * percentageForReps);
            }

            const table = computed(() => {
                let rows = [];
                for (let reps = 6; reps <= 15; reps++) {
                    rows.push({
                        reps: reps,
                        evenLower: calculateRelativeIntensity(evenLower.value, reps),
                        lower: calculateRelativeIntensity(lowerWeight.value, reps),
                        middle: calculateRelativeIntensity(globalState.calcWeight, reps),
                        higher: calculateRelativeIntensity(higherWeight.value, reps),
                        evenHigher: calculateRelativeIntensity(evenHigher.value, reps)
                    })
                }
                return rows;
            })

            function colourCode(relativeIntensity: number) {
                if (relativeIntensity < 0.70) return "#D0CECE"; // Too light
                if (relativeIntensity < 0.75) return "#C6E0B4"; // Very light
                if (relativeIntensity < 0.80) return "#A9D08E"; // Light
                if (relativeIntensity < 0.85) return "#FFE699"; // Moderate
                if (relativeIntensity < 0.90) return "#FFD966"; // Moderate+
                if (relativeIntensity < 0.95) return "#F4B084"; // Heavy
                if (relativeIntensity < 1.00) return "#C65911"; // Very heavy
                if (relativeIntensity >= 1.00) return "#C00000"; // Max
                return "";
            }

            return { globalState, table, 
                lowerWeight, higherWeight, colourCode, evenLower, evenHigher
            };
        }
    });
</script>