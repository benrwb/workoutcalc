<template>
    <tr>
        <td v-if="show1RM && guide.referenceWeight == '1RM'" 
            class="smallgray verdana"
            v-bind:title="oneRepMaxTooltip"
            v-bind:class="{ 'intensity60': oneRepMaxPercentage >= 55.0 && oneRepMaxPercentage < 70.0,
                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,
                            'intensity80': oneRepMaxPercentage >= 80.0 }">
            {{ formattedOneRepMaxPercentage }}</td>
        <td v-if="!readOnly">
            {{ setIdx + 1 }}
        </td>
        <td v-if="showGuide"
            v-bind:class="{ 'intensity60': adjustedPercentage(setIdx) >= 0.54 && adjustedPercentage(setIdx) < 0.70,
                            'intensity70': adjustedPercentage(setIdx) >= 0.70 && adjustedPercentage(setIdx) < 0.80,
                            'intensity80': adjustedPercentage(setIdx) >= 0.80 }"
            v-bind:title="guideTooltip(setIdx)">
            <!-- {{ guideString(setIdx) }} -->
            {{ roundGuideWeight(guideWeight(setIdx)) || "" }}
        </td>
        <td class="border">
            <number-input v-if="!readOnly" v-model="set.weight" step="any" />
            <template      v-if="readOnly"      >{{ set.weight }}</template>
        </td>
        <td class="border">
            <number-input v-if="!readOnly" v-model="set.reps" 
                          v-bind:placeholder="guideReps(setIdx)" />
            <template      v-if="readOnly"      >{{ set.reps }}</template>
        </td>
        <!-- <td class="score">{{ volumeForSet(set) }}</td> -->
        <td v-show="setIdx != 0" class="border">
            <number-input v-if="!readOnly" v-model="set.gap" />
            <template      v-if="readOnly"      >{{ set.gap }}</template>
        </td>
        <td v-show="setIdx == 0"><!-- padding --></td>
        <td v-if="show1RM" class="smallgray verdana"
            v-bind:class="{ 'est1RmEqualToRef': roundedOneRepMax == maxEst1RM && guide.referenceWeight == '1RM',
                            'est1RmExceedsRef': roundedOneRepMax > maxEst1RM  && guide.referenceWeight == '1RM' } ">
            {{ formattedOneRepMax }}
        </td>
        <td v-if="showVolume" class="smallgray verdana">
            {{ formattedVolume }}
        </td>
        <td v-if="guide.referenceWeight == 'WORK'"
            style="text-align: left">
            <template v-if="increaseDecreaseMessage == 'top'">
                ✅ Top of rep range
            </template>
            <template v-if="increaseDecreaseMessage == 'increase'">
                👆 Increase weight
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
import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet } from './supportFunctions'
import Vue, { PropType } from './types/vue'
import { Set, Guide } from './types/app'
import { _getGuidePercentages } from './guide';

