<template>
    <div>
        <div v-show="recentWorkouts.length > 0">

            <h4 class="recent">Recent workouts</h4>
            <label><input type="radio" v-model="filterType" value="nofilter" />All exercises</label>
            <label><input type="radio" v-model="filterType" value="filter1"  />Same exercise</label>
            <label><input type="radio" v-model="filterType" value="filter2"  />Same ex. &amp; reps</label>
            <span v-if="!!daysSinceLastWorked" 
                style="margin-left: 50px; "
                v-bind:style="{ color: daysSinceLastWorked > 7 ? 'red' : '' }">
                        <span v-show="daysSinceLastWorked > 7"
                                title="Decreased performance; Increased DOMS">⚠️</span>{{ daysSinceLastWorked }} days since last worked
            </span>
            <span v-show="numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW"
                  style="font-size: 13px; margin-left: 20px"
                  v-on:click="resetView">
                  ▲ Reset view
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
                        v-on:mousemove="showTooltip(sidx, $event)" v-on:mouseout="hideTooltip"
                        v-bind:class="{ 'highlight': !!currentExerciseGuide && currentExerciseGuide == summary.exercise.guideType }">
                        
                        <!--  Days between      10    9    8    7    6    5    4    3    2   
                              Frequency (x/wk)  0.7  0.8  0.9  1.0  1.2  1.4  1.8  2.3  3.5  -->
                        <!--<td>{{ summary.Frequency }}x</td>-->

                        <td v-bind:title="_formatDate(summary.exercise.date)"
                            style="text-align: right">{{ summary.relativeDateString }}</td>
                       
                        <td>{{ summary.exercise.name }}
                            
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
                                                         'bold': summary.numSetsHeadline >= 3 }">
                            <span class="pre"
                                >{{ summary.headlineWeight.padStart(6) }} x </span><span 
                            class="pre" v-bind:class="{ 'exceeded': summary.repRangeExceeded }"
                                >{{ summary.headlineReps }}</span><span
                            class="pre"
                                >{{ ' '.repeat(5 - summary.headlineReps.length) }}</span>
                        </td>

                        <td class="pre italic faded">{{ summary.maxAttempted }}</td>

                        <!-- TODO possible future development: "Avg rest time" ??? -->
                        
                        <td v-if="show1RM && showGuide" class="guide">{{ summary.exercise.guideType }}</td>

                        <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>

                        <td class="noborder" v-on:click="copySummaryToClipboard(summary)">📋</td>

                        <td v-show="!!summary.exercise.etag || !!summary.exercise.comments"
                            v-bind:title="spanTitle(summary.exercise)">
                            <span v-if="!!summary.exercise.etag"
                                >{{ tagList[summary.exercise.etag].emoji }}
                            </span>
                            <span v-if="!!summary.exercise.comments" 
                                  >🗨</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->
            <!-- Rationale: There's no point looking at data from over a month ago. -->
            <!-- It's just additional "noise" that detracts from the main issue: -->
            <!-- Is progress being made week-on-week? -->

            <div style="font-size: 13px; padding: 0 5px">
                <span v-show="numberNotShown > 0"
                      v-on:click="numberOfRecentWorkoutsToShow += DEFAULT_NUMBER_TO_SHOW">
                      Show more ▼
                </span>
                <span v-show="numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW"
                      style="padding: 0 40px"
                      v-on:click="resetView">
                      Reset view ▲
                </span>
                <span v-show="numberNotShown > 0 && numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW"
                      v-on:click="numberOfRecentWorkoutsToShow += numberNotShown">
                      Show all {{ numberOfRecentWorkoutsToShow + numberNotShown }} 
                      <span style="font-weight: bold; font-size: 16px">⮇</span>
                </span>
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
import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet, _generateExerciseText, _formatDate } from './supportFunctions'
import ToolTip from './tool-tip.vue'
import Vue, { PropType } from './types/vue'
import * as moment from './types/moment'
import { RecentWorkout, RecentWorkoutSummary, Set, Guide } from './types/app'

