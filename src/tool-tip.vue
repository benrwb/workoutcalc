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
        padding: 3px 5px 3px 5px;
        border: dotted 1px gray;
        min-width: 40px;
    }

    td.oneRepMaxExceeded {
        /* text-decoration: line-through; */
        /* color: red; */
        background-color: #fdd;
        color: #999;
    }
</style>

<template>
    <div id="tooltip" v-show="tooltipVisible && tooltipIdx != -1" ref="elementRef">
        <table>
            <tbody>
                <template v-if="debuggingInformation">
                    <tr>
                        <td colspan="99" style="white-space: pre-line">{{ debuggingInformation }}</td>
                    </tr>
                </template>
                <template v-else><!-- BEGIN hide all but debugging information -->
                
                <tr>
                    <td v-bind:colspan="colspan1 - 1">Date</td>
                    <td v-bind:colspan="colspan2 + 1"
                        style="padding-left: 5px">{{ tooltipData.date }}</td>
                </tr>

                <tr v-if="!!tooltipData.guideType">
                    <td v-bind:colspan="colspan1 - 1">Guide type</td>
                    <td v-bind:colspan="colspan2 + 1">{{ tooltipData.guideType }}</td>
                </tr>

                <tr v-if="!!tooltipData.ref1RM && currentExerciseGuide.weightType != 'WORK'">
                    <td v-bind:colspan="colspan1 - 1">Ref. 1RM</td>
                    <td v-bind:colspan="colspan2 + 1"
                        v-bind:class="{ oneRepMaxExceeded: maxEst1RM > tooltipData.ref1RM }">
                        {{ tooltipData.ref1RM }}
                    </td>
                </tr>

                <tr>
                    <th v-if="currentExerciseGuide.weightType == '1RM'">% 1RM</th>
                    <th>Weight</th>
                    <th>Reps</th>
                    <th v-if="!hideRirColumn">RIR</th>
                    <th>Rest</th>
                    <th>Est 1RM</th>
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
                        v-bind:exercise="tooltipData"
                        v-bind:hide-rir-column="hideRirColumn">
                </grid-row>
                <tr><td style="padding: 0"></td></tr> <!-- fix for chrome (table borders) -->

                <tr><!-- v-if="showVolume" -->
                    <td v-bind:colspan="colspan1">Total volume</td>
                    <td v-bind:colspan="colspan2">{{ totalVolume.toLocaleString() }} kg</td>
                </tr>

                <tr><!-- v-if="showVolume" -->
                    <td v-bind:colspan="colspan1">Work Sets volume</td>
                    <td v-bind:colspan="colspan2">{{ workSetsVolume.toLocaleString() }} kg</td>
                </tr>

                <tr>
                    <td v-bind:colspan="colspan1">Max est. 1RM</td>
                    <td v-bind:colspan="colspan2">{{ maxEst1RM }}</td>
                </tr>

                <tr v-if="tooltipData.comments">
                    <td v-bind:colspan="colspan1 + colspan2"
                        style="text-align: left; padding-left: 5px"
                        >💬 &quot;{{ tooltipData.comments }}&quot;</td>
                </tr>
            </template><!-- END hide all but debugging information -->
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import GridRow from './grid-row.vue'
import { defineComponent, PropType, nextTick, ref, computed } from "vue"
import { RecentWorkout, Guide } from './types/app'
import { _calculateTotalVolume, _calculateMax1RM, _volumeForSet } from './supportFunctions';

