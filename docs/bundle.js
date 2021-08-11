Vue.component('dropbox-sync', {
    template: "    <div style=\"background-color: #eef; display: inline-block\">"
+"        <div style=\"background-color: #dde; border-bottom: solid 1px #ccd; font-weight: bold; padding: 1px 5px\">"
+"            ☁ Cloud Backup - Dropbox"
+"        </div>"
+"        <div style=\"padding: 5px\">"
+"            <div v-show=\"!dropboxLastSyncTimestamp\">"
+"                Dropbox <a target=\"_blank\" href=\"https://dropbox.github.io/dropbox-api-v2-explorer/#files_list_folder\">access token</a>"
+"                <input type=\"text\" v-model=\"dropboxAccessToken\" v-bind:disabled=\"dropboxSyncInProgress\" />"
+"            </div>"
+"            <!-- Filename <input type=\"text\" v-model=\"dropboxFilename\" readonly=\"readonly\" />"
+"            <br /> -->"
+"            <button v-show=\"!dropboxLastSyncTimestamp && !!dropboxAccessToken\""
+"                    v-bind:disabled=\"dropboxSyncInProgress\""
+"                    v-on:click=\"dropboxSyncStage1\">Connect to Dropbox</button>"
+"            <img v-show=\"dropboxSyncInProgress\" src=\"https://cdnjs.cloudflare.com/ajax/libs/timelinejs/2.25/css/loading.gif\" />"
+"            <span v-show=\"!!dropboxLastSyncTimestamp && !dropboxSyncInProgress\">"
+"                Last sync at {{ dropboxLastSyncTimestamp | formatDate }}"
+"            </span>"
+"        </div>"
+"    </div>",
        props: {
            dropboxFilename: String, // user needs to create this file manually, initial contents should be an empty array []
            dataToSync: Array
        },
        data: function () { 
            return {
                dropboxAccessToken: localStorage["dropboxAccessToken"] || "",
                dropboxSyncInProgress: false,
                dropboxLastSyncTimestamp: null
            }
        },
        methods: {
            dropboxSyncStage1: function () {
                if (!this.dropboxAccessToken) return;
                this.dropboxSyncInProgress = true;
                var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
                var self = this;
                dbx.filesDownload({ path: '/' + this.dropboxFilename })
                    .then(function (data) {
                        var reader = new FileReader();
                        reader.addEventListener("loadend", function () {
                            var dropboxData = JSON.parse(reader.result);
                            self.dropboxSyncStage2(dropboxData);
                        });
                        reader.readAsText(data.fileBlob);
                    })
                    .catch(function (error) {
                        console.error(error);
                        alert("Failed to download " + self.dropboxFilename + " from Dropbox - " + error.message);
                        self.dropboxSyncInProgress = false;
                    });
            },
            dropboxSyncStage2: function (dropboxData) {
                var dropLookup = {}; // as {[key: number]: number}; // see comment above
                for (var i = 0; i < dropboxData.length; i++){
                    dropLookup[dropboxData[i].id] = i;
                }
                for (var i = 0; i < this.dataToSync.length; i++) {
                    var id = this.dataToSync[i].id;
                    if (id != null) { // check 'id' exists (not null/undefined)
                        if (!dropLookup.hasOwnProperty(id)) {
                            dropboxData.push(this.dataToSync[i]);
                        } else {
                            if (this.dataToSync[i].name == "DELETE") {
                                dropboxData[dropLookup[id]] = {
                                    "id": id,
                                    "name": "DELETE"
                                };
                            }
                        }
                    }
                }
                dropboxData.sort(function (a, b) {
                    var c = new Date(a.date || 0);
                    var d = new Date(b.date || 0);
                    return d - c; 
                });
                this.$emit("sync-complete", dropboxData); //this.recentWorkouts = dropboxData;
                this.dropboxSyncStage3(dropboxData);
            },
            dropboxSyncStage3: function (dropboxData) {
                if (!this.dropboxAccessToken ) return;
                var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
                var self = this;
                dbx.filesUpload({ 
                    path: '/' + this.dropboxFilename, 
                    contents: JSON.stringify(dropboxData, null, 2), // pretty print JSON (2 spaces)
                    mode: { '.tag': 'overwrite' }
                })
                .then(function (response) {
                    localStorage["dropboxAccessToken"] = self.dropboxAccessToken;
                    self.dropboxSyncInProgress = false;
                    self.dropboxLastSyncTimestamp = new Date();
                })
                .catch(function (error) {
                    console.error(error);
                    alert("Failed to upload " + self.dropboxFilename + " to Dropbox - " + error.message);
                    self.dropboxSyncInProgress = false;
                    self.dropboxLastSyncTimestamp = "";
                });
            }
        }
    });
