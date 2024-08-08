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
    .maintable .number-input {
        width: 65px;
        border: none;
        padding-right: 18px; /* leave space for ✨ emoji */
    }

    input.missing {
        background-color: #fee;
    }

    input.lastweekscomment {
        background-color: #ddd; 
        color: #555; 
        width: 200px; 
        font-size: 11px; 
        border-color: #ddd; 
        border-radius: 4px;
        padding: 4px 6px;
    }

    .showonhover {
        opacity: 0;
    }
    .showonhover:hover {
        opacity: 1;
    }
</style>

<template>
    <div style="display: inline-block; border-bottom: solid 2px #ddd"
         v-on:click="divClicked">
         
        <div style="margin-top: 15px; margin-bottom: 2px; font-weight: bold">
            Exercise
            <input type="text" v-model="exercise.number" style="width: 30px; font-weight: bold" />:
            <input type="text" v-model="exercise.name"   style="width: 225px" 
                    list="exercise-names" autocapitalize="off" />
        </div>

        <div style="margin-bottom: 15px; font-size: 14px">
            <!-- Guide -->
            <span>
                <label style="width: 120px; display: inline-block; text-align: right;">Guide:&nbsp;</label>
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
            <span v-if="currentExerciseGuide.weightType">
                <label style="margin-left: 20px">
                    <span v-if="currentExerciseGuide.weightType == 'WORK'">Work weight: </span>
                    <span v-if="currentExerciseGuide.weightType == '1RM'" >1RM: </span>
                </label>
                <span v-if="unroundedWorkWeight"
                      style="position: absolute; margin-top: 30px; width: 69px; text-align: right; color: pink">
                    {{ unroundedWorkWeight.toFixed(2) }}
                </span>
                <number-input v-model="exercise.ref1RM" style="width: 65px" class="verdana"
                              v-bind:class="{ 'missing': showEnterWeightMessage }" /> kg
                <button style="padding: 3px 5px"
                        v-on:mousedown.prevent="guessWeight($event.button)"
                        v-on:contextmenu.prevent
                        >Guess</button>
                        <!-- hidden feature: different mouse button = different target
                                             * left = average of last 10
                                             * middle = midpoint between average and max
                                             * right = max of last 10 -->
                <span v-if="guess1RM"
                      style="color: pink"> 1RM = {{ guess1RM.toFixed(1) }}</span>
            </span>
        </div>

        <div v-if="lastWeeksComment"
                style="margin: 20px 0; font-size: 11px; color: #888"> 
                🗨 Last week's comment: 
                <input type="text" readonly="true" v-bind:value="lastWeeksComment"
                    class="lastweekscomment" />
        </div>

        <div v-if="showEnterWeightMessage"
                style="background-color: pink; padding: 10px 20px; color: crimson; display: inline-block; border-radius: 5px; margin-left: 88px; margin-bottom: 20px">
            Enter a work weight
        </div>

        <div v-show="!showEnterWeightMessage" >
            <table class="maintable">
                <thead>
                    <tr>
                        <th v-if="currentExerciseGuide.weightType == '1RM'" class="smallgray">%1RM</th>
                        <th>Set</th>
                        <!-- <th v-if="show1RM && showGuide">Guide</th> -->
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Rest</th>
                        <th class="smallgray">Est 1RM</th>
                        <th v-if="showVolume" class="smallgray">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    <grid-row v-for="(set, setIdx) in exercise.sets"
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show-volume="showVolume"
                        v-bind:ref1-r-m="exercise.ref1RM"
                        v-bind:max-est1-r-m="exercise.ref1RM"
                        v-bind:read-only="false"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:guide-name="exercise.guideType"
                        v-bind:guide="currentExerciseGuide"
                        v-bind:exercise="exercise"
                        v-bind:rest-timer="restTimers.length <= setIdx ? 0 : restTimers[setIdx]"
                        v-on:reps-entered="setRestTimeCurrentSet(setIdx + 1)"
                    ></grid-row>
                    <tr>
                        <!-- <td v-if="show1RM"></td> -->
                        <td><button v-on:click="addSet">+</button></td>
                        <td colspan="3"
                            class="verdana"
                            style="font-size: 11px; padding-top: 5px">
                            <span class="smallgray">
                                <!-- Total reps: {{ runningTotal_numberOfReps(exercise) }} -->
                                <!-- &nbsp; -->
                                <!-- Average weight: {{ runningTotal_averageWeight(exercise).toFixed(1) }} -->
                                <span v-bind:class="{ 'showonhover': !showVolume }"
                                    style="padding-right: 10px">
                                    Total volume: {{ totalVolume }}
                                </span>
                            </span>
                            <!-- Headline -->
                            <span v-show="showNotes"
                                  style="padding: 0 5px"
                                  v-bind:style="{ 'opacity': currentExerciseHeadline.numSets <= 1 ? '0.5' : null,
                                              'font-weight': currentExerciseHeadline.numSets >= 3 ? 'bold' : null }"
                                  v-bind:class="'weekreps' + currentExerciseHeadline.reps"
                                  >Headline: {{ currentExerciseHeadline.headline }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-show="showNotes">
                <span style="font-size: smaller">Comment:</span>
                <input type="text" v-model="exercise.comments" size="30" style="font-size: smaller" />

                <span style="font-size: smaller">Tag:</span>
                <!-- (this helps put the workout "headlines" in context) -->
                <select v-model="exercise.etag"
                        style="vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px">
                    <option v-bind:value="0"></option>
                    <option v-for="(value, key) in tagList"
                            v-bind:value="key"
                    ><span class="emoji">{{ value.emoji }}</span> - {{ value.description }}</option>
                </select><br />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, PropType, computed, watch, onMounted, onBeforeUnmount, ref, onBeforeMount } from "vue";
    import { Exercise, RecentWorkout, Guide } from './types/app';
    import { _getHeadline } from "./headline";
    import { _newExercise, _newSet, _volumeForSet, _calculateMax1RM, _oneRmToRepsWeight, _roundGuideWeight } from './supportFunctions'
    import { globalState } from "./globalState";

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
            showNotes: Boolean
        },
        setup(props, context) {
            
            const lastWeeksComment = computed(() => {
                var found = props.recentWorkouts.find(z => z.name == props.exercise.name);
                if (found != null) {
                    return found.comments;
                } else {
                    return null;
                }
            });

            function addSet() {
                if (confirm("Are you sure you want to add a new set?")) {
                    props.exercise.sets.push(_newSet("WK"));
                }
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

            const showEnterWeightMessage = computed(() =>  {
                return props.exercise.guideType && !props.exercise.ref1RM;
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
                    globalState.calcWeight = props.exercise.ref1RM;
                    globalState.calc1RM = guess1RM.value;
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
                        props.exercise.sets = _newExercise(props.exercise.number, guide.warmUp.length, guide.workSets.length).sets;
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
            watch(() => props.exercise, () => {
                // exercise changed (e.g. new workout started),
                // so clear rest times
                restTimers.value = [];
                currentSet = 0;
                guess1RM.value = 0;
                unroundedWorkWeight.value = 0;
            });
            // END rest timer

            const guess1RM = ref(0);
            const unroundedWorkWeight = ref(0);

            function convert1RMtoWorkSetWeight(averageMax1RM: number) {
                // a similar method is used in <grid-row> component 
                let percentage = currentExerciseGuide.value.workSets[0]; // e.g. 0.60 = 60% of 1RM
                let unroundedWorkWeight = averageMax1RM * percentage;
                let roundedWorkWeight = _roundGuideWeight(unroundedWorkWeight, props.exercise.name); // rounded to nearest 2 or 2.5
                return roundedWorkWeight;
            }

            function calculateAverage(arr: number[]) {
                // Calculate the average of an array of numbers
                return arr.reduce((a, b) => a + b) / arr.length;
            }

            // function calculateTop3(arr: number[]) {
            //     // Calculate the average of the top 3 values in an array
            //     arr.sort((a, b) => b - a); // sort descending
            //     return calculateAverage(arr.slice(0, 3));
            // }

            function calculateMidpoint(arr: number[]) {
                // Calculate the mid-point between the average and the maximum value
                let average = calculateAverage(arr);
                let maxValue = Math.max(...arr);
                return average + ((maxValue - average) / 2);
            }

            function guessWeight(button: number) { 
                // `button`: 0 = left    use *average* of last 10 max1RM's
                //           1 = middle  use the midpoint between the average and max
                //           2 = right   use *max* of last 10 max1RM's
                let prevMaxes = [];                 
                let count = 0;
                guess1RM.value = 0;
                unroundedWorkWeight.value = 0;
                
                // Get last 10 Max1RM's for this exercise
                for (const exercise of props.recentWorkouts) {
                    if (exercise.name == props.exercise.name && exercise.guideType != "Deload") {
                        prevMaxes.push(_calculateMax1RM(exercise.sets, props.oneRmFormula));
                        count++;
                    }
                    if (count == 10) break; // look at previous 10 attempts at this exercise only
                }
                // Calculate the average
                let averageMax1RM = button == 1 ? calculateMidpoint(prevMaxes) // the midpoint between the average and the maximum
                    // button == 1 ? prevMaxes[0] // most recent 1RM
                    : button == 2 ? Math.max(...prevMaxes) // max of last 10 max1RM's
                    //: button == 2 ? calculateTop3(prevMaxes) // average of the top 3 max1RM's
                    : calculateAverage(prevMaxes); // average of last 10 max1RM's (button == 0)
                averageMax1RM = Math.round(averageMax1RM * 10) / 10; // round to nearest 1 d.p.
                globalState.calc1RM = averageMax1RM;

                // Populate "1RM" or "Work weight" box:
                if (currentExerciseGuide.value.weightType == "1RM") {
                    // for "1RM" guides, the value can be used directly:
                    props.exercise.ref1RM = averageMax1RM;
                    globalState.calcWeight = convert1RMtoWorkSetWeight(averageMax1RM);
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    // For "working weight" guides, the value needs to be converted:
                    // Convert the 1RM value into a working weight for this rep range
                    // (e.g. if 1RM is 40kg and rep range is ~10, then working weight will be ~30kg)
                    let guideParts = props.exercise.guideType.split('-');
                    if (guideParts.length == 2) {
                        let guideMidReps = guideParts.map(a => Number(a)).reduce((a, b) => a + b) / guideParts.length; // average (e.g. "8-10" -> 9)
                        let workWeight = _oneRmToRepsWeight(averageMax1RM, guideMidReps, props.oneRmFormula); // precise weight (not rounded)
                        unroundedWorkWeight.value = workWeight;
                        let roundedWorkWeight = _roundGuideWeight(workWeight, props.exercise.name); // rounded to nearest 2 or 2.5
                        props.exercise.ref1RM = roundedWorkWeight;
                        globalState.calcWeight = roundedWorkWeight;
                    }
                    guess1RM.value = averageMax1RM;
                }
            }


            return { lastWeeksComment, addSet, currentExerciseHeadline, currentExerciseGuide, 
                showEnterWeightMessage, isDigit, totalVolume, divClicked, 
                restTimers, setRestTimeCurrentSet, guessWeight, guess1RM, unroundedWorkWeight };
        }
    });
</script>