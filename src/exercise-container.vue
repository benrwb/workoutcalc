<style>
    .maintable {
        border-collapse: collapse;
        margin: 5px 0px;
    }
    .maintable td {
        text-align: right;
        border: none;
        padding-right: 5px;
    }
    .maintable td.border {
        border: solid 1px silver;
        padding-right: 0px;
    }
    .maintable td.score {
        color: gray;
        padding-right: 10px;
    }

    input.missing {
        background-color: #fee;
    }

    div.lastweekscomment-container {
        margin: 20px 0;
        font-size: 11px;
        color: #888;
    }
    @media (max-width: 768px) {
        div.lastweekscomment-container {
            margin-left: 25px;
            margin-top: 10px;
        }
    }
    div.lastweekscomment {
        background-color: #ddd; 
        color: #555; 
        width: 220px; 
        border-radius: 4px;
        padding: 4px 6px;
        vertical-align: top;
        display: inline-block;
    }
    span.lastweekscomment-label {
        display: inline-block;
        margin-top: 3px;
        margin-right: 4px;
    }

    /* .showonhover {
        opacity: 0;
    }
    .showonhover:hover {
        opacity: 1;
    } */

    .exercise-name-input {
        width: 225px;
    }
    .guide-label {
        width: 120px;
        display: inline-block;
        text-align: right;
    }
    .goal-input {
        width: 125px;
    }
    .comment-box { width: 300px; }
    .next-box { width: 140px; }

    @media (max-width: 768px) {
        /* reduce width of exercise-name-input on mobile */
        .exercise-name-input {
            width: 180px;
        }
        /* reduce amount of padding (width) of guide-label on mobile  */
        .guide-label {
            width: unset;
        }
        /* reduce width of goal-input on mobile */
        .goal-input {
            width: 102px;
        }
        /* reduce width of comment-box on mobile */
        .comment-box { width: 200px; }
        /* reduce width of next-box on mobile */
        .next-box { width: 120px; }
    }

    .deload-stripes {
        background-image: linear-gradient(
            135deg, 
            rgba(255, 255, 255, 0.6) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.6) 50%, 
            rgba(255, 255, 255, 0.6) 75%, 
            transparent 75%, 
            transparent
        );
        
        /* Adjust this to change how thick the stripes are */
        background-size: 30px 30px;

        /* This forces the pattern to align across all elements */
        background-attachment: fixed;
    }

    div.leftline {
        width: 10px;
        left: -10px;
        top: 5px;
        height: calc(100% - 5px);
        position: absolute;
        z-index: -1;
    }
    div.leftline.weekreps0,
    div.header-highlight.weekreps0 {
        background-color: #eee; /* to make the background of a selected exercise
                                     gray instead of white (for exercises without a guide) */
    }

</style>

