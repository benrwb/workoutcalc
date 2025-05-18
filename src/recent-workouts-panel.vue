<style>
    table.recent { 
        border-collapse: collapse;
        border: none;
    }
    table.recent th {
        background-color: #e6e6e6;
        color: #333;
        border-color: #e6e6e6;
    }
    table.recent th,
    table.recent td {
        padding: 3px 5px;
        font-size: 13px;
    }
    table.recent td {
        border: solid 1px #e6e6e6;
    }
    table.recent td.r {
        text-align: right;
    }
    table.recent td.c {
        text-align: center;
    }
    table.recent td.guide {
        min-width: 50px;
        font-size: 12px;
        text-align: center;
    }
    table.recent td.pre {
        text-align: center;
        white-space: pre;
        font-family: 'Lucida Console';
        font-size: 12px;
        padding-top: 4px;
    }
    table.recent td.bold {
        font-weight: bold;
    }
    table.recent .faded {
        color: darkgray;
    }
    table.recent td.best {
        position: relative; /* required because :after is position: absolute */
    }
    table.recent td.best:after {
        position: absolute;
        content: "🏆";
        left: 94px;
        top: 2px;
        /* stripe:   background: repeating-linear-gradient(135deg, transparent, transparent 10px, #ffd 10px, #ffd  20px); */
        /* triangle: background: linear-gradient(45deg, transparent 93%,orange 93%); */
        /* background-color: black;
        color: white; */
    }

    table.recent td.italic {
        font-style: italic;
    }

    table.recent td.noborder {
        border-top: solid 1px white;
        border-right: solid 1px white;
        border-bottom: solid 1px white;
        background-color: white;
        color: silver;
        cursor: default;
    }
    table.recent td.noborder:hover {
        background-color: red;
    }
    table.recent tr:hover td {
        background-color: #fe9;
        /* color: black; */
    }
    /* table.recent tr.highlight {
        background-color: #c1e3ef;
    } */

    h4.recent {
        color: #444;
        margin-bottom: 5px;
        /* margin-top: 50px; */
    }

    span.exceeded {
        background-color: palegreen;
        color: darkgreen;
        outline: solid 1.5px palegreen;
    }
    span.notmet {
        background-color: crimson;
        color: white;
        outline: solid 1.5px crimson;
    }
</style>

