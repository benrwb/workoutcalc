import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet } from './supportFunctions.js'

export default {
    // Use "es6-string-html" VS Code extension to enable syntax highlighting on the string below.
    template: /*html*/`
        <tr>
            <td v-if="show1RM" 
                class="smallgray verdana"
                v-bind:class="{ 'intensity60': oneRepMaxPercentage >= 60.0 && oneRepMaxPercentage < 73.2,
                                'intensity70': oneRepMaxPercentage >= 73.2 && oneRepMaxPercentage < 83.3,
                                'intensity80': oneRepMaxPercentage >= 83.3 }">
                {{ formattedOneRepMaxPercentage }}</td>
                <!--             ^^^ 80.6 so that 8RM is orange not purple (when using Brzycki) ^^^ -->
            <td v-if="!readOnly">
                {{ setIdx + 1 }}
            </td>
            <td v-if="showGuide"
                v-bind:class="{ 'intensity60': guidePercentage(setIdx) >= 0.600 && guidePercentage(setIdx) < 0.732,
                                'intensity70': guidePercentage(setIdx) >= 0.732 && guidePercentage(setIdx) < 0.833,
                                'intensity80': guidePercentage(setIdx) >= 0.833 }"
                v-bind:title="guideTooltip(setIdx)">
                {{ roundGuideWeight(guideWeight(setIdx)) }}
            </td>
            <td class="border">
                <input   v-if="!readOnly" v-model="set.weight" type="number" step="any" />
                <template v-if="readOnly"      >{{ set.weight }}</template>
            </td>
            <td class="border">
                <input   v-if="!readOnly" v-model="set.reps" type="number" />
                <template v-if="readOnly"      >{{ set.reps }}</template>
            </td>
            <!-- <td class="score">{{ volumeForSet(set) }}</td> -->
            <td v-show="setIdx != 0" class="border">
                <input   v-if="!readOnly" v-model="set.gap" type="number" />
                <template v-if="readOnly"      >{{ set.gap }}</template>
            </td>
            <td v-show="setIdx == 0"><!-- padding --></td>
            <td v-if="show1RM" class="smallgray verdana"
                v-bind:class="{ 'est1RmEqualToRef': roundedOneRepMax == maxEst1RM,
                                'est1RmExceedsRef': roundedOneRepMax > maxEst1RM } ">
                {{ formattedOneRepMax }}
            </td>
            <td v-if="showVolume" class="smallgray verdana">
                {{ formattedVolume }}
            </td>
        </tr>`,
    props: [ 
        "set", 
        "setIdx",
        "show1RM",
        "showVolume",
        "ref1RM", // used to calculate the "% 1RM" and "Guide" columns on the left
        "maxEst1RM", // used to highlight the "Est 1RM" column on the right
        "readOnly", // for tooltip
        "oneRmFormula",
        "showGuide",
        "guideType",
        "exerciseName", // used in roundGuideWeight
        "guides"
    ],
    methods: {
        guidePercentage(setNumber) {
            if (!this.guideType)
                return 0;
            if (!this.guides.hasOwnProperty(this.guideType))
                return 0;
            if (setNumber >= this.guides[this.guideType].length)
                return 0;
            else
                return this.guides[this.guideType][setNumber];
        },
        guideWeight: function (setNumber) {
            var percentage = this.guidePercentage(setNumber);
            if (!this.ref1RM || !percentage) return 0;
            return this.ref1RM * percentage;
        },
        roundGuideWeight: function (guideWeight) {
            if (!this.ref1RM) return "";
            if (!guideWeight) return "";
            if ((this.exerciseName || '').indexOf('db ') == 0)
                return Math.round(guideWeight * 0.5) / 0.5; // round to nearest 2
            else
                return Math.round(guideWeight * 0.4) / 0.4; // round to nearest 2.5
        },
        guideTooltip: function (setNumber) {
            return Math.round(this.guidePercentage(setNumber) * 100)
                + '% = '
                + this.guideWeight(setNumber).toFixed(1)
                + ' kg';
        }
    },
    computed: {
        oneRepMax: function() {
            return _calculateOneRepMax(this.set, this.oneRmFormula);
        },
        roundedOneRepMax: function() {
            return _roundOneRepMax(this.oneRepMax);
        },
        formattedOneRepMax: function() {
            if (this.oneRepMax == -1) return ""; // no data
            if (this.oneRepMax == -2) return "N/A"; // >12 reps
            return this.roundedOneRepMax.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
        },

        oneRepMaxPercentage: function() {
            if (!this.set.weight || !this.ref1RM) return -1; // no data
            return this.set.weight * 100 / this.ref1RM;
        },
        formattedOneRepMaxPercentage: function() {
            if (this.oneRepMaxPercentage == -1) return ""; // no data
            return Math.round(this.oneRepMaxPercentage) + "%"; 
        },

        formattedVolume: function() { 
            if (!this.set.weight || !this.set.reps) return ""; // no data
            if (this.set.reps <= 6) return "N/A"; // volume not relevant for strength sets
            return _volumeForSet(this.set);
        }
    }
};
