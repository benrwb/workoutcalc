var nextTick = Vue.nextTick;
var app = Vue.createApp();
app.component('dropbox-sync', {
    template: "    <div style=\"background-color: #eef; display: inline-block\">\n"
+"        <div style=\"background-color: #dde; border-bottom: solid 1px #ccd; font-weight: bold; padding: 1px 5px\">\n"
+"            ☁ Cloud Backup - Dropbox\n"
+"        </div>\n"
+"        <div style=\"padding: 5px\">\n"
+"            <div v-show=\"!dropboxLastSyncTimestamp\">\n"
+"                Dropbox <a target=\"_blank\" href=\"https://dropbox.github.io/dropbox-api-v2-explorer/#files_list_folder\">access token</a>\n"
+"                <input type=\"text\" v-model=\"dropboxAccessToken\" v-bind:disabled=\"dropboxSyncInProgress\" />\n"
+"            </div>\n"
+"            <!-- Filename <input type=\"text\" v-model=\"dropboxFilename\" readonly=\"readonly\" />\n"
+"            <br /> -->\n"
+"            <button v-show=\"!dropboxLastSyncTimestamp && !!dropboxAccessToken\"\n"
+"                    v-bind:disabled=\"dropboxSyncInProgress\"\n"
+"                    v-on:click=\"dropboxSyncStage1\">Connect to Dropbox</button>\n"
+"            <img v-show=\"dropboxSyncInProgress\" src=\"https://cdnjs.cloudflare.com/ajax/libs/timelinejs/2.25/css/loading.gif\" />\n"
+"            <span v-show=\"!!dropboxLastSyncTimestamp && !dropboxSyncInProgress\">\n"
+"                Last sync at {{ formatDate(dropboxLastSyncTimestamp) }}\n"
+"            </span>\n"
+"        </div>\n"
+"    </div>\n",
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
                .then(function () {
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
            },
            formatDate: _formatDate
        }
    });
