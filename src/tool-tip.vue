<template>
    <div id="tooltip" v-show="tooltipVisible">
        <table>
            <tr v-if="show1RM && !!tooltipData.ref1RM">
                <td colspan="4">Ref. 1RM</td>
                <td v-bind:class="{ oneRepMaxExceeded: tooltipData.maxEst1RM > tooltipData.ref1RM }">
                    {{ tooltipData.ref1RM }}
                </td>
            </tr>
            <tr>
                <th v-if="show1RM">% 1RM</th>
                <th>Weight</th>
                <th>Reps</th>
                <!-- <th>Score</th> -->
                <th>Rest</th>
                <th v-if="show1RM">Est 1RM</th>
                <th v-if="showVolume">Volume</th>
            </tr>
            <tr v-for="(set, setIdx) in tooltipData.sets"
                    is="grid-row" 
                    v-bind:set="set" 
                    v-bind:set-idx="setIdx"
                    v-bind:show1-r-m="show1RM"
                    v-bind:show-volume="showVolume"
                    v-bind:max-est1-r-m="tooltipData.maxEst1RM"
                    v-bind:ref1-r-m="tooltipData.ref1RM"
                    v-bind:read-only="true"
                    v-bind:one-rm-formula="oneRmFormula"
                    v-bind:show-guide="false"
                    v-bind:guides="guides">
                    <!-- v-bind:ref1-r-m = !!tooltipData.ref1RM ? tooltipData.ref1RM : tooltipData.maxEst1RM -->
            </tr>
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
            <tr v-if="showVolume">
                <td v-bind:colspan="colspan1">Volume per set (&gt;6 reps)</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.volumePerSet }}</td>
            </tr>

            <tr v-if="show1RM && !!tooltipData.guideType">
                <td v-bind:colspan="colspan1">Guide type</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.guideType }}</td>
            </tr>

            <tr v-if="show1RM">
                <td v-bind:colspan="colspan1">Max est. 1RM</td>
                <td v-bind:colspan="colspan2">{{ tooltipData.maxEst1RM }}</td>
            </tr>
        </table>
    </div>
</template>

<script>
import gridRow from './grid-row.vue'

export default {
    components: {
        gridRow
    },
    props: {
        recentWorkoutSummaries: Array,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Object
    },
    data: function() { 
        return {
            tooltipVisible: false,
            tooltipIdx: -1
        }
    },
    computed:{
        tooltipData: function() {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) { // outside array bounds
                return {
                    sets: [],
                    totalVolume: 0,
                    volumePerSet: 0,
                    highestWeight: 0,
                    maxEst1RM: 0,
                    ref1RM: 0,
                    totalReps: 0,
                    guideType: ''
                }
            } else {
                var summary = this.recentWorkoutSummaries[this.tooltipIdx];
                return {
                    sets: summary.exercise.sets,
                    totalVolume: summary.totalVolume,
                    volumePerSet: summary.volumePerSet,
                    highestWeight: summary.highestWeight,
                    maxEst1RM: summary.maxEst1RM,
                    ref1RM: summary.exercise.ref1RM, 
                    totalReps: summary.totalReps,
                    guideType: summary.exercise.guideType
                };
            }
        },
        colspan1: function() {
            var span = 2;
            if (this.show1RM) {
                span += 2;
            }
            return span;
        },
        colspan2: function() {
            return this.showVolume ? 2 : 1;
        }
    },
    methods: {
        show: function(summaryItemIdx, e) { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipIdx = summaryItemIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                Vue.nextTick(function() { self.moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function(e) {
            var popupWidth = $("#tooltip").width();
            var overflowX = (popupWidth + e.clientX + 5) > $(window).width();
            $("#tooltip").css({ left: overflowX ? e.pageX - popupWidth : e.pageX });

            var popupHeight = $("#tooltip").height();
            var overflowY = (popupHeight + e.clientY + 15) > $(window).height();
            $("#tooltip").css({ top: overflowY ? e.pageY - popupHeight - 10 : e.pageY + 10 });
        },
        hide: function () { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipVisible = false;
        }
    }
}
</script>