Vue.component('grid-row', {
    template: "    <tr>"
+"        <td v-if=\"show1RM\" "
+"            class=\"smallgray verdana\""
+"            v-bind:title=\"oneRepMaxTooltip\""
+"            v-bind:class=\"{ 'intensity60': oneRepMaxPercentage >= 55.0 && oneRepMaxPercentage < 70.0,"
+"                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,"
+"                            'intensity80': oneRepMaxPercentage >= 80.0 }\">"
+"            {{ formattedOneRepMaxPercentage }}</td>"
+"        <td v-if=\"!readOnly\">"
+"            {{ setIdx + 1 }}"
+"        </td>"
+"        <td v-if=\"showGuide\""
+"            v-bind:class=\"{ 'intensity60': guidePercentage(setIdx) >= 0.55 && guidePercentage(setIdx) < 0.70,"
+"                            'intensity70': guidePercentage(setIdx) >= 0.70 && guidePercentage(setIdx) < 0.80,"
+"                            'intensity80': guidePercentage(setIdx) >= 0.80 }\""
+"            v-bind:title=\"guideTooltip(setIdx)\">"
+"            <!-- {{ guideString(setIdx) }} -->"
+"            {{ roundGuideWeight(guideWeight(setIdx)) || \"\" }}"
+"        </td>"
+"        <td class=\"border\">"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.weight\" step=\"any\" />"
+"            <template      v-if=\"readOnly\"      >{{ set.weight }}</template>"
+"        </td>"
+"        <td class=\"border\">"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.reps\" "
+"                          v-bind:placeholder=\"guideReps(setIdx, set.weight)\" />"
+"            <template      v-if=\"readOnly\"      >{{ set.reps }}</template>"
+"        </td>"
+"        <!-- <td class=\"score\">{{ volumeForSet(set) }}</td> -->"
+"        <td v-show=\"setIdx != 0\" class=\"border\">"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.gap\" />"
+"            <template      v-if=\"readOnly\"      >{{ set.gap }}</template>"
+"        </td>"
+"        <td v-show=\"setIdx == 0\"><!-- padding --></td>"
+"        <td v-if=\"show1RM\" class=\"smallgray verdana\""
+"            v-bind:class=\"{ 'est1RmEqualToRef': roundedOneRepMax == maxEst1RM,"
+"                            'est1RmExceedsRef': roundedOneRepMax > maxEst1RM } \">"
+"            {{ formattedOneRepMax }}"
+"        </td>"
+"        <td v-if=\"showVolume\" class=\"smallgray verdana\">"
+"            {{ formattedVolume }}"
+"        </td>"
+"    </tr>",
    props: {
        "set": Object,
        "setIdx": Number,
        "show1RM": Boolean,
        "showVolume": Boolean,
        "ref1RM": Number, // used to calculate the "% 1RM" and "Guide" columns on the left
        "maxEst1RM": [Number, String], // TODO remove String so this is always a Number? // used to highlight the "Est 1RM" column on the right
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "showGuide": Boolean,
        "guideType": String,
        "exerciseName": String, // used in roundGuideWeight
        "guides": Object
    },
    methods: {
        guidePercentage: function (setNumber) {
            if (!this.guideType)
                return 0;
            if (!this.guides.hasOwnProperty(this.guideType))
                return 0;
            if (setNumber >= this.guides[this.guideType].length)
                return 0;
            else
                return this.guides[this.guideType][setNumber];
        },
        guideWeight: function (setNumber) {
            var percentage = this.guidePercentage(setNumber);
            if (!this.ref1RM || !percentage) return 0;
            return this.ref1RM * percentage;
        },
        guideReps: function (setIdx, setWeight) {
            if (!setWeight) {
                setWeight = this.roundGuideWeight(this.guideWeight(setIdx));
            }
            if (!this.showGuide || !this.ref1RM || !this.oneRmFormula || !setWeight) return "";
            var workSetWeight = this.workSetWeight();
            var reps = Math.round((1 - (setWeight / workSetWeight)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"
            var isWorkSet = setWeight >= workSetWeight;
            return isWorkSet ? "" : reps;
        },
        workSetWeight: function () {
            if (!this.guideType || !this.ref1RM || !this.guides.hasOwnProperty(this.guideType))
                return 0;
            var guideMaxPercentage = this.guides[this.guideType][this.guides[this.guideType].length - 1];
            return this.roundGuideWeight(this.ref1RM * guideMaxPercentage);
        },
        roundGuideWeight: function (guideWeight) {
            if (!this.ref1RM) return 0;
            if (!guideWeight) return 0;
            if ((this.exerciseName || '').indexOf('db ') == 0)
                return Math.round(guideWeight * 0.5) / 0.5; // round to nearest 2
            else
                return Math.round(guideWeight * 0.4) / 0.4; // round to nearest 2.5
        },
        guideTooltip: function (setNumber) {
            if (!this.ref1RM) return null; // don't show a tooltip
            var guideWeight = this.guideWeight(setNumber);
            if (!guideWeight) return null; // don't show a tooltip
            var roundedWeight = this.roundGuideWeight(guideWeight);
            return "Guide " 
                + parseFloat((this.guidePercentage(setNumber) * 100).toFixed(1))
                + '% = '
                + guideWeight.toFixed(1)
                + ' kg'
                + '\n'
                + 'Actual '
                + parseFloat(((Number(roundedWeight) / this.ref1RM) * 100).toFixed(1))
                + '% = '
                + roundedWeight
                + ' kg';
        }
    },
    computed: {
        oneRepMax: function () {
            return _calculateOneRepMax(this.set, this.oneRmFormula);
        },
        roundedOneRepMax: function () {
            return _roundOneRepMax(this.oneRepMax);
        },
        formattedOneRepMax: function () {
            if (this.oneRepMax == -1) return ""; // no data
            if (this.oneRepMax == -2) return "N/A"; // >12 reps
            return this.roundedOneRepMax.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
        },
        oneRepMaxPercentage: function () {
            if (!this.set.weight || !this.ref1RM) return -1; // no data
            return this.set.weight * 100 / this.ref1RM;
        },
        formattedOneRepMaxPercentage: function () {
            if (this.oneRepMaxPercentage == -1) return ""; // no data
            return Math.round(this.oneRepMaxPercentage) + "%"; 
        },
        oneRepMaxTooltip: function () {
            if (this.oneRepMaxPercentage == -1) return null; // don't show a tooltip
            return parseFloat(this.oneRepMaxPercentage.toFixed(1)) + "%";
        },
        formattedVolume: function () { 
            if (!this.set.weight || !this.set.reps) return ""; // no data
            var volume = _volumeForSet(this.set);
            return volume == 0 ? "" : volume.toString();
        }
    }
});
Vue.component('number-input', {
    template: "    <input type=\"number\" "
+"           v-bind:value=\"parsedValue\""
+"           v-on:input=\"updateValue\""
+"    />",
        props: {
            value: Number // for use with v-model
        },
        computed: {
            parsedValue: function () {
                if (this.value == 0) 
                    return "";
                else 
                    return this.value.toString();
            }
        },
        methods: {
            updateValue: function (event) {
                if (event.target.value == "") 
                    this.$emit("input", 0);
                else
                    this.$emit("input", Number(event.target.value))
            }
        }
    });
Vue.component('recent-workouts-panel', {
    template: "    <div>"
+"        <div v-show=\"recentWorkouts.length > 0\">"
+""
+"            <h4 class=\"recent\">Recent workouts</h4>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"nofilter\" />All exercises</label>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter1\"  />Same exercise</label>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter2\"  />Same ex. &amp; reps</label>"
+"            <span v-if=\"!!daysSinceLastWorked\" "
+"                style=\"margin-left: 50px; \""
+"                v-bind:style=\"{ color: daysSinceLastWorked > 7 ? 'red' : '' }\">"
+"                        <span v-show=\"daysSinceLastWorked > 7\""
+"                                title=\"Decreased performance; Increased DOMS\">⚠️</span>{{ daysSinceLastWorked }} days since last worked"
+"            </span>"
+"            <span v-show=\"numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\""
+"                  style=\"font-size: 13px; margin-left: 20px\""
+"                  v-on:click=\"resetView\">"
+"                  ▲ Reset view"
+"            </span>"
+""
+"            <table border=\"1\" class=\"recent\">"
+"                <thead>"
+"                    <tr>"
+"                        <!--<th>Freq.</th>-->"
+"                        <th>Date</th>"
+"                        <th>Exercise</th>"
+"                        <th>Gap</th><!-- days since last worked -->"
+"                        <th style=\"min-width: 45px\">Start@</th>"
+"                        <th style=\"min-width: 45px\">12 RM</th>"
+"                        <!--<th>8 RM</th>-->"
+"                        <!--<th>4 RM</th>-->"
+"                        <th>Headline</th>"
+"                        <th>Max</th>"
+"                        <th v-if=\"show1RM && showGuide\">Guide</th>"
+"                    </tr>"
+"                </thead>"
+"                <tbody>"
+"                    <tr v-for=\"(summary, sidx) in recentWorkoutSummaries\""
+"                        v-on:mousemove=\"showTooltip(sidx, $event)\" v-on:mouseout=\"hideTooltip($event)\""
+"                        v-bind:class=\"{ 'highlight': !!currentExerciseGuide && currentExerciseGuide == summary.exercise.guideType }\">"
+"                        "
+"                        <!--  Days between      10    9    8    7    6    5    4    3    2   "
+"                              Frequency (x/wk)  0.7  0.8  0.9  1.0  1.2  1.4  1.8  2.3  3.5  -->"
+"                        <!--<td>{{ summary.Frequency }}x</td>-->"
+""
+"                        <td v-bind:title=\"summary.exercise.date | formatDate\""
+"                            style=\"text-align: right\">{{ summary.relativeDateString }}</td>"
+"                       "
+"                        <td>{{ summary.exercise.name }}"
+"                            "
+"                        </td>"
+""
+"                        <td v-bind:class=\"{ 'faded': summary.daysSinceLastWorked >= 7 }\""
+"                            style=\"text-align: right\">{{ summary.daysSinceLastWorked || '' }}</td>"
+"                        <!-- || '' in the line above will show an empty string instead of 0 -->"
+""
+"                        <td class=\"pre italic\">{{ summary.warmUpWeight }}</td>"
+""
+"                        <td class=\"pre faded\">{{ summary.maxFor12 }}</td>"
+"                       "
+"                        <!-- v-bind:class=\"{ best: summary.isBestVolume }\" -->"
+"                        <!--<td class=\"pre\" v-bind:class=\"{ 'bold': summary.numSets8 >= 3 }\""
+"                            >{{ summary.maxFor8 }}</td>-->"
+""
+"                        <!-- v-bind:class=\"{ 'best': summary.isBestIntensity } -->"
+"                        <!--<td class=\"pre\" v-bind:class=\"{ 'faded': summary.numSets4 == 1,"
+"                                                         'bold': summary.numSets4 >= 3 }\""
+"                            >{{ summary.maxFor4 }}</td>-->"
+""
+"                        <td class=\"pre\" v-bind:class=\"{ 'faded': summary.numSetsHeadline == 1,"
+"                                                         'bold': summary.numSetsHeadline >= 3 }\""
+"                            >{{ summary.headline }}</td>"
+""
+"                        <td class=\"pre italic faded\">{{ summary.maxAttempted }}</td>"
+""
+"                        <!-- TODO possible future development: \"Avg rest time\" ??? -->"
+"                        "
+"                        <td v-if=\"show1RM && showGuide\" class=\"guide\">{{ summary.exercise.guideType }}</td>"
+""
+"                        <td class=\"noborder\" v-on:click=\"removeRecent(summary.idx)\">x</td>"
+""
+"                        <td class=\"noborder\" v-on:click=\"copySummaryToClipboard(summary)\">📋</td>"
+""
+"                        <td v-show=\"!!summary.exercise.etag || !!summary.exercise.comments\""
+"                            v-bind:title=\"spanTitle(summary.exercise)\">"
+"                            <span v-if=\"!!summary.exercise.etag\""
+"                                >{{ tagList[summary.exercise.etag].emoji }}"
+"                            </span>"
+"                            <span v-if=\"!!summary.exercise.comments\" "
+"                                  >🗨</span>"
+"                        </td>"
+"                    </tr>"
+"                </tbody>"
+"            </table>"
+"            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->"
+"            <!-- Rationale: There's no point looking at data from over a month ago. -->"
+"            <!-- It's just additional \"noise\" that detracts from the main issue: -->"
+"            <!-- Is progress being made week-on-week? -->"
+""
+"            <div style=\"font-size: 13px; padding: 0 5px\">"
+"                <span v-show=\"numberNotShown > 0\""
+"                      v-on:click=\"numberOfRecentWorkoutsToShow += DEFAULT_NUMBER_TO_SHOW\">"
+"                      Show more ▼"
+"                </span>"
+"                <span v-show=\"numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\""
+"                      style=\"padding: 0 40px\""
+"                      v-on:click=\"resetView\">"
+"                      Reset view ▲"
+"                </span>"
+"                <span v-show=\"numberNotShown > 0 && numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\""
+"                      v-on:click=\"numberOfRecentWorkoutsToShow += numberNotShown\">"
+"                      Show all {{ numberOfRecentWorkoutsToShow + numberNotShown }} "
+"                      <span style=\"font-weight: bold; font-size: 16px\">⮇</span>"
+"                </span>"
+"            </div>"
+"        </div>"
+"        "
+"        <tool-tip "
+"            v-bind:recent-workout-summaries=\"recentWorkoutSummaries\""
+"            v-bind:show1-r-m=\"show1RM\""
+"            v-bind:show-volume=\"showVolume\""
+"            v-bind:one-rm-formula=\"oneRmFormula\""
+"            v-bind:guides=\"guides\""
+"            ref=\"tooltip\""
+"        ></tool-tip>"
+""
+""
+"    </div>",
    props: {
        tagList: Object,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array,
        currentExerciseName: String,
        showGuide: Boolean,
        guides: Object,
        currentExerciseGuide: String,
        guideCategories: Object
    },
    data: function () {
        var DEFAULT_NUMBER_TO_SHOW = 6;
        return {
            filterType: 'filter1', // either 'filter1', 'filter2', or 'nofilter'
            numberOfRecentWorkoutsToShow: DEFAULT_NUMBER_TO_SHOW,
            numberNotShown: 0,
            DEFAULT_NUMBER_TO_SHOW: DEFAULT_NUMBER_TO_SHOW
        }
    },
    watch: {
        filterType: function () {
            this.resetView(); // reset view when changing filter type
        }
    },
    computed: {
        daysSinceLastWorked: function () {
            var next = this.findNextOccurence(this.currentExerciseName, -1); // -1 to include the first item (idx 0)
            if (next != null) {
                var today = moment().startOf("day");
                var date = moment(next.date).startOf("day");
                return today.diff(date, 'days');
            }
            return 0; // exercise not found
        },
        recentWorkoutSummaries: function () {
            var self = this;
            function isGuideMatch(guide) {
                if (self.guideCategories.hasOwnProperty(guide)
                 && self.guideCategories.hasOwnProperty(self.currentExerciseGuide)) {
                    return self.guideCategories[guide] == self.guideCategories[self.currentExerciseGuide];
                } else {
                    return guide == self.currentExerciseGuide;
                }
            }
            var summaries = [];
            var numberShown = 0;
            var lastDate = "";
            this.numberNotShown = 0;
            var today = moment().startOf('day');
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterType != "nofilter" && exercise.name != self.currentExerciseName) return;
                if (self.filterType == "filter2"  && !isGuideMatch(exercise.guideType)) return;
                var showThisRow = (numberShown++ < self.numberOfRecentWorkoutsToShow);
                if (showThisRow) {
                    lastDate = exercise.date;
                }
                if (self.filterType == "nofilter") {
                    if (lastDate == exercise.date) {
                        showThisRow = true;
                    }
                }
                if (!showThisRow) {
                    self.numberNotShown++;
                    return;
                }
                 var daysSinceLastWorked = 0;
                 var next = self.findNextOccurence(exercise.name, exerciseIdx);
                 if (next != null) {
                     var date1 = moment(exercise.date).startOf("day");
                     var date2 = moment(next.date).startOf("day");
                     daysSinceLastWorked = date1.diff(date2, "days");
                 }
                var warmUpWeight = exercise.sets[0].weight;
                var [maxFor12,numSets12,maxFor12weight] = self.summaryBuilder(exercise.sets, 12);
                var [headline,numSetsHeadline,headlineWeight] = self.getHeadline(exercise.sets);
                var maxWeight = exercise.sets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest value in array
                var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + set.reps }, 0); // sum array
                var maxEst1RM = exercise.sets
                    .map(function(set) { return _calculateOneRepMax(set, self.oneRmFormula) })
                    .filter(function(val) { return val > 0 }) // filter out error conditions
                    .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
                maxEst1RM = _roundOneRepMax(maxEst1RM);
                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType
                    "warmUpWeight": warmUpWeight,
                    "maxFor12": maxFor12weight,
                    "numSets12": numSets12,
                    "maxAttempted": headlineWeight == maxWeight ? "-" : maxWeight.toString(),
                    "headline": headline,
                    "numSetsHeadline": numSetsHeadline,
                    "totalVolume": totalVolume,
                    "volumePerSet": self.calculateVolumePerSet(exercise.sets), // for tooltip
                    "totalReps": totalReps, // for tooltip
                    "highestWeight": maxWeight, // for tooltip
                    "maxEst1RM": maxEst1RM, // for tooltip
                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": moment(exercise.date).from(today) // e.g. "5 days ago"
                });
            });
            return summaries;
        },
    },
    methods: {
        resetView: function () { 
            this.numberOfRecentWorkoutsToShow = this.DEFAULT_NUMBER_TO_SHOW;
        },
        findNextOccurence: function (exerciseName, startIdx) {
            for (var i = (startIdx + 1); i < (startIdx + 20); i++) {
                if (i >= this.recentWorkouts.length) {
                    return null; // hit end of array
                }
                if (this.recentWorkouts[i].name == exerciseName) {
                    return this.recentWorkouts[i]; // found
                }
            }
            return null; // not found
        },
        removeRecent: function (idx) {
            if (confirm("Remove this item from workout history?")) {
                this.recentWorkouts[idx].name = "DELETE";
                localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts); // save to local storage
                this.dropboxSyncStage1(); // TODO : THIS IS WRONG
            }
        },
        copySummaryToClipboard: function (summary) {
            var text = summary.exercise.date 
              + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
              + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
              + "\t" + summary.headline.trim() // trim() to remove padding
              + "\t" + (summary.exercise.guideType ? "Guide: " + summary.exercise.guideType + " reps" : "");
            navigator.clipboard.writeText(text).then(function () {
            }, function () {
                alert("failed to copy");
            });
        },
        padx: function (weight, reps) {
            if (!weight || !reps) return "";
            var strW = weight.toString();
            var strR = reps.toString();
            return strW.padStart(6) + " x " + strR.padEnd(5);
        },
        summaryBuilder: function (allSets, threshold) {
            var weight = allSets
                .filter(function(set) { return set.reps >= threshold }) // where reps >= threshold
                .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
            var sets = allSets
                .filter(function(set) { return set.weight == weight }) // where set.weight == weight
            var minReps = sets
                .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999); // lowest reps
            var maxReps = sets
                .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0); // highest reps
            var isMultiple = sets.length > 1;
            var showPlus = isMultiple && (minReps != maxReps);
            var displayString = this.padx(weight, minReps + (showPlus ? "+" : ""));
            return [displayString, sets.length, weight];
        },
        getHeadline: function (allSets) {
            var weights = allSets.map(function(set) { return set.weight });
            var mostFrequentWeight = weights.sort((a, b) =>
                weights.filter(v => v === a).length
                - weights.filter(v => v === b).length
             ).pop();
            var reps = allSets.filter(function(set) { return set.weight == mostFrequentWeight }).map(function(set) { return set.reps });
            reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
            reps = reps.slice(0, 3); // take top 3 items
            var maxReps = reps[0];
            var minReps = reps[reps.length - 1];
            var showPlus = maxReps != minReps;
            var displayString = this.padx(mostFrequentWeight, minReps + (showPlus ? "+" : ""));
            return [displayString, reps.length, mostFrequentWeight];
        },
        calculateVolumePerSet: function (sets) {
            var volumeSets = sets.filter(function(set) { return set.reps > 6 }); // volume not relevant for strength sets
            var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
            var volumePerSet = volumeSum / volumeSets.length;
            return Math.round(volumePerSet);
        },
        showTooltip: function (summaryItemIdx, e) {
            this.$refs.tooltip.show(summaryItemIdx, e);
        },
        hideTooltip: function () {
            this.$refs.tooltip.hide();
        },
        spanTitle: function (exercise) {
            var arr = [];
            if (exercise.etag) {
                arr.push(this.tagList[exercise.etag].emoji + " " + this.tagList[exercise.etag].description);
            }
            if (exercise.comments) {
                arr.push("🗨 \"" + exercise.comments + "\"");
            }
            return arr.join('\n');
        }
    }
});
Vue.component('rm-table', {
    template: "    <table border=\"1\" class=\"rmtable\">"
+"        <tr>"
+"            <th>Reps</th>"
+"            <th>Weight</th>"
+"            <th style=\"min-width: 53px\">Percent</th>"
+"        </tr>"
+"        <tr v-for=\"row in rows\""
+"        v-bind:class=\"{ 'intensity60': showGuide && guideType == '12-15' && row.reps >= 12 && row.reps <= 15,"
+"                        'intensity70': showGuide && guideType == '8-10'  && row.reps >= 8  && row.reps <= 10,"
+"                        'intensity80': showGuide && guideType == '5-7'   && row.reps >= 5  && row.reps <= 7 }\">"
+"            <td>{{ row.reps }}</td>"
+"            <td>{{ row.weight.toFixed(1) }}</td>"
+"            <td>{{ row.percentage.toFixed(1) }}%</td>"
+"        </tr>"
+"    </table>",
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        showGuide: Boolean,
        guideType: String
    },
    computed: {
        rows: function () {
            var rows = [];
            for (var reps = 1; reps <= 15; reps++) {
                var tempWeight = 100; // this can be any weight, it's just used to calculate the percentage.
                var tempRM = _calculateOneRepMax({ weight: tempWeight, reps: reps }, this.oneRmFormula);
                if (tempRM > 0) {
                    var percentage = tempWeight / tempRM;
                    rows.push({
                        reps: reps,
                        weight: this.ref1RM * percentage,
                        percentage: percentage * 100
                    });
                }
            }
            return rows;
        }
    }
});
function _calculateOneRepMax(set, formula) {
    if (!set.weight || !set.reps) return -1; // no data
    if (formula == 'Brzycki') {
        if (set.reps > 12) return -2; // can't calculate if >12 reps
        return set.weight / (1.0278 - 0.0278 * set.reps);
    }
    else if (formula == 'Brzycki 12+') {
        return set.weight / (1.0278 - 0.0278 * set.reps);
    }
    else if (formula == 'Epley') {
        return set.weight * (1 + (set.reps / 30));
    }
    else if (formula == 'McGlothin') {
        return (100 * set.weight) / (101.3 - 2.67123 * set.reps);
    }
    else if (formula == 'Lombardi') {
        return set.weight * Math.pow(set.reps, 0.10);
    }
    else if (formula == 'Mayhew et al.') {
        return (100 * set.weight) / (52.2 + 41.9 * Math.pow(Math.E, -0.055 * set.reps));
    }
    else if (formula == 'O\'Conner et al.') {
        return set.weight * (1 + (set.reps / 40));
    }
    else if (formula == 'Wathan') {
        return (100 * set.weight) / (48.8 + 53.8 * Math.pow(Math.E, -0.075 * set.reps));
    }
    else if (formula == 'Brzycki/Epley') {
        if (set.reps <= 10)
            return set.weight / (1.0278 - 0.0278 * set.reps); // Brzycki
        else
            return set.weight * (1 + (set.reps / 30)); // Epley
    }
    else 
        return -3; // unknown formula
}
function _roundOneRepMax (oneRepMax) {
    return Math.ceil(oneRepMax * 10) / 10;
}
function _newWorkout() {
    var list = [];
    for (var p = 0; p < 3; p++) { // for each page (3 in total)
        list.push(_newExercise());
    }
    return list;
}
function _newExercise() {
    var sets = [];
    for (var s = 0; s < 8; s++) { // for each set (8 in total)
        sets.push(_newSet());
    }
    return {
        name: '',
        sets: sets,
        ref1RM: 0,
        comments: '',
        etag: 0, // exercise tag
        guideType: ''
    };
}
function _newSet() {
    return {
        weight: 0,
        reps: 0,
        gap: 0
    };
}
function _volumeForSet (set) {
    var volume = set.weight * set.reps;
    return Math.round(volume);
}
function pad (str, len) {
    var xtra = len - str.length;
    return " ".repeat((xtra / 2) + (xtra % 2))
        + str
        + " ".repeat(xtra / 2);
}
function _generateExerciseText (exercise) {
    var weights = []; // these are kept separate...
    var reps = []; // ...because gaps will be...
    var gaps = []; // ...moved up by one later
    var exerciseVolume = 0;
    exercise.sets.forEach(function (set) {
        var score = _volumeForSet(set);
        if (score > 0) {
            weights.push(set.weight.toString());
            reps.push(set.reps.toString());
            gaps.push(set.gap.toString());  
            exerciseVolume += score;
        }
    });
    gaps.shift(); // first set's gap isn't used
    gaps.push(""); // add extra item so array has the same no. elements as the other two
    var paddedWeights = [];
    var paddedReps = [];
    var paddedGaps = [];
    weights.forEach(function (_, idx) {
        var len = Math.max(weights[idx].length, reps[idx].length, gaps[idx].length);
        paddedWeights.push(pad(weights[idx], len));
        paddedReps.push(pad(reps[idx], len));
        paddedGaps.push(pad(gaps[idx], len));
    });
    if (exerciseVolume > 0) {
        return "  " + ("kg  " + paddedWeights.join("  ")).trim() + "\n"
             + "  " + ("x   " + paddedReps.join("  ")).trim() + "\n"
             + "  " + ("🕘    " + paddedGaps.join("  ")).trim(); // + "\n"
    } else { 
        return "";
    }
}