app.component('grid-row', {
    template: "    <tr>\n"
+"        <td v-if=\"show1RM && guide.referenceWeight == '1RM'\" \n"
+"            class=\"smallgray verdana\"\n"
+"            v-bind:title=\"oneRepMaxTooltip\"\n"
+"            v-bind:class=\"{ 'intensity60': oneRepMaxPercentage >= 55.0 && oneRepMaxPercentage < 70.0,\n"
+"                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,\n"
+"                            'intensity80': oneRepMaxPercentage >= 80.0 }\">\n"
+"            {{ formattedOneRepMaxPercentage }}</td>\n"
+"        <td v-if=\"!readOnly\">\n"
+"            {{ setIdx + 1 }}\n"
+"        </td>\n"
+"        <td v-if=\"showGuide\"\n"
+"            v-bind:class=\"{ 'intensity60': adjustedPercentage(setIdx) >= 0.54 && adjustedPercentage(setIdx) < 0.70,\n"
+"                            'intensity70': adjustedPercentage(setIdx) >= 0.70 && adjustedPercentage(setIdx) < 0.80,\n"
+"                            'intensity80': adjustedPercentage(setIdx) >= 0.80 }\"\n"
+"            v-bind:title=\"guideTooltip(setIdx)\">\n"
+"            <!-- {{ guideString(setIdx) }} -->\n"
+"            {{ roundGuideWeight(guideWeight(setIdx)) || \"\" }}\n"
+"        </td>\n"
+"        <td class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.weight\" step=\"any\" />\n"
+"            <template      v-if=\"readOnly\"      >{{ set.weight }}</template>\n"
+"        </td>\n"
+"        <td class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.reps\" \n"
+"                          v-bind:placeholder=\"guideReps(setIdx)\" />\n"
+"            <template      v-if=\"readOnly\"      >{{ set.reps }}</template>\n"
+"        </td>\n"
+"        <!-- <td class=\"score\">{{ volumeForSet(set) }}</td> -->\n"
+"        <td v-show=\"setIdx != 0\" class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.gap\" />\n"
+"            <template      v-if=\"readOnly\"      >{{ set.gap }}</template>\n"
+"            <span v-if=\"set.gap == 1 || set.gap == 2\"\n"
+"                  style=\"position: absolute; margin-left: -19px\"\n"
+"                  title=\"Best rest period for hypertropy is 30-90 seconds between sets\">✨</span>\n"
+"                  <!-- Best rest period for endurance is 30 seconds or less -->\n"
+"                  <!-- Best rest period for strength is 3 minutes or more -->\n"
+"        </td>\n"
+"        <td v-show=\"setIdx == 0\"><!-- padding --></td>\n"
+"        <td v-if=\"show1RM\" class=\"smallgray verdana\"\n"
+"            v-bind:class=\"{ 'est1RmEqualToRef': roundedOneRepMax == maxEst1RM && guide.referenceWeight == '1RM',\n"
+"                            'est1RmExceedsRef': roundedOneRepMax > maxEst1RM  && guide.referenceWeight == '1RM' } \">\n"
+"            {{ formattedOneRepMax }}\n"
+"        </td>\n"
+"        <td v-if=\"showVolume\" class=\"smallgray verdana\">\n"
+"            {{ formattedVolume }}\n"
+"        </td>\n"
+"        <td v-if=\"guide.referenceWeight == 'WORK'\"\n"
+"            style=\"text-align: left\">\n"
+"            <template v-if=\"increaseDecreaseMessage == 'top'\">\n"
+"                ✅ Top of rep range\n"
+"            </template>\n"
+"            <template v-if=\"increaseDecreaseMessage == 'increase'\">\n"
+"                👆 Increase weight\n"
+"            </template>\n"
+"            <template v-if=\"increaseDecreaseMessage == 'increase-faded'\">\n"
+"                <span style=\"opacity: 0.5; font-style: italic\">👆 Increase weight</span>\n"
+"            </template>\n"
+"            <template v-if=\"increaseDecreaseMessage == 'decrease-faded'\">\n"
+"                <span style=\"opacity: 0.5; font-style: italic\">ℹ Below rep range</span>\n"
+"            </template>\n"
+"            <template v-if=\"increaseDecreaseMessage == 'decrease'\">\n"
+"                👇 Decrease weight\n"
+"                <!-- TODO: only show \"decrease\" message if   -->\n"
+"                <!--       *two* sets are below target range -->\n"
+"                <!-- Help link: also used in recent-workouts-panel.vue -->\n"
+"                <a href=\"https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range\"\n"
+"                   class=\"emoji\" target=\"_blank\">ℹ</a>\n"
+"            </template>\n"
+"        </td>\n"
+"    </tr>\n",
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
        "guide": Object,
        "exercise": Object
    },
    methods: {
        guidePercentage: function (setNumber) {
            if (setNumber >= this.guidePercentages.length)
                return 0;
            else
                return this.guidePercentages[setNumber];
        },
        adjustedPercentage: function (setNumber) {
            if (this.guide && this.guide.referenceWeight == "WORK") {
                if (!this.guide.name || !this.oneRmFormula) return 0;
                var guideParts = this.guide.name.split('-');
                if (guideParts.length != 2) return 0;
                var guideLowReps = Number(guideParts[0]);
                var guideHighReps = Number(guideParts[1]);
                var midPoint = (guideLowReps + guideHighReps) / 2;
                var number = _calculateOneRepMax({ weight: 100, reps: midPoint, gap: 0 }, this.oneRmFormula)
                var multiplier = 100 / number;
                return this.guidePercentages[setNumber] * multiplier;
            }  else {
                return this.guidePercentages[setNumber];
            }
        },
        guideWeight: function (setNumber) {
            var percentage = this.guidePercentage(setNumber);
            if (!this.ref1RM || !percentage) return 0;
            return this.ref1RM * percentage;
        },
        guideReps: function (setIdx) {
            var setWeight = this.set.weight;
            if (!setWeight) {
                setWeight = this.roundGuideWeight(this.guideWeight(setIdx));
            }
            if (!this.showGuide || !this.ref1RM || !this.oneRmFormula || !setWeight) return "";
            var reps = Math.round((1 - (setWeight / this.workSetWeight)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"
            return reps <= 0 ? "" : reps;
        },
        roundGuideWeight: function (guideWeight) {
            if (!this.ref1RM) return 0;
            if (!guideWeight) return 0;
            if (this.guidePercentages[this.setIdx] == 1.00) // 100%
                return guideWeight; // don't round
            else if ((this.exercise.name || '').indexOf('db ') == 0)
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
        },
        guidePercentages: function () {
            return _getGuidePercentages(this.exercise.number, this.guide);
        },
        workSetWeight: function () {
            if (!this.ref1RM || this.guidePercentages.length == 0)
                return 0;
            var guideMaxPercentage = this.guidePercentages[this.guidePercentages.length - 1];
            return this.roundGuideWeight(this.ref1RM * guideMaxPercentage);
        },
        increaseDecreaseMessage: function () {
            if (!this.guide.name) return "";
            if (!this.set.reps) return "";
            var guideParts = this.guide.name.split('-');
            if (guideParts.length != 2) return "";
            var guideLowReps = Number(guideParts[0]);
            var guideHighReps = Number(guideParts[1]);
            var alreadyFailedAtThisWeight = this.exercise.sets
                .filter(set => set.weight == this.set.weight
                            && this.exercise.sets.indexOf(set) < this.exercise.sets.indexOf(this.set) // only look at previous sets
                            && set.reps > 0
                            && set.reps < guideLowReps).length > 0;
            if (this.set.reps < guideLowReps)
                if (alreadyFailedAtThisWeight)
                    return "decrease";
                else
                    return "decrease-faded";
            if (this.set.reps == guideHighReps) return "top";
            if (this.set.reps > guideHighReps) 
                if (this.workSetWeight > 0 &&
                    this.set.weight >= this.workSetWeight)
                    return "increase";
                else
                    return "increase-faded";
            return "";
        },
    }
});
function _getGuides() {
    var guides = [];
    guides.push({
        name: "", // default (no guide)
        category: "",
        referenceWeight: "",
        warmUp: [],
        workSets: []
    });
    guides.push({
        name: "6-8",
        category: "MEDIUM",
        referenceWeight: "WORK",
        warmUp: [0.50, 0.50, 0.70, 0.85], // warm-up 2x50%, 1x70%, 1x85%
        workSets: [1, 1, 1]
    });
    guides.push({
        name: "8-10",
        category: "MEDIUM",
        referenceWeight: "WORK",
        warmUp: [0.50, 0.50, 0.75], // warm-up 2x50%, 1x75%
        workSets: [1, 1, 1]
    });
    guides.push({
        name: "12-14",
        category: "HIGH",
        referenceWeight: "WORK",
        warmUp: [], //[0.67, 0.67], // warm-up 2x67%
        workSets: [1, 1, 1]
    });
    guides.push({
        name: "12-15", // high reps = 60% 1RM
        category: "HIGH",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 2, 0.60, 0),
        workSets: [0.60, 0.60, 0.60]
    });
    guides.push({
        name: "8-12", // medium reps = 72.5% 1RM (halfway between 60% and 85%)
        category: "MEDIUM",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 3, 0.725, 0),
        workSets: [0.725, 0.725, 0.725]
    });
    guides.push({
        name: "5-7", // low reps = 85% 1RM
        category: "LOW",
        referenceWeight: "1RM",
        warmUp: generatePercentages(0.35, 4, 0.85, 0),
        workSets: [0.85, 0.85, 0.85]
    });
    return guides;
}
function _getGuidePercentages (exerciseName, guide) {
    var percentages = [];
    var warmUp = exerciseName.indexOf("1") == 0; // .startsWith('1')
    if (warmUp) {
        percentages = percentages.concat(guide.warmUp);
    }
    percentages = percentages.concat(guide.workSets);
    return percentages;
}
function generatePercentages(startWeight, numWarmUpSets, workWeight, numWorkSets) {
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

app.component('number-input', {
    template: "    <input type=\"number\" \n"
+"           v-bind:value=\"parsedValue\"\n"
+"           v-on:input=\"updateValue\"\n"
+"    />\n",
        props: {
            modelValue: Number // for use with v-model
        },
        computed: {
            parsedValue: function () {
                if (this.modelValue == 0) 
                    return "";
                else 
                    return this.modelValue.toString();
            }
        },
        methods: {
            updateValue: function (event) {
                var eventTarget = event.target;
                if (eventTarget.value == "") 
                    this.$emit("update:modelValue", 0);
                else
                    this.$emit("update:modelValue", Number(eventTarget.value))
            }
        }
    });
function _getPresets() {
    var presets = [];
    var str = localStorage.getItem("presets");
    if (!str) return [];
    var lines = str.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split('\t');
        if (parts.length != 4) continue;
        var presetName = parts[0];
        var exerciseNumber = parts[1];
        var exerciseGuide = parts[2];
        var exerciseName = parts[3];
        var preset = presets.find(z => z.name == presetName);
        if (!preset) {
            preset = { name: presetName, exercises: [] };
            presets.push(preset);
        }
        preset.exercises.push({
            number: exerciseNumber,
            guide: exerciseGuide,
            name: exerciseName
        });
    }
    return presets;
}
function _applyPreset(preset, weekNumber) {
    var exercises = [];
    preset.exercises.forEach(function (preset) {
        var exercise = _newExercise(preset.number);
        exercise.name = preset.name;
        var guide = preset.guide;
        if (preset.guide == "MAIN") { // Main lift, rep range depends on week
            if (weekNumber <= 3)
                guide = "12-14";
            else if (weekNumber <= 6)
                guide = "8-10";
            else
                guide = "6-8";
        }
        if (preset.guide == "ACES") { // Accessory lift, rep range depends on week
            if (weekNumber <= 5)
                guide = "12-14";
            else
                guide = "8-10";
        }
        exercise.guideType = guide;
        exercises.push(exercise);
    });
    return exercises;
}

