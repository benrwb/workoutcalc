Vue.component('grid-row', {
    template: "    <tr>"
+"        <td v-if=\"show1RM\" "
+"            class=\"smallgray verdana\""
+"            v-bind:title=\"oneRepMaxTooltip\""
+"            v-bind:class=\"{ 'intensity60': oneRepMaxPercentage >= 60.0 && oneRepMaxPercentage < 70.0,"
+"                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,"
+"                            'intensity80': oneRepMaxPercentage >= 80.0 }\">"
+"            {{ formattedOneRepMaxPercentage }}</td>"
+"        <td v-if=\"!readOnly\">"
+"            {{ setIdx + 1 }}"
+"        </td>"
+"        <td v-if=\"showGuide\""
+"            v-bind:class=\"{ 'intensity60': guidePercentage(setIdx) >= 0.600 && guidePercentage(setIdx) < 0.700,"
+"                            'intensity70': guidePercentage(setIdx) >= 0.700 && guidePercentage(setIdx) < 0.800,"
+"                            'intensity80': guidePercentage(setIdx) >= 0.800 }\""
+"            v-bind:title=\"guideTooltip(setIdx)\">"
+"            {{ roundGuideWeight(guideWeight(setIdx)) }}"
+"        </td>"
+"        <td class=\"border\">"
+"            <input   v-if=\"!readOnly\" v-model=\"set.weight\" type=\"number\" step=\"any\" />"
+"            <template v-if=\"readOnly\"      >{{ set.weight }}</template>"
+"        </td>"
+"        <td class=\"border\">"
+"            <input   v-if=\"!readOnly\" v-model=\"set.reps\" type=\"number\" />"
+"            <template v-if=\"readOnly\"      >{{ set.reps }}</template>"
+"        </td>"
+"        <!-- <td class=\"score\">{{ volumeForSet(set) }}</td> -->"
+"        <td v-show=\"setIdx != 0\" class=\"border\">"
+"            <input   v-if=\"!readOnly\" v-model=\"set.gap\" type=\"number\" />"
+"            <template v-if=\"readOnly\"      >{{ set.gap }}</template>"
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
        "ref1RM": String,
        "maxEst1RM": [Number, String],
        "readOnly": Boolean,
        "oneRmFormula": String,
        "showGuide": Boolean,
        "guideType": String,
        "exerciseName": String,
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
        roundGuideWeight: function (guideWeight) {
            if (!this.ref1RM) return "";
            if (!guideWeight) return "";
            if ((this.exerciseName || '').indexOf('db ') == 0)
                return Math.round(guideWeight * 0.5) / 0.5;
            else
                return Math.round(guideWeight * 0.4) / 0.4;
        },
        guideTooltip: function (setNumber) {
            if (!this.ref1RM) return null;
            var guideWeight = this.guideWeight(setNumber);
            if (!guideWeight) return null;
            var roundedWeight = this.roundGuideWeight(guideWeight);
            return "Guide " 
                + parseFloat((this.guidePercentage(setNumber) * 100).toFixed(1))
                + '% = '
                + guideWeight.toFixed(1)
                + ' kg'
                + '\n'
                + 'Actual '
                + parseFloat(((roundedWeight / this.ref1RM) * 100).toFixed(1))
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
            if (this.oneRepMax == -1) return "";
            if (this.oneRepMax == -2) return "N/A";
            return this.roundedOneRepMax.toFixed(1) + "kg";
        },
        oneRepMaxPercentage: function () {
            if (!this.set.weight || !this.ref1RM) return -1;
            return this.set.weight * 100 / this.ref1RM;
        },
        formattedOneRepMaxPercentage: function () {
            if (this.oneRepMaxPercentage == -1) return "";
            return Math.round(this.oneRepMaxPercentage) + "%"; 
        },
        oneRepMaxTooltip: function () {
            if (this.oneRepMaxPercentage == -1) return null;
            return parseFloat(this.oneRepMaxPercentage.toFixed(1)) + "%";
        },
        formattedVolume: function () { 
            if (!this.set.weight || !this.set.reps) return "";
            if (this.set.reps <= 6) return "N/A";
            return _volumeForSet(this.set);
        }
    }
});
Vue.component('recent-workouts-panel', {
    template: "    <div>"
+"        <div v-show=\"recentWorkouts.length > 0\">"
+""
+"            <h4 class=\"recent\">Recent workouts</h4>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"nofilter\" />No filter</label>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter1\"  />Filter 1</label>"
+"            <label><input type=\"radio\" v-model=\"filterType\" value=\"filter2\"  />Filter 2</label>"
+"            <span v-if=\"!!daysSinceLastWorked\" "
+"                style=\"margin-left: 50px; \""
+"                v-bind:style=\"{ color: daysSinceLastWorked > 7 ? 'red' : '' }\">"
+"                        <span v-show=\"daysSinceLastWorked > 7\""
+"                                title=\"Decreased performance; Increased DOMS\">⚠️</span>{{ daysSinceLastWorked }} days since last worked"
+"            </span>"
+"            <span v-show=\"showAllPrevious == true\""
+"                  style=\"font-size: 13px; margin-left: 20px\""
+"                  v-on:click=\"showAllPrevious = false\">"
+"                  ▲ Hide"
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
+"                            <span v-if=\"!!summary.exercise.etag\""
+"                                  v-bind:title=\"tagList[summary.exercise.etag].description\""
+"                                >{{ tagList[summary.exercise.etag].emoji }}"
+"                            </span>"
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
+"                        <td v-show=\"!!summary.exercise.comments\" v-bind:title=\"summary.exercise.comments\">🗨</td>"
+"                    </tr>"
+"                </tbody>"
+"            </table>"
+"            <!-- Only show $numberOfRecentWorkoutsToShow by default. -->"
+"            <!-- Rationale: There's no point looking at data from over a month ago. -->"
+"            <!-- It's just additional \"noise\" that detracts from the main issue: -->"
+"            <!-- Is progress being made week-on-week? -->"
+""
+"            <div v-show=\"numberNotShown > 0\""
+"                 style=\"font-size: 13px; padding: 3px 5px\""
+"                 v-on:click=\"showAllPrevious = true\">"
+"                 {{ numberNotShown }} more ▼"
+"            </div>"
+"            <div v-show=\"showAllPrevious == true\""
+"                  style=\"font-size: 13px; padding: 3px 5px\""
+"                  v-on:click=\"showAllPrevious = false\">"
+"                  ▲ Hide"
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
        currentExerciseGuide: String
    },
    data: function () {
        return {
            filterType: 'filter1',
            numberOfRecentWorkoutsToShow: 6,
            showAllPrevious: false,
            numberNotShown: 0
        }
    },
    watch: {
        filterType: function () {
            this.showAllPrevious = false;
        }
    },
    computed: {
        daysSinceLastWorked: function () {
            var next = this.findNextOccurence(this.currentExerciseName, 0);
            if (next != null) {
                var today = moment().startOf("day");
                var date = moment(next.date).startOf("day");
                return today.diff(date, 'days');
            }
            return 0;
        },
        recentWorkoutSummaries: function () {
            var summaries = [];
            var numberShown = 0;
            var lastDate = "";
            this.numberNotShown = 0;
            var today = moment().startOf('day');
            var self = this;
            this.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (self.filterType != "nofilter" && exercise.name != self.currentExerciseName) return;
                if (self.filterType == "filter2"  && exercise.guideType != self.currentExerciseGuide) return;
                var showThisRow = (numberShown++ < self.numberOfRecentWorkoutsToShow || self.showAllPrevious);
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
                var maxWeight = exercise.sets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0);
                var totalVolume = exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
                var totalReps = exercise.sets.reduce(function(acc, set) { return acc + Number(set.reps) }, 0);
                var maxEst1RM = exercise.sets
                    .map(function(set) { return _calculateOneRepMax(set, self.oneRmFormula) })
                    .filter(function(val) { return val > 0 })
                    .reduce(function(acc, val) { return Math.max(acc, val) }, 0);
                maxEst1RM = _roundOneRepMax(maxEst1RM);
                summaries.push({
                    "idx": exerciseIdx,
                    "exercise": exercise,
                    "warmUpWeight": warmUpWeight,
                    "maxFor12": maxFor12weight,
                    "numSets12": numSets12,
                    "maxAttempted": headlineWeight == maxWeight ? "-" : maxWeight,
                    "headline": headline,
                    "numSetsHeadline": numSetsHeadline,
                    "totalVolume": totalVolume,
                    "volumePerSet": self.calculateVolumePerSet(exercise.sets),
                    "totalReps": totalReps,
                    "highestWeight": maxWeight,
                    "maxEst1RM": maxEst1RM,
                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": moment(exercise.date).from(today)
                });
            });
            return summaries;
        },
    },
    methods: {
        findNextOccurence: function (exerciseName, startIdx) {
            for (var i = (startIdx + 1); i < (startIdx + 20); i++) {
                if (i >= this.recentWorkouts.length) {
                    return null;
                }
                if (this.recentWorkouts[i].name == exerciseName) {
                    return this.recentWorkouts[i];
                }
            }
            return null;
        },
        removeRecent: function (idx) {
            if (confirm("Remove this item from workout history?")) {
                this.recentWorkouts[idx].name = "DELETE";
                localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts);
                this.dropboxSyncStage1();
            }
        },
        copySummaryToClipboard: function (summary) {
            var text = summary.exercise.date 
              + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
              + "\t" + (summary.totalVolume / 1000)
              + "\t" + summary.headline.trim()
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
                .filter(function(set) { return set.reps >= threshold })
                .reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0);
            var sets = allSets
                .filter(function(set) { return set.weight == weight })
            var minReps = sets
                .reduce(function(acc, set) { return Math.min(acc, set.reps) }, 9999);
            var maxReps = sets
                .reduce(function(acc, set) { return Math.max(acc, set.reps) }, 0);
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
            reps.sort(function (a, b) { return a - b }).reverse()
            reps = reps.slice(0, 3);
            var maxReps = reps[0];
            var minReps = reps[reps.length - 1];
            var showPlus = maxReps != minReps;
            var displayString = this.padx(mostFrequentWeight, minReps + (showPlus ? "+" : ""));
            return [displayString, reps.length, mostFrequentWeight];
        },
        calculateVolumePerSet: function (sets) {
            var volumeSets = sets.filter(function(set) { return set.reps > 6 });
            var volumeSum = volumeSets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
            var volumePerSet = volumeSum / volumeSets.length;
            return Math.round(volumePerSet);
        },
        showTooltip: function (summaryItemIdx, e) {
            this.$refs.tooltip.show(summaryItemIdx, e);
        },
        hideTooltip: function () {
            this.$refs.tooltip.hide();
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
        ref1RM: String,
        oneRmFormula: String,
        showGuide: Boolean,
        guideType: String
    },
    computed: {
        rows: function () {
            var rows = [];
            for (var reps = 1; reps <= 15; reps++) {
                var tempWeight = 100;
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
    // This function is used by "grid-row" component and by main Vue instance.
    if (!set.weight || !set.reps) return -1; // no data
    //if (set.reps > 12) return -2; // can't calculate if >12 reps

    if (formula == 'Brzycki') {
        if (set.reps > 12) return -2; // can't calculate if >12 reps
        return set.weight / (1.0278 - 0.0278 * set.reps);
    }
    else if (formula == 'Brzycki 12+') {
        // same as above but not limited to max 12 reps
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
        // uses Brzycki for fewer than 10 reps
        // and Epley for more than 10 reps
        // (for 10 reps they are the same)
        if (set.reps <= 10)
            return set.weight / (1.0278 - 0.0278 * set.reps); // Brzycki
        else
            return set.weight * (1 + (set.reps / 30)); // Epley
    }
    else 
        return -3; // unknown formula
}


function _roundOneRepMax(oneRepMax) {
    // This function is used by "grid-row" component and by main Vue instance.
    //
    // Round up 1 d.p. to ensure that 12 reps always gives 69% not 70%.
    // e.g. 11 x 12 = 15.84557...
    // Standard[1] = 15.8;  11/15.8 = 0.696 = 70% when displayed (bright orange)
    // Round up[2] = 15.9;  11/15.9 = 0.692 = 69% when displayed (pale orange)
    // [1] = (Math.round(number * 10) / 10) or number.toFixed(1)
    // [2] = Math.ceil (see below)
    return Math.ceil(oneRepMax * 10) / 10;
}

 

function _newWorkout() {
    // create an empty workout
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
        ref1RM: '',
        comments: '',
        etag: 0, // exercise tag
        guideType: ''
    };
}

function _newSet() {
    return {
        weight: '',
        reps: '',
        gap: ''
    };
}

function _volumeForSet(set) {
    var weight = Number(set.weight);
    var reps = Number(set.reps);
    var volume = weight * reps;
    return volume == 0 ? "" : Math.round(volume);
}

function pad(str, len) {
    // Pads the string so it lines up correctly
    var xtra = len - str.length;
    return " ".repeat((xtra / 2) + (xtra % 2))
        + str
        + " ".repeat(xtra / 2);
}

function _generateExerciseText(exercise) {
    // format an exercise ready to be copied to the clipboard
    var weights = "kg";
    var reps = "x ";
    var gaps = "🕘  ";
    var exerciseVolume = 0;
    
    var self = this;
    exercise.sets.forEach(function (set, setIdx) {
        var w = set.weight;
        var r = set.reps;
        var g = (setIdx == (exercise.sets.length - 1)) 
            ? "" 
            : exercise.sets[setIdx + 1].gap; // use the next one down

        var score = _volumeForSet(set);
        if (score > 0) {
            var len = Math.max(w.length, r.length, g.length);
            weights += "  " + pad(w, len);
            reps += "  " + pad(r, len);
            gaps += "  " + pad(g, len);
            exerciseVolume += score;
            //totalVolume += score;
        }
    });

    if (exerciseVolume > 0) {
        return "  " + weights.trim() + "\n"
              + "  " + reps.trim() + "\n"
              + "  " + gaps.trim(); // + "\n"
              //+ "  Volume: " + exerciseVolume;
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
            if (this.tooltipIdx == -1
                || this.tooltipIdx >= this.recentWorkoutSummaries.length) {
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
        show: function (summaryItemIdx, e) {
            this.tooltipIdx = summaryItemIdx;
            if (!this.tooltipVisible) {
                this.tooltipVisible = true;
                var self = this;
                Vue.nextTick(function () { self.moveTooltip(e) });
            } else {
                this.moveTooltip(e);
            }
        },
        moveTooltip: function (e) {
            var popupWidth = $("#tooltip").width();
            var overflowX = (popupWidth + e.clientX + 5) > $(window).width();
            $("#tooltip").css({ left: overflowX ? e.pageX - popupWidth : e.pageX });
            var popupHeight = $("#tooltip").height();
            var overflowY = (popupHeight + e.clientY + 15) > $(window).height();
            $("#tooltip").css({ top: overflowY ? e.pageY - popupHeight - 10 : e.pageY + 10 });
        },
        hide: function () {
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
+"        <div v-for=\"(exercise, exIdx) in exercises\" v-show=\"exIdx == curPageIdx\" class=\"exdiv\">"
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
+"                    <!-- Reference --><input type=\"number\" v-model=\"exercise.ref1RM\" style=\"width: 65px\" class=\"smallgray verdana\" /> kg"
+"                </span>"
+"                <label v-if=\"show1RM\">"
+"                    <input type=\"checkbox\" v-model=\"showGuide\" /> Show guide"
+"                </label>"
+"                <!-- Guide type -->"
+"                <select v-if=\"show1RM && showGuide\""
+"                        v-model=\"exercise.guideType\">"
+"                        <option v-for=\"(value, key) in guides\" "
+"                                v-bind:value=\"key\">"
+"                                {{ key + (key.indexOf('-') != -1 ? \" reps\" : \"\") }}"
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
+"                            class=\"smallgray verdana showonhover\""
+"                            style=\"padding-top: 5px\">"
+"                            <!-- v-bind:class=\"{ 'showonhover': !showVolume }\" -->"
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
+"                                v-bind:show1-r-m=\"show1RM\""
+"                                v-bind:show-volume=\"showVolume\""
+"                                v-bind:one-rm-formula=\"oneRmFormula\""
+"                                v-bind:recent-workouts=\"recentWorkouts\""
+"                                v-bind:current-exercise-name=\"currentExerciseName\""
+"                                v-bind:show-guide=\"showGuide\""
+"                                v-bind:guides=\"guides\""
+"                                v-bind:current-exercise-guide=\"currentExerciseGuide\">"
+"        </recent-workouts-panel>"
+""
+""
+"        <br /><br />"
+"        <div style=\"background-color: #eef; display: inline-block\">"
+"            <div style=\"background-color: #dde; border-bottom: solid 1px #ccd; font-weight: bold; padding: 1px 5px\">"
+"                ☁ Cloud Backup - Dropbox"
+"            </div>"
+"            <div style=\"padding: 5px\">"
+"                <div v-show=\"!dropboxLastSyncTimestamp\">"
+"                    Dropbox <a target=\"_blank\" href=\"https://dropbox.github.io/dropbox-api-v2-explorer/#files_list_folder\">access token</a>"
+"                    <input type=\"text\" v-model=\"dropboxAccessToken\" v-bind:disabled=\"dropboxSyncInProgress\" />"
+"                </div>"
+"                <!-- Filename <input type=\"text\" v-model=\"dropboxFilename\" readonly=\"readonly\" />"
+"                <br /> -->"
+"                <button v-show=\"!dropboxLastSyncTimestamp && !!dropboxAccessToken\""
+"                        v-bind:disabled=\"dropboxSyncInProgress\""
+"                        v-on:click=\"dropboxSyncStage1\">Connect to Dropbox</button>"
+"                <img v-show=\"dropboxSyncInProgress\" src=\"https://cdnjs.cloudflare.com/ajax/libs/timelinejs/2.25/css/loading.gif\" />"
+"                <span v-show=\"!!dropboxLastSyncTimestamp && !dropboxSyncInProgress\">"
+"                    Last sync at {{ dropboxLastSyncTimestamp | formatDate }}"
+"                </span>"
+"            </div>"
+"        </div>"
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
        return {
            curPageIdx: 0,
            exercises: !localStorage["currentWorkout"] ? _newWorkout() : JSON.parse(localStorage["currentWorkout"]),
            recentWorkouts: !localStorage["recentWorkouts"] ? [] : JSON.parse(localStorage["recentWorkouts"]),
            outputText: '',
            emailTo: localStorage['emailTo'],
            dropboxFilename: "json/workouts.json",
            dropboxAccessToken: localStorage["dropboxAccessToken"] || "",
            dropboxSyncInProgress: false,
            dropboxLastSyncTimestamp: null,
            show1RM: true,
            showGuide: true,
            showVolume: false,
            oneRmFormula: 'Brzycki/Epley',
            showRmTable: false,
            workoutDate: "",
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
                '': [],
                '12-15': generateGuide(0.35, 3, 0.65, 4),
                '8-10': generateGuide(0.35, 3, 0.75, 4),
                '5-7': generateGuide(0.35, 4, 0.85, 4),
                'Deload': [0.35, 0.50, 0.50, 0.50],
                'old': [0.45, 0.5, 0.55, 0.62, 0.68, 0.76, 0.84, 0.84, 0.84]
            }
        }
    },
    methods: {
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
                this.dropboxSyncStage1();
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
            localStorage["currentWorkout"] = JSON.stringify(this.exercises);
            this.outputText = output;
            this.workoutDate = moment().format("YYYY-MM-DD");
        },
        copyWorkoutToClipboard: function () {
            var text = this.outputText;
            navigator.clipboard.writeText(text).then(function () {
            }, function () {
                alert("failed to copy");
            });
        },
        saveCurrentWorkoutToHistory: function () {
            var idSeed = Math.round(new Date().getTime() / 1000);
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
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts);
        },
        dropboxSyncStage1: function () {
            if (!this.dropboxAccessToken) return;
            this.dropboxSyncInProgress = true;
            var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
            var self = this;
            dbx.filesDownload({ path: '/' + this.dropboxFilename })
                .then(function (data) {
                    var reader = new FileReader();
                    reader.addEventListener("loadend", function () {
                        var obj = JSON.parse(reader.result);
                        self.dropboxSyncStage2(obj);
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
            var dropLookup = {}; 
            for (var i = 0; i < dropboxData.length; i++){
                dropLookup[dropboxData[i].id] = i;
            }
            for (var i = 0; i < this.recentWorkouts.length; i++) {
                var id = this.recentWorkouts[i].id;
                if (id != null) {
                    if (!dropLookup.hasOwnProperty(id)) {
                        dropboxData.push(this.recentWorkouts[i]);
                    } else {
                        if (this.recentWorkouts[i].name == "DELETE") {
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
            this.recentWorkouts = dropboxData;
            localStorage["recentWorkouts"] = JSON.stringify(this.recentWorkouts);
            this.dropboxSyncStage3();
        },
        dropboxSyncStage3: function () {
            if (!this.dropboxAccessToken ) return;
            var dbx = new Dropbox.Dropbox({ accessToken: this.dropboxAccessToken });
            var self = this;
            dbx.filesUpload({ 
                    path: '/' + this.dropboxFilename, 
                    contents: JSON.stringify(this.recentWorkouts, null, 2),
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
    },
    created: function () { 
        this.updateOutputText();
        this.dropboxSyncStage1();
    }
});
