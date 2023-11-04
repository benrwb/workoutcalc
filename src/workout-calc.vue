<template>
     <div>
        <div style="float: right; font-size: smaller; text-align: right">

            <span v-if="show1RM">
                One Rep Max Formula
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
            
            <span v-if="show1RM || showRmTable">
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
                <input type="text" style="width: 80px" v-model="workoutDate" 
                       disabled="true" />
            </div>

            <br /><br />

            Week number<br />
            <span>{{ weekNumber || "Invalid date" }}</span>

            <br /><br />
            <div style="display: inline-block; text-align: left; 
                        background-color: rgb(227 227 227)">
                <b>Idea:</b><br />
                <table>
                    <tr>
                        <!-- <th>Main</th> -->
                        <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->
                        <!-- <th>Acces.</th> -->
                    </tr>
                    <tr v-for="item in guideInformationTable">
                        <td :style="{ 'color': item.mainColor }">{{ item.mainText }} &nbsp;</td>
                        <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->
                        <!-- <td :style="{ 'color': item.acesColor }">{{ item.acesText }}</td> -->
                    </tr>
                </table>
<!-- <table>
<tr>
    <th colspan="2">Main</th>
    <th>Acces.</th>
</tr><tr>
    <td :style="{ 'color': weekNumber <= 3 ? 'black' : 'silver' }">Week 1-3:</td>
    <td :style="{ 'color': weekNumber <= 3 ? 'black' : 'silver' }">12-14&nbsp;&nbsp;</td>
    <td :style="{ 'color': weekNumber <= 5 ? 'black' : 'silver' }">Week 1-5:</td>
    <td :style="{ 'color': weekNumber <= 5 ? 'black' : 'silver' }">12-14</td>
</tr><tr>
    <td v-bind:style="{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }">Week 4-6:</td>
    <td v-bind:style="{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }">9-11</td>
    <td v-bind:style="{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }">Week 6+:</td>
    <td v-bind:style="{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }">9-11</td>
</tr><tr>
    <td v-bind:style="{ 'color': weekNumber >= 7 ? 'black' : 'silver' }">Week 7+:</td>
    <td v-bind:style="{ 'color': weekNumber >= 7 ? 'black' : 'silver' }">6-8</td>
</tr>
</table> -->
<!-- <span v-bind:style="{ 'color': weekNumber >= 1 && weekNumber <= 3? 'black' : 'silver' }">
    First few (3?) weeks:<br />12-14 range<br />
</span>
<span v-bind:style="{ 'color': weekNumber >= 4 ? 'black' : 'silver' }">
    Remaining weeks:<br />6-8 range, working up in weight<br />
