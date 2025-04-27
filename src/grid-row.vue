<style>
    .intensity60 {
        background-color: #fff1ab;
    }
    .intensity70 {
        background-color: orange;
        color: white !important;
    }
    .intensity80 {
        background-color: purple;
        color: white !important;
    }


    .maintable .number-input {
        width: 65px;
        border: none;
        padding-right: 18px; /* leave space for ✨ emoji */
    }

    .rir-select {
        width: 50px;
        border: none;
        padding-left: 9px;
        background-color: transparent;
    }
    @media (max-width: 768px) {
        /* reduce the width of number-input on mobile */
        .maintable .number-input {
            width: 40px;
        }
        /* reduce the width of rir-select on mobile */
        .rir-select {
            width: 35px;
            padding-left: 0;
        }
        /* reduce padding on "rest" input on mobile (to reduce its width) */
        .maintable .rest-input {
           padding-right: 8px; /* reduce from 18px (from .number-input) to 7px */
        }
    }
</style>

<template>
    <tr>
        <!-- === %1RM === -->
        <td v-if="guide.weightType == '1RM'" 
            class="smallgray verdana"
            v-bind:title="oneRepMaxTooltip"
            v-bind:class="{ 'intensity60': oneRepMaxPercentage >= 55.0 && oneRepMaxPercentage < 70.0,
                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,
                            'intensity80': oneRepMaxPercentage >= 80.0 }">
            {{ formattedOneRepMaxPercentage }}
        </td>

        <!-- === Set number === -->
        <td v-if="!readOnly"
            v-bind:class="!set.type ? '' : 'weekreps' + guideHighReps + (set.type == 'WU' ? '-faded' : '')">
            <!-- {{ setIdx + 1 }} -->
            <select v-model="set.type"
                    style="width: 37px; font-weight: bold">
                <option></option>
                <option value="WU">W - Warm up</option>
                <option value="WK">{{ potentialSetNumber }} - Work set</option>
            </select>
        </td>

        <!-- === Weight === -->
        <td class="border">
            <number-input v-if="!readOnly" v-model="set.weight" step="any"
                          v-bind:disabled="!set.type"
                          v-bind:placeholder="guideWeightPlaceholder" />
            <template     v-if="readOnly"      >{{ set.weight }}</template>
        </td>

        <!-- === Reps === -->
        <td class="border">
            <number-input v-if="!readOnly" v-model="set.reps" 
                          v-bind:disabled="!set.type"
                          v-bind:class="set.type == 'WU' ? null : 'weekreps' + set.reps"
                          v-bind:placeholder="guideRepsPlaceholder"
                          v-on:input="$emit('reps-entered')" />
            <template     v-if="readOnly"      >{{ set.reps }}</template>
        </td>

        <!-- === RIR === -->
        <td v-if="!hideRirColumn"
            class="border"
            v-bind:style="{ 'background-color': set.type == 'WU' || (guide && guide.name == '') ? '#eee' : '' }">
            <template v-if="!readOnly">
                <select class="rir-select" v-model="set.rir">
                    <option></option>
                    <option v-bind:value="-1">-1&nbsp;&nbsp;&nbsp;&nbsp;Failed mid-rep</option>
                    <option v-bind:value="0">&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;Couldn't do any more (AMRAP)</option>
                    <option v-bind:value="1">&nbsp;1&nbsp;&nbsp;&nbsp;&nbsp;Could do 1 more</option>
                    <option v-bind:value="2">&nbsp;2&nbsp;&nbsp;&nbsp;&nbsp;Could do a couple more</option>
                    <option v-bind:value="3">&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;Could do a few more</option>
                    <option v-bind:value="4">&nbsp;4&nbsp;&nbsp;&nbsp;&nbsp;Could do a few more</option>
                    <option v-bind:value="5">&nbsp;5&nbsp;&nbsp;&nbsp;&nbsp;Could do several more</option>
                    <option v-bind:value="10">10&nbsp;&nbsp;&nbsp;&nbsp;Could do many more</option>
                </select>
            </template>
            <template v-else>
                {{ set.rir }}
            </template>
        </td>

        <!-- === Rest === -->
        <td v-show="setIdx != 0" class="border">
            <number-input v-if="!readOnly" v-model="set.gap"
                          class="rest-input"
                          v-bind:disabled="!set.type"
                          v-bind:placeholder="formatTime(restTimer)" />
                          <!-- v-bind:class="'gap' + Math.min(set.gap, 6)"  -->
            <template      v-if="readOnly"      >{{ set.gap }}</template>
        </td>
        <td v-show="setIdx == 0"><!-- padding --></td>

        <!-- === Est 1RM === -->
        <td class="smallgray verdana">
            <!-- v-on:mousemove="$emit('update:showRI', true)" 
                 v-on:mouseout="$emit('update:showRI', false)" 
            <template v-if="!showRI"> -->
                {{ formattedSet1RM }}<!-- ^^^ Sep'24 changed `roundedOneRepMax` to `oneRepMax` --><!-- 
            </template>
            <template v-if="(showRI || (readOnly && exercise.id > 1730554466)) && relativeIntensity">
                {{ readOnly ? " / " : "" }}
                {{ relativeIntensity.toFixed(0) }}%
            </template> -->
        </td>

        <!-- === Volume === -->
        <td v-if="showVolume" class="smallgray verdana">
            {{ formattedVolume }}
        </td>

        <!-- === Increase/decrease message === -->
        <!-- <td v-if="guide.weightType == 'WORK' && !readOnly"
            style="text-align: left">
            <template v-if="increaseDecreaseMessage == 'top'">
                ✅ Top of rep range
            </template>
            <template v-if="increaseDecreaseMessage == 'increase'">
                👆 Increase weight
            </template>
            <template v-if="increaseDecreaseMessage == 'increase-faded'">
                <span style="opacity: 0.5; font-style: italic">👆 Increase weight</span>
            </template>
            <template v-if="increaseDecreaseMessage == 'decrease-faded'">
                <span style="opacity: 0.5; font-style: italic">ℹ Below rep range</span>
            </template>
            <template v-if="increaseDecreaseMessage == 'decrease'">
                👇 Decrease weight -->
                <!-- Help link: also used in recent-workouts-panel.vue -->
                <!-- <a href="https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range"
                   class="emoji" target="_blank">ℹ</a>
            </template>
        </td> -->
    </tr>
