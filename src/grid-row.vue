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

    td.est1RmEqualToRef {
        background-color: #d3ffd3;
    }
    td.est1RmExceedsRef {
        background-color: #ffd3d3;
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
            v-bind:class="!set.type ? '' : 'weekreps' + guideLowReps + (set.type == 'WU' ? '-faded' : '')">
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
                          v-bind:placeholder="!guide.weightType ? null : roundGuideWeight(guideWeight(setIdx)) || ''" />
            <template      v-if="readOnly"      >{{ set.weight }}</template>
        </td>

        <!-- === Reps === -->
        <td class="border">
            <number-input v-if="!readOnly" v-model="set.reps" 
                          v-bind:disabled="!set.type"
                          v-bind:class="set.type == 'WU' ? null : 'weekreps' + set.reps"
                          v-bind:placeholder="guideReps(setIdx)"
                          v-on:input="$emit('reps-entered')" />
            <template     v-if="readOnly"      >{{ set.reps }}</template>
        </td>

        <!-- === Rest === -->
        <td v-show="setIdx != 0" class="border">
            <number-input v-if="!readOnly" v-model="set.gap"
                          v-bind:disabled="!set.type"
                          v-bind:class="'gap' + Math.min(set.gap, 6)" 
                          v-bind:placeholder="formatTime(restTimer)" />
            <template      v-if="readOnly"      >{{ set.gap }}</template>
        </td>
        <td v-show="setIdx == 0"><!-- padding --></td>

        <!-- === Est 1RM === -->
        <td class="smallgray verdana"
            v-bind:class="{ 'est1RmEqualToRef': oneRepMax == maxEst1RM && guide.weightType == '1RM',
                            'est1RmExceedsRef': oneRepMax > maxEst1RM  && guide.weightType == '1RM' } ">
            {{ formattedOneRepMax }}<!-- ^^^ Sep'24 changed `roundedOneRepMax` to `oneRepMax` -->
        </td>

        <!-- === Volume === -->
        <td v-if="showVolume" class="smallgray verdana">
            {{ formattedVolume }}
        </td>

        <!-- === Increase/decrease message === -->
        <td v-if="guide.weightType == 'WORK' && !readOnly"
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
                👇 Decrease weight
                <!-- Help link: also used in recent-workouts-panel.vue -->
                <a href="https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range"
                   class="emoji" target="_blank">ℹ</a>
            </template>
        </td>
    </tr>
</template>

