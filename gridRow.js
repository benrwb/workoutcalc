import { _calculateOneRepMax, _roundOneRepMax } from './supportFunctions.js'

export default {
    // Use "es6-string-html" VS Code extension to enable syntax highlighting on the string below.
    template: /*html*/`
        <tr>
            <td v-if="show1RM" 
                class="smallgray verdana"
                v-bind:class="{ 'intensity60': oneRepMaxPercentage >= 60 && oneRepMaxPercentage < 70,
                                'intensity70': oneRepMaxPercentage >= 70 && oneRepMaxPercentage < 80.6,
                                'intensity80': oneRepMaxPercentage >= 80.6 }">
                {{ formattedOneRepMaxPercentage }}</td>
                <!--             ^^^ 80.6 so that 8RM is orange not purple (when using Brzycki) ^^^ -->
            <td v-if="!readOnly">
                {{ setIdx + 1 }}
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
                v-bind:class="{ 'est1RmEqualToRef': _roundOneRepMax(oneRepMax) == ref1RM,
                                'est1RmExceedsRef': _roundOneRepMax(oneRepMax) > ref1RM } ">
                {{ formattedOneRepMax }}
            </td>
        </tr>`,
    props: [ 
        "set", 
        "setIdx",
        "show1RM",
        "ref1RM",
        "readOnly", // for tooltip
        "oneRmFormula"
    ],
    methods: {
        _calculateOneRepMax: _calculateOneRepMax,
        _roundOneRepMax: _roundOneRepMax,
    },
    computed: {
        oneRepMax: function() {
            return this._calculateOneRepMax(this.set, this.oneRmFormula);
        },
        formattedOneRepMax: function() {
            if (this.oneRepMax == -1) return ""; // no data
            if (this.oneRepMax == -2) return "N/A"; // >12 reps
            return this._roundOneRepMax(this.oneRepMax).toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
        },

        oneRepMaxPercentage: function() {
            if (!this.set.weight || !this.ref1RM) return -1; // no data
            return this.set.weight * 100 / this.ref1RM;
        },
        formattedOneRepMaxPercentage: function() {
            if (this.oneRepMaxPercentage == -1) return ""; // no data
            return Math.round(this.oneRepMaxPercentage) + "%"; 
        }
    }
};
