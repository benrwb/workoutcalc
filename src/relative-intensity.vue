<style>
    .ri-key-box {
        padding: 0 5px;
        font-size: smaller;
    }
</style>

<template>
<b>Relative intensity</b>
<label class="verdana smallgray">
    <input type="radio" :value="false" v-model="show1RM" />%RI
</label>
<label class="verdana smallgray">
    <input type="radio" :value="true" v-model="show1RM" />1RM
</label>

<br />
1RM
<input type="text" v-model.number="globalState.calc1RM" size="4"/>
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
            <td v-bind:style="getStyle(row.evenLower.percentage) ">{{ outputValue(row.evenLower) }}</td>
            <td v-bind:style="getStyle(row.lower.percentage)     ">{{ outputValue(row.lower)     }}</td>
            <td v-bind:style="getStyle(row.middle.percentage)    ">{{ outputValue(row.middle)    }}</td>
            <td v-bind:style="getStyle(row.higher.percentage)    ">{{ outputValue(row.higher)    }}</td>
            <td v-bind:style="getStyle(row.evenHigher.percentage)">{{ outputValue(row.evenHigher)}}</td>
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



<label class="verdana smallgray"
       style="float: right; margin-right: 30px">
       <input type="checkbox"  v-model="blackAndWhite" />B&amp;W
</label>

<span class="ri-key-box" v-bind:style="getStyle(0.65)" title="65.0, 67.5% - Too light" >TL</span> <span 
      class="ri-key-box" v-bind:style="getStyle(0.70)" title="70.0, 72.5% - Very light">VL</span> <span 
      class="ri-key-box" v-bind:style="getStyle(0.75)" title="75.0, 77.5% - Light"     >L</span> Deload
<span class="ri-key-box" v-bind:style="getStyle(0.80)" title="80.0, 82.5% - Moderate"  >MOD</span><br />
<span class="ri-key-box" v-bind:style="getStyle(0.85)" title="85.0, 87.5% - Moderate+" >MOD+</span> Majority<br />
<span class="ri-key-box" v-bind:style="getStyle(0.90)" title="90.0, 92.5% - Heavy"     >H</span> Occasional
<span class="ri-key-box" v-bind:style="getStyle(0.95)" title="95.0, 97.5% - Very heavy">VH</span> <span 
      class="ri-key-box" v-bind:style="getStyle(1.00)" title="100%+ - Maximum"   >MAX</span>
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
            
            function calculateRelativeIntensity(workWeight: number, reps: number) {
                if (!workWeight || !globalState.calc1RM) 
                    return { oneRM: 0, percentage: 0 };
                let percentageForReps = 100 / _calculateOneRepMax(100, reps, props.oneRmFormula);
                return {
                    oneRM: _calculateOneRepMax(workWeight, reps, props.oneRmFormula),
                    percentage: workWeight / (globalState.calc1RM * percentageForReps) // relative intensity
                }
            }

            const lowerWeight = ref(0);
            const higherWeight = ref(0);
            const evenLower = ref(0);
            const evenHigher = ref(0);

            const table = computed(() => {
                let increment = _getIncrement(props.currentExerciseName, globalState.calcWeight);
                lowerWeight.value  = globalState.calcWeight - increment;
                higherWeight.value = globalState.calcWeight + increment;
                evenLower.value    = globalState.calcWeight -(increment * 2);
                evenHigher.value   = globalState.calcWeight +(increment * 2);

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
            });

            
            const show1RM = ref(false); // show 1RM instead of RI percentage

            function outputValue(val: any) { // `val` is an object containing `oneRM` and `percentage` properties 
                if (show1RM.value)
                    return val.oneRM.toFixed(1);
                else 
                    return val.percentage.toFixed(2);
            }

            const blackAndWhite = ref(false);

            function getStyle(relativeIntensity: number) {
                //relativeIntensity = Math.round(relativeIntensity * 100) / 100; // round to 2 d.p. (to match what is displayed)
                if (blackAndWhite.value) {
                    let background = "";
                    /**/ if (relativeIntensity < 0.70)  background = "#FFFFFF"; // Too light
                    else if (relativeIntensity < 0.75)  background = "#EEEEEE"; // Very light
                    else if (relativeIntensity < 0.80)  background = "#DDDDDD"; // Light
                    else if (relativeIntensity < 0.85)  background = "#CCCCCC"; // Moderate
                    else if (relativeIntensity < 0.90)  background = "#AAAAAA"; // Moderate+
                    else if (relativeIntensity < 0.95)  background = "#888888"; // Heavy
                    else if (relativeIntensity < 1.00)  background = "#444444"; // Very heavy
                    else if (relativeIntensity >= 1.00) background = "#000000"; // Max
                    let modplus = (relativeIntensity >= 0.85) && (relativeIntensity < 0.90);
                    return {
                        "background-color": background,
                        //"color": (relativeIntensity < 0.95) ? "black" : "gainsboro",
                        "color": modplus ? "white" : (relativeIntensity < 0.95) ? "black" : (relativeIntensity >= 1.00) ? "#ccc" : "#999"
                        //"font-weight": (relativeIntensity >= 0.85) && (relativeIntensity < 0.90) ? "bold" : "normal"
                    };
                } else {
                    let background = "";
                    /**/ if (relativeIntensity < 0.70)  background = "#D0CECE"; // Too light
                    else if (relativeIntensity < 0.75)  background = "#C6E0B4"; // Very light
                    else if (relativeIntensity < 0.80)  background = "#A9D08E"; // Light
                    else if (relativeIntensity < 0.85)  background = "#FFE699"; // Moderate
                    else if (relativeIntensity < 0.90)  background = "#FFD966"; // Moderate+
                    else if (relativeIntensity < 0.95)  background = "#F4B084"; // Heavy
                    else if (relativeIntensity < 1.00)  background = "#C65911"; // Very heavy
                    else if (relativeIntensity >= 1.00) background = "#C00000"; // Max
                    return {
                        "background-color": background
                    };
                }
            }

            return { globalState, table, 
                lowerWeight, higherWeight, evenLower, evenHigher,
                show1RM, outputValue, getStyle, blackAndWhite
            };
        }
    });
</script>