</template>

<script lang="ts">
import { _calculateOneRepMax, /*_roundOneRepMax,*/ _volumeForSet, _roundGuideWeight } from './supportFunctions'
import { defineComponent, PropType, computed } from "vue"
import { Set, Guide, Exercise } from './types/app'
import { _getGuidePercentages, _useGuideParts } from './guide';
import NumberInput from './number-input.vue';
import * as moment from "moment";

export default defineComponent({
    components: {
        NumberInput
    },
    props: {
        "set": Object as PropType<Set>,
        "setIdx": Number,
        "showVolume": Boolean,
        "referenceWeight": Number, // for "1RM" guides this will be 1RM,
                                   // for "WORK" guides it will be work set weight
        "ref1RM": Number,
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "guide": Object as PropType<Guide>,
        "exercise": Object as PropType<Exercise>,
            // exercise.name   used in roundGuideWeight 
            // exercise.number passed to _getGuidePercentages
            // exercise.sets   used in increaseDecreaseMessage (to look at other sets)
        "restTimer": Number,
        //"showRI": Boolean // whether to show %RI when hovering over the Est1RM column
        "hideRirColumn": Boolean,
        "goalWorkSetReps": Number
    },
    setup: function (props) {

        const guidePercentages = computed(() => {
            // POSSIBLE TODO: move the code that determines the guide percentages
            //                out of guide.ts and into here instead.
            //                It can then be based on the number of warmup (WU) sets,
            //                which means it will be able to adapt when an extra 
            //                warmup set is added.
            //                The only thing the guide will determine is the *number*
            //                of warmup sets (i.e. more warmup sets for lower rep ranges)
            //                not what the percentages will be.
            return _getGuidePercentages(props.exercise.number, props.guide);
        });

        function guideWeight(setNumber: number) {
            let percentage = (setNumber >= guidePercentages.value.length) ? 0 // out of range
                : guidePercentages.value[setNumber];
            if (!props.referenceWeight || !percentage) return 0;
            return props.referenceWeight * percentage;
        }

        function roundGuideWeight(guideWeight: number): number {
            if (!props.referenceWeight) return 0;
            if (!guideWeight) return 0;

            if (guidePercentages.value[props.setIdx] == 1.00) // 100%
                return guideWeight; // don't round
            else 
                return _roundGuideWeight(guideWeight, props.exercise.name); // round to nearest 2 or 2.5
        }

        const guideWeightPlaceholder = computed(() => { // used as placeholder text for "weight" input box
            return !props.guide.weightType ? null : roundGuideWeight(guideWeight(props.setIdx)) || '';
        });

        const workSetWeight = computed(() => {
            if (!props.referenceWeight || guidePercentages.value.length == 0)
                return 0;
            let guideMaxPercentage = guidePercentages.value[guidePercentages.value.length - 1];
            return roundGuideWeight(props.referenceWeight * guideMaxPercentage);
        });

        const guideRepsPlaceholder = computed(() => { // used as placeholder text for "reps" input box
        var setWeight = props.set.weight;
            if (!setWeight) {
                setWeight = roundGuideWeight(guideWeight(props.setIdx));
            }
            if (!props.referenceWeight || !props.oneRmFormula || !setWeight) return "";

            if (props.set.type == "WK" && props.goalWorkSetReps) {
                return props.goalWorkSetReps;
            }

            let reps = Math.round((1 - (setWeight / workSetWeight.value)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"
            return reps <= 0 ? "" : reps;
        });

        

        // used for placeholder text in "rest" box (timer)
        function formatTime(seconds: number): string {
            if (!seconds) return "";
            return moment.utc(seconds*1000).format("mm:ss");
        }

        
        

        


        // not used //setNumber: function(): string {
        // not used //    if (!this.set.type) return "";
        // not used //    if (this.set.type == "WU") return "W";
        // not used //    let number = 1;
        // not used //    for (let i = 0; i < this.exercise.sets.indexOf(this.set); i++) {
        // not used //        if (this.exercise.sets[i].type == "WK")
        // not used //            number++;
        // not used //    }
        // not used //    return number.toString();
        // not used //},


        // used in "set" dropdown
        const potentialSetNumber = computed(() => {
            let thisSetIdx = props.exercise.sets.indexOf(props.set);
            if (thisSetIdx == -1) // unlikely, but avoids possible infinite loop below
                return "?";
            let number = 1;
            for (let i = 0; i < thisSetIdx; i++) {
                if (props.exercise.sets[i].type == "WK")
                    number++;
            }
            return number.toString();
        });


        // estimated 1RM, based on this set
        const set1RM = computed(() => {
            return _calculateOneRepMax(props.set.weight, props.set.reps, props.oneRmFormula, props.set.rir);
        });
        const formattedSet1RM = computed(() => {
            if (set1RM.value == -1) return ""; // no data
            if (set1RM.value == -2) return "N/A"; // >12 reps
            return set1RM.value.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
            // Sep'24: ^^^ changed `roundedOneRepMax` to `oneRepMax`
        });

        // OLD // roundedOneRepMax: function (): number {
        // OLD //     return _roundOneRepMax(this.oneRepMax);
        // OLD // },

        

        // only shown if `guide.weightType == '1RM'`
        const oneRepMaxPercentage = computed(() => {
            if (!props.set.weight || !props.ref1RM) return -1; // no data
            return props.set.weight * 100 / props.ref1RM;
        });
        const formattedOneRepMaxPercentage = computed(() => {
            // Return oneRepMaxPercentage rounded to nearest whole number (e.g. 71%)
            if (oneRepMaxPercentage.value == -1) return ""; // no data
            return Math.round(oneRepMaxPercentage.value) + "%"; 
        });
        const oneRepMaxTooltip = computed(() => {
            // Return oneRepMaxPercentage rounded to 1 decimal place (e.g. 70.7%)
            if (oneRepMaxPercentage.value == -1) return null; // don't show a tooltip
            return parseFloat(oneRepMaxPercentage.value.toFixed(1)) + "%";
        });


        // only shown if `showVolume`
        const formattedVolume = computed(() => { 
            if (!props.set.weight || !props.set.reps) return ""; // no data
            //if (this.set.reps <= 6) return "N/A"; // volume not relevant for strength sets
            var volume = _volumeForSet(props.set);
            return volume == 0 ? "" : volume.toString();
        });


        
        //increaseDecreaseMessage: function (): string {
        //    if (!this.guide.name) return "";
        //    if (!this.set.reps) return "";
        //    if (this.set.type == "WU") return ""; // doesn't apply to warm-up sets
        //
        //    // IDEA //if (this.set.gap && this.set.gap > 5)
        //    // IDEA //    return "decrease"; // show decrease message if rest time is too long
        //
        //    var guideParts = this.guide.name.split('-');
        //    if (guideParts.length != 2) return "";
        //
        //    var guideLowReps = Number(guideParts[0]);
        //    var guideHighReps = Number(guideParts[1]);
        //
        //    var alreadyFailedAtThisWeight = this.exercise.sets
        //        .filter(set => set.weight == this.set.weight
        //                    && this.exercise.sets.indexOf(set) < this.exercise.sets.indexOf(this.set) // only look at previous sets
        //                    && set.reps > 0
        //                    && set.reps < guideLowReps).length > 0;
        //    
        //    var alreadyMetOrExceeded = this.exercise.sets
        //        .filter(set => set.weight == this.set.weight
        //                    && this.exercise.sets.indexOf(set) < this.exercise.sets.indexOf(this.set) // only look at previous sets
        //                    && set.reps > 0
        //                    && set.reps >= guideHighReps).length > 0;
        //
        //    if (this.set.reps < guideLowReps) // below rep range
        //        if (alreadyFailedAtThisWeight)
        //            return "decrease";
        //        else
        //            return "decrease-faded";
        //
        //    if (this.set.reps == guideHighReps) // at top of rep range
        //        if (alreadyMetOrExceeded)
        //            return "increase";
        //        else
        //            return "top";
        //
        //    if (this.set.reps > guideHighReps) // exceeded rep range
        //        if ((this.workSetWeight > 0 && this.set.weight >= this.workSetWeight)
        //            || alreadyMetOrExceeded)
        //            return "increase";
        //        else
        //            return "increase-faded";
        //    
        //    return "";
        //},


        // used for colour-coding
        const guideHighReps = computed(() => { 
            if (!props.guide.name) return "";
            var guideParts = props.guide.name.split('-');
            if (guideParts.length != 2) return "";
            return Number(guideParts[1]);
        });
        

        // relativeIntensity: function () {
        //     if (this.set1RM < 0) return 0;
        //     return this.set1RM * 100 / this.ref1RM;
        // }

        return { oneRepMaxTooltip, oneRepMaxPercentage, formattedOneRepMaxPercentage,
            guideWeightPlaceholder, guideRepsPlaceholder, 
            guideHighReps, potentialSetNumber, formatTime,
            formattedSet1RM, formattedVolume };
    }
});
</script>