</span> -->
            </div>

            <br /><br />
            <label>
                <input type="checkbox" v-model="showWeekTable" />
                Show table
            </label>
            <week-table v-if="showWeekTable"
                        v-bind:recent-workouts="recentWorkouts"
                        v-bind:current-exercise-name="currentExerciseName"
                        v-bind:show1-r-m="show1RM"
                        v-bind:show-volume="showVolume"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:guides="guides" />
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
        >📋</button><select 
                style="height: 40.5px"
                v-on:change="clearAll">
            <option style="display: none">Clear</option>
            <option>Blank</option>
            <option v-for="preset in presets">
                {{ preset.name }}
            </option>
        </select>
        
        <datalist id="exercise-names">
            <option v-for="exerciseName in exerciseNamesAutocomplete"
                    v-bind:value="exerciseName"></option>
        </datalist>

        <div v-for="(exercise, exIdx) in exercises" 
             v-show="exIdx == curPageIdx" 
             class="exdiv">

            <div style="margin-top: 15px; margin-bottom: 10px; font-weight: bold">
                Exercise
                <input type="text" v-model="exercise.number" style="width: 30px; font-weight: bold" />:
                <input type="text" v-model="exercise.name"   style="width: 225px" 
                       list="exercise-names" autocapitalize="off"
                /><!-- border-right-width: 0 --><!--<button style="vertical-align: top; border: solid 1px #a9a9a9; height: 29px"
                        v-on:click="copyExerciseToClipboard(exercise)">📋</button>-->
            </div>

            <div v-if="show1RM && showRmTable"
                    style="float: right">
                <rm-table v-bind:one-rm-formula="oneRmFormula"
                            v-bind:ref1-r-m="exercise.ref1RM"
                            v-bind:show-guide="showGuide"
                            v-bind:guide-type="exercise.guideType"
                ></rm-table>
            </div>

            <div style="margin-bottom: 15px" class="smallgray">
                <label>
                    <input type="checkbox" v-model="showVolume" /> Show volume
                </label>
                <label>
                    <input type="checkbox" v-model="show1RM" /> 
                    {{ currentExerciseGuide.referenceWeight == "WORK" ? "Work weight" : "Show 1RM" }}
                </label>
                <span v-if="show1RM">
                    <!-- Reference --><number-input v-model="exercise.ref1RM" style="width: 65px" class="smallgray verdana" /> kg
                </span>
                <label v-if="show1RM">
                    <input type="checkbox" v-model="showGuide" /> Show guide
                </label>
                <!-- Guide type -->
                <select v-if="show1RM && showGuide"
                        v-model="exercise.guideType">
                        <option v-for="guide in guides" 
                                v-bind:value="guide.name"
                                v-bind:style="{ 'color': guide.referenceWeight == '1RM' ? 'red' : '' }">
                            {{ guide.name + (isDigit(guide.name[0]) ? " reps" : "") }}
                        </option>
                </select>
            </div>
            <div v-if="lastWeeksComment"
                 style="margin: 20px 0; font-size: 11px; color: #888"> 
                 🗨 Last week's comment: 
                 <input type="text" readonly="true" v-bind:value="lastWeeksComment"
                        class="lastweekscomment" />
            </div>
            <table class="maintable">
                <thead>
                    <tr>
                        <th v-if="show1RM && currentExerciseGuide.referenceWeight == '1RM'" class="smallgray">%1RM</th>
                        <th>Set</th>
                        <th v-if="show1RM && showGuide">Guide</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <!-- <th style="padding: 0px 10px">Score</th> -->
                        <th>Rest</th>
                        <th v-if="show1RM" class="smallgray">Est 1RM</th>
                        <th v-if="showVolume" class="smallgray">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    <grid-row v-for="(set, setIdx) in exercise.sets"
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show1-r-m="show1RM"
                        v-bind:show-volume="showVolume"
                        v-bind:ref1-r-m="exercise.ref1RM"
                        v-bind:max-est1-r-m="exercise.ref1RM"
                        v-bind:read-only="false"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:show-guide="show1RM && showGuide"
                        v-bind:guide-name="currentExerciseGuideName"
                        v-bind:guide="currentExerciseGuide"
                        v-bind:exercise="exercise">
                    </grid-row>
                    <tr>
                        <td v-if="show1RM"></td>
                        <td><button v-on:click="addSet">+</button></td>
                        <td colspan="3"
                            class="smallgray verdana"
                            v-bind:class="{ 'showonhover': !showVolume }"
                            style="padding-top: 5px">
                                <!-- Total reps: {{ runningTotal_numberOfReps(exercise) }} -->
                                <!-- &nbsp; -->
                                <!-- Average weight: {{ runningTotal_averageWeight(exercise).toFixed(1) }} -->
                            Total volume: {{ runningTotal_totalVolume(exercise) }}
                        </td>
                    </tr>
                </tbody>
            </table>

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
        </div><!-- /foreach exercise -->
        <br />
        <!--
        <textarea style="width: 400px; height: 50px; margin-bottom: 5px" 
                v-model="outputText" 
                readonly="readonly"></textarea>-->

        <!-- <br />Mail to: <br />
        <input type="email" style="width: 260px" v-model="emailTo" />
        &nbsp;<a v-bind:href="emailLink">Send email</a> -->

    
        
        <recent-workouts-panel v-bind:tag-list="tagList"
                               v-bind:show1-r-m="show1RM"
                               v-bind:show-volume="showVolume"
                               v-bind:one-rm-formula="oneRmFormula"
                               v-bind:recent-workouts="recentWorkouts"
                               v-bind:current-exercise-name="currentExerciseName"
                               v-bind:current-exercise1-r-m="currentExercise1RM"
                               v-bind:show-guide="showGuide"
                               v-bind:current-exercise-guide="currentExerciseGuideName"
                               v-bind:guides="guides">
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
import { _newWorkout, _newSet, _volumeForSet, _newExercise, _generateExerciseText } from './supportFunctions'
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