<script lang="ts">
import { _calculateOneRepMax, /*_roundOneRepMax,*/ _volumeForSet, _roundGuideWeight } from './supportFunctions'
import { defineComponent, PropType } from "vue"
import { Set, Guide, Exercise } from './types/app'
import { _getGuidePercentages } from './guide';
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
        "ref1RM": Number, // used to calculate the "% 1RM" and "Guide" columns on the left
        "maxEst1RM": Number, // used to highlight the "Est 1RM" column on the right
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "guide": Object as PropType<Guide>,
        "exercise": Object as PropType<Exercise>,
            // exercise.name   used in roundGuideWeight 
            // exercise.number passed to _getGuidePercentages
            // exercise.sets   used in increaseDecreaseMessage (to look at other sets)
        "restTimer": Number
    },
    methods: {
        guidePercentage: function (setNumber: number) {
            if (setNumber >= this.guidePercentages.length)
                return 0;
            else
                return this.guidePercentages[setNumber];
        },
        repGoalForSet: function (setNumber: number): number {
            // used to colour-code the guide
            if (!this.guide || this.guide.weightType != "WORK") return 0;
            if (!this.guide.name || !this.oneRmFormula) return 0;
            if (setNumber >= this.guidePercentages.length) return 0;

            var guideParts = this.guide.name.split('-');
            if (guideParts.length != 2) return 0;
            var guideLowReps = Number(guideParts[0]);
            //var guideHighReps = Number(guideParts[1]);
            //var midPoint = (guideLowReps + guideHighReps) / 2;

            return Math.round((1 / this.guidePercentages[setNumber]) * guideLowReps);
        },
        guideWeight: function (setNumber: number) {
            var percentage = this.guidePercentage(setNumber);
            if (!this.ref1RM || !percentage) return 0;
            return this.ref1RM * percentage;
        },
        guideReps: function (setIdx: number) {
            var setWeight = this.set.weight;
            if (!setWeight) {
                setWeight = this.roundGuideWeight(this.guideWeight(setIdx));
            }
            if (!this.ref1RM || !this.oneRmFormula || !setWeight) return "";

            var reps = Math.round((1 - (setWeight / this.workSetWeight)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"

            return reps <= 0 ? "" : reps;
        },
        roundGuideWeight: function (guideWeight: number): number {
            if (!this.ref1RM) return 0;
            if (!guideWeight) return 0;

            if (this.guidePercentages[this.setIdx] == 1.00) // 100%
                return guideWeight; // don't round
            else 
                return _roundGuideWeight(guideWeight, this.exercise.name); // round to nearest 2 or 2.5
        },
        guideTooltip: function (setNumber: number) {
            if (!this.ref1RM) return null; // don't show a tooltip
            var guideWeight = this.guideWeight(setNumber);
            if (!guideWeight) return null; // don't show a tooltip
            var roundedWeight = this.roundGuideWeight(guideWeight);
            
            // combination of parseFloat and toFixed = round to 1 d.p. but remove unnecessary zeros
            // e.g. 81.5273 becomes 81.5, 80.0000 becomes 80
            // see https://stackoverflow.com/a/19623253/58241
            return "Guide " 
                + parseFloat((this.guidePercentage(setNumber) * 100).toFixed(1))
                + '% = '
                + guideWeight.toFixed(1)
                + ' kg'
                + '\n'
                + 'Actual '
                + parseFloat(((Number(roundedWeight) / this.ref1RM) * 100).toFixed(1))
                + '% = '
                + roundedWeight
                + ' kg';
        },
        formatTime: function (seconds: number): string {
            if (!seconds) return "";
            return moment.utc(seconds*1000).format("mm:ss");
        }
    },
    computed: {
        setNumber: function(): string {
            if (!this.set.type) return "";
            if (this.set.type == "WU") return "W";
            let number = 1;
            for (let i = 0; i < this.exercise.sets.indexOf(this.set); i++) {
                if (this.exercise.sets[i].type == "WK")
                    number++;
            }
            return number.toString();
        },
        potentialSetNumber: function(): string {
            let thisSetIdx = this.exercise.sets.indexOf(this.set);
            if (thisSetIdx == -1) // unlikely, but avoids possible infinite loop below
                return "?";
            let number = 1;
            for (let i = 0; i < thisSetIdx; i++) {
                if (this.exercise.sets[i].type == "WK")
                    number++;
            }
            return number.toString();
        },
        oneRepMax: function (): number {
            return _calculateOneRepMax(this.set.weight, this.set.reps, this.oneRmFormula);
        },
        // OLD // roundedOneRepMax: function (): number {
        // OLD //     return _roundOneRepMax(this.oneRepMax);
        // OLD // },
        formattedOneRepMax: function (): string {
            if (this.oneRepMax == -1) return ""; // no data
            if (this.oneRepMax == -2) return "N/A"; // >12 reps
            return this.oneRepMax.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
            // Sep'24: ^^^ changed `roundedOneRepMax` to `oneRepMax`
        },

        oneRepMaxPercentage: function (): number {
            if (!this.set.weight || !this.ref1RM) return -1; // no data
            return this.set.weight * 100 / this.ref1RM;
        },
        formattedOneRepMaxPercentage: function (): string {
            // Return oneRepMaxPercentage rounded to nearest whole number (e.g. 71%)
            if (this.oneRepMaxPercentage == -1) return ""; // no data
            return Math.round(this.oneRepMaxPercentage) + "%"; 
        },
        oneRepMaxTooltip: function (): string {
            // Return oneRepMaxPercentage rounded to 1 decimal place (e.g. 70.7%)
            if (this.oneRepMaxPercentage == -1) return null; // don't show a tooltip
            return parseFloat(this.oneRepMaxPercentage.toFixed(1)) + "%";
        },

        formattedVolume: function (): string { 
            if (!this.set.weight || !this.set.reps) return ""; // no data
            //if (this.set.reps <= 6) return "N/A"; // volume not relevant for strength sets
            var volume = _volumeForSet(this.set);
            return volume == 0 ? "" : volume.toString();
        },
        guidePercentages: function (): number[] {
            return _getGuidePercentages(this.exercise.number, this.guide);
        },
        workSetWeight: function (): number {
            if (!this.ref1RM || this.guidePercentages.length == 0)
                return 0;
            var guideMaxPercentage = this.guidePercentages[this.guidePercentages.length - 1];
            return this.roundGuideWeight(this.ref1RM * guideMaxPercentage);
        },

        increaseDecreaseMessage: function (): string {
            if (!this.guide.name) return "";
            if (!this.set.reps) return "";
            if (this.set.type == "WU") return ""; // doesn't apply to warm-up sets

            // IDEA //if (this.set.gap && this.set.gap > 5)
            // IDEA //    return "decrease"; // show decrease message if rest time is too long

            var guideParts = this.guide.name.split('-');
            if (guideParts.length != 2) return "";

            var guideLowReps = Number(guideParts[0]);
            var guideHighReps = Number(guideParts[1]);

            var alreadyFailedAtThisWeight = this.exercise.sets
                .filter(set => set.weight == this.set.weight
                            && this.exercise.sets.indexOf(set) < this.exercise.sets.indexOf(this.set) // only look at previous sets
                            && set.reps > 0
                            && set.reps < guideLowReps).length > 0;
            
            var alreadyMetOrExceeded = this.exercise.sets
                .filter(set => set.weight == this.set.weight
                            && this.exercise.sets.indexOf(set) < this.exercise.sets.indexOf(this.set) // only look at previous sets
                            && set.reps > 0
                            && set.reps >= guideHighReps).length > 0;

            if (this.set.reps < guideLowReps) // below rep range
                if (alreadyFailedAtThisWeight)
                    return "decrease";
                else
                    return "decrease-faded";

            if (this.set.reps == guideHighReps) // at top of rep range
                if (alreadyMetOrExceeded)
                    return "increase";
                else
                    return "top";

            if (this.set.reps > guideHighReps) // exceeded rep range
                if ((this.workSetWeight > 0 && this.set.weight >= this.workSetWeight)
                    || alreadyMetOrExceeded)
                    return "increase";
                else
                    return "increase-faded";
            
            return "";
        },

        guideLowReps: function() {
            if (!this.guide.name) return "";
            var guideParts = this.guide.name.split('-');
            if (guideParts.length != 2) return "";
            return Number(guideParts[0]);
        }
    }
});
</script>