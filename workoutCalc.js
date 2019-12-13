import { _newWorkout, _newSet, _volumeForSet } from './supportFunctions.js'
import gridRow from './gridRow.js'
import recentWorkoutsPanel from './recentWorkoutsNew.js'

export default {
    components: {
        gridRow,
        recentWorkoutsPanel
    },
    // Use "es6-string-html" VS Code extension to enable syntax highlighting on the string below.
    template: /*html*/`
        <div>
            <div style="float: right; font-size: smaller">
                One Rep Max Formula
                <select v-model="oneRmFormula">
                    <option>McGlothin</option>
                    <option>Brzycki</option>
                    <option>Wathan</option>
                    <option>Epley</option>
                    <option>Mayhew et al.</option>
                    <option>O'Conner et al.</option>
                    <option>Lombardi</option>
                </select>
                <br />
                Guide type
                <select v-model="guideType">
                    <option value="">Default</option>
                    <option value="6-8">6-8 reps</option>
                    <option value="8-10">8-10 reps</option>
                    <option value="12-15">12-15 reps</option>
                </select>
            </div>

            <button v-for="(exercise, idx) in exercises"
                    v-on:click="gotoPage(idx)"
                    class="pagebtn"
                    v-bind:class="{ activeBtn: curPageIdx == idx }">
                {{ idx + 1 }}
            </button>
            
            <button class="clearbtn" v-on:click="clearAll">Clear</button>
            

            <div v-for="(exercise, exIdx) in exercises" v-show="exIdx == curPageIdx" class="exdiv">

                <div style="margin-top: 15px; margin-bottom: 10px">
                    <b>Exercise #{{ exIdx + 1 }}:</b>
                    <input type="text" v-model="exercise.name" style="width: 225px" autocapitalize="off" />
                </div>

                <div style="margin-bottom: 15px" class="smallgray">
                    <label>
                        <input type="checkbox" v-model="show1RM" /> Show 1RM
                    </label>
                    <label>
                        <input type="checkbox" v-model="showVolume" /> Show volume
                    </label>
                    <span v-if="show1RM" style="margin-left: 15px" >
                        Reference <input type="number" v-model="exercise.ref1RM" style="width: 65px" class="smallgray verdana" /> kg
                    </span>
                    <label v-if="show1RM">
                        <input type="checkbox" v-model="showGuide" /> Show guide
                    </label>
                </div>

                <table class="maintable">
                    <thead>
                        <tr>
                            <th v-if="show1RM" class="smallgray">%1RM</th>
                            <th>Set</th>
                            <th v-if="showGuide">Guide</th>
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
                            v-bind:one-rm-formula="oneRmFormula"
                            v-bind:ref1-r-m="exercise.ref1RM"
                            v-bind:read-only="false"
                            v-bind:show-guide="show1RM && showGuide"
                            v-bind:exercise-name="exercise.name"
                            v-bind:guide-percentages="guidePercentages">
                        </tr>
                        <tr>
                            <td v-if="show1RM"></td>
                            <td><button v-on:click="addSet">+</button></td>
                            <td colspan="3"
                                class="smallgray verdana showonhover"
                                style="padding-top: 5px">
                                <!-- v-bind:class="{ 'showonhover': !showVolume }" -->
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
            <textarea style="width: 400px; height: 50px; margin-bottom: 5px" 
                    v-model="outputText" 
                    readonly="readonly"></textarea>

            <!-- <br />Mail to: <br />
            <input type="email" style="width: 260px" v-model="emailTo" />
            &nbsp;<a v-bind:href="emailLink">Send email</a> -->


            
            <recent-workouts-panel v-bind:tag-list="tagList"
                                   v-bind:show1-r-m="show1RM"
                                   v-bind:show-volume="showVolume"
                                   v-bind:one-rm-formula="oneRmFormula"
                                   v-bind:recent-workouts="recentWorkouts"
                                   v-bind:current-exercise-name="currentExerciseName">
            </recent-workouts-panel>


            <br /><br />
            <div style="background-color: #eef; display: inline-block">
                <div style="background-color: #dde; border-bottom: solid 1px #ccd; font-weight: bold; padding: 1px 5px">
                    ☁ Cloud Backup - Dropbox
                </div>
                <div style="padding: 5px">
                    <div v-show="!dropboxLastSyncTimestamp">
                        Dropbox <a target="_blank" href="https://dropbox.github.io/dropbox-api-v2-explorer/#files_list_folder">access token</a>
                        <input type="text" v-model="dropboxAccessToken" v-bind:disabled="dropboxSyncInProgress" />
                    </div>
                    <!-- Filename <input type="text" v-model="dropboxFilename" readonly="readonly" />
                    <br /> -->
                    <button v-show="!dropboxLastSyncTimestamp && !!dropboxAccessToken"
                            v-bind:disabled="dropboxSyncInProgress"
                            v-on:click="dropboxSyncStage1">Connect to Dropbox</button>
                    <img v-show="dropboxSyncInProgress" src="https://cdnjs.cloudflare.com/ajax/libs/timelinejs/2.25/css/loading.gif" />
                    <span v-show="!!dropboxLastSyncTimestamp && !dropboxSyncInProgress">
                        Last sync at {{ dropboxLastSyncTimestamp | formatDate }}
                    </span>
                </div>
            </div>
            <br /><br />


           

        </div>`,
    data: function() { 
        return {
            curPageIdx: 0,
            exercises: !localStorage["currentWorkout"] ? _newWorkout() : JSON.parse(localStorage["currentWorkout"]),
            recentWorkouts: !localStorage["recentWorkouts"] ? [] : JSON.parse(localStorage["recentWorkouts"]),
            outputText: '',
            emailTo: localStorage['emailTo'],

            dropboxFilename: "workouts.json", // user needs to create this file manually, initial contents should be an empty array []
            dropboxAccessToken: localStorage["dropboxAccessToken"] || "",
            dropboxSyncInProgress: false,
            dropboxLastSyncTimestamp: null,

            show1RM: true,
            showGuide: true,
            showVolume: false,
            oneRmFormula: 'Brzycki',

            tagList: {
                // object keys have to be strings (i.e. "10" not 10)
                "10": { "emoji": "💪", "description": "high energy" },
                "20": { "emoji": "😓", "description": "low energy" },
                "25": { "emoji": "🤕", "description": "injury" },
                //"30": { "emoji": "🆗", "description": "productive if unremarkable" },
                //"40": { "emoji": "📈", "description": "increase over previous workout" },
                "50": { "emoji": "💯", "description": "new PR" },
                "60": { "emoji": "🐢", "description": "long gaps between sets" },
                "61": { "emoji": "🐇", "description": "short gaps between sets" },
                "70": { "emoji": "🐌", "description": "preworkout took a while to kick in" },
                "80": { "emoji": "☕", "description": "too much caffeine" },
                "98": { "emoji": "🛑", "description": "stop sign" },
                "99": { "emoji": "☝", "description": "need to increase the weight" }
            },

            guideType: ''
        }
    },
    methods: {
        //runningTotal_numberOfReps(exercise) {
        //    return exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0);
        //},
        //runningTotal_averageWeight(exercise) {
        //    var totalReps = this.runningTotal_numberOfReps(exercise);
        //    if (totalReps == 0) return 0;
        //    var self = this;
        //    var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
        //    return totalVolume / totalReps;
        //},
        runningTotal_totalVolume: function(exercise) {
            var self = this;
            return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
        },
        gotoPage: function(idx) {
            this.curPageIdx = idx;
        },
        clearAll: function() {
            if (confirm("Are you sure you want to clear the whole form?")) {
                this.saveCurrentWorkoutToHistory();
                this.exercises = _newWorkout();
                this.curPageIdx = 0;
                this.dropboxSyncStage1();
            }
        },
        addSet: function() {
            if (confirm("Are you sure you want to add a new set?")) {
                this.exercises[this.curPageIdx].sets.push(_newSet());
            }
        },
        
        updateOutputText: function() {
            // Generate output text
            var output = "";
            var totalVolume = 0;

            var self = this;
            this.exercises.forEach(function(exercise, exerciseIdx) {
                var weights = "kg";
                var reps = "x ";
                var gaps = "🕘  ";
                var exerciseVolume = 0;
                
                exercise.sets.forEach(function (set, setIdx) {
                    var w = set.weight;
                    var r = set.reps;
                    var g = (setIdx == (exercise.sets.length - 1)) 
                        ? "" 
                        : exercise.sets[setIdx + 1].gap; // use the next one down

                    var score = _volumeForSet(set);
                    if (score > 0) {
                        var len = Math.max(w.length, r.length, g.length);
                        weights += "  " + self.pad(w, len);
                        reps += "  " + self.pad(r, len);
                        gaps += "  " + self.pad(g, len);
                        exerciseVolume += score;
                        totalVolume += score;
                    }
                });

                if (exerciseVolume > 0) {
                    output += (exerciseIdx + 1).toString() + ". " + exercise.name + "\n  "
                        + weights.trim() + "\n  "
                        + reps.trim() + "\n  "
                        + gaps.trim() + "\n  "
                        //+ "Volume: " + exerciseVolume + "\n"
                        + "\n";
                }
            });
            //if (totalVolume > 0) {
            //    output += "Total volume: " + totalVolume;
            //}

            localStorage["currentWorkout"] = JSON.stringify(this.exercises); // save to local storage

            this.outputText = output; // update output text
        },
        saveCurrentWorkoutToHistory: function() {
            var idSeed = Math.round(new Date().getTime() / 1000); // no. seconds since Jan 1, 1970
            var self = this;
            this.exercises.forEach(function(exercise) {
                var setsWithScore = exercise.sets.filter(function(set) { return _volumeForSet(set) > 0 });
                if (setsWithScore.length > 0) {
                    // Add exercise to this.recentWorkouts
                    self.recentWorkouts.unshift({
                        id: idSeed++,
                        date: moment().format("YYYY-MM-DD"),
                        name: exercise.name,
                        ref1RM: exercise.ref1RM,
                        sets: setsWithScore,
                        comments: exercise.comments,
                        etag: exercise.etag
                    });
                }
            });
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
        },

        dropboxSyncStage1: function() {
            // Dropbox sync stage 1 - Load existing data from Dropbox
            if (!this.dropboxAccessToken) return;
            this.dropboxSyncInProgress = true;

            // See https://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
            var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
            var self = this;
            dbx.filesDownload({ path: '/' + this.dropboxFilename })
                .then(function(data) {
                    var reader = new FileReader();
                    reader.addEventListener("loadend", function() {
                        var obj = JSON.parse(reader.result);
                        self.dropboxSyncStage2(obj);
                    });
                    reader.readAsText(data.fileBlob);
                })
                .catch(function(error) {
                    console.error(error);
                    alert("Failed to download " + self.dropboxFilename + " from Dropbox - " + error.message);
                    self.dropboxSyncInProgress = false;
                });
        },
        dropboxSyncStage2: function(dropboxData) {
            // Dropbox sync stage 2 - 
            // Merge this.recentWorkouts with dropboxData, using 'id' field as a key

            // Build lookup
            //     Key = ID (unique)
            //     Value = Item index
            // e.g. {
            //     1521245786: 0,
            //     1521418547: 1
            // }
            var dropLookup = {}; 
            for (var i = 0; i < dropboxData.length; i++){
                dropLookup[dropboxData[i].id] = i;

                // BEGIN Temporary patch 3-Aug-18: Add "id" field
                //       var dayTicks = moment(dropboxData[i].date).startOf("day").valueOf();
                //       var milliTicks = moment(dropboxData[i].date).milliseconds();
                //       dropboxData[i].id = Math.round((dayTicks / 1000) + milliTicks);
                // END   Temporary patch
            }

            // Add & "delete" items
            for (var i = 0; i < this.recentWorkouts.length; i++) {
                var id = this.recentWorkouts[i].id;
                if (id != null) { // check 'id' exists (not null/undefined)
                    if (!dropLookup.hasOwnProperty(id)) {
                        // dropData doesn't contain item - add it
                        dropboxData.push(this.recentWorkouts[i]);
                    } else {
                        // dropData contains item - check deletion status
                        if (this.recentWorkouts[i].name == "DELETE") {
                            // note that the item is not deleted completely,
                            // a "placeholder" is left behind, e.g. {"id":1521245786,"name":"DELETE"}
                            // This is so that the deletion status can be propagated to all other synced devices.
                            // (otherwise it would keep re-appearing when other devices synced)
                            dropboxData[dropLookup[id]] = {
                                "id": id,
                                "name": "DELETE"
                            };
                        }
                    }
                }
            }

            // Sort by [date] DESC, i.e. so the most recent is at the top.
            // https://stackoverflow.com/questions/10123953
            dropboxData.sort(function(a, b){
                var c = new Date(a.date);
                var d = new Date(b.date);
                return d - c; 
            });

            // Save changes
            this.recentWorkouts = dropboxData;
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
            this.dropboxSyncStage3();
        },
        dropboxSyncStage3: function() {
            // Dropbox sync stage 3 - Save data back to Dropbox
            if (!this.dropboxAccessToken ) return;
            // See https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/upload/index.html
            var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
            var self = this;
            dbx.filesUpload({ 
                    path: '/' + this.dropboxFilename, 
                    contents: JSON.stringify(this.recentWorkouts, null, 2), // pretty print JSON (2 spaces)
                    mode: { '.tag': 'overwrite' }
                })
                .then(function(response) {
                    localStorage["dropboxAccessToken"] = self.dropboxAccessToken;
                    self.dropboxSyncInProgress = false;
                    self.dropboxLastSyncTimestamp = new Date();
                })
                .catch(function(error) {
                    console.error(error);
                    alert("Failed to upload " + self.dropboxFilename + " to Dropbox - " + error.message);
                    self.dropboxSyncInProgress = false;
                    self.dropboxLastSyncTimestamp = "";
                });
        },
        pad: function(str, len) {
            // Pads the string so it lines up correctly
            var xtra = len - str.length;
            return " ".repeat((xtra / 2) + (xtra % 2))
                + str
                + " ".repeat(xtra / 2);
        }
    },
    computed: {
        emailLink: function() {
            return "mailto:" + this.emailTo + "?subject=workout&body=" + encodeURIComponent(this.outputText);
        },
        currentExerciseName: function() {
            // passed as a prop to <recent-workouts-panel>
            return this.exercises[this.curPageIdx].name;
        },
        guidePercentages: function() {
            if (this.guideType == '12-15') {
                // high rep = 12-15 reps = 69%-71% 1RM
                return [0.45, 0.50, 0.55, 0.62, 0.69, 0.69, 0.69, 0.69];
            } 
            if (this.guideType == '8-10') {
                // medium reps = 8-10 reps = 75-79% 1RM
                return [0.45, 0.50, 0.55, 0.65, 0.76, 0.76, 0.76, 0.76];
            }
            if (this.guideType == '6-8') {
                // low reps = 6-8 reps = 79-83% 1RM
                return [0.45, 0.55, 0.65, 0.75, 0.84, 0.84, 0.84, 0.84];
            }
            // default
            return [0.45, 0.5, 0.55, 0.62, 0.68, 0.76, 0.84, 0.84, 0.84]; // 3-2-1-3
            // [0.5, 0.55, 0.6, 0.65, 0.70, 0.75, 0.81, 0.81, 0.81] // 2-2-2-3
        }
    },
    watch: {
        exercises: {
            handler: function() { 
                // update output text whenever any changes are made
                this.updateOutputText(); 
            },
            deep: true
        },
        emailTo: function() {
            // save email address to local storage whenever it's changed
            localStorage["emailTo"] = this.emailTo;
        }
    },
    created: function() { 
        this.updateOutputText();
        this.dropboxSyncStage1();
    }
};
