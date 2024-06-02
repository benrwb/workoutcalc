<style>
    button.pagebtn {
        padding: 10px 0;
        margin-right: 5px;
        min-width: 51px;
    }
    button.activeBtn {
        background-color: #fe3;
    }
</style>

<template>
     <div>
        <div style="float: right; font-size: smaller; text-align: right">

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
                <br /><br />
            </span>
            

            
            <span>
                <label>
                    <input type="checkbox" v-model="showRmTable" />
                    Show table
                </label>
                <br /><br />
            </span>

            

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
            <template v-if="daysDiff != null">
                <template v-if="weekNumber != null">
                    {{ weekNumber }}w
                </template>
                <span style="color: silver">
                    {{ daysDiff % 7 }}d
                </span>
            </template>
            <template v-else>
                Invalid date
            </template>

            <br /><br />
            <guide-info-table v-bind:week-number="weekNumber"></guide-info-table>

            <br /><br />
            <div style="float: left">{{ currentExercise.name }}</div>
            <label>
                <input type="checkbox" v-model="showWeekTable" />
                Show table
            </label>
            <week-table v-if="showWeekTable"
                        v-bind:recent-workouts="recentWorkouts"
                        v-bind:current-exercise-name="currentExercise.name"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:guides="guides" />
            <br />
            <volume-table v-bind:recent-workouts="recentWorkouts"
                          v-bind:current-workout="exercises"
                          v-bind:workout-date="workoutDate" />
        </div>

        <div v-if="showRmTable"
             style="float: right">
            <rm-table v-bind:one-rm-formula="oneRmFormula"
                      v-bind:ref1-r-m="currentExercise.ref1RM"
                      v-bind:guide-type="currentExercise.guideType"
            ></rm-table>
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
            <label>
                <input type="checkbox" v-model="showNotes" /> Show notes
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

        <div v-for="(exercise, exIdx) in exercises" 
             class="exdiv"
             ><!-- v-show="exIdx == curPageIdx"  -->

           <exercise-container v-bind:exercise="exercise"
                               v-bind:recent-workouts="recentWorkouts"
                               v-bind:show-volume="showVolume"
                               v-bind:guides="guides"
                               v-bind:one-rm-formula="oneRmFormula"
                               v-bind:tag-list="tagList"
                               v-bind:show-notes="showNotes"
                               v-on:select-exercise="gotoPage(exIdx)"
           ></exercise-container>

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
                               ref="recentWorkoutsPanel">
        </recent-workouts-panel>


        <br /><br />
        <dropbox-sync ref="dropbox"
                      dropbox-filename="json/workouts.json"
                      v-bind:data-to-sync="recentWorkouts"
                      v-on:sync-complete="dropboxSyncComplete">
        </dropbox-sync>
        <br /><br />

    </div>
</template>

<script lang="ts">
import { _newWorkout, _newSet, _volumeForSet, _newExercise, _generateExerciseText, _generateWorkoutText } from './supportFunctions'
import { _getGuides } from './guide';
import { _applyPreset, _getPresets, _getGuideWeeks } from './presets';
import GridRow from './grid-row.vue'
import RecentWorkoutsPanel from './recent-workouts-panel.vue'
import RmTable from './rm-table.vue'
import WeekTable from './week-table.vue';
import NumberInput from './number-input.vue';
import { Exercise, RecentWorkout, Guide, GuideWeek } from './types/app'
import { defineComponent, PropType } from "vue"
import * as moment from "moment"
import DropboxSync from './dropbox-sync.vue'
import ExerciseContainer from './exercise-container.vue';

export default defineComponent({
    components: {
        GridRow,
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
            showNotes: false,
            oneRmFormula: 'Brzycki/Epley',
            showRmTable: false,
            showWeekTable: true,

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
                "9a": { "emoji": "👇", "description": "need to decrease the weight" }
            },

            guides: _getGuides(),
            presets: _getPresets(),

            exerciseNamesAutocomplete: exerciseNamesAutocomplete
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
            if (this.getTotalScore() == 0) {
                // nothing to save, so just clear the form
                this.curPageIdx = 0;
                this.exercises = _newWorkout();
            }
            else if (confirm("Save current workout and clear form?")) {
                // save current workout and clear form
                this.saveCurrentWorkoutToHistory();
                this.exercises = _newWorkout();
                this.curPageIdx = 0;
                this.syncWithDropbox();
                let recentWorkoutsPanel = this.$refs.recentWorkoutsPanel as InstanceType<typeof RecentWorkoutsPanel>;
                recentWorkoutsPanel.filterType = "nofilter";
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
                var presetName = event.target.value;
                var preset = this.presets.find(z => z.name == presetName);
                this.exercises = _applyPreset(preset, this.weekNumber, this.guides);
                this.curPageIdx = 0;
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
        }
    },
    computed: {
        currentExercise: function() {
            return this.exercises[this.curPageIdx];
        },
        currentExerciseGuide: function (): Guide {
            let found = this.guides.find(g => g.name == this.currentExercise.guideType);
            return found || this.guides[0]; // fallback to default (empty) guide if not found
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
    }
});
</script>