app.component('recent-workouts-panel', {
    template: "    <div>\n"
+"        <div v-show=\"recentWorkouts.length > 0\">\n"
+"\n"
+"            <h4 class=\"recent\">Recent workouts</h4>\n"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"nofilter\" />All exercises</label>\n"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter1\"  />Same exercise</label>\n"
+"            <!-- <label><input type=\"radio\" v-model=\"filterType\" value=\"filter2\"  />Same ex. &amp; reps</label> -->\n"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter3\"  />Same ex. &gt;= weight</label>\n"
+"            <span v-if=\"!!daysSinceLastWorked\" \n"
+"                style=\"margin-left: 50px; \"\n"
+"                v-bind:style=\"{ color: daysSinceLastWorked > 7 ? 'red' : '' }\">\n"
+"                        <span v-show=\"daysSinceLastWorked > 7\"\n"
+"                                title=\"Decreased performance; Increased DOMS\">⚠️</span>{{ daysSinceLastWorked }} days since last worked\n"
+"            </span>\n"
+"            <span v-show=\"numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\"\n"
+"                  style=\"font-size: 13px; margin-left: 20px\"\n"
+"                  v-on:click=\"resetView\">\n"
+"                  ▲ Reset view\n"
+"            </span>\n"
+"\n"
+"            <table border=\"1\" class=\"recent\">\n"
+"                <thead>\n"
+"                    <tr>\n"
+"                        <!--<th>Freq.</th>-->\n"
+"                        <th colspan=\"3\">\n"
+"                            <span style=\"float: right\">Gap</span>\n"
+"                            Date\n"
+"                        </th>\n"
+"                        <th>Exercise</th>\n"
+"                        <!-- <th style=\"min-width: 45px\">Start@</th> -->\n"
+"                        <!-- <th style=\"min-width: 45px\">12 RM</th> -->\n"
+"                        <!--<th>8 RM</th>-->\n"
+"                        <!--<th>4 RM</th>-->\n"
+"                        <th>Headline</th>\n"
+"                        <th>Max</th>\n"
+"                        <th v-if=\"show1RM && showGuide\">Guide</th>\n"
+"                    </tr>\n"
+"                </thead>\n"
+"                <tbody>\n"
+"                    <tr v-for=\"(summary, sidx) in recentWorkoutSummaries\"\n"
+"                        v-on:mousemove=\"showTooltip(summary.idx, $event)\" v-on:mouseout=\"hideTooltip\">\n"
+"                        <!-- v-bind:class=\"{ 'highlight': !!currentExerciseGuide && currentExerciseGuide == summary.exercise.guideType }\" -->\n"
+"                        \n"
+"                        <!--  Days between      10    9    8    7    6    5    4    3    2   \n"
+"                              Frequency (x/wk)  0.7  0.8  0.9  1.0  1.2  1.4  1.8  2.3  3.5  -->\n"
+"                        <!--<td>{{ summary.Frequency }}x</td>-->\n"
+"\n"
+"                        <!-- Relative date -->\n"
+"                        <td v-bind:title=\"formatDate(summary.exercise.date)\"\n"
+"                            style=\"text-align: right\">{{ summary.relativeDateString }}</td>\n"
+"                        \n"
+"                        <!-- Date -->\n"
+"                        <td style=\"text-align: right\">{{ formatDate(summary.exercise.date) }}</td>\n"
+"\n"
+"                        <!-- Gap -->\n"
+"                        <td v-bind:class=\"{ 'faded': summary.daysSinceLastWorked >= 7 }\"\n"
+"                            style=\"text-align: right\">{{ summary.daysSinceLastWorked || '' }}</td>\n"
+"                        <!-- || '' in the line above will show an empty string instead of 0 -->\n"
+"\n"
+"                        <td>{{ summary.exercise.name }}</td>\n"
+"\n"
+"                        <!-- <td class=\"pre italic\">{{ summary.warmUpWeight }}</td> -->\n"
+"\n"
+"                        <!-- <td class=\"pre faded\">{{ summary.maxFor12 }}</td> -->\n"
+"                       \n"
+"                        <!-- v-bind:class=\"{ best: summary.isBestVolume }\" -->\n"
+"                        <!--<td class=\"pre\" v-bind:class=\"{ 'bold': summary.numSets8 >= 3 }\"\n"
+"                            >{{ summary.maxFor8 }}</td>-->\n"
+"\n"
+"                        <!-- v-bind:class=\"{ 'best': summary.isBestIntensity } -->\n"
+"                        <!--<td class=\"pre\" v-bind:class=\"{ 'faded': summary.numSets4 == 1,\n"
+"                                                         'bold': summary.numSets4 >= 3 }\"\n"
+"                            >{{ summary.maxFor4 }}</td>-->\n"
+"\n"
+"                        <td class=\"pre\" v-bind:class=\"{ 'faded': summary.headlineNumSets == 1,\n"
+"                                                         'bold': summary.headlineNumSets >= 3 }\">\n"
+"                            <span class=\"pre\"\n"
+"                                >{{ summary.headlineWeight.padStart(6) }} x </span><span \n"
+"                            class=\"pre\" v-bind:class=\"{ 'exceeded': summary.repRangeExceeded }\"\n"
+"                                >{{ summary.headlineReps }}</span><span\n"
+"                            class=\"pre\"\n"
+"                                >{{ ' '.repeat(5 - Math.min(5, summary.headlineReps.length)) }}</span>\n"
+"                        </td>\n"
+"\n"
+"                        <td class=\"pre\">\n"
+"                            <template v-if=\"summary.maxAttempted == summary.headlineWeight\">\n"
+"                                <span class=\"faded\">-</span>\n"
+"                            </template>\n"
+"                            <template v-else>\n"
+"                                <span class=\"pre\"\n"
+"                                    >{{ summary.maxAttempted.padStart(3) }} x </span><span \n"
+"                                class=\"pre notmet\"\n"
+"                                    >{{ summary.maxAttemptedReps }}</span><span\n"
+"                                class=\"pre\"\n"
+"                                    >{{ ' '.repeat(2 - Math.min(2, summary.maxAttemptedReps.length)) }}</span>\n"
+"                                <!-- Help link: also used in grid-row.vue -->\n"
+"                                <a href=\"https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range\"\n"
+"                                   class=\"emoji\" target=\"_blank\">ℹ</a>\n"
+"                            </template>\n"
+"                        </td>\n"
+"\n"
+"                        <!-- <td class=\"pre italic faded\">{{ summary.maxAttempted }}</td> -->\n"
+"\n"
+"                        <!-- TODO possible future development: \"Avg rest time\" ??? -->\n"
+"                        \n"
+"                        <td v-if=\"show1RM && showGuide\" class=\"guide\">{{ summary.exercise.guideType }}</td>\n"
+"\n"
+"                        <td class=\"noborder\" v-on:click=\"removeRecent(summary.idx)\">x</td>\n"
+"\n"
+"                        <td class=\"noborder\" v-on:click=\"copySummaryToClipboard(summary)\">📋</td>\n"
+"\n"
+"                        <td v-show=\"!!summary.exercise.etag || !!summary.exercise.comments\"\n"
+"                            v-bind:title=\"spanTitle(summary.exercise)\">\n"
+"                            <span v-if=\"!!summary.exercise.etag\"\n"
+"                                >{{ tagList[summary.exercise.etag].emoji }}\n"
+"                            </span>\n"
+"                            <span v-if=\"!!summary.exercise.comments\" \n"
+"                                  >🗨</span>\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                </tbody>\n"
+"            </table>\n"
+"            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->\n"
+"            <!-- Rationale: There's no point looking at data from over a month ago. -->\n"
+"            <!-- It's just additional \"noise\" that detracts from the main issue: -->\n"
+"            <!-- Is progress being made week-on-week? -->\n"
+"\n"
+"            <div style=\"font-size: 13px; padding: 0 5px\">\n"
+"                <span v-show=\"numberNotShown > 0\"\n"
+"                      v-on:click=\"numberOfRecentWorkoutsToShow += DEFAULT_NUMBER_TO_SHOW\">\n"
+"                      Show more ▼\n"
+"                </span>\n"
+"                <span v-show=\"numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\"\n"
+"                      style=\"padding: 0 40px\"\n"
+"                      v-on:click=\"resetView\">\n"
+"                      Reset view ▲\n"
+"                </span>\n"
+"                <span v-show=\"numberNotShown > 0 && numberOfRecentWorkoutsToShow > DEFAULT_NUMBER_TO_SHOW\"\n"
+"                      v-on:click=\"numberOfRecentWorkoutsToShow += numberNotShown\">\n"
+"                      Show all {{ numberOfRecentWorkoutsToShow + numberNotShown }} \n"
+"                      <span style=\"font-weight: bold; font-size: 16px\">⮇</span>\n"
+"                </span>\n"
+"            </div>\n"
+"        </div>\n"
+"        \n"
+"        <tool-tip \n"
+"            v-bind:recent-workouts=\"recentWorkouts\"\n"
+"            v-bind:show1-r-m=\"show1RM\"\n"
+"            v-bind:show-volume=\"showVolume\"\n"
+"            v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"            v-bind:guides=\"guides\"\n"
+"            ref=\"tooltip\"\n"
+"        ></tool-tip>\n"
+"\n"
+"\n"
+"    </div>\n",
    props: {
        tagList: Object,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array,
        currentExerciseName: String,
        currentExercise1RM: Number,
        showGuide: Boolean,
        currentExerciseGuide: String,
        guides: Array
    },
    data: function () {
        var DEFAULT_NUMBER_TO_SHOW = 6;
        return {
            filterType: 'filter1', // either 'nofilter', 'filter1' or 'filter3' 
            numberOfRecentWorkoutsToShow: DEFAULT_NUMBER_TO_SHOW,
            numberNotShown: 0,
            DEFAULT_NUMBER_TO_SHOW: DEFAULT_NUMBER_TO_SHOW
        }
    },
    watch: {
        filterType: function () {
            this.resetView(); // reset view when changing filter type
        },
        currentExerciseName: function () {
            this.filterType = "filter1"; // change to "same exercise" view when switching between different exercises
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
                var [headlineReps,headlineNumSets,headlineWeight,repRangeExceeded] = exercise.guideType
                    ? self.getHeadlineFromGuide(exercise.guideType, exercise.sets)
                    : self.getHeadline(exercise.sets);
                if (self.filterType == "filter3"  && !self.currentExercise1RM) return; // can't filter - 1RM box is empty
                if (self.filterType == "filter3"  && headlineWeight < self.currentExercise1RM) return;
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
                var maxWeight = exercise.sets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
                var maxWeightReps = exercise.sets.filter(set => set.weight == maxWeight)
                                                 .reduce((acc, set) => Math.max(acc, set.reps), 0);
                var totalVolume = _calculateTotalVolume(exercise);
                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType
                    "maxAttempted": maxWeight.toString(),
                    "maxAttemptedReps": maxWeightReps.toString(),
                    "headlineWeight": headlineWeight.toString(),
                    "headlineReps": headlineReps,
                    "headlineNumSets": headlineNumSets,
                    "repRangeExceeded": repRangeExceeded,
                    "totalVolume": totalVolume,
                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": moment(exercise.date).from(today) // e.g. "5 days ago"
                });
            });
            return summaries;
        },
        guideCategories: function () {
            var guideCategories = {};
            this.guides.forEach(guide =>
                guideCategories[guide.name] = guide.category
            );
            return guideCategories;
        }
    },
    methods: {
        resetView: function () { 
            this.numberOfRecentWorkoutsToShow = this.DEFAULT_NUMBER_TO_SHOW;
        },
        findNextOccurence: function (exerciseName, startIdx) {
            for (var i = (startIdx + 1); i < (startIdx + 50); i++) {
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
            alert("TODO Not implemented");
        },
        copySummaryToClipboard: function (summary) {
            var text = summary.exercise.date 
              + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
              + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
              + "\t" + summary.headlineWeight + " x " + summary.headlineReps
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
            var weights = allSets.map(set => set.weight);
            var mostFrequentWeight = weights.sort((a, b) =>
                weights.filter(v => v === a).length
                - weights.filter(v => v === b).length
             ).pop();
            var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
            return this.getHeadline_internal(mostFrequentWeight, reps, false);
        },
        getHeadlineFromGuide: function (guideName, allSets) {
            if (!guideName) return ['', 0, 0, false];
            var guideParts = guideName.split('-');
            if (guideParts.length != 2) return ['', 0, 0, false];
            var guideLowReps = Number(guideParts[0]);
            var guideHighReps = Number(guideParts[1]);
            var matchingSets = allSets.filter(set => set.reps >= guideLowReps);
            var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
            matchingSets = matchingSets.filter(set => set.weight == maxWeight);
            var reps = matchingSets.map(set => set.reps);
            var repRangeExceeded = Math.max(...reps) >= guideHighReps;
            return this.getHeadline_internal(maxWeight, reps, repRangeExceeded);
        },
        getHeadline_internal: function (weight, reps, rre) {
            reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
            var maxReps = reps[0];
            var minReps = reps[reps.length - 1];
            var showMinus = maxReps != minReps;
            var displayReps = maxReps + (showMinus ? "-" : "");
            return [displayReps, reps.length, weight, rre];
        },
        showTooltip: function (recentWorkoutIdx, e) {
            var tooltip = this.$refs.tooltip;
            tooltip.show(recentWorkoutIdx, e);
        },
        hideTooltip: function () {
            var tooltip = this.$refs.tooltip;
            tooltip.hide();
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
        },
        formatDate: _formatDate
    }
});
app.component('rm-table', {
    template: "    <table border=\"1\" class=\"rmtable\">\n"
+"        <tr>\n"
+"            <th>Reps</th>\n"
+"            <th>Weight</th>\n"
+"            <th style=\"min-width: 53px\">Percent</th>\n"
+"        </tr>\n"
+"        <tr v-for=\"row in rows\"\n"
+"        v-bind:class=\"{ 'intensity60': showGuide && guideType == '12-15' && row.reps >= 12 && row.reps <= 15,\n"
+"                        'intensity70': showGuide && guideType == '8-10'  && row.reps >= 8  && row.reps <= 10,\n"
+"                        'intensity80': showGuide && guideType == '5-7'   && row.reps >= 5  && row.reps <= 7 }\">\n"
+"            <td>{{ row.reps }}</td>\n"
+"            <td>{{ row.weight.toFixed(1) }}</td>\n"
+"            <td>{{ row.percentage.toFixed(1) }}%</td>\n"
+"        </tr>\n"
+"    </table>\n",
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
                var tempRM = _calculateOneRepMax({ weight: tempWeight, reps: reps, gap: 0 }, this.oneRmFormula);
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
    return ["1", "2", "3"].map(function (number) {
        return _newExercise(number)
    });
}
function _newExercise(number) {
    var sets = [];
    for (var s = 0; s < 8; s++) { // for each set (8 in total)
        sets.push(_newSet());
    }
    return {
        number: number, // e.g. 1/2/3, 1A/1B
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
function _formatDate (datestr) { // dateformat?: string
    if (!datestr) return "";
    /*if (!dateformat) */var dateformat = "DD/MM/YYYY";
    return moment(datestr).format(dateformat);
} 
function _calculateTotalVolume (exercise) {
    return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
}

app.component('tool-tip', {
    template: "    <div id=\"tooltip\" v-show=\"tooltipVisible && tooltipIdx != -1\">\n"
+"        <table>\n"
+"            <tr v-if=\"show1RM && !!tooltipData.guideType\">\n"
+"                <td v-bind:colspan=\"colspan1\">Guide type</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.guideType }}</td>\n"
+"            </tr>\n"
+"\n"
+"            <tr v-if=\"show1RM && !!tooltipData.ref1RM && currentExerciseGuide.referenceWeight != 'WORK'\">\n"
+"                <td v-bind:colspan=\"colspan1\">Ref. 1RM</td>\n"
+"                <td v-bind:class=\"{ oneRepMaxExceeded: maxEst1RM > tooltipData.ref1RM }\">\n"
+"                    {{ tooltipData.ref1RM }}\n"
+"                </td>\n"
+"            </tr>\n"
+"\n"
+"            <tr>\n"
+"                <th v-if=\"show1RM && currentExerciseGuide.referenceWeight == '1RM'\">% 1RM</th>\n"
+"                <th>Weight</th>\n"
+"                <th>Reps</th>\n"
+"                <!-- <th>Score</th> -->\n"
+"                <th>Rest</th>\n"
+"                <th v-if=\"show1RM\">Est 1RM</th>\n"
+"                <th v-if=\"showVolume\">Volume</th>\n"
+"            </tr>\n"
+"            <grid-row v-for=\"(set, setIdx) in tooltipData.sets\"\n"
+"                    v-bind:set=\"set\" \n"
+"                    v-bind:set-idx=\"setIdx\"\n"
+"                    v-bind:show1-r-m=\"show1RM\"\n"
+"                    v-bind:show-volume=\"showVolume\"\n"
+"                    v-bind:ref1-r-m=\"tooltipData.ref1RM\"\n"
+"                    v-bind:max-est1-r-m=\"maxEst1RM\"\n"
+"                    v-bind:read-only=\"true\"\n"
+"                    v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                    v-bind:show-guide=\"false\"\n"
+"                    v-bind:guide=\"currentExerciseGuide\"\n"
+"                    v-bind:exercise=\"tooltipData\">\n"
+"                    <!-- v-bind:ref1-r-m = !!tooltipData.ref1RM ? tooltipData.ref1RM : tooltipData.maxEst1RM -->\n"
+"            </grid-row>\n"
+"            <tr><td style=\"padding: 0\"></td></tr> <!-- fix for chrome (table borders) -->\n"
+"            <!--<tr style=\"border-top: double 3px black\">\n"
+"                <td v-bind:colspan=\"colspan1\">Total reps</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.totalReps }}</td>\n"
+"            </tr>\n"
+"            <tr>\n"
+"                <td v-bind:colspan=\"colspan1\">Maximum weight</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.highestWeight }}</td>\n"
+"            </tr>-->\n"
+"            <tr><!-- v-if=\"showVolume\" -->\n"
+"                <td v-bind:colspan=\"colspan1\">Total volume</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ totalVolume.toLocaleString() }} kg</td>\n"
+"            </tr>\n"
+"            <!-- <tr v-if=\"showVolume\">\n"
+"                <td v-bind:colspan=\"colspan1\">Volume per set (&gt;6 reps)</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ tooltipData.volumePerSet }}</td>\n"
+"            </tr> -->\n"
+"\n"
+"            <tr v-if=\"show1RM\">\n"
+"                <td v-bind:colspan=\"colspan1\">Max est. 1RM</td>\n"
+"                <td v-bind:colspan=\"colspan2\">{{ maxEst1RM }}</td>\n"
+"            </tr>\n"
+"        </table>\n"
+"    </div>\n",
    props: {
        recentWorkouts: Array,
        show1RM: Boolean,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Array
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
                || this.tooltipIdx >= this.recentWorkouts.length) { // outside array bounds
                return {
                    number: "",
                    name: "",
                    sets: [],
                    ref1RM: 0,
                    comments: "",
                    etag: 0,
                    guideType: "",
                    id: 0,
                    date: "",
                    blockStart: "", // date
                    weekNumber: 0
                }
            } else {
                return this.recentWorkouts[this.tooltipIdx];
            }
        },
        colspan1: function () {
            var span = 2;
            if (this.show1RM && this.currentExerciseGuide.referenceWeight == '1RM') {
                span += 1;
            }
            if (this.show1RM) {
                span += 1;
            }
            return span;
        },
        colspan2: function () {
            return this.showVolume ? 2 : 1;
        },
        currentExerciseGuide: function () {
            for (var i = 0; i < this.guides.length; i++) {
                if (this.guides[i].name ==  this.tooltipData.guideType )
                    return this.guides[i];
            }
            return this.guides[0]; // not found - return default (empty) guide
        },
        totalVolume: function () {
            return _calculateTotalVolume(this.tooltipData);
        },
        maxEst1RM: function () {
            var self = this;
            var maxEst1RM = this.tooltipData.sets
                .map(function(set) { return _calculateOneRepMax(set, self.oneRmFormula) })
                .filter(function(val) { return val > 0 }) // filter out error conditions
                .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
            maxEst1RM = _roundOneRepMax(maxEst1RM);
            return maxEst1RM;
        }
    },
    methods: {
        show: function (recentWorkoutIdx, e) { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipIdx = recentWorkoutIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                nextTick(function () { self.moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function (e) {
            var tooltip = this.$el;
            var popupWidth = tooltip.clientWidth;
            var overflowX = (popupWidth + e.clientX + 5) > document.documentElement.clientWidth;
            tooltip.style.left = (overflowX ? e.pageX - popupWidth : e.pageX) + "px";
            var popupHeight = tooltip.clientHeight;
            tooltip.style.top = (e.pageY - popupHeight - 10) + "px";
        },
        hide: function () { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipVisible = false;
        }
    }
});
app.component('week-table', {
    template: "<div>\n"
+"\n"
+"<label>\n"
+"    <input type=\"checkbox\" v-model=\"colourCodeReps\" />\n"
+"    Colour-code reps\n"
+"</label>\n"
+"\n"
+"\n"
+"\n"
+"<table border=\"1\" class=\"weektable\">\n"
+"    <tr>\n"
+"        <!-- Table heading -->\n"
+"        <td></td>\n"
+"        <td v-for=\"heading in table.columnHeadings\"\n"
+"            style=\"width: 40px\">\n"
+"            {{ heading }}\n"
+"        </td>\n"
+"    </tr>\n"
+"    <tr v-for=\"(row, rowIdx) in table.rows\">\n"
+"        <!-- Table body -->\n"
+"        <td>{{ rowIdx + 1 }}</td>\n"
+"        <td v-for=\"col in row\"\n"
+"            v-bind:class=\"colourCodeReps && ('weekreps' + col.reps)\"\n"
+"            v-bind:title=\"tooltip(col)\"\n"
+"            v-on:mousemove=\"showTooltip(col.idx, $event)\" v-on:mouseout=\"hideTooltip\">\n"
+"            {{ col.weight > 0 ? col.weight.toString() : \"\" }}\n"
+"        </td>\n"
+"    </tr>\n"
+"</table>\n"
+"\n"
+"<br />\n"
+"<table v-if=\"colourCodeReps\">\n"
+"    <tr>\n"
+"        <td>KEY:</td>\n"
+"        <td v-for=\"number in 15\"\n"
+"            v-bind:class=\"'weekreps' + (16 - number)\">{{ 16 - number }}</td>\n"
+"    </tr>\n"
+"</table>\n"
+"\n"
+"<tool-tip \n"
+"    v-bind:recent-workouts=\"recentWorkouts\"\n"
+"    v-bind:show1-r-m=\"show1RM\"\n"
+"    v-bind:show-volume=\"showVolume\"\n"
+"    v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"    v-bind:guides=\"guides\"\n"
+"    ref=\"tooltip\"\n"
+"></tool-tip>\n"
+"\n"
+"</div>\n",
    props: {
        recentWorkouts: Array,
        currentExerciseName: String,
        show1RM: Boolean, // for tooltip
        showVolume: Boolean, // for tooltip
        oneRmFormula: String, // for tooltip
        guides: Array, // for tooltip
    },
    data: function () {
        return {
            colourCodeReps: false
        }
    },
    methods: {
        getHeadline: function (exerciseIdx) {
            var matchingSets = this.recentWorkouts[exerciseIdx].sets; // include all sets
            var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
            var maxWeightSets = matchingSets.filter(set => set.weight == maxWeight);
            var maxReps = maxWeightSets.reduce((acc, set) => Math.max(acc, set.reps), 0); // highest value in array
            return {
                weight: maxWeight,
                reps: maxWeightSets.length < 2 ? 0 // don't colour-code reps if there was only 1 set at this weight
                    : maxReps,
                idx: exerciseIdx // for tooltip
            };
        },
        tooltip: function (cell) {
            if (cell.weight && cell.reps) 
                return cell.weight.toString() + " x " + cell.reps.toString();
            else 
                return null;
        },
        showTooltip: function (recentWorkoutIdx, e) {
            var tooltip = this.$refs.tooltip;
            tooltip.show(recentWorkoutIdx, e);
        },
        hideTooltip: function () {
            var tooltip = this.$refs.tooltip;
            tooltip.hide();
        },
    },
    computed: {
        table: function () {
            var columnHeadings = [];
            var tableRows = [];
            function merge(rowIdx, colIdx, exerciseIdx) {
                var headline = self.getHeadline(exerciseIdx);
                if (!tableRows[rowIdx][colIdx]) {
                    tableRows[rowIdx][colIdx] = headline;
                } else {
                    if (headline.weight > tableRows[rowIdx][colIdx].weight) {
                        tableRows[rowIdx][colIdx] = headline;
                    }
                }
            }
            var self = this;
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != self.currentExerciseName) return;
                if (exerciseIdx > 500) return; // don't go back too far
                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) {
                        columnHeadings.push(exercise.blockStart);
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = exercise.weekNumber - 1; // e.g. week 1 is [0]
                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length < colIdx)
                        tableRows[rowIdx].push({ weight: 0, reps: 0, idx: -1 }); // create cells as necessary
                    merge(rowIdx, colIdx, exerciseIdx)
                }
            });
            tableRows.forEach(function (row) {
                while (row.length < columnHeadings.length) {
                    row.push({ weight: 0, reps: 0, idx: -1 }); // create cells as necessary
                }
            });
            columnHeadings.reverse();
            for (var i = 0; i < tableRows.length; i++) {
                tableRows[i].reverse();
            }
            return {
                columnHeadings: columnHeadings,
                rows: tableRows
            };
        }
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .weekreps1 {
        background-color: crimson;
        color: white;
    }
    .weekreps2 {
        background-color: crimson;
        color: white;
    }
    .weekreps3 {
        background-color: crimson;
        color: white;
    }
    .weekreps4 {
        background-color: crimson;
        color: white;
    }
    .weekreps5 {
        background-color: purple;
        color: white;
    }
    .weekreps6 {
        background-color: purple;
        color: white;
    }
    .weekreps7 {
        background-color: purple;
        color: white;
    }
    .weekreps8 {
        background-color: orange;
        color: white;
    }
    .weekreps9 {
        background-color: orange;
        color: white;
    }
     .weekreps10 {
        background-color: orange;
        color: white;
    }
    .weekreps11 {
        background-color: #fff1ab;
    }
    .weekreps12 {
        background-color: #fff1ab
    }
    .weekreps13 {
        background-color: #fff1ab
    }
    .weekreps14 {
        background-color: #fff1ab
    }
    /* 15+ reps = white background */
`;
                    document.head.appendChild(componentStyles);
                }
app.component('workout-calc', {
    template: "     <div>\n"
+"        <div v-if=\"show1RM\"\n"
+"                style=\"float: right; font-size: smaller; text-align: right\">\n"
+"            One Rep Max Formula\n"
+"            <select v-model=\"oneRmFormula\">\n"
+"                <option>Brzycki/Epley</option>\n"
+"                <option>Brzycki</option>\n"
+"                <option>Brzycki 12+</option>\n"
+"                <option>McGlothin</option>\n"
+"                <option>Epley</option>\n"
+"                <option>Wathan</option>\n"
+"                <option>Mayhew et al.</option>\n"
+"                <option>O'Conner et al.</option>\n"
+"                <option>Lombardi</option>\n"
+"            </select>\n"
+"            \n"
+"            <br /><br />\n"
+"\n"
+"            <label>\n"
+"                <input type=\"checkbox\" v-model=\"showRmTable\" />\n"
+"                Show table\n"
+"            </label>\n"
+"            \n"
+"            <br /><br />\n"
+"\n"
+"            <div style=\"display: inline-block; text-align: left\">\n"
+"                Workout date<br />\n"
+"                <input type=\"text\" style=\"width: 80px\" v-model=\"workoutDate\" \n"
+"                       disabled=\"true\" />\n"
+"            </div>\n"
+"\n"
+"            <br /><br />\n"
+"\n"
+"            Block start date<br />\n"
+"            <input type=\"text\" style=\"width: 80px\" v-model=\"blockStartDate\" \n"
+"                    placeholder=\"YYYY-MM-DD\" />\n"
+"\n"
+"            <br /><br />\n"
+"\n"
+"            Week number<br />\n"
+"            <span>{{ weekNumber || \"Invalid date\" }}</span>\n"
+"\n"
+"            <br /><br />\n"
+"            <div style=\"display: inline-block; text-align: left; \n"
+"                        background-color: rgb(227 227 227)\">\n"
+"                <b>Idea:</b><br />\n"
+"                <span v-bind:style=\"{ 'color': weekNumber >= 1 && weekNumber <= 3? 'black' : 'silver' }\">\n"
+"                    First few (3?) weeks:<br />12-14 range<br />\n"
+"                </span>\n"
+"                <span v-bind:style=\"{ 'color': weekNumber >= 4 ? 'black' : 'silver' }\">\n"
+"                    Remaining weeks:<br />6-8 range, working up in weight<br />\n"
+"                </span>\n"
+"            </div>\n"
+"\n"
+"            <br /><br />\n"
+"            <label>\n"
+"                <input type=\"checkbox\" v-model=\"showWeekTable\" />\n"
+"                Show table\n"
+"            </label>\n"
+"            <week-table v-if=\"showWeekTable\"\n"
+"                        v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                        v-bind:current-exercise-name=\"currentExerciseName\"\n"
+"                        v-bind:show1-r-m=\"show1RM\"\n"
+"                        v-bind:show-volume=\"showVolume\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:guides=\"guides\" />\n"
+"        </div>\n"
+"\n"
+"        <div style=\"display: inline-block; min-width: 298px\">\n"
+"            <button v-for=\"(exercise, idx) in exercises\"\n"
+"                    v-on:click=\"gotoPage(idx)\"\n"
+"                    class=\"pagebtn\"\n"
+"                    v-bind:class=\"{ activeBtn: curPageIdx == idx }\">\n"
+"                {{ exercise.number }}\n"
+"            </button>\n"
+"            <button v-on:click=\"addExercise\">+</button>\n"
+"        </div>\n"
+"\n"
+"        <button style=\"padding: 8.8px 3px 9.5px 3px; margin-right: 5px\"\n"
+"                v-on:click=\"copyWorkoutToClipboard\"\n"
+"        >📋</button><select \n"
+"                style=\"height: 40.5px\"\n"
+"                v-on:change=\"clearAll\">\n"
+"            <option style=\"display: none\">Clear</option>\n"
+"            <option>Blank</option>\n"
+"            <option v-for=\"preset in presets\">\n"
+"                {{ preset.name }}\n"
+"            </option>\n"
+"        </select>\n"
+"        \n"
+"        <datalist id=\"exercise-names\">\n"
+"            <option v-for=\"exerciseName in exerciseNamesAutocomplete\"\n"
+"                    v-bind:value=\"exerciseName\"></option>\n"
+"        </datalist>\n"
+"\n"
+"        <div v-for=\"(exercise, exIdx) in exercises\" \n"
+"             v-show=\"exIdx == curPageIdx\" \n"
+"             class=\"exdiv\">\n"
+"\n"
+"            <div style=\"margin-top: 15px; margin-bottom: 10px; font-weight: bold\">\n"
+"                Exercise\n"
+"                <input type=\"text\" v-model=\"exercise.number\" style=\"width: 30px; font-weight: bold\" />:\n"
+"                <input type=\"text\" v-model=\"exercise.name\"   style=\"width: 225px\" \n"
+"                       list=\"exercise-names\" autocapitalize=\"off\"\n"
+"                /><!-- border-right-width: 0 --><!--<button style=\"vertical-align: top; border: solid 1px #a9a9a9; height: 29px\"\n"
+"                        v-on:click=\"copyExerciseToClipboard(exercise)\">📋</button>-->\n"
+"            </div>\n"
+"\n"
+"            <div v-if=\"show1RM && showRmTable\"\n"
+"                    style=\"float: right\">\n"
+"                <rm-table v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                            v-bind:ref1-r-m=\"exercise.ref1RM\"\n"
+"                            v-bind:show-guide=\"showGuide\"\n"
+"                            v-bind:guide-type=\"exercise.guideType\"\n"
+"                ></rm-table>\n"
+"            </div>\n"
+"\n"
+"            <div style=\"margin-bottom: 15px\" class=\"smallgray\">\n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"showVolume\" /> Show volume\n"
+"                </label>\n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"show1RM\" /> \n"
+"                    {{ currentExerciseGuide.referenceWeight == \"WORK\" ? \"Work weight\" : \"Show 1RM\" }}\n"
+"                </label>\n"
+"                <span v-if=\"show1RM\">\n"
+"                    <!-- Reference --><number-input v-model=\"exercise.ref1RM\" style=\"width: 65px\" class=\"smallgray verdana\" /> kg\n"
+"                </span>\n"
+"                <label v-if=\"show1RM\">\n"
+"                    <input type=\"checkbox\" v-model=\"showGuide\" /> Show guide\n"
+"                </label>\n"
+"                <!-- Guide type -->\n"
+"                <select v-if=\"show1RM && showGuide\"\n"
+"                        v-model=\"exercise.guideType\">\n"
+"                        <option v-for=\"guide in guides\" \n"
+"                                v-bind:value=\"guide.name\"\n"
+"                                v-bind:style=\"{ 'color': guide.referenceWeight == '1RM' ? 'red' : '' }\">\n"
+"                            {{ guide.name + (isDigit(guide.name[0]) ? \" reps\" : \"\") }}\n"
+"                        </option>\n"
+"                </select>\n"
+"            </div>\n"
+"            <div v-if=\"lastWeeksComment\"\n"
+"                 style=\"margin: 20px 0; font-size: 11px; color: #888\"> \n"
+"                 🗨 Last week's comment: \n"
+"                 <input type=\"text\" readonly=\"true\" v-bind:value=\"lastWeeksComment\"\n"
+"                        class=\"lastweekscomment\" />\n"
+"            </div>\n"
+"            <table class=\"maintable\">\n"
+"                <thead>\n"
+"                    <tr>\n"
+"                        <th v-if=\"show1RM && currentExerciseGuide.referenceWeight == '1RM'\" class=\"smallgray\">%1RM</th>\n"
+"                        <th>Set</th>\n"
+"                        <th v-if=\"show1RM && showGuide\">Guide</th>\n"
+"                        <th>Weight</th>\n"
+"                        <th>Reps</th>\n"
+"                        <!-- <th style=\"padding: 0px 10px\">Score</th> -->\n"
+"                        <th>Rest</th>\n"
+"                        <th v-if=\"show1RM\" class=\"smallgray\">Est 1RM</th>\n"
+"                        <th v-if=\"showVolume\" class=\"smallgray\">Volume</th>\n"
+"                    </tr>\n"
+"                </thead>\n"
+"                <tbody>\n"
+"                    <grid-row v-for=\"(set, setIdx) in exercise.sets\"\n"
+"                        v-bind:set=\"set\" \n"
+"                        v-bind:set-idx=\"setIdx\"\n"
+"                        v-bind:show1-r-m=\"show1RM\"\n"
+"                        v-bind:show-volume=\"showVolume\"\n"
+"                        v-bind:ref1-r-m=\"exercise.ref1RM\"\n"
+"                        v-bind:max-est1-r-m=\"exercise.ref1RM\"\n"
+"                        v-bind:read-only=\"false\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:show-guide=\"show1RM && showGuide\"\n"
+"                        v-bind:guide-name=\"currentExerciseGuideName\"\n"
+"                        v-bind:guide=\"currentExerciseGuide\"\n"
+"                        v-bind:exercise=\"exercise\">\n"
+"                    </grid-row>\n"
+"                    <tr>\n"
+"                        <td v-if=\"show1RM\"></td>\n"
+"                        <td><button v-on:click=\"addSet\">+</button></td>\n"
+"                        <td colspan=\"3\"\n"
+"                            class=\"smallgray verdana\"\n"
+"                            v-bind:class=\"{ 'showonhover': !showVolume }\"\n"
+"                            style=\"padding-top: 5px\">\n"
+"                                <!-- Total reps: {{ runningTotal_numberOfReps(exercise) }} -->\n"
+"                                <!-- &nbsp; -->\n"
+"                                <!-- Average weight: {{ runningTotal_averageWeight(exercise).toFixed(1) }} -->\n"
+"                            Total volume: {{ runningTotal_totalVolume(exercise) }}\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                </tbody>\n"
+"            </table>\n"
+"\n"
+"            <span style=\"font-size: smaller\">Comment:</span>\n"
+"            <input type=\"text\" v-model=\"exercise.comments\" size=\"30\" style=\"font-size: smaller\" />\n"
+"\n"
+"            <span style=\"font-size: smaller\">Tag:</span>\n"
+"            <!-- (this helps put the workout \"headlines\" in context) -->\n"
+"            <select v-model=\"exercise.etag\"\n"
+"                    style=\"vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px\">\n"
+"                <option v-bind:value=\"0\"></option>\n"
+"                <option v-for=\"(value, key) in tagList\"\n"
+"                        v-bind:value=\"key\"\n"
+"                ><span class=\"emoji\">{{ value.emoji }}</span> - {{ value.description }}</option>\n"
+"            </select><br />\n"
+"        </div><!-- /foreach exercise -->\n"
+"        <br />\n"
+"        <!--\n"
+"        <textarea style=\"width: 400px; height: 50px; margin-bottom: 5px\" \n"
+"                v-model=\"outputText\" \n"
+"                readonly=\"readonly\"></textarea>-->\n"
+"\n"
+"        <!-- <br />Mail to: <br />\n"
+"        <input type=\"email\" style=\"width: 260px\" v-model=\"emailTo\" />\n"
+"        &nbsp;<a v-bind:href=\"emailLink\">Send email</a> -->\n"
+"\n"
+"    \n"
+"        \n"
+"        <recent-workouts-panel v-bind:tag-list=\"tagList\"\n"
+"                               v-bind:show1-r-m=\"show1RM\"\n"
+"                               v-bind:show-volume=\"showVolume\"\n"
+"                               v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                               v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                               v-bind:current-exercise-name=\"currentExerciseName\"\n"
+"                               v-bind:current-exercise1-r-m=\"currentExercise1RM\"\n"
+"                               v-bind:show-guide=\"showGuide\"\n"
+"                               v-bind:current-exercise-guide=\"currentExerciseGuideName\"\n"
+"                               v-bind:guides=\"guides\">\n"
+"        </recent-workouts-panel>\n"
+"\n"
+"\n"
+"        <br /><br />\n"
+"        <dropbox-sync ref=\"dropbox\"\n"
+"                      dropbox-filename=\"json/workouts.json\"\n"
+"                      v-bind:data-to-sync=\"recentWorkouts\"\n"
+"                      v-on:sync-complete=\"dropboxSyncComplete\">\n"
+"        </dropbox-sync>\n"
+"        <br /><br />\n"
+"\n"
+"    </div>\n",
    data: function () {
        var exercises = _newWorkout();
        if (localStorage["currentWorkout"]) {
            exercises = JSON.parse(localStorage["currentWorkout"]);
        }
        var recentWorkouts = [];
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
        clearAll: function (event) {
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
            var output = "";
            this.exercises.forEach(function (exercise, exerciseIdx) {
                var text = _generateExerciseText(exercise);
                if (text.length > 0) {
                    output += exercise.number + ". " + exercise.name + "\n" + text + "\n\n";
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
        isDigit: function (str) {
            if (!str) return false;
            return str[0] >= '0' && str[0] <= '9';
        }
    },
    computed: {
        emailLink: function () {
            return "mailto:" + this.emailTo + "?subject=workout&body=" + encodeURIComponent(this.outputText);
        },
        currentExerciseName: function () {
            return this.exercises[this.curPageIdx].name;
        },
        currentExercise1RM: function () {
            return this.exercises[this.curPageIdx].ref1RM;
        },
        currentExerciseGuideName: function () {
            return this.exercises[this.curPageIdx].guideType;
        },
        currentExerciseGuide: function () {
            for (var i = 0; i < this.guides.length; i++) {
                if (this.guides[i].name == this.currentExerciseGuideName) 
                    return this.guides[i];
            }
            return this.guides[0]; // not found - return default (empty) guide
        },
        weekNumber: function() {
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
        lastWeeksComment: function () {
            var found = this.recentWorkouts.find(z => z.name == this.currentExerciseName);
            if (found != null) {
                return found.comments;
            } else {
                return null;
            }
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
