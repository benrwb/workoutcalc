<style>
    #tooltip {
        position: absolute;
        background-color: rgb(255,255,225);
        font-size: 13px;
    }
    #tooltip table {
        border-collapse: collapse;
        border: solid 1px black;
    }
    #tooltip th {
        background-color: #e8e8b6;
    }
    #tooltip td {
        text-align: right;
        padding: 3px 5px 3px 30px;
        border: dotted 1px gray;
    }

    td.oneRepMaxExceeded {
        /* text-decoration: line-through; */
        /* color: red; */
        background-color: #fdd;
        color: #999;
    }
</style>

<template>
    <div id="tooltip" v-show="tooltipVisible && tooltipIdx != -1">
        <table>
            <tbody>
                <tr>
                    <td v-bind:colspan="colspan1">Date</td>
                    <td v-bind:colspan="colspan2">{{ tooltipData.date }}</td>
                </tr>

                <tr v-if="!!tooltipData.guideType">
                    <td v-bind:colspan="colspan1">Guide type</td>
                    <td v-bind:colspan="colspan2">{{ tooltipData.guideType }}</td>
                </tr>

                <tr v-if="!!tooltipData.ref1RM && (currentExerciseGuide.weightType != 'WORK' || tooltipData.id > 1730554466)">
                    <td v-bind:colspan="colspan1">Ref. 1RM</td>
                    <td v-bind:class="{ oneRepMaxExceeded: maxEst1RM > tooltipData.ref1RM }">
                        {{ tooltipData.ref1RM }}
                    </td>
                </tr>

                <tr>
                    <th v-if="currentExerciseGuide.weightType == '1RM'">% 1RM</th>
                    <th>Weight</th>
                    <th>Reps</th>
                    <th>Rest</th>
                    <th>Est 1RM{{ tooltipData.id > 1730554466 ? " / RI%" : "" }}</th>
                    <th v-if="showVolume">Volume</th>
                </tr>
                <grid-row v-for="(set, setIdx) in tooltipData.sets"
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show-volume="showVolume"
                        v-bind:reference-weight="0"
                        v-bind:ref1-r-m="tooltipData.ref1RM"
                        v-bind:read-only="true"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:show-guide="false"
                        v-bind:guide="currentExerciseGuide"
                        v-bind:exercise="tooltipData">
                </grid-row>
                <tr><td style="padding: 0"></td></tr> <!-- fix for chrome (table borders) -->
                <!--<tr style="border-top: double 3px black">
                    <td v-bind:colspan="colspan1">Total reps</td>
                    <td v-bind:colspan="colspan2">{{ tooltipData.totalReps }}</td>
                </tr>
                <tr>
                    <td v-bind:colspan="colspan1">Maximum weight</td>
                    <td v-bind:colspan="colspan2">{{ tooltipData.highestWeight }}</td>
                </tr>-->
                <tr><!-- v-if="showVolume" -->
                    <td v-bind:colspan="colspan1">Total volume</td>
                    <td v-bind:colspan="colspan2">{{ totalVolume.toLocaleString() }} kg</td>
                </tr>
                <!-- <tr v-if="showVolume">
                    <td v-bind:colspan="colspan1">Volume per set (&gt;6 reps)</td>
                    <td v-bind:colspan="colspan2">{{ tooltipData.volumePerSet }}</td>
                </tr> -->

                <tr>
                    <td v-bind:colspan="colspan1">Max est. 1RM</td>
                    <td v-bind:colspan="colspan2">{{ maxEst1RM }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import GridRow from './grid-row.vue'
import { defineComponent, PropType, nextTick } from "vue"
import { RecentWorkout, Guide } from './types/app'
import { _calculateTotalVolume, _calculateMax1RM } from './supportFunctions';

export default defineComponent({
    components: {
        GridRow
    },
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Array as PropType<Guide[]>
    },
    data: function () { 
        return {
            tooltipVisible: false,
            tooltipIdx: -1
        }
    },
    computed: {
        tooltipData: function (): RecentWorkout {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkouts.length) { // outside array bounds
                return {
                    // Fields from Exercise...
                    number: "",
                    name: "",
                    sets: [],
                    ref1RM: 0,
                    comments: "",
                    etag: 0,
                    guideType: "",
                    warmUp: "",
                    // Fields from RecentWorkout...
                    id: 0,
                    date: "",
                    blockStart: "", // date
                    weekNumber: 0
                }
            } else {
                return this.recentWorkouts[this.tooltipIdx];
            }
        },
        colspan1: function (): number {
            var span = 2;
            if (this.currentExerciseGuide.weightType == '1RM') {
                span += 1;
            }
            //if (this.show1RM) {
                span += 1;
            //}
            return span;
        },
        colspan2: function (): number {
            return this.showVolume ? 2 : 1;
        },
        currentExerciseGuide: function (): Guide {
            for (var i = 0; i < this.guides.length; i++) {
                if (this.guides[i].name ==  this.tooltipData.guideType )
                    return this.guides[i];
            }
            return this.guides[0]; // not found - return default (empty) guide
        },
        totalVolume: function () {
            return _calculateTotalVolume(this.tooltipData);
        },
        // totalReps: function () {
        //     return this.tooltipData.sets.reduce(function(acc, set) { return acc + set.reps }, 0); // sum array
        // },
        // calculateVolumePerSet: function (sets: Set[]) {
        //     var volumeSets = sets.filter(function(set) { return set.reps > 6 }); // volume not relevant for strength sets
        //     var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
        //     var volumePerSet = volumeSum / volumeSets.length;
        //     return Math.round(volumePerSet);
        // },
        maxEst1RM: function (): number {
            return _calculateMax1RM(this.tooltipData.sets, this.oneRmFormula);
        }
    },
    methods: {
        show: function (recentWorkoutIdx: number, e: MouseEvent) { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipIdx = recentWorkoutIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                nextTick(function () { self.moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function (e: MouseEvent) {
            var tooltip = this.$el as HTMLElement;

            var popupWidth = tooltip.clientWidth;
            var overflowX = (popupWidth + e.clientX + 5) > document.documentElement.clientWidth;
            tooltip.style.left = (overflowX ? e.pageX - popupWidth : e.pageX) + "px";

            var popupHeight = tooltip.clientHeight;
            //var overflowY = (popupHeight + e.clientY + 15) > document.documentElement.clientHeight;
            //tooltip.style.top = (overflowY ? e.pageY - popupHeight - 10 : e.pageY + 10) + "px";
            tooltip.style.top = (e.pageY - popupHeight - 10) + "px";
        },
        hide: function () { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipVisible = false;
        }
    }
});
</script>