export default Vue.extend({
    components: {
        ToolTip
    },
    props: {
        tagList: Object,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String,
        showGuide: Boolean,
        currentExerciseGuide: String,
        guides: Array as PropType<Guide[]>
    },
    data: function () {
        var DEFAULT_NUMBER_TO_SHOW = 6;
        return {
            filterType: 'filter1', // either 'filter1', 'filter2', or 'nofilter'
            numberOfRecentWorkoutsToShow: DEFAULT_NUMBER_TO_SHOW,
            numberNotShown: 0,
            DEFAULT_NUMBER_TO_SHOW: DEFAULT_NUMBER_TO_SHOW
        }
    },
    watch: {
        filterType: function () {
            this.resetView(); // reset view when changing filter type
        }
    },
    computed: {
        daysSinceLastWorked: function (): number {
            var next = this.findNextOccurence(this.currentExerciseName, -1); // -1 to include the first item (idx 0)
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

                var showThisRow = (numberShown++ < self.numberOfRecentWorkoutsToShow);
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
                var [headlineReps,numSetsHeadline,headlineWeight,repRangeExceeded] = exercise.guideType
                    ? self.getHeadlineFromGuide(exercise.guideType, exercise.sets)
                    : self.getHeadline(exercise.sets);

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
                    "maxFor12": maxFor12weight == 0 ? "-" : maxFor12weight.toString(), // show "-" instead of 0
                    //"maxFor8": maxFor8 != maxFor12 ? maxFor8 : "-",
                    //"maxFor4": maxFor4 != maxFor8 ? maxFor4 : "-",
                    //"numSets12": numSets12,
                    //"numSets8": numSets8,
                    //"numSets4": numSets4,
                    "maxAttempted": headlineWeight == maxWeight ? "-" : maxWeight.toString(),

                    "headlineWeight": headlineWeight.toString(),
                    "headlineReps": headlineReps,
                    "numSetsHeadline": numSetsHeadline,
                    "repRangeExceeded": repRangeExceeded,

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
        guideCategories: function () {
            var guideCategories = {} as any;
            this.guides.forEach(guide =>
                guideCategories[guide.name] = guide.category
            );
            return guideCategories;
        }
    },
    methods: {
        resetView: function () { 
            this.numberOfRecentWorkoutsToShow = this.DEFAULT_NUMBER_TO_SHOW;
        },
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
            alert("TODO Not implemented");
            //if (confirm("Remove this item from workout history?")) {
            //    this.recentWorkouts[idx].name = "DELETE";
            //    localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
            //    this.dropboxSyncStage1(); // TODO : THIS IS WRONG
            //}
        },
        copySummaryToClipboard: function (summary: RecentWorkoutSummary) {
            var text = summary.exercise.date 
              + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
              + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
              + "\t" + summary.headlineWeight + " x " + summary.headlineReps
              + "\t" + (summary.exercise.guideType ? "Guide: " + summary.exercise.guideType + " reps" : "");
            navigator.clipboard.writeText(text).then(function () {
                //alert("success");
            }, function () {
                alert("failed to copy");
            });
        },
        padx: function (weight: number, reps: string) {
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
        getHeadline: function (allSets: Set[]): [string,number,number,boolean] {
            var weights = allSets.map(set => set.weight);
            var mostFrequentWeight = weights.sort((a, b) =>
                weights.filter(v => v === a).length
                - weights.filter(v => v === b).length
             ).pop();
            var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
            return this.getHeadline_internal(mostFrequentWeight, reps, false);
        },
        getHeadlineFromGuide: function (guideName: string, allSets: Set[]): [string,number,number,boolean] {
            if (!guideName) return ['', 0, 0, false];
            var guideParts = guideName.split('-');
            if (guideParts.length != 2) return ['', 0, 0, false];

            var guideLowReps = Number(guideParts[0]);
            var guideHighReps = Number(guideParts[1]);

            // Only look at sets where the number of reps is *at least* what the guide says
            var matchingSets = allSets.filter(set => set.reps >= guideLowReps);
            
            // Then look at the set(s) with the highest weight
            var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
            matchingSets = matchingSets.filter(set => set.weight == maxWeight);

            // Get reps for matching sets
            var reps = matchingSets.map(set => set.reps);
            var repRangeExceeded = Math.max(...reps) >= guideHighReps;
            return this.getHeadline_internal(maxWeight, reps, repRangeExceeded);
        },
        getHeadline_internal: function (weight: number, reps: number[], rre: boolean): [string,number,number,boolean] {
            reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
            //reps = reps.slice(0, 3); // take top 3 items

            var maxReps = reps[0];
            var minReps = reps[reps.length - 1];
            //var showPlus = maxReps != minReps;
            //var displayString = this.padx(weight, minReps + (showPlus ? "+" : ""));
            var showMinus = maxReps != minReps;
            //var displayString = this.padx(weight, maxReps + (showMinus ? "-" : ""));
            var displayReps = maxReps + (showMinus ? "-" : "");

            return [displayReps, reps.length, weight, rre];
        },
        calculateVolumePerSet: function (sets: Set[]) {
            var volumeSets = sets.filter(function(set) { return set.reps > 6 }); // volume not relevant for strength sets
            var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
            var volumePerSet = volumeSum / volumeSets.length;
            return Math.round(volumePerSet);
        },
        showTooltip: function (summaryItemIdx: number, e: MouseEvent) {
            var tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.show(summaryItemIdx, e);
        },
        hideTooltip: function () {
            var tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.hide();
        },
        spanTitle: function (exercise: RecentWorkout) {
            var arr = [];
            if (exercise.etag) {
                arr.push(this.tagList[exercise.etag].emoji + " " + this.tagList[exercise.etag].description);
            }
            if (exercise.comments) {
                arr.push("🗨 \"" + exercise.comments + "\"");
            }
            return arr.join('\n');
        },
        _formatDate: _formatDate
    }
});
</script>