<template>
    <div>
        <div v-show="recentWorkouts.length > 0">

            <h4 class="recent">Recent workouts</h4>
            <label><input type="radio" v-model="filterType" value="nofilter" />All exercises</label>
            <label><input type="radio" v-model="filterType" value="filter1"  />Same exercise</label>
            <!-- <label><input type="radio" v-model="filterType" value="filter2"  />Same ex. &amp; reps</label> -->
            <label><input type="radio" v-model="filterType" value="filter3"  />Same ex. &gt;= weight</label>
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
                        <th colspan="3">
                            <span style="float: right">Gap</span>
                            Date
                        </th>
                        <th>Exercise</th>
                        <!-- <th style="min-width: 45px">Start@</th> -->
                        <!-- <th style="min-width: 45px">12 RM</th> -->
                        <!--<th>8 RM</th>-->
                        <!--<th>4 RM</th>-->
                        <th>Headline</th>
                        <!-- <th>Max</th> -->
                        <th>Guide</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(summary, sidx) in recentWorkoutSummaries"
                        v-on:mousemove="showTooltip(summary.idx, $event)" v-on:mouseout="hideTooltip">
                        <!-- v-bind:class="{ 'highlight': !!currentExerciseGuide && currentExerciseGuide == summary.exercise.guideType }" -->
                        
                        <!--  Days between      10    9    8    7    6    5    4    3    2   
                              Frequency (x/wk)  0.7  0.8  0.9  1.0  1.2  1.4  1.8  2.3  3.5  -->
                        <!--<td>{{ summary.Frequency }}x</td>-->

                        <!-- Relative date -->
                        <td v-bind:title="formatDate(summary.exercise.date)"
                            style="text-align: right">{{ summary.relativeDateString }}</td>
                        
                        <!-- Date -->
                        <td style="text-align: right">{{ formatDate(summary.exercise.date) }}</td>

                        <!-- Gap -->
                        <td v-bind:class="{ 'faded': summary.daysSinceLastWorked >= 7 }"
                            style="text-align: right">{{ summary.daysSinceLastWorked || '' }}</td>
                        <!-- || '' in the line above will show an empty string instead of 0 -->

                        <td>{{ summary.exercise.name }}</td>

                        <!-- <td class="pre italic">{{ summary.warmUpWeight }}</td> -->

                        <!-- <td class="pre faded">{{ summary.maxFor12 }}</td> -->
                       
                        <!-- v-bind:class="{ best: summary.isBestVolume }" -->
                        <!--<td class="pre" v-bind:class="{ 'bold': summary.numSets8 >= 3 }"
                            >{{ summary.maxFor8 }}</td>-->

                        <!-- v-bind:class="{ 'best': summary.isBestIntensity } -->
                        <!--<td class="pre" v-bind:class="{ 'faded': summary.numSets4 == 1,
                                                         'bold': summary.numSets4 >= 3 }"
                            >{{ summary.maxFor4 }}</td>-->
                        <!-- v-bind:class="{ 'exceeded': summary.repRangeExceeded }" -->
                        <td class="pre" v-bind:class="{ 'faded': summary.headlineNumSets == 1,
                                                         'bold': summary.headlineNumSets >= 3 }">
                            <span class="pre"
                                >{{ summary.headlineWeight.padStart(6) }} x {{ summary.headlineReps }} {{ ' '.repeat(5 - Math.min(5, summary.headlineReps.length)) }}
                            </span>
                        </td>

                        <!--<td class="pre">
                            <template v-if="summary.maxAttempted == summary.headlineWeight">
                                <span class="faded">-</span>
                            </template>
                            <template v-else>
                                <span class="pre"
                                    >{{ summary.maxAttempted.padStart(3) }} x </span><span 
                                class="pre notmet"
                                    >{{ summary.maxAttemptedReps }}</span><span
                                class="pre"
                                    >{{ ' '.repeat(2 - Math.min(2, summary.maxAttemptedReps.length)) }}</span>
                                 --><!-- Help link: also used in grid-row.vue --><!--
                                <a href="https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range"
                                   class="emoji" target="_blank">ℹ</a>
                            </template>
                        </td>-->

                        <!-- <td class="pre italic faded">{{ summary.maxAttempted }}</td> -->

                        <!-- TODO possible future development: "Avg rest time" ??? -->
                        
                        <td class="guide">{{ summary.exercise.guideType }}</td>

                        <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>

                        <!-- left-click: Copy this exercise only to the clipboard -->
                        <!-- right-click: Copy the whole workout to the clipboard -->
                        <td class="noborder" 
                            v-on:click="copyToClipboard(summary, false)"
                            v-on:contextmenu.prevent="copyToClipboard(summary, true)">📋</td>

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
        
    </div>
</template>

<script lang="ts">
import { _generateExerciseText, _formatDate, _calculateTotalVolume, _generateWorkoutText } from "./supportFunctions"
import { defineComponent, PropType, ref, watch, computed, Ref } from "vue"
import * as moment from "moment"
import { RecentWorkout, RecentWorkoutSummary, Set, Guide } from "./types/app"
import { _getHeadline } from "./headline";