<template>
<div>
    <div class="leftline"
        :class="highlightClasses">
    </div>

    <div style="display: inline-block; border-bottom: solid 2px #ddd"
         v-on:click="divClicked">
         
        <div class="header-highlight"
            :class="highlightClasses"><!-- to highlight the selected exercise -->

            <div style="padding-top: 10px; margin-top: 5px; margin-bottom: 2px; font-weight: bold">
                Exercise
                <input type="text" v-model="exercise.number" style="width: 30px; font-weight: bold" />:
                <input type="text" v-model="exercise.name"   class="exercise-name-input"
                    list="exercise-names" autocapitalize="off" />
            </div>

            <div style="padding-bottom: 5px; margin-bottom: 10px; font-size: 14px">
                <!-- Guide -->
                <span>
                    <label class="guide-label">Guide:&nbsp;</label>
                    <select v-model="exercise.guideType">
                            <option v-for="guide in guides"
                                    v-bind:key="guide.name"
                                    v-bind:value="guide.name"
                                    v-bind:style="{ 'color': guide.weightType == '1RM' ? 'dodgerblue' : '' }">
                                {{ guide.name + (isDigit(guide.name[0]) ? " reps" : "") }}
                            </option>
                    </select>
                </span>

                <!-- Reference -->
                <span v-if="false"><!-- v-if="currentExerciseGuide.weightType" -->

                    <template v-if="currentExerciseGuide.weightType == 'WORK'">
                        <label style="margin-left: 20px">Work weight:
                        </label>
                        <span v-if="unroundedWorkWeight"
                            style="position: absolute; margin-top: 30px; width: 69px; text-align: right; color: pink">
                            {{ unroundedWorkWeight.toFixed(2) }}
                        </span>
                        <number-input v-model="roundedWorkWeight" style="width: 65px" class="verdana"
                                    v-bind:class="{ 'missing': enterWeightMessage }" /> kg
                    </template>

                    <template v-if="currentExerciseGuide.weightType == '1RM'">
                        <label style="margin-left: 20px">1RM: 
                        </label>
                        <number-input v-model="exercise.ref1RM" style="width: 65px" class="verdana"
                                    v-bind:class="{ 'missing': enterWeightMessage }" /> kg
                    </template>

                    <!-- <button style="padding: 3px 5px"
                            v-on:mousedown.prevent="guessWeight"
                            v-on:contextmenu.prevent
                            >Guess</button> -->
                            <!-- hidden feature: different mouse button = different target
                                                * left = average of last 10
                                                * middle = midpoint between average and max
                                                * right = max of last 10 -->
                    <span v-if="currentExerciseGuide.weightType == 'WORK' && exercise.ref1RM"
                        style="color: pink"> 1RM = {{ exercise.ref1RM.toFixed(1) }}</span>
                </span>

                <label style="margin-left: 11px">Goal:&nbsp;</label>

                <!-- Note that `goal` is saved into `exercise`, 
                    which means that it will persist between page reloads.
                    (because of workout-calc/saveCurrentWorkoutToLocalStorage)
                    It *won't* however be saved to workouts.json,
                    because it's not listed in workout-calc/saveCurrentWorkoutToHistory() -->
                <input type="text" class="goal-input" v-model="exercise.goal" />
            </div>
        </div><!-- /headerHighlightClass -->

        <div v-if="lastWeeksComment"
             class="lastweekscomment-container"> 
                <span class="lastweekscomment-label">🗨 Last week's comment:</span>
                <div class="lastweekscomment">{{ lastWeeksComment }}</div>
                <!-- <button v-if="!exercise.goal"
                        v-bind:disabled="goalNumbers.length != 2"
                        style="margin-left: 5px"
                        v-on:click="getNextWeight">Apply</button> -->
        </div>

        <div v-if="enterWeightMessage"
                style="background-color: pink; padding: 10px 20px; color: crimson; display: inline-block; border-radius: 5px; margin-left: 88px; margin-bottom: 20px">
            {{ enterWeightMessage }}
        </div>

        <div v-show="!enterWeightMessage" >
            <table class="maintable">
                <thead>
                    <tr>
                        <th v-if="currentExerciseGuide.weightType == '1RM'" class="smallgray">%1RM</th>
                        <th>Set</th>
                        <!-- <th v-if="show1RM && showGuide">Guide</th> -->
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>RIR</th>
                        <th>Rest</th>
                        <th class="smallgray" style="min-width: 45px">
                            <!-- {{ showRI ? "%RI" : "Est 1RM" }} -->
                            Est 1RM
                        </th>
                        <th v-if="showVolume" class="smallgray">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    <grid-row v-for="(set, setIdx) in exercise.sets"
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show-volume="showVolume"
                        v-bind:ref1-r-m="exercise.ref1RM"
                        v-bind:read-only="false"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:guide-name="exercise.guideType"
                        v-bind:guide="currentExerciseGuide"
                        v-bind:exercise="exercise"
                        v-bind:rest-timer="restTimers.length <= setIdx ? 0 : restTimers[setIdx]"
                        v-on:reps-entered="setRestTimeCurrentSet(setIdx + 1)"
                        v-bind:goal-work-set-reps="goalWorkSetReps"
                        v-bind:goal-work-set-weight="referenceWeightForGridRow"
                        @delete-set="deleteSet($event)"
                        >
                   <!-- v-bind:reference-weight="referenceWeightForGridRow" -->
                   <!-- v-model:show-r-i="showRI" -->
                    </grid-row>
                    <tr>
                        <!-- <td v-if="show1RM"></td> -->
                        <td style="vertical-align: top; padding-top: 3px;">
                            <button v-on:click="addSet">+</button>
                        </td>
                        <td colspan="5" class="verdana"
                            style="text-align: left">

                            <button v-on:click="showNotes = !showNotes"
                                    style="margin-right: 5px">📝</button>
                                    
                            <span v-if="exercise.goal || exercise.next || showNotes"
                                  style="display: inline-block; padding-top: 15px">
                                <span style="font-size: 12.5px">Next: </span>
                                <input type="text" v-model="exercise.next" 
                                       class="next-box" style="font-size: smaller"
                                       placeholder="weight x reps" />
                                <button v-if="!exercise.next"
                                        @click="guessNext">Guess</button>
                            </span>
                        </td>
                    </tr>
                    <tr v-if="showNotes">
                        <td colspan="6">
                            <!-- <span style="font-size: smaller">Comment:</span> -->
                            <input type="text" v-model="exercise.comments" 
                                    class="comment-box"
                                    style="font-size: smaller"
                                    placeholder="Comment" />
                            
                            <span style="font-size: smaller">&nbsp;&nbsp;Tag:</span>
                            <!-- (this helps put the workout "headlines" in context) -->
                            <select v-model="exercise.etag"
                                    style="vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px">
                                <option v-bind:value="0"></option>
                                <option v-for="(value, key) in tagList"
                                        v-bind:value="key"
                                    >{{ value.emoji }} - {{ value.description }}</option>
                            </select>
                        </td>
                    </tr>
                    <tr v-if="showVolume">
                        <td></td>
                        <td colspan="5"
                            style="text-align: left; padding-left: 40px">
                            <span v-if="showVolume"
                                class="smallgray"
                                style="padding-right: 10px">
                                    Total volume: {{ totalVolume }}
                            </span>
                            <!-- Headline -->
                            <!-- <span v-show="showNotes"
                                style="padding: 0 5px; font-size: 11px"
                                v-bind:style="{ 'opacity': currentExerciseHeadline.numSets <= 1 ? '0.5' : null,
                                            'font-weight': currentExerciseHeadline.numSets >= 3 ? 'bold' : null }"
                                v-bind:class="'weekreps' + currentExerciseHeadline.reps"
                                >Headline: {{ currentExerciseHeadline.headline }}
                            </span> -->
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 7px"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
</template>

