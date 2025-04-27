<style>
    button.pagebtn {
        padding: 10px 0;
        margin-right: 5px;
        min-width: 51px;
    }
    button.activeBtn {
        background-color: #fe3;
    }
    div.exdiv {
        margin-left: 2px;
        position: relative; /* because div.leftline is position: absolute */
        display: inline-block; /* required otherwise the tooltip won't work (because of position: relative) */
    }
    div.leftline {
        width: 19px;
        left: -18px;
        height: 100%;
        position: absolute;
        border-top-right-radius: 100%;
        border-bottom-right-radius: 50%;
    }
    div.leftline.weekreps0 {
        background-color: #eee;
    }

    @media (min-width: 768px) {
        /* on desktop, position these divs side-by-side with other content */
        /* (but on mobile these rules don't apply, so they will appear one above another) */
        div.middle-div {
            float: right; 
            position: sticky; 
            top: 0;
        }
        div.right-div {
            float: right; 
            position: sticky; 
            top: 0;
        }
    }
</style>

<template>
     <div>
        <div class="right-div"
             style="font-size: smaller; text-align: right">

            <span>One Rep Max Formula
                <select v-model="oneRmFormula">
                    <option>Brzycki/Epley</option>
                    <option>Brzycki</option>
                    <option>Brzycki 12+</option>
                    <option>McGlothin</option>
                    <option>Epley</option>
                    <option>Wathan</option>
                    <option>Mayhew et al.</option>
                    <option>O'Conner et al.</option>
                    <option>Lombardi</option>
                </select>
                <br />
            </span>
            
            <label>
                <input type="checkbox" v-model="globalState.includeRirInEst1RM" />
                Include RIR
            </label>
            <br /><br />
            
           

            <!-- <div style="float: left">
                <guide-info-table v-bind:week-number="weekNumber"
                                  v-bind:current-exercise-name="currentExercise.name" 
                                  v-bind:presets="presets"
                                  v-bind:workout-preset="lastUsedPreset" />
            </div> -->

            Block start date<br />
            <input type="text" style="width: 80px" v-model="blockStartDate" 
                    placeholder="YYYY-MM-DD" />

            <br /><br />

            <div style="display: inline-block; text-align: left">
                Workout date<br />
                <input type="text" style="width: 80px" v-model="workoutDate" />
            </div>

            <br /><br />

            Week number<br />
            <!-- <template v-if="daysDiff != null">
                <template v-if="weekNumber != null">
                    {{ weekNumber }}w
                </template>
                <span style="color: silver">
                    {{ daysDiff % 7 }}d
                </span>
            </template> -->
            <template v-if="daysDiff != null">
                <template v-if="weekNumber != null">Wk <b>{{ weekNumber }}</b></template>
                <span style="color: silver">.{{ dayNumber }}</span>
            </template>
            <template v-else>
                Invalid date
            </template>

           
            <br /><br />
            <div v-if="showTables"
                 style="float: left">{{ currentExercise.name }}</div>
            <label>
                <input type="checkbox" v-model="showTables" />
                Show tables
            </label>
            <week-table v-if="showTables && currentExercise.name"
                        v-bind:recent-workouts="recentWorkouts"
                        v-bind:current-exercise-name="currentExercise.name"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-on:show-tooltip="showTooltip"
                        v-on:hide-tooltip="hideTooltip" />
            <br />
            <volume-table v-if="showTables"
                          v-bind:recent-workouts="recentWorkouts"
                          v-bind:current-workout="exercises"
                          v-bind:workout-date="workoutDate" />
        </div>

        <div class="middle-div">

            <div style="font-size: smaller; text-align: right">
                <label>
                    <input type="checkbox" v-model="showPreviousTable" />
                    Show previous
                </label>
            </div>

            <prev-table v-if="showPreviousTable"
                        v-bind:recent-workouts="recentWorkouts"
                        v-bind:current-exercise-name="currentExercise.name" 
                        v-on:show-tooltip="showTooltip"
                        v-on:hide-tooltip="hideTooltip" />
            <!--<relative-intensity v-bind:one-rm-formula="oneRmFormula"
                                v-bind:current-exercise-name="currentExercise.name"
            ></relative-intensity>
            <br />
            <rm-calc-2d v-bind:one-rm-formula="oneRmFormula"
                        v-bind:guide-type="currentExercise.guideType"
                        v-bind:current-exercise-name="currentExercise.name"
            ></rm-calc-2d>
            <br />
            <rm-table v-bind:one-rm-formula="oneRmFormula"
                      v-bind:ref1-r-m="currentExercise.ref1RM"
                      v-bind:guide-type="currentExercise.guideType"
            ></rm-table>-->
            <!--<br />
            <rm-calc v-bind:one-rm-formula="oneRmFormula"
                     v-bind:guide-type="currentExercise.guideType"
            ></rm-calc>-->
        </div>

        <div style="display: inline-block; min-width: 298px">
            <button v-for="(exercise, idx) in exercises"
                    v-on:click="gotoPage(idx)"
                    class="pagebtn"
                    v-bind:class="{ activeBtn: curPageIdx == idx }">
                {{ exercise.number }}
            </button>
            <button v-on:click="addExercise">+</button>
        </div>

        <button style="padding: 8.8px 3px 9.5px 3px; margin-right: 5px"
                v-on:click="copyWorkoutToClipboard"
        >📋</button>
        
        <button class="pagebtn"
                v-on:click="clear"
                style="padding: 2px; vertical-align: top; height: 40px; width: 51px"
        >{{ outputText ? "Save + " : "" }}Clear</button>

        <select style="height: 40.5px; width: 50px"
                v-on:change="startNewWorkout">
            <option style="display: none">New</option>
            <option v-for="preset in presets">
                {{ preset.name }}
            </option>
        </select>

        <!-- <select style="height: 40.5px"
                v-on:change="clearAndNew">
            <option style="display: none">Clear</option>
            <option>Blank</option>
            <option v-for="preset in presets">
                {{ preset.name }}
            </option>
        </select> -->
        
        <datalist id="exercise-names">
            <option v-for="exerciseName in exerciseNamesAutocomplete"
                    v-bind:value="exerciseName"></option>
        </datalist>

        <div class="smallgray">
            <label>
                <input type="checkbox" v-model="showVolume" /> Show volume
            </label>
        </div>

        <!-- Warm up (stored in 1st exercise `comments` field)-->
        <div v-if="exercises.length > 0"
             style="display: inline-block; border-top: solid 2px #eee; border-bottom: solid 2px #eee; padding: 20px 0; margin-top: 20px">
            Warm up: 
            <textarea style="width: 272px; height: 50px; vertical-align: top;"
                      v-model="exercises[0].warmUp"
            ></textarea>
        </div>

        <div v-for="(exercise, exIdx) in exercises" >
            <div class="exdiv"
                ><!-- v-show="exIdx == curPageIdx"  -->
                <div v-if="exIdx == curPageIdx"
                    class="leftline"
                    v-bind:class="'weekreps' + currentExerciseGuideHighReps">
                </div>
                <exercise-container v-bind:exercise="exercise"
                                    v-bind:recent-workouts="recentWorkouts"
                                    v-bind:show-volume="showVolume"
                                    v-bind:guides="guides"
                                    v-bind:one-rm-formula="oneRmFormula"
                                    v-bind:tag-list="tagList"
                                    v-bind:week-number="weekNumber"
                                    v-on:select-exercise="gotoPage(exIdx)"
                ></exercise-container>
            </div>
        </div><!-- /foreach exercise -->
        <br />
    
        
        <recent-workouts-panel v-bind:tag-list="tagList"
                               v-bind:show-volume="showVolume"
                               v-bind:one-rm-formula="oneRmFormula"
                               v-bind:recent-workouts="recentWorkouts"
                               v-bind:current-exercise-name="currentExercise.name"
                               v-bind:current-exercise1-r-m="currentExercise.ref1RM"
                               v-bind:current-exercise-guide="currentExercise.guideType"
                               v-bind:guides="guides"
                               v-on:show-tooltip="showTooltip"
                               v-on:hide-tooltip="hideTooltip"
                               ref="recentWorkoutsPanel">
        </recent-workouts-panel>


        <br /><br />
        <dropbox-sync ref="dropbox"
                      dropbox-filename="json/workouts.json"
                      v-bind:data-to-sync="recentWorkouts"
                      v-on:sync-complete="dropboxSyncComplete">
        </dropbox-sync>
        <br /><br />

        <tool-tip 
            v-bind:recent-workouts="recentWorkouts"
            v-bind:show-volume="showVolume"
            v-bind:one-rm-formula="oneRmFormula"
            v-bind:guides="guides"
            ref="tooltip"
        ></tool-tip>

    </div>