export default defineComponent({
    components: {
        GridRow,
        RecentWorkoutsPanel,
        RmTable,
        DropboxSync,
        WeekTable,
        NumberInput,
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
            emailTo: localStorage['emailTo'],

            show1RM: true,
            showGuide: true,
            showVolume: false,
            oneRmFormula: 'Brzycki/Epley',
            showRmTable: false,
            showWeekTable: true,

            blockStartDate: localStorage.getItem("blockStartDate"),
            workoutDate: "", // will be set by updateOutputText()

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
        this.updateOutputText();
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
        },
        //runningTotal_numberOfReps(exercise) {
        //    return exercise.sets.reduce(function (acc, set) { return acc + set.reps }, 0);
        //},
        //runningTotal_averageWeight(exercise) {
        //    var totalReps = this.runningTotal_numberOfReps(exercise);
        //    if (totalReps == 0) return 0;
        //    var self = this;
        //    var totalVolume = exercise.sets.reduce(function (acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
        //    return totalVolume / totalReps;
        //},
        runningTotal_totalVolume: function (exercise: Exercise) {
            var self = this;
            return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
        },
        gotoPage: function (idx: number) {
            this.curPageIdx = idx;
        },
        clearAll: function (event: any) {
            if (confirm("Are you sure you want to clear the whole form?")) {
                this.saveCurrentWorkoutToHistory();

                var presetName = event.target.value;
                if (presetName == "Blank") {
                    this.exercises = _newWorkout();
                } else {
                    var preset = this.presets.find(z => z.name == presetName);
                    this.exercises = _applyPreset(preset, this.weekNumber);
                }
                this.curPageIdx = 0;
                this.syncWithDropbox();
            }
            event.target.value = "Clear"; // reset selection
        },
        addSet: function () {
            if (confirm("Are you sure you want to add a new set?")) {
                this.exercises[this.curPageIdx].sets.push(_newSet());
            }
        },
        addExercise: function () {
            var number = prompt("Enter exercise number", (this.exercises.length + 1).toString());
            if (number != null) {
                this.exercises.push(_newExercise(number));
                this.curPageIdx = this.exercises.length - 1;
            }
        },
        
        updateOutputText: function () {
            // Generate output text
            var output = "";
            //var totalVolume = 0;

            this.exercises.forEach(function (exercise, exerciseIdx) {
                var text = _generateExerciseText(exercise);
                if (text.length > 0) {
                    output += exercise.number + ". " + exercise.name + "\n" + text + "\n\n";
                }
            });
            //if (totalVolume > 0) {
            //    output += "Total volume: " + totalVolume;
            //}

            localStorage["currentWorkout"] = JSON.stringify(this.exercises); // save to local storage

            this.outputText = output; // update output text

            this.workoutDate = moment().format("YYYY-MM-DD"); // update workout date
        },
        //copyExerciseToClipboard: function (exercise) {
        //    var text = _generateExerciseText(exercise);
        //    navigator.clipboard.writeText(text).then(function () {
        //        //alert("success");
        //    }, function () {
        //        alert("failed to copy");
        //    });
        //},
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
                        ref1RM: exercise.ref1RM,
                        comments: exercise.comments,
                        etag: exercise.etag,
                        guideType: exercise.guideType
                    });
                }
            });
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
        },
        isDigit: function (str: string): boolean {
            if (!str) return false;
            return str[0] >= '0' && str[0] <= '9';
        }
    },
    computed: {
        emailLink: function (): string {
            return "mailto:" + this.emailTo + "?subject=workout&body=" + encodeURIComponent(this.outputText);
        },
        currentExerciseName: function (): string {
            // passed as a prop to <recent-workouts-panel>
            return this.exercises[this.curPageIdx].name;
        },
        currentExercise1RM: function (): number {
            // passed as a prop to <recent-workouts-panel>
            return this.exercises[this.curPageIdx].ref1RM;
        },
        currentExerciseGuideName: function (): string {
            // passed as a prop to <recent-workouts-panel>
            return this.exercises[this.curPageIdx].guideType;
        },
        currentExerciseGuide: function (): Guide {
            for (var i = 0; i < this.guides.length; i++) {
                if (this.guides[i].name == this.currentExerciseGuideName) 
                    return this.guides[i];
            }
            return this.guides[0]; // not found - return default (empty) guide
        },
        weekNumber: function(): number {
            var refdate = moment(this.blockStartDate, "YYYY-MM-DD", true);
            if (!refdate.isValid()) {
                return null;
            }
            var wodate = moment(this.workoutDate, "YYYY-MM-DD", true);
            if (!wodate.isValid()) {
                return null;
            } 
            return wodate.diff(this.blockStartDate, 'weeks') + 1;
        },
        lastWeeksComment: function (): string {
            var found = this.recentWorkouts.find(z => z.name == this.currentExerciseName);
            if (found != null) {
                return found.comments;
            } else {
                return null;
            }
        },
        guideInformationTable: function () {
            // Shows which guide is being used for each week
            // See also presets.ts/_applyPreset and presets.ts/_getGuideWeeks
            var wk = this.weekNumber;
            function guideToList(guideWeeks: GuideWeek[]) {
                return guideWeeks.map(z => ({
                    text: "Week " + z.fromWeek
                          + (z.fromWeek == z.toWeek ? "" : (z.toWeek == 99 ? "+" : "-" + z.toWeek))
                          + ": " + z.guide,
                    color: wk >= z.fromWeek && wk <= z.toWeek ? "black" : "silver"
                }));
            }
            var mainList = guideToList(_getGuideWeeks("MAIN"));
            var acesList = guideToList(_getGuideWeeks("ACES"));

            // combine `mainList` and `acesList` into a table
            return mainList.map((mainItem, idx) => ({
                mainText: mainItem.text,
                mainColor: mainItem.color,
                acesText: idx >= acesList.length ? "" : acesList[idx].text,
                acesColor: idx >= acesList.length ? "" : acesList[idx].color
            }));
        }
    },
    watch: {
        exercises: {
            handler: function () { 
                // update output text whenever any changes are made
                this.updateOutputText(); 
            },
            deep: true
        },
        emailTo: function () {
            // save email address to local storage whenever it's changed
            localStorage["emailTo"] = this.emailTo;
        },
        blockStartDate: function (newValue) {
            if (moment(newValue, "YYYY-MM-DD", true).isValid()) {
                localStorage.setItem("blockStartDate", newValue);
            } else {
                localStorage.removeItem("blockStartDate");
            }
        }
    }
});
</script>