<script lang="ts">
    import { defineComponent, PropType, computed, watch, onMounted, onBeforeUnmount, ref, toRef } from "vue";
    import { Exercise, RecentWorkout, Guide } from './types/app';
    import { _getHeadline } from "./headline";
    import { _newExercise, _newSet, _volumeForSet, _calculateMax1RM, _oneRmToRepsWeight, _roundGuideWeight, _calculateAvg1RM, _arrayAverage, _getIncrement, _smallDecrement, _smallIncrement } from './supportFunctions'
    import { globalState } from "./globalState";
    import { _useGuideParts } from "./guide";
    import { _newExerciseFromGuide } from "./presets";

    export default defineComponent({
        props: {
            exercise: { 
                type: Object as PropType<Exercise>, 
                required: true 
            },
            recentWorkouts: Array as PropType<RecentWorkout[]>,
            showVolume: Boolean,
            guides: Array as PropType<Guide[]>,
            oneRmFormula: String,
            tagList: Object,
            weekNumber: Number,
            getNextExerciseNumber: Function,
            showBackgroundHighlight: Boolean
        },
        setup(props, context) {
            
            // See also presets.ts / extractGoalFromPreviousComment
            const lastWeeksComment = computed(() => {
                let found = props.recentWorkouts.find(z => z.name == props.exercise.name);
                if (found != null) {
                    return found.comments;
                } else {
                    return null;
                }
            });

            // WORK IN PROGRESS //function getLastWeeksGoal() {
            // WORK IN PROGRESS //    let found = props.recentWorkouts.find(z => z.name == props.exercise.name);
            // WORK IN PROGRESS //    if (found && found.goal) {
            // WORK IN PROGRESS //        return found.goal;
            // WORK IN PROGRESS //    } else {
            // WORK IN PROGRESS //        return null;
            // WORK IN PROGRESS //    }
            // WORK IN PROGRESS //}
            // See also presets.ts / extractGoalFromPreviousComment
            //const goalNumbers = computed(() => {
            //    // extract goal weight and reps from last week's comment
            //    // comment must be in the format "next: weight x reps (optional comment)"
            //    if (!lastWeeksComment.value) return [];
            //    const match = lastWeeksComment.value.match(/next:\s*([\d.]+)\s*x\s*(\d+)/i);
            //    // /next:\s* — Matches "next:" (case-insensitive due to /i flag) with optional whitespace.
            //    // ([\d.]+) — Captures the first number (integer or decimal).
            //    // \s*x\s* — Matches "x" with optional spaces around it.
            //    // (\d+) — Captures the second number (only integers).
            //    if (match) {
            //        return [parseFloat(match[1]), parseInt(match[2], 10)];
            //    }
            //    return [];
            //});

            // See also presets.ts / extractGoalFromPreviousComment
            //function getNextWeight() {
            //    if (goalNumbers.value.length == 2) {
            //        roundedWorkWeight.value = globalState.calcWeight = goalNumbers.value[0];
            //        props.exercise.goal = goalNumbers.value[0] + " x " + goalNumbers.value[1];
            //    }
            //}

            function addSet() {
                //if (confirm("Are you sure you want to add a new set?")) {
                    props.exercise.sets.push(_newSet("WK"));
                //}
            }

            function deleteSet(setIdx: number) {
                props.exercise.sets.splice(setIdx, 1);
            }

            const currentExerciseHeadline = computed(() => {
                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(props.exercise);
                return {
                    headline: headlineNumSets == 0 ? "None" 
                            : headlineWeight + " x " + repsDisplayString,
                    numSets: headlineNumSets,
                    reps: headlineReps
                };
            });

            const currentExerciseGuide = computed(() => {
                let found = props.guides.find(g => g.name == props.exercise.guideType);
                return found || props.guides[0]; // fallback to default (empty) guide if not found
            });


            const enterWeightMessage = computed(() =>  {
                return ""; // TODO maybe base this on "Goal" instead?
                if (totalVolume.value == 0) {
                    // ^^^ only show this message when the exercise is empty
                    //    (to avoid showing it after a page refresh
                    //     when the exercise is populated
                    //     but the work weight is cleared)
                    if (currentExerciseGuide.value.weightType == "1RM"
                        && !props.exercise.ref1RM) {
                        return "Enter 1RM";
                    }
                    else if (currentExerciseGuide.value.weightType == "WORK"
                        && !roundedWorkWeight.value) {
                        return "Enter a work weight";
                    }
                }
                return ""; // false when evaluated as a boolean (falsy)
            });

            function isDigit (str: string): boolean {
                if (!str) return false;
                return str[0] >= '0' && str[0] <= '9';
            }

            const totalVolume = computed(() => {
                return props.exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
            });

            function divClicked() {
                context.emit("select-exercise"); // handled by <workout-calc> (parent component)
                // BEGIN update calculators
                if (currentExerciseGuide.value.weightType == "1RM") {
                    globalState.calc1RM = props.exercise.ref1RM;
                    globalState.calcWeight = convert1RMtoWorkSetWeight(props.exercise.ref1RM);
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    globalState.calc1RM = props.exercise.ref1RM;
                    globalState.calcWeight = referenceWeightForGridRow.value ;// roundedWorkWeight.value;
                }
                else {
                    globalState.calcWeight = 0;
                    globalState.calc1RM = 0;
                }
                // END update calculators
            }

            watch(() => props.exercise.guideType, () => {
                if (totalVolume.value == 0) {
                    // guide changed and the exercise is empty, so reset it
                    // (i.e. add the appropriate number/type of sets, depending on the selected guide)
                    let guide = props.guides.find(g => g.name == props.exercise.guideType);
                    if (guide) {
                        props.exercise.sets = _newExerciseFromGuide(guide, props.exercise.number, props.exercise.name).sets;
                    }
                }
            });

            // BEGIN rest timer
            let referenceTime = 0; // the time the previous set was completed
            let currentSet = 0; // current index into `restTimers` array, updated when <grid-row> emits `reps-entered` event
            function setRestTimeCurrentSet(setIdx: number) {
                currentSet = setIdx;
                referenceTime = new Date().getTime();
            }
            const restTimers = ref([]); // array of rest times (in seconds) for each set
            function everySecond() {
                while(restTimers.value.length <= currentSet)
                    restTimers.value.push(0); // add extra items to array as required
                restTimers.value[currentSet] = (new Date().getTime() - referenceTime) / 1000; // calculate difference between `referenceTime` and current time
            }
            let timerId = 0;
            onMounted(() => {
                timerId = setInterval(everySecond, 1000);
            });
            onBeforeUnmount(() => {
                clearInterval(timerId);
            });
            function shouldShowNotes() { 
                return !!props.exercise.comments // show if comments have been written... (e.g. on page refresh)
                // OLD ////|| (lastWeeksComment.value || "").toLowerCase().startsWith("next:"); // ...or if there was a "next:" comment last week
                // OLD //|| props.exercise.guideType.startsWith("Double") // show the box to remind the...
                // OLD //|| props.exercise.guideType.startsWith("Wave"); // ...user to set a goal for next time
            }
            const showNotes = ref(shouldShowNotes());
            watch(() => props.exercise, () => {
                // exercise changed (e.g. new workout started),
                // so clear rest times
                restTimers.value = [];
                currentSet = 0;
                unroundedWorkWeight.value = 0;
                roundedWorkWeight.value = 0;
                showNotes.value = shouldShowNotes();
            });
            // END rest timer

            const unroundedWorkWeight = ref(0);
            const roundedWorkWeight = ref(0);

            function convert1RMtoWorkSetWeight(averageMax1RM: number) {
                // a similar method is used in <grid-row> component 
                let percentage = currentExerciseGuide.value.workSets[0]; // e.g. 0.60 = 60% of 1RM
                let unrounded = averageMax1RM * percentage;
                let rounded = _roundGuideWeight(unrounded, props.exercise.name); // rounded to nearest 2 or 2.5
                return rounded;
            }

            // function calculateTop3(arr: number[]) {
            //     // Calculate the average of the top 3 values in an array
            //     arr.sort((a, b) => b - a); // sort descending
            //     return calculateAverage(arr.slice(0, 3));
            // }

            //function calculateMidpoint(arr: number[]) {
            //    // Calculate the mid-point between the average and the maximum value
            //    let average = _arrayAverage(arr);
            //    let maxValue = Math.max(...arr);
            //    return average + ((maxValue - average) / 2);
            //}


           
            function guessWeight(event: MouseEvent) {
                let prevMaxes = []; // maximum 1RMs
                let count = 0;
                unroundedWorkWeight.value = 0;
                roundedWorkWeight.value = 0;
                
                // Get last 10 Max1RM's for this exercise
                for (const exercise of props.recentWorkouts) {
                    if (exercise.name == props.exercise.name) {
                        prevMaxes.push(_calculateMax1RM(exercise.sets, props.oneRmFormula));
                        count++;
                    }
                    if (count == 10) break; // look at previous 10 attempts at this exercise only
                }

                // Get the 1RM
                // (using the *maximum* value, because many of the previous
                //  workouts will deliberately be below 100% intensity
                //  and therefore the 1RM values will be lower than the true 1RM.)
                let oneRM = props.exercise.ref1RM = globalState.calc1RM = Math.max(...prevMaxes);

                // Calculate relative 1RM
                let button = event.button;
                let relative1RM = 
                    //---- button 0 = left button ----
                    button == 0 ? oneRM * 0.8625 // Moderate+ = 86.25% of 1RM (for most work sets)
                    //---- button 1 = middle button + shift key ----
                    : button == 1 && event.shiftKey ? oneRM * 0.9313 // Half way between left and right buttons
                    //---- button 1 = middle button ----
                    : button == 1 ? oneRM * 0.775 // Deload = 77.5% of 1RM
                    //---- button 2 = right button ----
                    : oneRM * 1; // Heavy = 100% of 1RM (for 1RM tests)
                relative1RM = Math.round(relative1RM * 10) / 10; // round to nearest 1 d.p.
            
                // Populate "1RM" or "Work weight" box:
                if (currentExerciseGuide.value.weightType == "1RM") {
                    // For "1RM" guides, the `oneRM` value can be used directly.
                    // Note that `relative1RM` is not used here, this is because
                    // the percentage of 1RM is built into the guide itself,
                    // (e.g. the "12-15" guide uses 60% of 1RM), so there is
                    // no need to apply the percentage reduction of `relative1RM` here.
                    globalState.calcWeight = convert1RMtoWorkSetWeight(oneRM);
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    // For "working weight" guides, the value needs to be converted:
                    // Convert the `relative1RM` value into a working weight for this rep range
                    // (e.g. if 1RM is 40kg and rep range is ~10, then working weight will be ~30kg)
                    let guideParts = props.exercise.guideType.split('-');
                    if (guideParts.length == 2) {
                        let guideLowReps = Number(guideParts[0]); // min (e.g. "8-10" -> 8)
                        unroundedWorkWeight.value = _oneRmToRepsWeight(relative1RM, guideLowReps, props.oneRmFormula); // precise weight (not rounded)
                        roundedWorkWeight.value = globalState.calcWeight = _roundGuideWeight(unroundedWorkWeight.value, props.exercise.name); // rounded to nearest 2 or 2.5
                    }
                }
            }


            const referenceWeightForGridRow = computed(() => {
                // This depends on the guide type:
                // * For "1RM" guide type, this is the 1RM, and <grid-row> calculates
                //    the guide weight as a percentage of this (e.g. 60% for 12-15 reps).
                // * For the "WORK" guide type, the this is the weight used
                //   for the work sets. (So work sets will be 100% of this).
                if (currentExerciseGuide.value.weightType == "1RM") {
                    return props.exercise.ref1RM;
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    if (props.exercise.goal) {
                        // New "goal" feature (work in progress)
                        let xpos = props.exercise.goal.indexOf("x");
                        let strWeight = (xpos == -1)
                            ? props.exercise.goal.trim() // just weight
                            : props.exercise.goal.substring(0, xpos).trim(); // weight and reps, remove reps
                        return Number(strWeight); // grid-row `referenceWeight` prop is of type Number
                    } else {
                        // Old "enter work weight" box
                        return roundedWorkWeight.value;
                    }
                }
            });

            const goalWorkSetReps = computed(() => {
                if (currentExerciseGuide.value.weightType == "WORK") {
                    if (props.exercise.goal) {
                        // New "goal" feature (work in progress)
                        let goalParts = props.exercise.goal.split("x")
                        if (goalParts.length >= 2) {
                            return Number(goalParts[1]);
                        }
                    }
                }
                return 0;
            });

            

            const guideParts = _useGuideParts(toRef(() => props.exercise.guideType));

            function guessNext() {
                // guess what the goal will be for next time, 
                // based on the current goal and rep range
                // (then set this as the comment)
                if (!props.exercise.goal) {
                    alert("Goal not set");
                    return;
                }
                if (props.exercise.guideType.startsWith("Double")) {
                    // BEGIN DOUBLE PROGRESSION
                    // WORK IN PROGRESS //let isDeloadWeek = goal.toLower().includes("deload") || tag == "DL"
                    // WORK IN PROGRESS //if (isDeload) {
                    // WORK IN PROGRESS //   let goal = getLastWeeksGoal();
                    // WORK IN PROGRESS //   if (goal) {
                    // WORK IN PROGRESS //       let goalParts = getGoalParts(goal);
                    // WORK IN PROGRESS //       if (goalParts) {
                    // WORK IN PROGRESS //           let nextWeight = goalParts[0];
                    // WORK IN PROGRESS //           let nextReps = goalParts[1];
                    // WORK IN PROGRESS //}
                    let nextWeight = referenceWeightForGridRow.value; // same weight as currently (this is derived from `goal`)
                    let nextReps = goalWorkSetReps.value + 1; // one more rep
                    let suffix = "";
                    if ((props.weekNumber+1) % 4 == 0) {
                        // Deload every 4 weeks
                        // (need to use weekNumber+1 because we're setting a goal for *next* time,
                        //  so the `+1` is required to see what week number it will be *next* week,
                        //  i.e. if next week is the 4th week then it will be a deload.)
                        nextReps = guideParts.value.guideLowReps;
                        suffix = " x 2 (Deload)"; // 2 sets instead of 3
                    }
                    else if (nextReps > guideParts.value.guideHighReps) {
                        // Top of rep range: increase weight
                        nextWeight = _smallIncrement(nextWeight, props.exercise.name);
                        nextReps = guideParts.value.guideLowReps;
                    }
                    props.exercise.next = nextWeight + " x " + nextReps + suffix;
                    // END DOUBLE PROGRESSION
                } else if (props.exercise.guideType.startsWith("Wave")) {
                    // BEGIN WAVE LOADING
                    if ((guideParts.value.guideHighReps - guideParts.value.guideLowReps) != 2) {
                        alert("Only works with guides 2 reps apart, e.g. 4-6");
                        return;
                    }
                    let nextReps = goalWorkSetReps.value - 1; // reduce reps 
                    let nextWeight = _smallIncrement(referenceWeightForGridRow.value, props.exercise.name); // increase weight
                    let suffix = "";
                    if (nextReps < guideParts.value.guideLowReps) {
                        // end of cycle
                        if (!props.exercise.goal.includes("Deload")) {
                            // haven't done a deload yet, so program one:
                            nextReps = guideParts.value.guideLowReps;
                            for (let i = 0; i < 3; i++) { // reduce weight 3 times, to get it back to the same weight...
                                nextWeight = _smallDecrement(nextWeight, props.exercise.name); // ...used at the start of this cycle
                            }
                            suffix = " x 2 (Deload)"; // 2 sets instead of 3
                        }
                        else {
                            // have already done a deload, so start the next cycle:
                            nextReps = guideParts.value.guideHighReps;
                        }
                    }
                    props.exercise.next = nextWeight + " x " + nextReps + suffix;
                    // END WAVE LOADING
                } else {
                    if (!props.exercise.guideType)
                        alert("No guide selected");
                    else
                        alert("Unknown progression strategy for guide '" + props.exercise.guideType + "'");
                }
            }

            // BEGIN Auto-number feature
            watch(() => props.exercise.sets, () => {
                if (props.exercise.number == "A" 
                    && totalVolume.value > 0 // don't auto-number when exercise is first populated (after choosing a preset)
                    && props.getNextExerciseNumber) {
                    // call `getNextExerciseNumber` function (in <workout-calc>)
                    props.exercise.number = props.getNextExerciseNumber();
                }
            }, { deep: true });
            // END Auto-number

            // Background highlight
            const highlightClasses = computed(() => {
                let classes = [];
                if (props.showBackgroundHighlight) {
                    classes.push('weekreps' + guideParts.value.guideHighReps);
                    if (props.exercise.etag == "DL") {
                        classes.push("deload-stripes");
                    }
                }
                return classes;
            });

            return { 
                lastWeeksComment, addSet, currentExerciseHeadline, currentExerciseGuide, 
                enterWeightMessage, isDigit, totalVolume, divClicked, 
                restTimers, setRestTimeCurrentSet, guessWeight, unroundedWorkWeight, roundedWorkWeight,
                showNotes, referenceWeightForGridRow, /*showRI*/ 
                //goalNumbers, getNextWeight, 
                goalWorkSetReps, guessNext, deleteSet, highlightClasses
            };
        }
    });
</script>