export default defineComponent({
    props: {
        tagList: Object,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array as PropType<RecentWorkout[]>,
        currentExerciseName: String,
        currentExercise1RM: Number,
        currentExerciseGuide: String,
        guides: Array as PropType<Guide[]>
    },
    setup: function (props, context) {

        let DEFAULT_NUMBER_TO_SHOW = 6;
        let filterType = ref("filter1"); // either 'nofilter', 'filter1' or 'filter3' 
        let numberOfRecentWorkoutsToShow = ref(DEFAULT_NUMBER_TO_SHOW);

        function resetView() { 
            numberOfRecentWorkoutsToShow.value = DEFAULT_NUMBER_TO_SHOW;
        }

        watch(filterType, () => {
            resetView(); // reset view when changing filter type
        });

        watch(() => props.currentExerciseName, (newName) => {
            if (newName) { // don't change if exercise name is blank (e.g. after clearing the form)
                filterType.value = "filter1"; // change to "same exercise" view when switching between different exercises
            }
        })

        function findNextOccurence(exerciseName: string, startIdx: number) {
            // (startIdx + 1) to skip current item
            // (startIdx + 50) for performance reasons (don't check whole list)
            for (let i = (startIdx + 1); i < (startIdx + 50); i++) {
                if (i >= props.recentWorkouts.length) {
                    return null; // hit end of array
                }
                if (props.recentWorkouts[i].name == exerciseName) {
                    return props.recentWorkouts[i]; // found
                }
            }
            return null; // not found
        }

        const daysSinceLastWorked = computed(() => {
            let next = findNextOccurence(props.currentExerciseName, -1); // -1 to include the first item (idx 0)
            if (next != null) {
                let today = moment().startOf("day");
                let date = moment(next.date).startOf("day");
                return today.diff(date, 'days');
            }
            return 0; // exercise not found
        });
        
        function removeRecent(idx: number) {
            alert("TODO Not implemented");
            //if (confirm("Remove this item from workout history?")) {
            //    this.recentWorkouts[idx].name = "DELETE";
            //    localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
            //    this.dropboxSyncStage1(); // TODO : THIS IS WRONG
            //}
        }

        function copyToClipboard(summary: RecentWorkoutSummary, all: boolean) {
            let text = "";
            if (!all) {
                // Copy this exercise only to the clipboard
                text = summary.exercise.date 
                    + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
                    + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
                    + "\t" + summary.headlineWeight + " x " + summary.headlineReps
                    + "\t" + (summary.exercise.guideType ? "Guide: " + summary.exercise.guideType + (summary.exercise.guideType.includes("-") ? " reps" : "") : "");
            }
            else {
                // copy the whole workout to the clipboard
                let exercisesOnSameDate = recentWorkoutSummaries.value
                    .filter(z=>z.exercise.date == summary.exercise.date)
                    .map(z => z.exercise); // get all the exercises performed on this date
                exercisesOnSameDate.reverse(); // sort so that exercise #1 is at the top of the list
                text = _generateWorkoutText(exercisesOnSameDate);
            }
            navigator.clipboard.writeText(text).then(function () {
                //alert("success");
            }, function () {
                alert("failed to copy");
            });
        }

        function showTooltip(recentWorkoutIdx: number, e: MouseEvent) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }

        function hideTooltip() {
            context.emit("hide-tooltip");
        }

        function spanTitle(exercise: RecentWorkout) {
            let arr = [];
            if (exercise.etag) {
                arr.push(props.tagList[exercise.etag].emoji + " " + props.tagList[exercise.etag].description);
            }
            if (exercise.comments) {
                arr.push("🗨 \"" + exercise.comments + "\"");
            }
            return arr.join('\n');
        }

        const guideCategories = computed(() => {
            let guideCategories = {} as any;
            props.guides.forEach(guide =>
                guideCategories[guide.name] = guide.category
            );
            return guideCategories;
        });
        
        // These two reactive variables are updated by the watcher below
        const numberNotShown = ref(0);
        const recentWorkoutSummaries = ref([]) as Ref<RecentWorkoutSummary[]>;

        watch([() => props.recentWorkouts, filterType, numberOfRecentWorkoutsToShow], () => {
            function isGuideMatch(guide: string) {
                if (guideCategories.value.hasOwnProperty(guide)
                 && guideCategories.value.hasOwnProperty(props.currentExerciseGuide)) {
                     // Category match (combine similar guides)
                    return guideCategories.value[guide] == guideCategories.value[props.currentExerciseGuide];
                } else {
                    // Category not available, use exact match
                    return guide == props.currentExerciseGuide;
                }
            }
            let summaries = [] as RecentWorkoutSummary[];
            numberNotShown.value = 0;
            let numberShown = 0;
            let lastDate = "";
            let today = moment().startOf('day');
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (filterType.value != "nofilter" && exercise.name != props.currentExerciseName) return;
                if (filterType.value == "filter2"  && !isGuideMatch(exercise.guideType)) return;
                
                // Headline (need to do this first because its required for filter3)
                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(exercise);
                
                if (filterType.value == "filter3"  && !props.currentExercise1RM) return; // can't filter - 1RM box is empty
                if (filterType.value == "filter3"  && headlineWeight < props.currentExercise1RM) return;


                let showThisRow = (numberShown++ < numberOfRecentWorkoutsToShow.value);
                // vvv BEGIN don't cut off a workout halfway through vvv
                if (showThisRow) {
                    lastDate = exercise.date;
                }
                if (filterType.value == "nofilter") {
                    if (lastDate == exercise.date) {
                        showThisRow = true;
                    }
                }
                // ^^^ END prevent cutoff ^^^s
                if (!showThisRow) {
                    numberNotShown.value++;
                    return;
                }

                // BEGIN calculate "days since last worked" (for each row)
                let daysSinceLastWorked = 0;
                // Look for next occurence of this exercise
                let next = findNextOccurence(exercise.name, exerciseIdx);
                if (next != null) {
                    let date1 = moment(exercise.date).startOf("day");
                    let date2 = moment(next.date).startOf("day");
                    daysSinceLastWorked = date1.diff(date2, "days");
                    //frequency = (7 / daysSinceLastWorked).toFixed(1);
                }
                // END calculate "days since last worked" (for each row)

                // Warm up (first set)
                //var warmUpWeight = exercise.sets[0].weight;
                //var warmUp = self.padx(exercise.sets[0].weight, exercise.sets[0].reps);

                // Max weight for a minimum of 12 reps
                //var [maxFor12,numSets12,maxFor12weight] = self.summaryBuilder(exercise.sets, 12);

                // Max weight for a minimum of 8 reps
                //var [maxFor8,numSets8] = self.summaryBuilder(exercise.sets, 8);

                // Max weight for a minimum of 4 reps
                //var [maxFor4,numSets4] = self.summaryBuilder(exercise.sets, 4);

                
                // Max
                //let maxWeight = exercise.sets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
                //let maxWeightReps = exercise.sets.filter(set => set.weight == maxWeight)
                //                                 .reduce((acc, set) => Math.max(acc, set.reps), 0);

                // Volume (for when copying to clipboard)
                let totalVolume = _calculateTotalVolume(exercise);
                
                // Relative date string
                let relativeDateString = moment(exercise.date).from(today); // e.g. "5 days ago"
                if (relativeDateString == "a few seconds ago")
                    relativeDateString = "today";
                else if (relativeDateString == "a day ago")
                    relativeDateString = "yesterday";

                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType

                    //"warmUpWeight": warmUpWeight,
                    //"maxFor12": maxFor12weight == 0 ? "-" : maxFor12weight.toString(), // show "-" instead of 0
                    //"maxFor8": maxFor8 != maxFor12 ? maxFor8 : "-",
                    //"maxFor4": maxFor4 != maxFor8 ? maxFor4 : "-",
                    //"numSets12": numSets12,
                    //"numSets8": numSets8,
                    //"numSets4": numSets4,
                    //"maxAttempted": maxWeight.toString(),
                    //"maxAttemptedReps": maxWeightReps.toString(),

                    "headlineWeight": headlineWeight.toString(),
                    "headlineReps": repsDisplayString,
                    "headlineNumSets": headlineNumSets,
                    //"repRangeExceeded": repRangeExceeded,

                    "totalVolume": totalVolume,
                    //"volumePerSet": self.calculateVolumePerSet(exercise.sets), // for tooltip
                    //"totalReps": totalReps, // for tooltip
                    //"highestWeight": maxWeight, // for tooltip

                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": relativeDateString
                });
            });
            recentWorkoutSummaries.value = summaries;
            //return summaries;
        });

        return {filterType, numberOfRecentWorkoutsToShow, DEFAULT_NUMBER_TO_SHOW,
            daysSinceLastWorked, removeRecent, showTooltip, hideTooltip, spanTitle, copyToClipboard, resetView,
            recentWorkoutSummaries, numberNotShown,
            formatDate: _formatDate
        };
    }
    //methods: {
        // padx: function (weight: number, reps: string) {
        //     if (!weight || !reps) return "";
        //     var strW = weight.toString();
        //     var strR = reps.toString();
        //     return strW.padStart(6) + " x " + strR.padEnd(5);
        // },
        // summaryBuilder: function (allSets: Set[], threshold: number): [string,number,number] {
        //     // Max weight for a minimum of {threshold} reps
        //     var weight = allSets
        //         .filter(function(set) { return set.reps >= threshold }) // where reps >= threshold
        //         .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
        //     var sets = allSets
        //         .filter(function(set) { return set.weight == weight }) // where set.weight == weight
        //     var minReps = sets
        //         .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
        //     var maxReps = sets
        //         .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
        //     var isMultiple = sets.length > 1;
        //     var showPlus = isMultiple && (minReps != maxReps);
        //     var displayString = this.padx(weight, minReps + (showPlus ? "+" : ""));
        //     return [displayString, sets.length, weight];
        // },
    //}
});
</script>