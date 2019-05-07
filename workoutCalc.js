import { _calculateOneRepMax, _roundOneRepMax, _newWorkout } from './supportFunctions.js'
import gridRow from './gridRow.js'

export default {
    components: {
        gridRow
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
                    <label>Show 1RM
                        <input type="checkbox" v-model="show1RM" />
                    </label>
                    <span v-if="show1RM" style="margin-left: 15px" >
                        Reference <input type="number" v-model="exercise.ref1RM" style="width: 65px" class="smallgray verdana" /> kg
                    </span>
                </div>

                <table class="maintable">
                    <thead>
                        <tr>
                            <th v-if="show1RM" class="smallgray">%1RM</th>
                            <th>Set</th>
                            <th>Weight</th>
                            <th>Reps</th>
                            <!-- <th style="padding: 0px 10px">Score</th> -->
                            <th>Rest</th>
                            <th v-if="show1RM" class="smallgray">Est 1RM</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(set, setIdx) in exercise.sets"
                            is="grid-row" 
                            v-bind:set="set" 
                            v-bind:set-idx="setIdx"
                            v-bind:show1-r-m="show1RM"
                            v-bind:ref1-r-m="exercise.ref1RM"
                            v-bind:read-only="false"
                            v-bind:one-rm-formula="oneRmFormula">
                        </tr>
                        <tr>
                            <td v-if="show1RM"></td>
                            <td><button v-on:click="addSet">+</button></td>
                            <td colspan="3"
                                class="smallgray verdana showonhover"
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
            <textarea style="width: 400px; height: 50px; margin-bottom: 5px" 
                    v-model="outputText" 
                    readonly="readonly"></textarea>

            <!-- <br />Mail to: <br />
            <input type="email" style="width: 260px" v-model="emailTo" />
            &nbsp;<a v-bind:href="emailLink">Send email</a> -->


            

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
                            <!-- <th>Weight range</th>
                            <th>No. sets</th>
                            <th>Avg per set</th> -->
                            <!-- <th>Warm up</th> -->
                            <th>12 rep max</th>
                            <!-- <th>Total volume</th> -->
                            <th>{{ MAX_FOR_REPS_THRESHOLD }} rep max</th>
                            <!-- <th>Total reps</th> -->
                            <!-- <th>&gt;=8 reps avg.</th> -->
                            <th>Max attempted</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(summary, sidx) in recentWorkoutSummaries"
                            v-on:mousemove="showTooltip(sidx, $event)" v-on:mouseout="hideTooltip($event)"
                            v-show="sidx < numberOfRecentWorkoutsToShow || showAllPrevious">
                            <td>{{ summary.date | formatDate }}</td>
                            <td>{{ summary.name }}
                                <span v-if="!!summary.etag"
                                    v-bind:title="tagList[summary.etag].description"
                                    >{{ tagList[summary.etag].emoji }}
                                </span>
                            </td>
                            <!--<td class="r">{{ summary.lowestWeight }} → {{ summary.highestWeight }}</td> -->
                            <!--<td class="r">{{ summary.numberOfSets }}</td> -->
                            <!--<td class="r">{{ summary.averageVolumePerSet }}</td> -->
                            <!--<td class="r">e.g. "25x12"</td> -->
                            <!--<td class="r">e.g. "27.5x9"</td> -->
                            <!-- <td class="pre italic">{{ summary.warmUp }}</td> -->
                            <td class="pre italic">{{ summary.maxFor12 }}</td>
                            <!-- <td class="pre">{{ summary.totalVolume.toLocaleString() }}</td> -->
                            <!--                bold: summary.maxForRepsIsMultiple -->
                            <td v-bind:class="{ best: summary.isBestVolume }"
                                class="pre" 
                                >{{ summary.maxForReps }}</td>
                            <!-- TODO possible future development: add number of sets ??? -->
                            <!-- e.g. 30kg 3x8, or 25kg 4x8+ ??? -->
                            <!-- <td class="pre">{{ summary.totalReps }}</td> -->
                            <!-- <td v-bind:class="{ 'faded': summary.hyperLowReps }"
                                class="pre">{{ summary.hyperAverage }}</td> -->
                            <td v-bind:class="{ 'faded': summary.maxWeightSetCount == 1,
                                                'bold': summary.maxWeightSetCount >= 3,
                                                'best': summary.isBestIntensity }"
                                class="pre">{{ summary.maxAttempted }}</td>
                            <!-- TODO possible future development: "Avg rest time" ??? -->
                            <td class="noborder" v-on:click="removeRecent(summary.idx)">x</td>
                            <td v-show="!!summary.comments" v-bind:title="summary.comments">🗨</td>
                            <!-- Or a summary of the whole workout (25)12 (30)8/9 (32.5)4/4/4 -->
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


            <div id="tooltip" v-show="tooltipVisible">
                <table>
                    <tr v-if="show1RM && !!tooltipData.ref1RM && tooltipData.ref1RM != tooltipData.maxEst1RM">
                        <td colspan="4">Ref. 1RM</td>
                        <td v-bind:class="{ oneRepMaxExceeded: tooltipData.maxEst1RM > tooltipData.ref1RM }">
                            {{ tooltipData.ref1RM }}
                        </td>
                    </tr>
                    <tr>
                        <th v-if="show1RM">% 1RM</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <!-- <th>Score</th> -->
                        <th>Rest</th>
                        <th v-if="show1RM">Est 1RM</th>
                    </tr>
                    <tr v-for="(set, setIdx) in tooltipData.sets"
                            is="grid-row" 
                            v-bind:set="set" 
                            v-bind:set-idx="setIdx"
                            v-bind:show1-r-m="show1RM"
                            v-bind:ref1-r-m="!!tooltipData.ref1RM ? Math.max(tooltipData.ref1RM,tooltipData.maxEst1RM) : tooltipData.maxEst1RM"
                            v-bind:read-only="true"
                            v-bind:one-rm-formula="oneRmFormula">
                    </tr>
                    <tr><td style="padding: 0"></td></tr> <!-- fix for chrome (table borders) -->
                    <tr style="border-top: double 3px black">
                        <td v-bind:colspan="show1RM ? 4 : 2">Total volume</td>
                        <td>{{ tooltipData.totalVolume.toLocaleString() }} kg</td>
                    </tr>
                    <tr>
                        <td v-bind:colspan="show1RM ? 4 : 2">Total reps</td>
                        <td>{{ tooltipData.totalReps }}</td>
                    </tr>
                    <tr>
                        <td v-bind:colspan="show1RM ? 4 : 2">Maximum weight</td>
                        <td>{{ tooltipData.highestWeight }}</td>
                    </tr>

                    <tr v-if="show1RM">
                        <td colspan="4">Max est. 1RM</td>
                        <td>{{ tooltipData.maxEst1RM }}</td>
                    </tr>
                </table>
            </div>

        </div>`,
    data: function() { 
        return {
            // MAX_FOR_REPS_THRESHOLD
            // I tried setting this to 12 for a while,
            // (sort of marking the halfway point in a workout),
            // but the problem with 12 is that there's no way to make
            // week-on-week progress (i.e. my 12RM doesn't improve every week).
            // Whereas setting it to less than 12 (8, for example) provides a goal
            // to aim for every workout (e.g. x8, x9, x10, x11, x12)
            MAX_FOR_REPS_THRESHOLD: 7,
            curPageIdx: 0,
            exercises: !localStorage["currentWorkout"] ? this._newWorkout() : JSON.parse(localStorage["currentWorkout"]),
            outputText: '',
            emailTo: localStorage['emailTo'],
            recentWorkouts: !localStorage["recentWorkouts"] ? [] : JSON.parse(localStorage["recentWorkouts"]),
            filterActive: true,
            tooltipVisible: false,
            tooltipIdx: -1,
            dropboxFilename: "workouts.json", // user needs to create this file manually, initial contents should be an empty array []
            dropboxAccessToken: localStorage["dropboxAccessToken"] || "",
            dropboxSyncInProgress: false,
            dropboxLastSyncTimestamp: null,
            show1RM: true,
            showAllPrevious: false,
            numberOfRecentWorkoutsToShow: 4,
            oneRmFormula: 'Brzycki',
            tagList: {
                // object keys have to be strings (i.e. "10" not 10)
                "10": { "emoji": "💪", "description": "high energy" },
                "20": { "emoji": "😓", "description": "low energy" },
                //"30": { "emoji": "🆗", "description": "productive if unremarkable" },
                //"40": { "emoji": "📈", "description": "increase over previous workout" },
                "50": { "emoji": "💯", "description": "new PR" },
                "60": { "emoji": "🐢", "description": "long gaps between sets" },
                "70": { "emoji": "🐌", "description": "preworkout took a while to kick in" },
                "80": { "emoji": "☕", "description": "too much caffeine" },
                "99": { "emoji": "☝", "description": "need to increase the weight" }
            }
        }
    },
    methods: {
        _calculateOneRepMax: _calculateOneRepMax,
        _roundOneRepMax: _roundOneRepMax,
        _newWorkout: _newWorkout,

        //runningTotal_numberOfReps(exercise) {
        //    return exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0);
        //},
        //runningTotal_averageWeight(exercise) {
        //    var totalReps = this.runningTotal_numberOfReps(exercise);
        //    if (totalReps == 0) return 0;
        //    var self = this;
        //    var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + self.volumeForSet(set) }, 0); // sum array
        //    return totalVolume / totalReps;
        //},
        runningTotal_totalVolume: function(exercise) {
            var self = this;
            return exercise.sets.reduce(function(acc, set) { return acc + self.volumeForSet(set) }, 0);
        },
        gotoPage: function(idx) {
            this.curPageIdx = idx;
        },
        clearAll: function() {
            if (confirm("Are you sure you want to clear the whole form?")) {
                this.saveCurrentWorkoutToHistory();
                this.exercises = this._newWorkout();
                this.curPageIdx = 0;
                this.dropboxSyncStage1();
            }
        },
        addSet: function() {
            if (confirm("Are you sure you want to add a new set?")) {
                this.exercises[this.curPageIdx].sets.push(newSet());
            }
        },
        volumeForSet: function(set) {
            var weight = Number(set.weight);
            var reps = Number(set.reps);
            var volume = weight * reps;
            return volume == 0 ? "" : Math.round(volume);
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

                    var score = self.volumeForSet(set);
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
                var setsWithScore = exercise.sets.filter(function(set) { return self.volumeForSet(set) > 0 });
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
        removeRecent: function(idx) {
            if (confirm("Remove this item from workout history?")) {
                this.recentWorkouts[idx].name = "DELETE";
                localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
                this.dropboxSyncStage1();
            }
        },
        showTooltip: function(summaryItemIdx, e) {
            this.tooltipIdx = summaryItemIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                Vue.nextTick(function() { self.moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function(e) {
            var popupWidth = $("#tooltip").width();
            var overflowX = (popupWidth + e.clientX + 5) > $(window).width();
            $("#tooltip").css({ left: overflowX ? e.pageX - popupWidth : e.pageX });

            var popupHeight = $("#tooltip").height();
            var overflowY = (popupHeight + e.clientY + 15) > $(window).height();
            $("#tooltip").css({ top: overflowY ? e.pageY - popupHeight - 10 : e.pageY + 10 });
        },
        hideTooltip: function (e) {
            this.tooltipVisible = false;
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
        },
        padx: function(weight, reps) {
            if (!weight || !reps) return "";
            var strW = weight.toString();
            var strR = reps.toString();
            return strW.padStart(6) + " x " + strR.padEnd(5);
        },
        showMore: function() {
            this.showAllPrevious = true;
        },
        summaryBuilder: function(sets, threshold) {
            // Max weight for a minimum of {threshold} reps
            var hyperWeight = sets
                .filter(function(set) { return set.reps >= threshold }) // where reps >= MAX_FOR_REPS_THRESHOLD_2
                .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
            var hyperSets = sets
                .filter(function(set) { return set.weight == hyperWeight }) // where weight == hyperWeight
            var hyperMinReps = hyperSets
                .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
            var hyperMaxReps = hyperSets
                .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
            var hyperIsMultiple = hyperSets.length > 1;
            var hyperShowPlus = hyperIsMultiple && (hyperMinReps != hyperMaxReps);
            var hyperString = this.padx(hyperWeight, hyperMinReps + (hyperShowPlus ? "+" : ""));
            return hyperString;
        }
    },
    computed: {
        emailLink: function() {
            return "mailto:" + this.emailTo + "?subject=workout&body=" + encodeURIComponent(this.outputText);
        },
        recentWorkoutSummaries: function() {
            var currentExerciseName = this.exercises[this.curPageIdx].name;
            var summaries = [];
            var self = this;
            this.showAllPrevious = false;
            
            var bestVolume_MaxWeight = 0; 
            var bestVolume_MaxReps = 0; 
            var bestIntensity_MaxWeight = 0; 
            var bestIntensity_MaxReps = 0; 
            
            this.recentWorkouts.forEach(function(exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterActive && exercise.name != currentExerciseName) return;

                // Warm up (first set)
                var warmUp = self.padx(exercise.sets[0].weight, exercise.sets[0].reps);

                // Max weight for a minimum of MAX_FOR_REPS_THRESHOLD reps
                var hyperWeight = exercise.sets
                    .filter(function(set) { return set.reps >= self.MAX_FOR_REPS_THRESHOLD }) // where reps >= MAX_FOR_REPS_THRESHOLD
                    .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
                var hyperSets = exercise.sets
                    .filter(function(set) { return set.weight == hyperWeight }) // where weight == hyperWeight
                var hyperMinReps = hyperSets
                    .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
                var hyperMaxReps = hyperSets
                    .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
                var hyperIsMultiple = hyperSets.length > 1;
                var hyperShowPlus = hyperIsMultiple && (hyperMinReps != hyperMaxReps);
                var hyperString = self.padx(hyperWeight, hyperMinReps + (hyperShowPlus ? "+" : ""));

                // Max weight for a minimum of 12 reps
                var hyper12 = self.summaryBuilder(exercise.sets, 12);

                // Best volume
                if (hyperWeight > bestVolume_MaxWeight) {
                    bestVolume_MaxWeight = hyperWeight;
                    bestVolume_MaxReps = hyperMaxReps;
                } 
                else if (hyperWeight == bestVolume_MaxWeight) {
                    if (hyperMaxReps > bestVolume_MaxReps) {
                        bestVolume_MaxReps = hyperMaxReps;
                    }
                }
                
                // Max weight (any number of reps)
                var maxWeight = exercise.sets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest value in array
                var maxSets = exercise.sets
                    .filter(function(set) { return set.weight == maxWeight }) // where weight == maxWeight
                var maxWeightMinReps = maxSets
                    .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
                var maxWeightMaxReps = maxSets
                    .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
                var maxWeightIsMultiple = maxSets.length > 1;
                var maxWeightShowPlus = maxWeightIsMultiple && (maxWeightMinReps != maxWeightMaxReps);
                var maxString = self.padx(maxWeight, maxWeightMinReps + (maxWeightShowPlus ? "+" : ""));

                // Best intensity
                if (maxWeight > bestIntensity_MaxWeight) {
                    bestIntensity_MaxWeight = maxWeight;
                    bestIntensity_MaxReps = maxWeightMaxReps;
                } 
                else if (maxWeight == bestIntensity_MaxWeight) {
                    if (maxWeightMaxReps > bestIntensity_MaxReps) {
                        bestIntensity_MaxReps = maxWeightMaxReps;
                    }
                }
                
                // Other bits
                var minWeight = exercise.sets.reduce(function(acc, set) { return Math.min(acc, set.weight) }, 9999); // lowest value in array
                var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + self.volumeForSet(set) }, 0); // sum array
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0); // sum array

                //var volumeSets = exercise.sets
                //    .filter(function(set) { return set.reps >= self.MAX_FOR_REPS_THRESHOLD }); // where reps >= MAX_FOR_REPS_THRESHOLD
                //var volumeSumWeight = volumeSets
                //    .reduce(function(acc, set) { return acc + Number(set.weight) }, 0); // sum array
                //var volumeSumReps = volumeSets
                //    .reduce(function(acc, set) { return acc + Number(set.reps) }, 0); // sum array

                var maxEst1RM = exercise.sets
                    .map(function(set) { return self._calculateOneRepMax(set, self.oneRmFormula) })
                    .filter(function(val) { return val > 0 }) // filter out error conditions
                    .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
                maxEst1RM = self._roundOneRepMax(maxEst1RM);

                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "date": exercise.date,
                    "name": exercise.name,
                    "totalVolume": totalVolume,
                    "averageVolumePerSet": Math.round(totalVolume / exercise.sets.length),
                    "numberOfSets": exercise.sets.length,
                    "lowestWeight": minWeight, 
                    "highestWeight": maxWeight, 
                    "warmUp": warmUp,
                    "maxFor12": hyper12,
                    "maxForReps": hyperString,
                    "maxForRepsIsMultiple": hyperIsMultiple,
                    "maxAttempted": maxString != hyperString ? maxString : "-",
                    "maxWeightSetCount": maxSets.length,
                    "maxEst1RM": maxEst1RM,
                    "totalReps": totalReps,
                    "averageWeight": totalVolume / totalReps,
                    //"hyperAverage": volumeSets.length == 0 ? "-" : (volumeSumWeight / volumeSets.length).toFixed(1),
                    //"hyperLowReps": volumeSumReps < 25, // less than 25 reps
                    "comments": exercise.comments,
                    "etag": exercise.etag
                });
            });
            
            // All-time best
            for (var i = 0; i < summaries.length; i++) {
                var summary = summaries[i];
                var sets = this.recentWorkouts[summary.idx].sets;
                summary.isBestVolume = sets
                    .filter(function(set) { return set.weight == bestVolume_MaxWeight && set.reps == bestVolume_MaxReps })
                    .length > 0;
                summary.isBestIntensity = sets
                    .filter(function(set) { return set.weight == bestIntensity_MaxWeight && set.reps == bestIntensity_MaxReps })
                    .length > 0;
            }

            return summaries;
        },
        tooltipData: function() {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) { // outside array bounds
                return {
                    sets: [],
                    totalVolume: 0,
                    highestWeight: 0,
                    maxEst1RM: 0,
                    ref1RM: 0,
                    totalReps: 0
                }
            } else {
                var summaryItem = this.recentWorkoutSummaries[this.tooltipIdx];
                var sets = this.recentWorkouts[summaryItem.idx].sets;
                return {
                    sets: sets,
                    totalVolume: summaryItem.totalVolume,
                    highestWeight: summaryItem.highestWeight,
                    maxEst1RM: summaryItem.maxEst1RM,
                    ref1RM: summaryItem.maxEst1RM, // ignoring ref1RM for the moment // this.recentWorkouts[summaryItem.idx].ref1RM,
                    totalReps: summaryItem.totalReps
                };
            }
        },
        daysSinceLastWorked: function() {
            if (!this.filterActive) return "";
            if (this.recentWorkoutSummaries.length == 0) return "";
            var today = moment().startOf("day");
            var date = moment(this.recentWorkoutSummaries[0].date).startOf("day");
            return today.diff(date, 'days');
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
    }, 
    filters: {
        formatDate: function (datestr) {
            if (!datestr) return "";
            return moment(datestr).format("DD/MM/YY");
        }
    }
};