export default Vue.extend({
    props: {
        "set": Object as PropType<Set>,
        "setIdx": Number,
        "show1RM": Boolean,
        "showVolume": Boolean,
        "ref1RM": Number, // used to calculate the "% 1RM" and "Guide" columns on the left
        "maxEst1RM": [Number, String], // TODO remove String so this is always a Number? // used to highlight the "Est 1RM" column on the right
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "showGuide": Boolean,
        "guide": Object as PropType<Guide>,
        "exerciseName": String, // used in roundGuideWeight
        "exerciseNumber": String // passed to _getGuidePercentages
    },
    methods: {
        guidePercentage: function (setNumber: number) {
            if (setNumber >= this.guidePercentages.length)
                return 0;
            else
                return this.guidePercentages[setNumber];
        },
        adjustedPercentage: function (setNumber: number): number {
            // used to colour-code the guide
            if (this.guide && this.guide.referenceWeight == "WORK") {
                if (!this.guide.name || !this.oneRmFormula) return 0;
                var guideParts = this.guide.name.split('-');
                if (guideParts.length != 2) return 0;

                var guideLowReps = Number(guideParts[0]);
                var guideHighReps = Number(guideParts[1]);
                var midPoint = (guideLowReps + guideHighReps) / 2;

                var number = _calculateOneRepMax({ weight: 100, reps: midPoint, gap: 0 }, this.oneRmFormula)
                var multiplier = 100 / number;
                return this.guidePercentages[setNumber] * multiplier;
            }  else {
                return this.guidePercentages[setNumber];
            }
        },
        guideWeight: function (setNumber: number) {
            var percentage = this.guidePercentage(setNumber);
            if (!this.ref1RM || !percentage) return 0;
            return this.ref1RM * percentage;
        },
        // guideString: function (setNumber: number) {
        //     var guidePercentage = this.guidePercentage(setNumber);
        //     var roundedWeight = this.roundGuideWeight(this.ref1RM * guidePercentage);
        //     if (!this.ref1RM || !guidePercentage || !roundedWeight) return "";

        //     var reps = this.guideReps(Number(roundedWeight));
        //     return roundedWeight + (reps ? "x" + reps : "");
        // },
        guideReps: function (setIdx: number) {
            var setWeight = this.set.weight;
            if (!setWeight) {
                setWeight = this.roundGuideWeight(this.guideWeight(setIdx));
            }
            if (!this.showGuide || !this.ref1RM || !this.oneRmFormula || !setWeight) return "";

            // alternative method // Rep guide: Warm up sets max two-thirds of work sets (based on 1RM calculation)
            // alternative method // var twoThirds = this.ref1RM * 0.67;
            // alternative method // var reps = 1;
            // alternative method // do {
            // alternative method //     var tempSet = { weight: Number(setWeight), reps: reps + 1, gap: 0 };
            // alternative method //     var repMax = _calculateOneRepMax(tempSet, this.oneRmFormula);
            // alternative method //     if (repMax > twoThirds) {
            // alternative method //         break;
            // alternative method //     }
            // alternative method // } while (++reps < 15);
            
            var reps = Math.round((1 - (setWeight / this.workSetWeight)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"

            //var isWorkSet = setWeight >= workSetWeight;
            //return isWorkSet ? "" : reps;
            return reps <= 0 ? "" : reps;
        },
        roundGuideWeight: function (guideWeight: number): number {
            if (!this.ref1RM) return 0;
            if (!guideWeight) return 0;

            if (this.guidePercentages[this.setIdx] == 1.00) // 100%
                return guideWeight; // don't round
            else if ((this.exerciseName || '').indexOf('db ') == 0)
                return Math.round(guideWeight * 0.5) / 0.5; // round to nearest 2
            else
                return Math.round(guideWeight * 0.4) / 0.4; // round to nearest 2.5
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
        }
    },
    computed: {
        oneRepMax: function (): number {
            return _calculateOneRepMax(this.set, this.oneRmFormula);
        },
        roundedOneRepMax: function (): number {
            return _roundOneRepMax(this.oneRepMax);
        },
        formattedOneRepMax: function (): string {
            if (this.oneRepMax == -1) return ""; // no data
            if (this.oneRepMax == -2) return "N/A"; // >12 reps
            return this.roundedOneRepMax.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
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
            return _getGuidePercentages(this.exerciseNumber, this.guide);
        },
        workSetWeight: function (): number {
            if (!this.ref1RM || this.guidePercentages.length == 0)
                return 0;
            var guideMaxPercentage = this.guidePercentages[this.guidePercentages.length - 1];
            return this.roundGuideWeight(this.ref1RM * guideMaxPercentage);
        },
        firstWorkSetIdx: function (): number {
            if (!this.ref1RM || this.guidePercentages.length == 0)
                return 0;

            var guideMaxPercentage = this.guidePercentages[this.guidePercentages.length - 1];
            
            for (var i = this.guidePercentages.length - 1; i >= 0; i--) {
                if (this.guidePercentages[i] < guideMaxPercentage) {
                    return i + 1;
                }
            }
            return 0; // all sets are work sets
        },

        increaseDecreaseMessage: function (): string {
            if (!this.ref1RM) return ""; // don't show if "work weight" box is blank
            if (!this.guide.name) return "";
            var guideParts = this.guide.name.split('-');
            if (guideParts.length != 2) return "";

            var guideLowReps = Number(guideParts[0]);
            var guideHighReps = Number(guideParts[1]);

            if (!this.set.reps) return "";
            if ((this.setIdx < this.firstWorkSetIdx)
             && (this.set.weight < this.workSetWeight)) return ""; // doesn't apply to warm-up sets

            if (this.set.reps < guideLowReps) return "decrease";
            if (this.set.reps == guideHighReps) return "top";
            if (this.set.reps > guideHighReps) return "increase";
            return "";
        }
    }
});
</script>