<style>
    input.missing {
        background-color: #fee;
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
            <!-- Guide type -->
            <span>
                <label style="width: 120px; display: inline-block; text-align: right;">Guide: </label>
                <select v-model="exercise.guideType">
                        <option v-for="guide in guides"
                                v-bind:key="guide.name"
                                v-bind:value="guide.name"
                                v-bind:style="{ 'color': guide.referenceWeight == '1RM' ? 'dodgerblue' : '' }">
                            {{ guide.name + (isDigit(guide.name[0]) ? " reps" : "") }}
                        </option>
                </select>
            </span>

            <!-- Reference -->
            <span v-if="currentExerciseGuide.referenceWeight">
                <label style="margin-left: 20px">
                    <span v-if="currentExerciseGuide.referenceWeight == 'WORK'">Work weight: </span>
                    <span v-if="currentExerciseGuide.referenceWeight == '1RM'" >1RM: </span>
                </label>
                <number-input v-model="exercise.ref1RM" style="width: 65px" class="verdana"
                              v-bind:class="{ 'missing': showEnterWeightMessage }" /> kg
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
                        <th v-if="currentExerciseGuide.referenceWeight == '1RM'" class="smallgray">%1RM</th>
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
                        v-bind:set-time="restTimes.length <= setIdx ? 0 : restTimes[setIdx]"
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
                            <!-- Headline (temporarily hidden) -->
                            <!-- <span style="padding: 0 5px"
                                v-bind:style="{ 'opacity': currentExerciseHeadline.numSets <= 1 ? '0.5' : null,
                                                'font-weight': currentExerciseHeadline.numSets >= 3 ? 'bold' : null }"
                                v-bind:class="'weekreps' + currentExerciseHeadline.reps"
                                >Headline: {{ currentExerciseHeadline.headline }}
                            </span> -->
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
    import { getHeadlineFromGuide, getHeadlineWithoutGuide } from "./headline";
    import { _newExercise, _newSet, _volumeForSet } from './supportFunctions'

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
                let completedSets = props.exercise.sets.filter(set => _volumeForSet(set) > 0);

                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = props.exercise.guideType
                        ? getHeadlineFromGuide(props.exercise.guideType, completedSets)
                        : getHeadlineWithoutGuide(completedSets);

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
                context.emit("select-exercise");
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
            let currentSet = 0; // current index into `restTimes` array, updated when <grid-row> emits `reps-entered` event
            function setRestTimeCurrentSet(setIdx: number) {
                currentSet = setIdx;
                referenceTime = new Date().getTime();
            }
            const restTimes = ref([]); // array of rest times (in seconds) for each set
            function everySecond() {
                while(restTimes.value.length <= currentSet)
                    restTimes.value.push(0); // add extra items to array as required
                restTimes.value[currentSet] = (new Date().getTime() - referenceTime) / 1000; // calculate difference between `referenceTime` and current time
            }
            let timerId = 0;
            onMounted(() => {
                timerId = setInterval(everySecond, 1000);
            });
            onBeforeUnmount(() => {
                clearInterval(timerId);
            });
            // END rest timer

            return { lastWeeksComment, addSet, currentExerciseHeadline, currentExerciseGuide, 
                showEnterWeightMessage, isDigit, totalVolume, divClicked, 
                restTimes, setRestTimeCurrentSet };
        }
    });
</script>