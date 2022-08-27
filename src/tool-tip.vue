<template>
    <div id="tooltip" v-show="tooltipVisible">
        <table>
            <tr v-if="show1RM && !!tooltipData.guideType">
                <td v-bind:colspan="colspan1">Guide type</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.guideType }}</td>
            </tr>

            <tr v-if="show1RM && !!tooltipData.ref1RM && currentExerciseGuide.referenceWeight != 'WORK'">
                <td v-bind:colspan="colspan1">Ref. 1RM</td>
                <td v-bind:class="{ oneRepMaxExceeded: tooltipData.maxEst1RM > tooltipData.ref1RM }">
                    {{ tooltipData.ref1RM }}
                </td>
            </tr>

            <tr>
                <th v-if="show1RM && currentExerciseGuide.referenceWeight == '1RM'">% 1RM</th>
                <th>Weight</th>
                <th>Reps</th>
                <!-- <th>Score</th> -->
                <th>Rest</th>
                <th v-if="show1RM">Est 1RM</th>
                <th v-if="showVolume">Volume</th>
            </tr>
            <grid-row v-for="(set, setIdx) in tooltipData.sets"
                    v-bind:set="set" 
                    v-bind:set-idx="setIdx"
                    v-bind:show1-r-m="show1RM"
                    v-bind:show-volume="showVolume"
                    v-bind:ref1-r-m="tooltipData.ref1RM"
                    v-bind:max-est1-r-m="tooltipData.maxEst1RM"
                    v-bind:read-only="true"
                    v-bind:one-rm-formula="oneRmFormula"
                    v-bind:show-guide="false"
                    v-bind:guide="currentExerciseGuide"
                    v-bind:exercise-name="''"
                    v-bind:exercise-number="tooltipData.exerciseNumber">
                    <!-- v-bind:ref1-r-m = !!tooltipData.ref1RM ? tooltipData.ref1RM : tooltipData.maxEst1RM -->
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
                <td v-bind:colspan="colspan2">{{ tooltipData.totalVolume.toLocaleString() }} kg</td>
            </tr>
            <!-- <tr v-if="showVolume">
                <td v-bind:colspan="colspan1">Volume per set (&gt;6 reps)</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.volumePerSet }}</td>
            </tr> -->

            <tr v-if="show1RM">
                <td v-bind:colspan="colspan1">Max est. 1RM</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.maxEst1RM }}</td>
            </tr>
        </table>
    </div>
</template>

<script lang="ts">
import GridRow from './grid-row.vue'
import { defineComponent, PropType, nextTick } from "vue"
import { RecentWorkoutSummary, TooltipData, Guide } from './types/app'

export default defineComponent({
    components: {
        GridRow
    },
    props: {
        recentWorkoutSummaries: Array as PropType<RecentWorkoutSummary[]>,
        show1RM: Boolean,
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
        tooltipData: function (): TooltipData {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) { // outside array bounds
                return {
                    sets: [],
                    totalVolume: 0,
                    //volumePerSet: 0,
                    highestWeight: 0,
                    maxEst1RM: 0,
                    ref1RM: 0,
                    totalReps: 0,
                    guideType: '',
                    exerciseNumber: ''
                }
            } else {
                var summary = this.recentWorkoutSummaries[this.tooltipIdx];
                return {
                    sets: summary.exercise.sets,
                    totalVolume: summary.totalVolume,
                    //volumePerSet: summary.volumePerSet,
                    highestWeight: summary.highestWeight,
                    maxEst1RM: summary.maxEst1RM,
                    ref1RM: summary.exercise.ref1RM, 
                    totalReps: summary.totalReps,
                    guideType: summary.exercise.guideType,
                    exerciseNumber: summary.exercise.number
                };
            }
        },
        colspan1: function (): number {
            var span = 2;
            if (this.show1RM && this.currentExerciseGuide.referenceWeight == '1RM') {
                span += 1;
            }
            if (this.show1RM) {
                span += 1;
            }
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
        }
    },
    methods: {
        show: function (summaryItemIdx: number, e: MouseEvent) { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipIdx = summaryItemIdx;
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