Vue.component('tool-tip', {
    template: "    <div id=\"tooltip\" v-show=\"tooltipVisible\">"
+"        <table>"
+"            <tr v-if=\"show1RM && !!tooltipData.ref1RM\">"
+"                <td colspan=\"4\">Ref. 1RM</td>"
+"                <td v-bind:class=\"{ oneRepMaxExceeded: tooltipData.maxEst1RM > tooltipData.ref1RM }\">"
+"                    {{ tooltipData.ref1RM }}"
+"                </td>"
+"            </tr>"
+"            <tr>"
+"                <th v-if=\"show1RM\">% 1RM</th>"
+"                <th>Weight</th>"
+"                <th>Reps</th>"
+"                <!-- <th>Score</th> -->"
+"                <th>Rest</th>"
+"                <th v-if=\"show1RM\">Est 1RM</th>"
+"                <th v-if=\"showVolume\">Volume</th>"
+"            </tr>"
+"            <tr v-for=\"(set, setIdx) in tooltipData.sets\""
+"                    is=\"grid-row\" "
+"                    v-bind:set=\"set\" "
+"                    v-bind:set-idx=\"setIdx\""
+"                    v-bind:show1-r-m=\"show1RM\""
+"                    v-bind:show-volume=\"showVolume\""
+"                    v-bind:max-est1-r-m=\"tooltipData.maxEst1RM\""
+"                    v-bind:ref1-r-m=\"tooltipData.ref1RM\""
+"                    v-bind:read-only=\"true\""
+"                    v-bind:one-rm-formula=\"oneRmFormula\""
+"                    v-bind:show-guide=\"false\""
+"                    v-bind:guides=\"guides\">"
+"                    <!-- v-bind:ref1-r-m = !!tooltipData.ref1RM ? tooltipData.ref1RM : tooltipData.maxEst1RM -->"
+"            </tr>"
+"            <tr><td style=\"padding: 0\"></td></tr> <!-- fix for chrome (table borders) -->"
+"            <!--<tr style=\"border-top: double 3px black\">"
+"                <td v-bind:colspan=\"colspan1\">Total reps</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.totalReps }}</td>"
+"            </tr>"
+"            <tr>"
+"                <td v-bind:colspan=\"colspan1\">Maximum weight</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.highestWeight }}</td>"
+"            </tr>-->"
+"            <tr><!-- v-if=\"showVolume\" -->"
+"                <td v-bind:colspan=\"colspan1\">Total volume</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.totalVolume.toLocaleString() }} kg</td>"
+"            </tr>"
+"            <tr v-if=\"showVolume\">"
+"                <td v-bind:colspan=\"colspan1\">Volume per set (&gt;6 reps)</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.volumePerSet }}</td>"
+"            </tr>"
+""
+"            <tr v-if=\"show1RM && !!tooltipData.guideType\">"
+"                <td v-bind:colspan=\"colspan1\">Guide type</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.guideType }}</td>"
+"            </tr>"
+""
+"            <tr v-if=\"show1RM\">"
+"                <td v-bind:colspan=\"colspan1\">Max est. 1RM</td>"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.maxEst1RM }}</td>"
+"            </tr>"
+"        </table>"
+"    </div>",
    props: {
        recentWorkoutSummaries: Array,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Object
    },
    data: function () { 
        return {
            tooltipVisible: false,
            tooltipIdx: -1
        }
    },
    computed: {
        tooltipData: function () {
            if (this.tooltipIdx == -1 // nothing selected
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) { // outside array bounds
                return {
                    sets: [],
                    totalVolume: 0,
                    volumePerSet: 0,
                    highestWeight: 0,
                    maxEst1RM: 0,
                    ref1RM: 0,
                    totalReps: 0,
                    guideType: ''
                }
            } else {
                var summary = this.recentWorkoutSummaries[this.tooltipIdx];
                return {
                    sets: summary.exercise.sets,
                    totalVolume: summary.totalVolume,
                    volumePerSet: summary.volumePerSet,
                    highestWeight: summary.highestWeight,
                    maxEst1RM: summary.maxEst1RM,
                    ref1RM: summary.exercise.ref1RM, 
                    totalReps: summary.totalReps,
                    guideType: summary.exercise.guideType
                };
            }
        },
        colspan1: function () {
            var span = 2;
            if (this.show1RM) {
                span += 2;
            }
            return span;
        },
        colspan2: function () {
            return this.showVolume ? 2 : 1;
        }
    },
    methods: {
        show: function (summaryItemIdx, e) { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipIdx = summaryItemIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                Vue.nextTick(function () { self.moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function (e) {
            var popupWidth = $("#tooltip").width();
            var overflowX = (popupWidth + e.clientX + 5) > $(window).width();
            $("#tooltip").css({ left: overflowX ? e.pageX - popupWidth : e.pageX });
            var popupHeight = $("#tooltip").height();
            $("#tooltip").css({ top: /*overflowY ? */e.pageY - popupHeight - 10 /*: e.pageY + 10*/ });
        },
        hide: function () { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipVisible = false;
        }
    }
});
Vue.component('workout-calc', {
    template: "     <div>"
+"        <div v-if=\"show1RM\""
+"                style=\"float: right; font-size: smaller; text-align: right\">"
+"            One Rep Max Formula"
+"            <select v-model=\"oneRmFormula\">"
+"                <option>Brzycki/Epley</option>"
+"                <option>Brzycki</option>"
+"                <option>Brzycki 12+</option>"
+"                <option>McGlothin</option>"
+"                <option>Epley</option>"
+"                <option>Wathan</option>"
+"                <option>Mayhew et al.</option>"
+"                <option>O'Conner et al.</option>"
+"                <option>Lombardi</option>"
+"            </select>"
+"            "
+"            <br /><br />"
+""
+"            <label>"
+"                <input type=\"checkbox\" v-model=\"showRmTable\" />"
+"                Show table"
+"            </label>"
+""
+"            <br /><br />"
+""
+"            <div style=\"display: inline-block; text-align: left\">"
+"                Workout date<br />"
+"                <input type=\"text\" style=\"width: 80px\" v-model=\"workoutDate\" "
+"                    disabled=\"disabled\" />"
+"            </div>"
+""
+"        </div>"
+""
+"        <div style=\"display: inline-block; min-width: 298px\">"
+"            <button v-for=\"(exercise, idx) in exercises\""
+"                    v-on:click=\"gotoPage(idx)\""
+"                    class=\"pagebtn\""
+"                    v-bind:class=\"{ activeBtn: curPageIdx == idx }\">"
+"                {{ idx + 1 }}"
+"            </button>"
+"            <button v-on:click=\"addExercise\">+</button>"
+"        </div>"
+""
+"        <button style=\"padding: 8.8px 3px 9.5px 3px; margin-right: 5px\""
+"                v-on:click=\"copyWorkoutToClipboard\""
+"                >📋</button><button "
+"                class=\"clearbtn\" v-on:click=\"clearAll\">Clear</button>"
+"        "
+""
+"        <div v-for=\"(exercise, exIdx) in exercises\" "
+"             v-show=\"exIdx == curPageIdx\" "
+"             class=\"exdiv\">"
+""
+"            <div style=\"margin-top: 15px; margin-bottom: 10px\">"
+"                <b>Exercise #{{ exIdx + 1 }}:</b>"
+"                <input type=\"text\" v-model=\"exercise.name\" autocapitalize=\"off\" "
+"                        style=\"width: 225px\""
+"                /><!-- border-right-width: 0 --><!--<button style=\"vertical-align: top; border: solid 1px #a9a9a9; height: 29px\""
+"                            v-on:click=\"copyExerciseToClipboard(exercise)\">📋</button>-->"
+"            </div>"
+""
+"            <div v-if=\"show1RM && showRmTable\""
+"                    style=\"float: right\">"
+"                <rm-table v-bind:one-rm-formula=\"oneRmFormula\""
+"                            v-bind:ref1-r-m=\"exercise.ref1RM\""
+"                            v-bind:show-guide=\"showGuide\""
+"                            v-bind:guide-type=\"exercise.guideType\""
+"                ></rm-table>"
+"            </div>"
+""
+"            <div style=\"margin-bottom: 15px\" class=\"smallgray\">"
+"                <label>"
+"                    <input type=\"checkbox\" v-model=\"showVolume\" /> Show volume"
+"                </label>"
+"                <label>"
+"                    <input type=\"checkbox\" v-model=\"show1RM\" /> Show 1RM"
+"                </label>"
+"                <span v-if=\"show1RM\">"
+"                    <!-- Reference --><number-input v-model=\"exercise.ref1RM\" style=\"width: 65px\" class=\"smallgray verdana\" /> kg"
+"                </span>"
+"                <label v-if=\"show1RM\">"
+"                    <input type=\"checkbox\" v-model=\"showGuide\" /> Show guide"
+"                </label>"
+"                <!-- Guide type -->"
+"                <select v-if=\"show1RM && showGuide\""
+"                        v-model=\"exercise.guideType\">"
+"                        <option v-for=\"(value, key) in guides\" "
+"                                v-bind:value=\"key\">"
+"                                {{ key + (key[0] >= '0' && key[0] <= '9' ? \" reps\" : \"\") }}"
+"                        </option>"
+"                </select>"
+"            </div>"
+""
+"            <table class=\"maintable\">"
+"                <thead>"
+"                    <tr>"
+"                        <th v-if=\"show1RM\" class=\"smallgray\">%1RM</th>"
+"                        <th>Set</th>"
+"                        <th v-if=\"show1RM && showGuide\">Guide</th>"
+"                        <th>Weight</th>"
+"                        <th>Reps</th>"
+"                        <!-- <th style=\"padding: 0px 10px\">Score</th> -->"
+"                        <th>Rest</th>"
+"                        <th v-if=\"show1RM\" class=\"smallgray\">Est 1RM</th>"
+"                        <th v-if=\"showVolume\" class=\"smallgray\">Volume</th>"
+"                    </tr>"
+"                </thead>"
+"                <tbody>"
+"                    <tr v-for=\"(set, setIdx) in exercise.sets\""
+"                        is=\"grid-row\" "
+"                        v-bind:exercise-name=\"exercise.name\""
+"                        v-bind:set=\"set\" "
+"                        v-bind:set-idx=\"setIdx\""
+"                        v-bind:show1-r-m=\"show1RM\""
+"                        v-bind:show-volume=\"showVolume\""
+"                        v-bind:one-rm-formula=\"oneRmFormula\""
+"                        v-bind:max-est1-r-m=\"exercise.ref1RM\""
+"                        v-bind:ref1-r-m=\"exercise.ref1RM\""
+"                        v-bind:read-only=\"false\""
+"                        v-bind:show-guide=\"show1RM && showGuide\""
+"                        v-bind:guide-type=\"exercise.guideType\""
+"                        v-bind:guides=\"guides\">"
+"                    </tr>"
+"                    <tr>"
+"                        <td v-if=\"show1RM\"></td>"
+"                        <td><button v-on:click=\"addSet\">+</button></td>"
+"                        <td colspan=\"3\""
+"                            class=\"smallgray verdana\""
+"                            v-bind:class=\"{ 'showonhover': !showVolume }\""
+"                            style=\"padding-top: 5px\">"
+"                                <!-- Total reps: {{ runningTotal_numberOfReps(exercise) }} -->"
+"                                <!-- &nbsp; -->"
+"                                <!-- Average weight: {{ runningTotal_averageWeight(exercise).toFixed(1) }} -->"
+"                            Total volume: {{ runningTotal_totalVolume(exercise) }}"
+"                        </td>"
+"                    </tr>"
+"                </tbody>"
+"            </table>"
+""
+"            <span style=\"font-size: smaller\">Comment:</span>"
+"            <input type=\"text\" v-model=\"exercise.comments\" size=\"30\" style=\"font-size: smaller\" />"
+""
+"            <span style=\"font-size: smaller\">Tag:</span>"
+"            <!-- (this helps put the workout \"headlines\" in context) -->"
+"            <select v-model=\"exercise.etag\""
+"                    style=\"vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px\">"
+"                <option v-bind:value=\"0\"></option>"
+"                <option v-for=\"(value, key) in tagList\""
+"                        v-bind:value=\"key\""
+"                ><span class=\"emoji\">{{ value.emoji }}</span> - {{ value.description }}</option>"
+"            </select><br />"
+"        </div><!-- /foreach exercise -->"
+"        <br />"
+"        <!--"
+"        <textarea style=\"width: 400px; height: 50px; margin-bottom: 5px\" "
+"                v-model=\"outputText\" "
+"                readonly=\"readonly\"></textarea>-->"
+""
+"        <!-- <br />Mail to: <br />"
+"        <input type=\"email\" style=\"width: 260px\" v-model=\"emailTo\" />"
+"        &nbsp;<a v-bind:href=\"emailLink\">Send email</a> -->"
+""
+""
+"        "
+"        <recent-workouts-panel v-bind:tag-list=\"tagList\""
+"                               v-bind:show1-r-m=\"show1RM\""
+"                               v-bind:show-volume=\"showVolume\""
+"                               v-bind:one-rm-formula=\"oneRmFormula\""
+"                               v-bind:recent-workouts=\"recentWorkouts\""
+"                               v-bind:current-exercise-name=\"currentExerciseName\""
+"                               v-bind:show-guide=\"showGuide\""
+"                               v-bind:guides=\"guides\""
+"                               v-bind:current-exercise-guide=\"currentExerciseGuide\""
+"                               v-bind:guide-categories=\"guideCategories\">"
+"        </recent-workouts-panel>"
+""
+""
+"        <br /><br />"
+"        <dropbox-sync ref=\"dropbox\""
+"                      dropbox-filename=\"json/workouts.json\""
+"                      v-bind:data-to-sync=\"recentWorkouts\""
+"                      v-on:sync-complete=\"dropboxSyncComplete\">"
+"        </dropbox-sync>"
+"        <br /><br />"
+""
+"    </div>",
    data: function () {
        function generateGuide (startWeight, numWarmUpSets, workWeight, numWorkSets) {
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
        var exercises = _newWorkout();
        if (localStorage["currentWorkout"]) {
            exercises = JSON.parse(localStorage["currentWorkout"]);
        }
        var recentWorkouts = [];
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
                "10": { "emoji": "💪", "description": "high energy" },
                "20": { "emoji": "😓", "description": "low energy" },
                "21": { "emoji": "🔻", "description": "had to reduce weight" },
                "25": { "emoji": "🤕", "description": "injury" },
                "50": { "emoji": "🏆", "description": "new PR" },
                "60": { "emoji": "🐢", "description": "long gaps between sets" },
                "61": { "emoji": "🐇", "description": "short gaps between sets" },
                "70": { "emoji": "🐌", "description": "preworkout took a while to kick in" },
                "80": { "emoji": "☕", "description": "too much caffeine" },
                "98": { "emoji": "🛑", "description": "stop sign" },
                "99": { "emoji": "☝", "description": "need to increase the weight" },
                "9a": { "emoji": "👇", "description": "need to decrease the weight" }
            },
            guides: {
                '': [], // none
                '12-15': generateGuide(0.35, 2, 0.60, 3),
                '8-12': generateGuide(0.35, 3, 0.725, 3),
                '5-7': generateGuide(0.35, 4, 0.85, 3),
            },
            guideCategories: {
                "5-7" : "LOW",
                "8-10": "MEDIUM",
                "8-12": "MEDIUM",
                "12-15":"HIGH",
                "15+" : "HIGH"
            }
        }
    },
    mounted: function () { 
        this.updateOutputText();
        this.syncWithDropbox();
    },
    methods: {
        syncWithDropbox: function () { 
            var dropbox = this.$refs.dropbox;
            dropbox.dropboxSyncStage1();
        },
        dropboxSyncComplete: function (dropboxData) {
            this.recentWorkouts = dropboxData; // update local data with dropbox data
            localStorage["recentWorkouts"] = JSON.stringify(dropboxData); // save to local storage
        },
        runningTotal_totalVolume: function (exercise) {
            var self = this;
            return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
        },
        gotoPage: function (idx) {
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
            if (confirm("Are you sure you want to add a new exercise?")) {
                this.exercises.push(_newExercise());
                this.curPageIdx = this.exercises.length - 1;
            }
        },
        updateOutputText: function () {
            var output = "";
            var self = this;
            this.exercises.forEach(function (exercise, exerciseIdx) {
                var text = _generateExerciseText(exercise);
                if (text.length > 0) {
                    output += (exerciseIdx + 1).toString() + ". " + exercise.name + "\n" + text + "\n\n";
                }
            });
            localStorage["currentWorkout"] = JSON.stringify(this.exercises); // save to local storage
            this.outputText = output; // update output text
            this.workoutDate = moment().format("YYYY-MM-DD"); // update workout date
        },
        copyWorkoutToClipboard: function () {
            var text = this.outputText;
            navigator.clipboard.writeText(text).then(function () {
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
                    self.recentWorkouts.unshift({
                        id: idSeed++,
                        date: self.workoutDate,
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
    },
    computed: {
        emailLink: function () {
            return "mailto:" + this.emailTo + "?subject=workout&body=" + encodeURIComponent(this.outputText);
        },
        currentExerciseName: function () {
            return this.exercises[this.curPageIdx].name;
        },
        currentExerciseGuide: function () {
            return this.exercises[this.curPageIdx].guideType;
        }
    },
    watch: {
        exercises: {
            handler: function () { 
                this.updateOutputText(); 
            },
            deep: true
        },
        emailTo: function () {
            localStorage["emailTo"] = this.emailTo;
        }
    }
});
