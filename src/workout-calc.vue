<template>
     <div>
        <div v-if="show1RM"
                style="float: right; font-size: smaller; text-align: right">
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

            <label>
                <input type="checkbox" v-model="showRmTable" />
                Show table
            </label>

            <br /><br />

            <div style="display: inline-block; text-align: left">
                Workout date<br />
                <input type="text" style="width: 80px" v-model="workoutDate" 
                    disabled="disabled" />
            </div>

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
                >📋</button><button 
                class="clearbtn" v-on:click="clearAll">Clear</button>
        

        <div v-for="(exercise, exIdx) in exercises" 
             v-show="exIdx == curPageIdx" 
             class="exdiv">

            <div style="margin-top: 15px; margin-bottom: 10px; font-weight: bold">
                Exercise
                <input type="text" v-model="exercise.number" style="width: 30px; font-weight: bold" />:
                <input type="text" v-model="exercise.name" autocapitalize="off" style="width: 225px" 
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
                    <input type="checkbox" v-model="show1RM" /> Show 1RM
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
                                v-bind:value="guide">
                                {{ guide + (guide[0] >= '0' && guide[0] <= '9' ? " reps" : "") }}
                        </option>
                </select>
            </div>

            <table class="maintable">
                <thead>
                    <tr>
                        <th v-if="show1RM" class="smallgray">%1RM</th>
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
                    <tr v-for="(set, setIdx) in exercise.sets"
                        is="grid-row" 
                        v-bind:set="set" 
                        v-bind:set-idx="setIdx"
                        v-bind:show1-r-m="show1RM"
                        v-bind:show-volume="showVolume"
                        v-bind:ref1-r-m="exercise.ref1RM"
                        v-bind:max-est1-r-m="exercise.ref1RM"
                        v-bind:read-only="false"
                        v-bind:one-rm-formula="oneRmFormula"
                        v-bind:show-guide="show1RM && showGuide"
                        v-bind:current-guide="currentExerciseGuide"
                        v-bind:exercise-name="exercise.name">
                    </tr>
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
                               v-bind:show-guide="showGuide"
                               v-bind:current-exercise-guide="currentExerciseGuideName"
                               v-bind:guide-categories="guideCategories">
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
import gridRow from './grid-row.vue'
import recentWorkoutsPanel from './recent-workouts-panel.vue'
import rmTable from './rm-table.vue'
import { Exercise, Guide, RecentWorkout } from './types/app'
import Vue from './types/vue'
import * as moment from './types/moment'
import dropboxSync from './dropbox-sync.vue'

export default Vue.extend({
    components: {
        gridRow,
        recentWorkoutsPanel,
        rmTable,
        dropboxSync
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

            guides: [
                // see 'currentExerciseGuide' computed property 
                // for details on how the guides are generated
                
                '', // none
                '12-15', // high reps = 60% 1RM
                '8-12', // medium reps = 72.5% 1RM (halfway between 60% and 85%)
                '5-7', // low reps = 85% 1RM
                //'12-15': generateGuide(0.35, 3, 0.65, 4), // high reps = 65% 1RM
                //'8-10': generateGuide(0.35, 4, 0.75, 4), // medium reps = 75% 1RM
                //'Deload': [0.35, 0.50, 0.50, 0.50],
                //'old': [0.45, 0.5, 0.55, 0.62, 0.68, 0.76, 0.84, 0.84, 0.84]
            ],
            guideCategories: {
                // This is used for "Filter 2" in Recent Workouts Panel
                // to combine similar guides together, 
                // e.g. if the currently-selected guide is "8-10", 
                //      then it will show "8-12" as well
                "5-7"  : "LOW",
                "8-10" : "MEDIUM",
                "8-12" : "MEDIUM",
                "12-15": "HIGH",
                "15+"  : "HIGH"
            }
        }
    },
    mounted: function () { 
        this.updateOutputText();
        this.syncWithDropbox();
    },
    methods: {
        syncWithDropbox: function () { 
            var dropbox = this.$refs.dropbox as InstanceType<typeof dropboxSync>;
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
        clearAll: function () {
            if (confirm("Are you sure you want to clear the whole form?")) {
                this.saveCurrentWorkoutToHistory();
                this.exercises = _newWorkout();
                this.curPageIdx = 0;
                this.syncWithDropbox();
            }
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

            var self = this;
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
                        number: exercise.number,
                        name: exercise.name,
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
        generateGuide: function (startWeight: number, numWarmUpSets: number, workWeight: number, numWorkSets: number) {
            var sets = [];
            var increment = (workWeight - startWeight) / numWarmUpSets;
            for (var i = 0; i < numWarmUpSets; i++) {
                sets.push(startWeight + (increment * i));
            }
            for (var i = 0; i < numWorkSets; i++) {
                sets.push(workWeight);
            }
            return sets;
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
        currentExerciseGuideName: function (): string {
            // passed as a prop to <recent-workouts-panel>
            return this.exercises[this.curPageIdx].guideType;
        },
        currentExerciseGuide: function (): number[] {
            var guideName = this.currentExerciseGuideName;
            var warmUp = this.exercises[this.curPageIdx].number.indexOf("1") == 0; // .startsWith('1')
            if (guideName == "12-15") {
                // high reps = 60% 1RM
                return this.generateGuide(0.35, (warmUp ? 2 : 0), 0.60, 3)
            }
            else if (guideName == "8-12") {
                // medium reps = 72.5% 1RM (halfway between 60% and 85%)
                return this.generateGuide(0.35, (warmUp ? 3 : 0), 0.725, 3);
            }
            else if (guideName == "5-7") {
                // low reps = 85% 1RM
                return this.generateGuide(0.35, (warmUp ? 4: 0), 0.85, 3)
            }
            else return []; // none
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
        }
    }
});
</script>