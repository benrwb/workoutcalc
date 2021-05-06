<template>
    <div>
        <div v-show="recentWorkouts.length > 0">

            <h4 class="recent">Recent workouts</h4>
            <label><input type="radio" v-model="filterType" value="nofilter" />No filter</label>
            <label><input type="radio" v-model="filterType" value="filter1"  />Filter 1</label>
            <label><input type="radio" v-model="filterType" value="filter2"  />Filter 2</label>
            <span v-if="!!daysSinceLastWorked" 
                style="margin-left: 50px; "
                v-bind:style="{ color: daysSinceLastWorked > 7 ? 'red' : '' }">
                        <span v-show="daysSinceLastWorked > 7"
                                title="Decreased performance; Increased DOMS">⚠️</span>{{ daysSinceLastWorked }} days since last worked
            </span>
            <span v-show="showAllPrevious == true"
                  style="font-size: 13px; margin-left: 20px"
                  v-on:click="showAllPrevious = false">
                  ▲ Hide
            </span>

            <table border="1" class="recent">
                <thead>
                    <tr>
                        <!--<th>Freq.</th>-->
                        <th>Date</th>
                        <th>Exercise</th>
                        <th>Gap</th><!-- days since last worked -->
                        <th style="min-width: 45px">Start@</th>
                        <th style="min-width: 45px">12 RM</th>
                        <!--<th>8 RM</th>-->
                        <!--<th>4 RM</th>-->
                        <th>Headline</th>
                        <th>Max</th>
                        <th v-if="show1RM && showGuide">Guide</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(summary, sidx) in recentWorkoutSummaries"
                        v-on:mousemove="showTooltip(sidx, $event)" v-on:mouseout="hideTooltip($event)"
                        v-bind:class="{ 'highlight': !!currentExerciseGuide && currentExerciseGuide == summary.exercise.guideType }">
                        
                        <!--  Days between      10    9    8    7    6    5    4    3    2   
                              Frequency (x/wk)  0.7  0.8  0.9  1.0  1.2  1.4  1.8  2.3  3.5  -->
                        <!--<td>{{ summary.Frequency }}x</td>-->

                        <td v-bind:title="summary.exercise.date | formatDate"
                            style="text-align: right">{{ summary.relativeDateString }}</td>
                       
                        <td>{{ summary.exercise.name }}
                            <span v-if="!!summary.exercise.etag"
                                  v-bind:title="tagList[summary.exercise.etag].description"
                                >{{ tagList[summary.exercise.etag].emoji }}
                            </span>
                        </td>

                        <td v-bind:class="{ 'faded': summary.daysSinceLastWorked >= 7 }"
                            style="text-align: right">{{ summary.daysSinceLastWorked || '' }}</td>
                        <!-- || '' in the line above will show an empty string instead of 0 -->

                        <td class="pre italic">{{ summary.warmUpWeight }}</td>

                        <td class="pre faded">{{ summary.maxFor12 }}</td>
                       
                        <!-- v-bind:class="{ best: summary.isBestVolume }" -->
                        <!--<td class="pre" v-bind:class="{ 'bold': summary.numSets8 >= 3 }"
                            >{{ summary.maxFor8 }}</td>-->

                        <!-- v-bind:class="{ 'best': summary.isBestIntensity } -->
                        <!--<td class="pre" v-bind:class="{ 'faded': summary.numSets4 == 1,
                                                         'bold': summary.numSets4 >= 3 }"
                            >{{ summary.maxFor4 }}</td>-->

                        <td class="pre" v-bind:class="{ 'faded': summary.numSetsHeadline == 1,
                                                         'bold': summary.numSetsHeadline >= 3 }"
                            >{{ summary.headline }}</td>

                        <td class="pre italic faded">{{ summary.maxAttempted }}</td>

                        <!-- TODO possible future development: "Avg rest time" ??? -->
                        
                        <td v-if="show1RM && showGuide" class="guide">{{ summary.exercise.guideType }}</td>

                        <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>

                        <td class="noborder" v-on:click="copySummaryToClipboard(summary)">📋</td>

                        <td v-show="!!summary.exercise.comments" v-bind:title="summary.exercise.comments">🗨</td>
                    </tr>
                </tbody>
            </table>
            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->
            <!-- Rationale: There's no point looking at data from over a month ago. -->
            <!-- It's just additional "noise" that detracts from the main issue: -->
            <!-- Is progress being made week-on-week? -->

            <div v-show="numberNotShown > 0"
                 style="font-size: 13px; padding: 3px 5px"
                 v-on:click="showAllPrevious = true">
                 {{ numberNotShown }} more ▼
            </div>
            <div v-show="showAllPrevious == true"
                  style="font-size: 13px; padding: 3px 5px"
                  v-on:click="showAllPrevious = false">
                  ▲ Hide
            </div>
        </div>
        
        <tool-tip 
            v-bind:recent-workout-summaries="recentWorkoutSummaries"
            v-bind:show1-r-m="show1RM"
            v-bind:show-volume="showVolume"
            v-bind:one-rm-formula="oneRmFormula"
            v-bind:guides="guides"
            ref="tooltip"
        ></tool-tip>


    </div>
