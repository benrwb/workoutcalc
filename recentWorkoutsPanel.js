import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet } from './supportFunctions.js'
import gridRow from './gridRow.js'

export default {
    components: {
        gridRow
    },
    // Use "es6-string-html" VS Code extension to enable syntax highlighting on the string below.
    template: /*html*/`
    <div>
        <div v-show="recentWorkouts.length > 0">
            <h4 class="recent">Recent workouts</h4>
            <label>
                <input type="checkbox" v-model="filterActive" />
                Filter
            </label>
            <span v-if="!!daysSinceLastWorked" 
                style="margin-left: 50px; "
                v-bind:style="{ color: daysSinceLastWorked > 7 ? 'red' : '' }">
                        <span v-show="daysSinceLastWorked > 7"
                                title="Decreased performance; Increased DOMS">⚠️</span>{{ daysSinceLastWorked }} days since last worked
            </span>
            <table border="1" class="recent">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Exercise</th>
                        <!-- <th>Weight range</th>
                        <th>No. sets</th>
                        <th>Avg per set</th> -->
                        <!-- <th>Warm up</th> -->
                        <th>12 rep max</th>
                        <!-- <th>Total volume</th> -->
                        <th>{{ MAX_FOR_REPS_THRESHOLD }} rep max</th>
                        <!-- <th>Total reps</th> -->
                        <!-- <th>&gt;=8 reps avg.</th> -->
                        <th>Max attempted</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(summary, sidx) in recentWorkoutSummaries"
                        v-on:mousemove="showTooltip(sidx, $event)" v-on:mouseout="hideTooltip($event)"
                        v-show="sidx < numberOfRecentWorkoutsToShow || showAllPrevious">
                        <td>{{ summary.date | formatDate }}</td>
                        <td>{{ summary.name }}
                            <span v-if="!!summary.etag"
                                v-bind:title="tagList[summary.etag].description"
                                >{{ tagList[summary.etag].emoji }}
                            </span>
                        </td>
                        <!--<td class="r">{{ summary.lowestWeight }} → {{ summary.highestWeight }}</td> -->
                        <!--<td class="r">{{ summary.numberOfSets }}</td> -->
                        <!--<td class="r">{{ summary.averageVolumePerSet }}</td> -->
                        <!--<td class="r">e.g. "25x12"</td> -->
                        <!--<td class="r">e.g. "27.5x9"</td> -->
                        <!-- <td class="pre italic">{{ summary.warmUp }}</td> -->
                        <td class="pre italic">{{ summary.maxFor12 }}</td>
                        <!-- <td class="pre">{{ summary.totalVolume.toLocaleString() }}</td> -->
                        <!--                bold: summary.maxForRepsIsMultiple -->
                        <td v-bind:class="{ best: summary.isBestVolume }"
                            class="pre" 
                            >{{ summary.maxForReps }}</td>
                        <!-- TODO possible future development: add number of sets ??? -->
                        <!-- e.g. 30kg 3x8, or 25kg 4x8+ ??? -->
                        <!-- <td class="pre">{{ summary.totalReps }}</td> -->
                        <!-- <td v-bind:class="{ 'faded': summary.hyperLowReps }"
                            class="pre">{{ summary.hyperAverage }}</td> -->
                        <td v-bind:class="{ 'faded': summary.maxWeightSetCount == 1,
                                            'bold': summary.maxWeightSetCount >= 3,
                                            'best': summary.isBestIntensity }"
                            class="pre">{{ summary.maxAttempted }}</td>
                        <!-- TODO possible future development: "Avg rest time" ??? -->
                        <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>
                        <td v-show="!!summary.comments" v-bind:title="summary.comments">🗨</td>
                        <!-- Or a summary of the whole workout (25)12 (30)8/9 (32.5)4/4/4 -->
                    </tr>
                </tbody>
            </table>
            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->
            <!-- Rationale: There's no point looking at data from over a month ago. -->
            <!-- It's just additional "noise" that detracts from the main issue: -->
            <!-- Is progress being made week-on-week? -->
            <div v-show="recentWorkoutSummaries.length > numberOfRecentWorkoutsToShow && !showAllPrevious"
                v-on:click="showMore"
                style="font-size: 13px; padding: 3px 5px">
                    {{ recentWorkoutSummaries.length - numberOfRecentWorkoutsToShow }} more ▼
            </div>
        </div>

        <div id="tooltip" v-show="tooltipVisible">
            <table>
                <tr v-if="show1RM && !!tooltipData.ref1RM && tooltipData.ref1RM != tooltipData.maxEst1RM">
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
                </tr>
                <tr v-for="(set, setIdx) in tooltipData.sets"
                        is="grid-row" 
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show1-r-m="show1RM"
                        v-bind:ref1-r-m="!!tooltipData.ref1RM ? Math.max(tooltipData.ref1RM,tooltipData.maxEst1RM) : tooltipData.maxEst1RM"
                        v-bind:read-only="true"
                        v-bind:one-rm-formula="oneRmFormula">
                </tr>
                <tr><td style="padding: 0"></td></tr> <!-- fix for chrome (table borders) -->
                <tr style="border-top: double 3px black">
                    <td v-bind:colspan="show1RM ? 4 : 2">Total volume</td>
                    <td>{{ tooltipData.totalVolume.toLocaleString() }} kg</td>
                </tr>
                <tr>
                    <td v-bind:colspan="show1RM ? 4 : 2">Total reps</td>
                    <td>{{ tooltipData.totalReps }}</td>
                </tr>
                <tr>
                    <td v-bind:colspan="show1RM ? 4 : 2">Maximum weight</td>
                    <td>{{ tooltipData.highestWeight }}</td>
                </tr>

                <tr v-if="show1RM">
                    <td colspan="4">Max est. 1RM</td>
                    <td>{{ tooltipData.maxEst1RM }}</td>
                </tr>
            </table>
        </div>
    </div>
    `,
    props: {
        tagList: Object,
        show1RM: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array,
        currentExerciseName: String
    },
    data: function() {
        return {
            // MAX_FOR_REPS_THRESHOLD
            // I tried setting this to 12 for a while,
            // (sort of marking the halfway point in a workout),
            // but the problem with 12 is that there's no way to make
            // week-on-week progress (i.e. my 12RM doesn't improve every week).
            // Whereas setting it to less than 12 (8, for example) provides a goal
            // to aim for every workout (e.g. x8, x9, x10, x11, x12)
            MAX_FOR_REPS_THRESHOLD: 7,

            filterActive: true,
            numberOfRecentWorkoutsToShow: 4,
            showAllPrevious: false,
            
            tooltipVisible: false,
            tooltipIdx: -1,
        }
    },
    computed: {
        daysSinceLastWorked: function() {
            if (!this.filterActive) return "";
            if (this.recentWorkoutSummaries.length == 0) return "";
            var today = moment().startOf("day");
            var date = moment(this.recentWorkoutSummaries[0].date).startOf("day");
            return today.diff(date, 'days');
        },
        recentWorkoutSummaries: function() {
            var summaries = [];
            this.showAllPrevious = false;
            
            var bestVolume_MaxWeight = 0; 
            var bestVolume_MaxReps = 0; 
            var bestIntensity_MaxWeight = 0; 
            var bestIntensity_MaxReps = 0; 
            
            var self = this;
            this.recentWorkouts.forEach(function(exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterActive && exercise.name != self.currentExerciseName) return;

                // Warm up (first set)
                var warmUp = self.padx(exercise.sets[0].weight, exercise.sets[0].reps);

                // Max weight for a minimum of MAX_FOR_REPS_THRESHOLD reps
                var hyperWeight = exercise.sets
                    .filter(function(set) { return set.reps >= self.MAX_FOR_REPS_THRESHOLD }) // where reps >= MAX_FOR_REPS_THRESHOLD
                    .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
                var hyperSets = exercise.sets
                    .filter(function(set) { return set.weight == hyperWeight }) // where weight == hyperWeight
                var hyperMinReps = hyperSets
                    .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
                var hyperMaxReps = hyperSets
                    .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
                var hyperIsMultiple = hyperSets.length > 1;
                var hyperShowPlus = hyperIsMultiple && (hyperMinReps != hyperMaxReps);
                var hyperString = self.padx(hyperWeight, hyperMinReps + (hyperShowPlus ? "+" : ""));

                // Max weight for a minimum of 12 reps
                var hyper12 = self.summaryBuilder(exercise.sets, 12);

                // Best volume
                if (hyperWeight > bestVolume_MaxWeight) {
                    bestVolume_MaxWeight = hyperWeight;
                    bestVolume_MaxReps = hyperMaxReps;
                } 
                else if (hyperWeight == bestVolume_MaxWeight) {
                    if (hyperMaxReps > bestVolume_MaxReps) {
                        bestVolume_MaxReps = hyperMaxReps;
                    }
                }
                
                // Max weight (any number of reps)
                var maxWeight = exercise.sets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest value in array
                var maxSets = exercise.sets
                    .filter(function(set) { return set.weight == maxWeight }) // where weight == maxWeight
                var maxWeightMinReps = maxSets
                    .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
                var maxWeightMaxReps = maxSets
                    .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
                var maxWeightIsMultiple = maxSets.length > 1;
                var maxWeightShowPlus = maxWeightIsMultiple && (maxWeightMinReps != maxWeightMaxReps);
                var maxString = self.padx(maxWeight, maxWeightMinReps + (maxWeightShowPlus ? "+" : ""));

                // Best intensity
                if (maxWeight > bestIntensity_MaxWeight) {
                    bestIntensity_MaxWeight = maxWeight;
                    bestIntensity_MaxReps = maxWeightMaxReps;
                } 
                else if (maxWeight == bestIntensity_MaxWeight) {
                    if (maxWeightMaxReps > bestIntensity_MaxReps) {
                        bestIntensity_MaxReps = maxWeightMaxReps;
                    }
                }
                
                // Other bits
                var minWeight = exercise.sets.reduce(function(acc, set) { return Math.min(acc, set.weight) }, 9999); // lowest value in array
                var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0); // sum array

                //var volumeSets = exercise.sets
                //    .filter(function(set) { return set.reps >= self.MAX_FOR_REPS_THRESHOLD }); // where reps >= MAX_FOR_REPS_THRESHOLD
                //var volumeSumWeight = volumeSets
                //    .reduce(function(acc, set) { return acc + Number(set.weight) }, 0); // sum array
                //var volumeSumReps = volumeSets
                //    .reduce(function(acc, set) { return acc + Number(set.reps) }, 0); // sum array

                var maxEst1RM = exercise.sets
                    .map(function(set) { return _calculateOneRepMax(set, self.oneRmFormula) })
                    .filter(function(val) { return val > 0 }) // filter out error conditions
                    .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
                maxEst1RM = _roundOneRepMax(maxEst1RM);

                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "date": exercise.date,
                    "name": exercise.name,
                    "totalVolume": totalVolume,
                    "averageVolumePerSet": Math.round(totalVolume / exercise.sets.length),
                    "numberOfSets": exercise.sets.length,
                    "lowestWeight": minWeight, 
                    "highestWeight": maxWeight, 
                    "warmUp": warmUp,
                    "maxFor12": hyper12,
                    "maxForReps": hyperString,
                    "maxForRepsIsMultiple": hyperIsMultiple,
                    "maxAttempted": maxString != hyperString ? maxString : "-",
                    "maxWeightSetCount": maxSets.length,
                    "maxEst1RM": maxEst1RM,
                    "totalReps": totalReps,
                    "averageWeight": totalVolume / totalReps,
                    //"hyperAverage": volumeSets.length == 0 ? "-" : (volumeSumWeight / volumeSets.length).toFixed(1),
                    //"hyperLowReps": volumeSumReps < 25, // less than 25 reps
                    "comments": exercise.comments,
                    "etag": exercise.etag
                });
            });
            
            // All-time best
            for (var i = 0; i < summaries.length; i++) {
                var summary = summaries[i];
                var sets = this.recentWorkouts[summary.idx].sets;
                summary.isBestVolume = sets
                    .filter(function(set) { return set.weight == bestVolume_MaxWeight && set.reps == bestVolume_MaxReps })
                    .length > 0;
                summary.isBestIntensity = sets
                    .filter(function(set) { return set.weight == bestIntensity_MaxWeight && set.reps == bestIntensity_MaxReps })
                    .length > 0;
            }

            return summaries;
        },
        tooltipData: function() {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) { // outside array bounds
                return {
                    sets: [],
                    totalVolume: 0,
                    highestWeight: 0,
                    maxEst1RM: 0,
                    ref1RM: 0,
                    totalReps: 0
                }
            } else {
                var summaryItem = this.recentWorkoutSummaries[this.tooltipIdx];
                var sets = this.recentWorkouts[summaryItem.idx].sets;
                return {
                    sets: sets,
                    totalVolume: summaryItem.totalVolume,
                    highestWeight: summaryItem.highestWeight,
                    maxEst1RM: summaryItem.maxEst1RM,
                    ref1RM: summaryItem.maxEst1RM, // ignoring ref1RM for the moment // this.recentWorkouts[summaryItem.idx].ref1RM,
                    totalReps: summaryItem.totalReps
                };
            }
        },
    },
    methods: {
        showMore: function() {
            this.showAllPrevious = true;
        },
        removeRecent: function(idx) {
            if (confirm("Remove this item from workout history?")) {
                this.recentWorkouts[idx].name = "DELETE";
                localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
                this.dropboxSyncStage1();
            }
        },
        showTooltip: function(summaryItemIdx, e) {
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
        hideTooltip: function (e) {
            this.tooltipVisible = false;
        },
        padx: function(weight, reps) {
            if (!weight || !reps) return "";
            var strW = weight.toString();
            var strR = reps.toString();
            return strW.padStart(6) + " x " + strR.padEnd(5);
        },
        summaryBuilder: function(sets, threshold) {
            // Max weight for a minimum of {threshold} reps
            var hyperWeight = sets
                .filter(function(set) { return set.reps >= threshold }) // where reps >= MAX_FOR_REPS_THRESHOLD_2
                .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
            var hyperSets = sets
                .filter(function(set) { return set.weight == hyperWeight }) // where weight == hyperWeight
            var hyperMinReps = hyperSets
                .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
            var hyperMaxReps = hyperSets
                .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
            var hyperIsMultiple = hyperSets.length > 1;
            var hyperShowPlus = hyperIsMultiple && (hyperMinReps != hyperMaxReps);
            var hyperString = this.padx(hyperWeight, hyperMinReps + (hyperShowPlus ? "+" : ""));
            return hyperString;
        }
    }
}