</template>

<script lang="ts">
import { _newWorkout, _newSet, _volumeForSet, _newExercise, _generateExerciseText, _generateWorkoutText } from './supportFunctions'
import { _getGuides } from './guide';
import { _applyPreset, _getPresets, _getGuideWeeks } from './presets';
import RecentWorkoutsPanel from './recent-workouts-panel.vue'
import RmTable from './rm-table.vue'
import WeekTable from './week-table.vue';
import NumberInput from './number-input.vue';
import { Exercise, RecentWorkout, Guide, GuideWeek } from './types/app'
import { defineComponent, PropType } from "vue"
import * as moment from "moment"
import DropboxSync from './dropbox-sync.vue'
import ExerciseContainer from './exercise-container.vue';
import ToolTip from "./tool-tip.vue";
import { globalState } from "./globalState";

export default defineComponent({
    components: {
        RecentWorkoutsPanel,
        RmTable,
        DropboxSync,
        WeekTable,
        NumberInput,
        ExerciseContainer,
    },
    data: function () {

        var exercises = _newWorkout();
        if (localStorage["currentWorkout"]) {
            exercises = JSON.parse(localStorage["currentWorkout"]);
        }

        var recentWorkouts = [] as RecentWorkout[];
        if (localStorage["recentWorkouts"]) {
            recentWorkouts = JSON.parse(localStorage["recentWorkouts"]);
        }

        var exerciseNamesAutocomplete = [];
        for (var i = 0; i < 50; i++) {
            if (i >= recentWorkouts.length) break;
            if (exerciseNamesAutocomplete.indexOf(recentWorkouts[i].name) == -1)
                exerciseNamesAutocomplete.push(recentWorkouts[i].name);
        }
        exerciseNamesAutocomplete.sort();

        return {
            curPageIdx: 0,
            exercises: exercises,
            recentWorkouts: recentWorkouts,
            outputText: '',

            showVolume: false,
            oneRmFormula: 'Brzycki/Epley',
            showPreviousTable: true,
            showTables: true,

            blockStartDate: "", // will be updated by dropboxSyncComplete()
            workoutDate: moment().format("YYYY-MM-DD"), // will be updated by startNewWorkout()

            tagList: {
                // object keys have to be strings (i.e. "10" not 10)
                "10": { "emoji": "💪", "description": "high energy" },
                "20": { "emoji": "😓", "description": "low energy" },
                "21": { "emoji": "🔻", "description": "had to reduce weight" },
                "25": { "emoji": "🤕", "description": "injury" },
                //"30": { "emoji": "🆗", "description": "productive if unremarkable" },
                //"40": { "emoji": "📈", "description": "increase over previous workout" },
                "50": { "emoji": "🏆", "description": "new PR" },
                "60": { "emoji": "🐢", "description": "long gaps between sets" },
                "61": { "emoji": "🐇", "description": "short gaps between sets" },
                "70": { "emoji": "🐌", "description": "preworkout took a while to kick in" },
                "80": { "emoji": "☕", "description": "too much caffeine" },
                "98": { "emoji": "🛑", "description": "stop sign" },
                "99": { "emoji": "☝", "description": "need to increase the weight" },
                "9a": { "emoji": "👇", "description": "need to decrease the weight" },
                "9b": { "emoji": "📏", "description": "1RM attempt" } // i.e. ruler = measure
            },

            guides: _getGuides(),
            presets: _getPresets(),
            lastUsedPreset: sessionStorage.getItem("lastUsedPreset") || "",
            
            exerciseNamesAutocomplete: exerciseNamesAutocomplete,
            globalState: globalState
        }
    },
    mounted: function () { 
        this.saveCurrentWorkoutToLocalStorage();
        this.syncWithDropbox();
    },
    methods: {
        syncWithDropbox: function () { 
            var dropbox = this.$refs.dropbox as InstanceType<typeof DropboxSync>;
            dropbox.dropboxSyncStage1();
        },
        dropboxSyncComplete: function (dropboxData: RecentWorkout[]) {
            this.recentWorkouts = dropboxData; // update local data with dropbox data
            localStorage["recentWorkouts"] = JSON.stringify(dropboxData); // save to local storage
            if (this.recentWorkouts.length > 0) {
                this.blockStartDate = this.recentWorkouts[0].blockStart;
            }
        },

        gotoPage: function (idx: number) {
            this.curPageIdx = idx;
        },
        getTotalScore: function () { // used by `startNewWorkout` and `clear`
            var totalScore = 0;
            this.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    totalScore += _volumeForSet(set);
                });
            });
            return totalScore;
        },
        clear: function () {
            let warning = moment().isSame(this.workoutDate, 'day')
                ? "" : "* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\nWARNING: WORKOUT DATE IS NOT TODAY'S DATE\n* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\n";
            const clearForm = () => {
                // helper function: "clear" actions common to both conditions below
                this.curPageIdx = 0;
                this.exercises = _newWorkout();
                globalState.calc1RM = 0;
                globalState.calcWeight = 0;
                let recentWorkoutsPanel = this.$refs.recentWorkoutsPanel as InstanceType<typeof RecentWorkoutsPanel>;
                recentWorkoutsPanel.filterType = "nofilter";
                this.lastUsedPreset = "";
            }
            if (this.getTotalScore() == 0) {
                // nothing to save, so just clear the form
                clearForm();
            }
            else if (confirm(warning + "Save current workout and clear form?")) {
                // save current workout and clear form
                this.saveCurrentWorkoutToHistory();
                clearForm();
                this.syncWithDropbox();
            }
        },
        // clearAndNew: function (event: any) {
        //     if (confirm("Are you sure you want to clear the whole form?")) {
        //         this.saveCurrentWorkoutToHistory();

        //         var presetName = event.target.value;
        //         if (presetName == "Blank") {
        //             this.exercises = _newWorkout();
        //         } else {
        //             var preset = this.presets.find(z => z.name == presetName);
        //             this.exercises = _applyPreset(preset, this.weekNumber);
        //         }
        //         this.curPageIdx = 0;
        //         this.syncWithDropbox();
        //     }
        //     event.target.value = "Clear"; // reset selection
        // },
        startNewWorkout: function (event: any) {
            if (this.getTotalScore() > 0) {
                alert("Please clear the current workout before starting a new one.");
            } else {
                this.workoutDate = moment().format("YYYY-MM-DD"); // update workout date
                let presetName = event.target.value;
                let preset = this.presets.find(z => z.name == presetName);
                this.exercises = _applyPreset(preset, this.weekNumber, this.guides);
                this.curPageIdx = 0;
                this.lastUsedPreset = presetName; // save to sessionStorage
            }
            event.target.value = "New"; // reset selection
        },

        addExercise: function () {
            var number = prompt("Enter exercise number", (this.exercises.length + 1).toString());
            if (number != null) {
                this.exercises.push(_newExercise(number, 0, 3));
                this.curPageIdx = this.exercises.length - 1;
            }
        },
        
        saveCurrentWorkoutToLocalStorage: function () {
            // also updates `this.outputText`
            localStorage["currentWorkout"] = JSON.stringify(this.exercises); // save to local storage
            this.outputText = _generateWorkoutText(this.exercises);
        },

        copyWorkoutToClipboard: function () {
            var text = this.outputText;
            navigator.clipboard.writeText(text).then(function () {
                //alert("success");
            }, function () {
                alert("failed to copy");
            });
        },

        saveCurrentWorkoutToHistory: function () {
            var idSeed = Math.round(new Date().getTime() / 1000); // no. seconds since Jan 1, 1970
            var self = this;
            this.exercises.forEach(function (exercise) {
                var setsWithScore = exercise.sets.filter(function (set) { return _volumeForSet(set) > 0 });
                if (setsWithScore.length > 0) {
                    // Add exercise to this.recentWorkouts
                    self.recentWorkouts.unshift({
                        id: idSeed++,
                        date: self.workoutDate,
                        blockStart: self.blockStartDate,
                        weekNumber: self.weekNumber,
                        name: exercise.name,
                        number: exercise.number,
                        sets: setsWithScore,
                        guideType: exercise.guideType,
                        ref1RM: exercise.ref1RM,
                        comments: exercise.comments,
                        etag: exercise.etag,
                        warmUp: exercise.warmUp // applies to first exercise of workout only
                    });
                }
            });
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
        },

        showTooltip: function(recentWorkoutIdx: number, e: MouseEvent) {
            let tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.show(recentWorkoutIdx, e);
        },
        hideTooltip: function() {
            let tooltip = this.$refs.tooltip as InstanceType<typeof ToolTip>;
            tooltip.hide();
        }
    },
    computed: {
        currentExercise: function() {
            return this.exercises[this.curPageIdx];
        },
        //currentExerciseGuide: function (): Guide {
        //    let found = this.guides.find(g => g.name == this.currentExercise.guideType);
        //    return found || this.guides[0]; // fallback to default (empty) guide if not found
        //},
        currentExerciseGuideHighReps: function () {
            if (this.currentExercise.guideType && this.currentExercise.guideType.includes("-"))
                return this.currentExercise.guideType.split("-")[1];
            else
                return "0";
        },

        daysDiff: function() {
            var refdate = moment(this.blockStartDate, "YYYY-MM-DD", true);
            if (!refdate.isValid()) {
                return null;
            }
            var wodate = moment(this.workoutDate, "YYYY-MM-DD", true);
            if (!wodate.isValid()) {
                return null;
            } 
            var duration = moment.duration(wodate.diff(refdate));
            return Math.round(duration.asDays()); // rounded in case the clocks change between the two dates (in which case it won't *quite* be a whole number)
        },
        weekNumber: function () {
            if (this.daysDiff == null || this.daysDiff < 0) return null;
            return Math.floor(this.daysDiff / 7) + 1;
        },
        dayNumber: function () {
            if (this.daysDiff == null || this.daysDiff < 0) return null;
            return (this.daysDiff % 7) + 1;
        }
        
    },
    watch: {
        exercises: {
            handler: function () { 
                // save current workout to localStorage
                // (this also updates `this.outputText` whenever any changes are made)
                this.saveCurrentWorkoutToLocalStorage(); 
            },
            deep: true
        },
        lastUsedPreset: function (newValue) {
            // save the last-used preset into sessionStorage,
            // so that it's persisted between page reloads
            // (this is used by <guide-info-table>)
            sessionStorage.setItem("lastUsedPreset", newValue);
        }
    }
});
</script>