export default defineComponent({
    components: { GridRow },
    props: {
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Array as PropType<Guide[]>
    },
    setup: function(props) { 
        
        const tooltipIdx = ref(-1);
        
        const tooltipData = computed(function() : RecentWorkout {
            if (tooltipIdx.value == -1 // nothing selected
                || tooltipIdx.value >= props.recentWorkouts.length) { // outside array bounds
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
                    goal: "",
                    // Fields from RecentWorkout...
                    id: 0,
                    date: "",
                    blockStart: "", // date
                    weekNumber: 0
                }
            } else {
                return props.recentWorkouts[tooltipIdx.value];
            }
        });

        const hideRirColumn = computed(() => {
            // If there isn't any RIR data then hide the column
            let setsWithoutRir = tooltipData.value.sets.filter(z => !z.rir).length;
            return (setsWithoutRir == tooltipData.value.sets.length);
        });

        const currentExerciseGuide = computed(() => {
            for (var i = 0; i < props.guides.length; i++) {
                if (props.guides[i].name == tooltipData.value.guideType)
                    return props.guides[i];
            }
            return props.guides[0]; // not found - return default (empty) guide
        });

        const colspan1 = computed(() => {
            let span = 3;
            if (!hideRirColumn.value)
                span += 1;
            if (currentExerciseGuide.value.weightType == "1RM")
                span += 1;
            return span;
        });

        const colspan2 = computed(() => {
            return props.showVolume ? 2 : 1;
        });

        const totalVolume = computed(() => {
            return _calculateTotalVolume(tooltipData.value);
        });

        const workSetsVolume = computed(() => {
            let workSets = tooltipData.value.sets.filter(z => z.type == "WK");
            let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
            return volume;
        });

        const maxEst1RM = computed(() => {
            return _calculateMax1RM(tooltipData.value.sets, props.oneRmFormula);
        });

        const debuggingInformation = ref("");
        const elementRef = ref(null);

        function moveTooltip(e: MouseEvent) {
            // `e.pageX` and `e.pageY` = mouse position within page (document)
            // `e.clientX` and `e.clientY` = mouse position within viewport
 
            let tooltip = elementRef.value as HTMLElement;

            let popupWidth = tooltip.clientWidth;
            let overflowX = (popupWidth + e.clientX + 5) > document.documentElement.clientWidth; // would it disappear off the right edge of the page?
            let leftPos = (overflowX ? e.pageX - popupWidth : e.pageX);
            if (leftPos < 0) leftPos = 0; // prevent tooltip from disappearing off left edge of screen
            tooltip.style.left = leftPos + "px";

            let popupHeight = tooltip.clientHeight;
            //method 1//var overflowY = (popupHeight + e.clientY + 15) > document.documentElement.clientHeight;
            //method 1//tooltip.style.top = (overflowY ? e.pageY - popupHeight - 10 : e.pageY + 10) + "px";
            //method 2//tooltip.style.top = (e.pageY - popupHeight - 10) + "px";
            let underflowY = (e.clientY - popupHeight) < 0; // would it disappear off the top of the page?
            tooltip.style.top = (underflowY ? e.pageY + 10 : e.pageY - popupHeight - 10) + "px";

            //debuggingInformation.value =
            //   `popupWidth = ${popupWidth}
            //    popupHeight = ${popupHeight}
            //    e.pageX = ${e.pageX}
            //    e.pageY = ${e.pageY}
            //    e.clientX = ${e.clientX}
            //    e.clientY = ${e.clientY}
            //    overflowX = ${overflowX}
            //    underflowY = ${underflowY}
            //    document.clientWidth = ${document.documentElement.clientWidth}`;
        }

        const tooltipVisible = ref(false);

        function show(recentWorkoutIdx: number, e: MouseEvent) { // this function is called by parent (via $refs) so name/params must not be changed
            tooltipIdx.value = recentWorkoutIdx;
            if (!tooltipVisible.value) {
                tooltipVisible.value = true;
                nextTick(() => { moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                moveTooltip(e);
            }
        }

        function hide() { // this function is called by parent (via $refs) so name/params must not be changed
            tooltipVisible.value = false;
        }

        return { elementRef, tooltipVisible, tooltipIdx, 
            debuggingInformation,
            colspan1, colspan2, tooltipData,
            currentExerciseGuide, maxEst1RM, 
            hideRirColumn, 
            totalVolume, workSetsVolume, 
            show, hide, // `show` and `hide` are called by parent component
        }
    }
});
</script>