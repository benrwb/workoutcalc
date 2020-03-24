import { _calculateOneRepMax, _roundOneRepMax, _volumeForSet } from './supportFunctions.js'
import toolTip from './toolTip.js'

export default {
    components: {
        toolTip
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
                        <th style="min-width: 45px">Start@</th>
                        <th style="min-width: 45px">12 RM</th>
                        <!--<th>8 RM</th>-->
                        <!--<th>4 RM</th>-->
                        <th>Headline</th>
                        <th>Max</th>
                        <th v-if="showGuide">Guide</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(summary, sidx) in recentWorkoutSummaries"
                        v-on:mousemove="showTooltip(sidx, $event)" v-on:mouseout="hideTooltip($event)"
                        v-bind:class="{ 'highlight': currentExerciseGuide == summary.exercise.guideType }"
                        v-show="sidx < numberOfRecentWorkoutsToShow || showAllPrevious">
                        
                        <td>{{ summary.exercise.date | formatDate }}</td>
                        <td>{{ summary.exercise.name }}
                            <span v-if="!!summary.exercise.etag"
                                v-bind:title="tagList[summary.exercise.etag].description"
                                >{{ tagList[summary.exercise.etag].emoji }}
                            </span>
                        </td>

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
                        
                        <td v-if="showGuide" class="guide">{{ summary.exercise.guideType }}</td>

                        <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>

                        <td v-show="!!summary.exercise.comments" v-bind:title="summary.exercise.comments">🗨</td>
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

        <tool-tip 
            v-bind:recent-workout-summaries="recentWorkoutSummaries"
            v-bind:show1-r-m="show1RM"
            v-bind:show-volume="showVolume"
            v-bind:one-rm-formula="oneRmFormula"
            v-bind:guides="guides"
            ref="tooltip"
        ></tool-tip>


    </div>
    `,
    props: {
        tagList: Object,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array,
        currentExerciseName: String,
        showGuide: Boolean,
        guides: Object,
        currentExerciseGuide: String
    },
    data: function() {
        return {
            filterActive: true,
            numberOfRecentWorkoutsToShow: 6,
            showAllPrevious: false
        }
    },
    computed: {
        daysSinceLastWorked: function() {
            if (!this.filterActive) return "";
            if (this.recentWorkoutSummaries.length == 0) return "";
            var today = moment().startOf("day");
            var date = moment(this.recentWorkoutSummaries[0].exercise.date).startOf("day");
            return today.diff(date, 'days');
        },
        recentWorkoutSummaries: function() {
            var summaries = [];
            this.showAllPrevious = false;
            var self = this;
            this.recentWorkouts.forEach(function(exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterActive && exercise.name != self.currentExerciseName) return;

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
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0); // sum array
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
                    "maxAttempted": headlineWeight == maxWeight ? "-" : maxWeight,

                    "headline": headline,
                    "numSetsHeadline": numSetsHeadline,

                    "totalVolume": totalVolume, // for tooltip
                    "volumePerSet": self.calculateVolumePerSet(exercise.sets), // for tooltip
                    "totalReps": totalReps, // for tooltip
                    "highestWeight": maxWeight, // for tooltip
                    "maxEst1RM": maxEst1RM // for tooltip
                });
            });
            
            return summaries;
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
        padx: function(weight, reps) {
            if (!weight || !reps) return "";
            var strW = weight.toString();
            var strR = reps.toString();
            return strW.padStart(6) + " x " + strR.padEnd(5);
        },
        summaryBuilder: function(allSets, threshold) {
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
        getHeadline: function(allSets) {
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
        calculateVolumePerSet: function(sets) {
            var volumeSets = sets.filter(function(set) { return set.reps > 6 }); // volume not relevant for strength sets
            var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
            var volumePerSet = volumeSum / volumeSets.length;
            return Math.round(volumePerSet);
        },
        showTooltip: function(summaryItemIdx, e) {
            this.$refs.tooltip.show(summaryItemIdx, e);
        },
        hideTooltip: function () {
            this.$refs.tooltip.hide();
        },
    }
}