</template>

<script lang="ts">
import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet, _generateExerciseText } from './supportFunctions'
import toolTip from './tool-tip.vue'
import Vue, { PropType } from './types/vue'
import * as moment from './types/moment'
import { RecentWorkout, RecentWorkoutSummary, Set, Guide } from './types/app'

export default Vue.extend({
    components: {
        toolTip
    },
    props: {
        tagList: Object,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String,
        showGuide: Boolean,
        guides: Object as PropType<Guide>,
        currentExerciseGuide: String,
        guideCategories: Object
    },
    data: function () {
        return {
            filterType: 'filter1', // either 'filter1', 'filter2', or 'nofilter'
            numberOfRecentWorkoutsToShow: 6,
            showAllPrevious: false,
            numberNotShown: 0
        }
    },
    watch: {
        filterType: function () {
            this.showAllPrevious = false; // reset to false when changing filter type
        }
    },
    computed: {
        daysSinceLastWorked: function (): number {
            var next = this.findNextOccurence(this.currentExerciseName, 0);
            if (next != null) {
                var today = moment().startOf("day");
                var date = moment(next.date).startOf("day");
                return today.diff(date, 'days');
            }
            return 0; // exercise not found
        },
        recentWorkoutSummaries: function (): RecentWorkoutSummary[] {
            var self = this;
            function isGuideMatch(guide: string) {
                if (self.guideCategories.hasOwnProperty(guide)
                 && self.guideCategories.hasOwnProperty(self.currentExerciseGuide)) {
                     // Category match (combine similar guides)
                    return self.guideCategories[guide] == self.guideCategories[self.currentExerciseGuide];
                } else {
                    // Category not available, use exact match
                    return guide == self.currentExerciseGuide;
                }
            }
            var summaries = [] as RecentWorkoutSummary[];
            var numberShown = 0;
            var lastDate = "";
            this.numberNotShown = 0;
            var today = moment().startOf('day');
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterType != "nofilter" && exercise.name != self.currentExerciseName) return;
                if (self.filterType == "filter2"  && !isGuideMatch(exercise.guideType)) return;

                var showThisRow = (numberShown++ < self.numberOfRecentWorkoutsToShow || self.showAllPrevious);
                // vvv BEGIN don't cut off a workout halfway through vvv
                if (showThisRow) {
                    lastDate = exercise.date;
                }
                if (self.filterType == "nofilter") {
                    if (lastDate == exercise.date) {
                        showThisRow = true;
                    }
                }
                // ^^^ END prevent cutoff ^^^s
                if (!showThisRow) {
                    self.numberNotShown++;
                    return;
                }

                 // BEGIN calculate "days since last worked" (for each row)
                 var daysSinceLastWorked = 0;
                 // Look for next occurence of this exercise
                 var next = self.findNextOccurence(exercise.name, exerciseIdx);
                 if (next != null) {
                     var date1 = moment(exercise.date).startOf("day");
                     var date2 = moment(next.date).startOf("day");
                     daysSinceLastWorked = date1.diff(date2, "days");
                     //frequency = (7 / daysSinceLastWorked).toFixed(1);
                 }
                 // END calculate "days since last worked" (for each row)

                // Warm up (first set)
                var warmUpWeight = exercise.sets[0].weight;
                //var warmUp = self.padx(exercise.sets[0].weight, exercise.sets[0].reps);

                // Max weight for a minimum of 12 reps
                var [maxFor12,numSets12,maxFor12weight] = self.summaryBuilder(exercise.sets, 12);

                 // Max weight for a minimum of 8 reps
                //var [maxFor8,numSets8] = self.summaryBuilder(exercise.sets, 8);

                // Max weight for a minimum of 4 reps
                //var [maxFor4,numSets4] = self.summaryBuilder(exercise.sets, 4);

                // Headline
                var [headline,numSetsHeadline,headlineWeight] = self.getHeadline(exercise.sets);

                // Extra bits for tooltip
                var maxWeight = exercise.sets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest value in array
                var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + set.reps }, 0); // sum array
                var maxEst1RM = exercise.sets
                    .map(function(set) { return _calculateOneRepMax(set, self.oneRmFormula) })
                    .filter(function(val) { return val > 0 }) // filter out error conditions
                    .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
                maxEst1RM = _roundOneRepMax(maxEst1RM);

                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType

                    "warmUpWeight": warmUpWeight,
                    "maxFor12": maxFor12weight,
                    //"maxFor8": maxFor8 != maxFor12 ? maxFor8 : "-",
                    //"maxFor4": maxFor4 != maxFor8 ? maxFor4 : "-",
                    "numSets12": numSets12,
                    //"numSets8": numSets8,
                    //"numSets4": numSets4,
                    "maxAttempted": headlineWeight == maxWeight ? "-" : maxWeight.toString(),

                    "headline": headline,
                    "numSetsHeadline": numSetsHeadline,

                    "totalVolume": totalVolume,
                    "volumePerSet": self.calculateVolumePerSet(exercise.sets), // for tooltip
                    "totalReps": totalReps, // for tooltip
                    "highestWeight": maxWeight, // for tooltip
                    "maxEst1RM": maxEst1RM, // for tooltip

                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": moment(exercise.date).from(today) // e.g. "5 days ago"
                });
            });
            
            return summaries;
        },
    },
    methods: {
        findNextOccurence: function (exerciseName: string, startIdx: number) {
            // (startIdx + 1) to skip current item
            // (startIdx + 20) for performance reasons (don't check whole list)
            for (var i = (startIdx + 1); i < (startIdx + 20); i++) {
                if (i >= this.recentWorkouts.length) {
                    return null; // hit end of array
                }
                if (this.recentWorkouts[i].name == exerciseName) {
                    return this.recentWorkouts[i]; // found
                }
            }
            return null; // not found
        },
        removeRecent: function (idx: number) {
            if (confirm("Remove this item from workout history?")) {
                this.recentWorkouts[idx].name = "DELETE";
                localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
                this.dropboxSyncStage1(); // TODO : THIS IS WRONG
            }
        },
        copySummaryToClipboard: function (summary: RecentWorkoutSummary) {
            var text = summary.exercise.date 
              + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
              + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
              + "\t" + summary.headline.trim() // trim() to remove padding
              + "\t" + (summary.exercise.guideType ? "Guide: " + summary.exercise.guideType + " reps" : "");
            navigator.clipboard.writeText(text).then(function () {
                //alert("success");
            }, function () {
                alert("failed to copy");
            });
        },
        padx: function (weight: number, reps: number) {
            if (!weight || !reps) return "";
            var strW = weight.toString();
            var strR = reps.toString();
            return strW.padStart(6) + " x " + strR.padEnd(5);
        },
        summaryBuilder: function (allSets: Set[], threshold: number): [string,number,number] {
            // Max weight for a minimum of {threshold} reps
            var weight = allSets
                .filter(function(set) { return set.reps >= threshold }) // where reps >= threshold
                .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
            var sets = allSets
                .filter(function(set) { return set.weight == weight }) // where set.weight == weight
            var minReps = sets
                .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
            var maxReps = sets
                .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
            var isMultiple = sets.length > 1;
            var showPlus = isMultiple && (minReps != maxReps);
            var displayString = this.padx(weight, minReps + (showPlus ? "+" : ""));
            return [displayString, sets.length, weight];
        },
        getHeadline: function (allSets: Set[]): [string,number,number] {
            var weights = allSets.map(function(set) { return set.weight });
            var mostFrequentWeight = weights.sort((a, b) =>
                weights.filter(v => v === a).length
                - weights.filter(v => v === b).length
             ).pop();
            var reps = allSets.filter(function(set) { return set.weight == mostFrequentWeight }).map(function(set) { return set.reps });
            reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
            reps = reps.slice(0, 3); // take top 3 items
            
            var maxReps = reps[0];
            var minReps = reps[reps.length - 1];
            var showPlus = maxReps != minReps;
            var displayString = this.padx(mostFrequentWeight, minReps + (showPlus ? "+" : ""));

            //var displayString = mostFrequentWeight.toString() + " x " + reps.join();
            return [displayString, reps.length, mostFrequentWeight];
        },
        calculateVolumePerSet: function (sets: Set[]) {
            var volumeSets = sets.filter(function(set) { return set.reps > 6 }); // volume not relevant for strength sets
            var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
            var volumePerSet = volumeSum / volumeSets.length;
            return Math.round(volumePerSet);
        },
        showTooltip: function (summaryItemIdx: number, e) {
            this.$refs.tooltip.show(summaryItemIdx, e);
        },
        hideTooltip: function () {
            this.$refs.tooltip.hide();
        }
    }
});
</script>