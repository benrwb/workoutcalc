const app = Vue.createApp();

const nextTick = Vue.nextTick;
const ref = Vue.ref;
const watch = Vue.watch;
const computed = Vue.computed;
const reactive = Vue.reactive;
const onMounted = Vue.onMounted;
const onBeforeUnmount = Vue.onBeforeUnmount;
const defineComponent = Vue.defineComponent;
const toRef = Vue.toRef;
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
app.component('exercise-container', {
    template: "    <div style=\"display: inline-block; border-bottom: solid 2px #ddd\"\n"
+"         v-on:click=\"divClicked\">\n"
+"         \n"
+"        <div style=\"margin-top: 15px; margin-bottom: 2px; font-weight: bold\">\n"
+"            Exercise\n"
+"            <input type=\"text\" v-model=\"exercise.number\" style=\"width: 30px; font-weight: bold\" />:\n"
+"            <input type=\"text\" v-model=\"exercise.name\"   style=\"width: 225px\" \n"
+"                    list=\"exercise-names\" autocapitalize=\"off\" />\n"
+"        </div>\n"
+"\n"
+"        <div style=\"margin-bottom: 15px; font-size: 14px\">\n"
+"            <!-- Guide -->\n"
+"            <span>\n"
+"                <label style=\"width: 120px; display: inline-block; text-align: right;\">Guide:&nbsp;</label>\n"
+"                <select v-model=\"exercise.guideType\">\n"
+"                        <option v-for=\"guide in guides\"\n"
+"                                v-bind:key=\"guide.name\"\n"
+"                                v-bind:value=\"guide.name\"\n"
+"                                v-bind:style=\"{ 'color': guide.weightType == '1RM' ? 'dodgerblue' : '' }\">\n"
+"                            {{ guide.name + (isDigit(guide.name[0]) ? \" reps\" : \"\") }}\n"
+"                        </option>\n"
+"                </select>\n"
+"            </span>\n"
+"\n"
+"            <!-- Reference -->\n"
+"            <span v-if=\"false\"><!-- v-if=\"currentExerciseGuide.weightType\" -->\n"
+"\n"
+"                <template v-if=\"currentExerciseGuide.weightType == 'WORK'\">\n"
+"                    <label style=\"margin-left: 20px\">Work weight:\n"
+"                    </label>\n"
+"                    <span v-if=\"unroundedWorkWeight\"\n"
+"                          style=\"position: absolute; margin-top: 30px; width: 69px; text-align: right; color: pink\">\n"
+"                        {{ unroundedWorkWeight.toFixed(2) }}\n"
+"                    </span>\n"
+"                    <number-input v-model=\"roundedWorkWeight\" style=\"width: 65px\" class=\"verdana\"\n"
+"                                  v-bind:class=\"{ 'missing': enterWeightMessage }\" /> kg\n"
+"                </template>\n"
+"\n"
+"                <template v-if=\"currentExerciseGuide.weightType == '1RM'\">\n"
+"                    <label style=\"margin-left: 20px\">1RM: \n"
+"                    </label>\n"
+"                    <number-input v-model=\"exercise.ref1RM\" style=\"width: 65px\" class=\"verdana\"\n"
+"                                  v-bind:class=\"{ 'missing': enterWeightMessage }\" /> kg\n"
+"                </template>\n"
+"\n"
+"                <!-- <button style=\"padding: 3px 5px\"\n"
+"                        v-on:mousedown.prevent=\"guessWeight\"\n"
+"                        v-on:contextmenu.prevent\n"
+"                        >Guess</button> -->\n"
+"                        <!-- hidden feature: different mouse button = different target\n"
+"                                             * left = average of last 10\n"
+"                                             * middle = midpoint between average and max\n"
+"                                             * right = max of last 10 -->\n"
+"                <span v-if=\"currentExerciseGuide.weightType == 'WORK' && exercise.ref1RM\"\n"
+"                      style=\"color: pink\"> 1RM = {{ exercise.ref1RM.toFixed(1) }}</span>\n"
+"            </span>\n"
+"\n"
+"            <label style=\"margin-left: 20px\">Goal: </label>\n"
+"\n"
+"            <!-- Note that `goal` is saved into `exercise`, \n"
+"                 which means that it will persist between page reloads.\n"
+"                 (because of workout-calc/saveCurrentWorkoutToLocalStorage)\n"
+"                 It *won't* however be saved to workouts.json,\n"
+"                 because it's not listed in workout-calc/saveCurrentWorkoutToHistory() -->\n"
+"            <input type=\"text\" size=\"10\" v-model=\"exercise.goal\" />\n"
+"        </div>\n"
+"\n"
+"        <div v-if=\"lastWeeksComment\"\n"
+"                style=\"margin: 20px 0; font-size: 11px; color: #888\"> \n"
+"                🗨 Last week's comment: \n"
+"                <input type=\"text\" readonly=\"true\" v-bind:value=\"lastWeeksComment\"\n"
+"                    class=\"lastweekscomment\" />\n"
+"                <button v-bind:disabled=\"nextWeight == null\"\n"
+"                        style=\"margin-left: 5px\"\n"
+"                        v-on:click=\"getNextWeight\">Apply</button>\n"
+"        </div>\n"
+"\n"
+"        <div v-if=\"enterWeightMessage\"\n"
+"                style=\"background-color: pink; padding: 10px 20px; color: crimson; display: inline-block; border-radius: 5px; margin-left: 88px; margin-bottom: 20px\">\n"
+"            {{ enterWeightMessage }}\n"
+"        </div>\n"
+"\n"
+"        <div v-show=\"!enterWeightMessage\" >\n"
+"            <table class=\"maintable\">\n"
+"                <thead>\n"
+"                    <tr>\n"
+"                        <th v-if=\"currentExerciseGuide.weightType == '1RM'\" class=\"smallgray\">%1RM</th>\n"
+"                        <th>Set</th>\n"
+"                        <!-- <th v-if=\"show1RM && showGuide\">Guide</th> -->\n"
+"                        <th>Weight</th>\n"
+"                        <th>Reps</th>\n"
+"                        <th>RIR</th>\n"
+"                        <th>Rest</th>\n"
+"                        <th class=\"smallgray\" style=\"min-width: 45px\">\n"
+"                            <!-- {{ showRI ? \"%RI\" : \"Est 1RM\" }} -->\n"
+"                            Est 1RM\n"
+"                        </th>\n"
+"                        <th v-if=\"showVolume\" class=\"smallgray\">Volume</th>\n"
+"                    </tr>\n"
+"                </thead>\n"
+"                <tbody>\n"
+"                    <grid-row v-for=\"(set, setIdx) in exercise.sets\"\n"
+"                        v-bind:set=\"set\" \n"
+"                        v-bind:set-idx=\"setIdx\"\n"
+"                        v-bind:show-volume=\"showVolume\"\n"
+"                        v-bind:reference-weight=\"referenceWeightForGridRow\"\n"
+"                        v-bind:ref1-r-m=\"exercise.ref1RM\"\n"
+"                        v-bind:read-only=\"false\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:guide-name=\"exercise.guideType\"\n"
+"                        v-bind:guide=\"currentExerciseGuide\"\n"
+"                        v-bind:exercise=\"exercise\"\n"
+"                        v-bind:rest-timer=\"restTimers.length <= setIdx ? 0 : restTimers[setIdx]\"\n"
+"                        v-on:reps-entered=\"setRestTimeCurrentSet(setIdx + 1)\"\n"
+"                    ><!-- v-model:show-r-i=\"showRI\" -->\n"
+"                    </grid-row>\n"
+"                    <tr>\n"
+"                        <!-- <td v-if=\"show1RM\"></td> -->\n"
+"                        <td><button v-on:click=\"addSet\">+</button></td>\n"
+"                        <td colspan=\"5\"\n"
+"                            class=\"verdana\"\n"
+"                            style=\"padding-top: 3px; text-align: left\">\n"
+"\n"
+"                            <button v-on:click=\"showNotes = !showNotes\"\n"
+"                                    style=\"margin-right: 5px\">📝</button>\n"
+"\n"
+"                            <span v-show=\"showNotes\">\n"
+"                                <!-- <span style=\"font-size: smaller\">Comment:</span> -->\n"
+"                                <input type=\"text\" v-model=\"exercise.comments\" \n"
+"                                       size=\"30\" style=\"font-size: smaller; margin-right: 10px\"\n"
+"                                       placeholder=\"Comment, e.g. &quot;next: weight x reps&quot;\" />\n"
+"\n"
+"                                <span style=\"font-size: smaller\">Tag:</span>\n"
+"                                <!-- (this helps put the workout \"headlines\" in context) -->\n"
+"                                <select v-model=\"exercise.etag\"\n"
+"                                        style=\"vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px\">\n"
+"                                    <option v-bind:value=\"0\"></option>\n"
+"                                    <option v-for=\"(value, key) in tagList\"\n"
+"                                            v-bind:value=\"key\"\n"
+"                                    >{{ value.emoji }} - {{ value.description }}</option>\n"
+"                                </select>\n"
+"                            </span>\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                    <tr v-if=\"showNotes\">\n"
+"                        <td></td>\n"
+"                        <td colspan=\"5\"\n"
+"                            style=\"text-align: left; padding-left: 40px\">\n"
+"                            <span v-if=\"showVolume\"\n"
+"                                class=\"smallgray\"\n"
+"                                style=\"padding-right: 10px\">\n"
+"                                    Total volume: {{ totalVolume }}\n"
+"                            </span>\n"
+"                            <!-- Headline -->\n"
+"                            <!-- <span v-show=\"showNotes\"\n"
+"                                style=\"padding: 0 5px; font-size: 11px\"\n"
+"                                v-bind:style=\"{ 'opacity': currentExerciseHeadline.numSets <= 1 ? '0.5' : null,\n"
+"                                            'font-weight': currentExerciseHeadline.numSets >= 3 ? 'bold' : null }\"\n"
+"                                v-bind:class=\"'weekreps' + currentExerciseHeadline.reps\"\n"
+"                                >Headline: {{ currentExerciseHeadline.headline }}\n"
+"                            </span> -->\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                </tbody>\n"
+"            </table>\n"
+"            \n"
+"        </div>\n"
+"    </div>\n",
        props: {
            exercise: { 
                type: Object,
                required: true 
            },
            recentWorkouts: Array,
            showVolume: Boolean,
            guides: Array,
            oneRmFormula: String,
            tagList: Object
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
                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(props.exercise);
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
            const enterWeightMessage = computed(() =>  {
                return ""; // TODO maybe base this on "Goal" instead?
                if (totalVolume.value == 0) {
                    if (currentExerciseGuide.value.weightType == "1RM"
                        && !props.exercise.ref1RM) {
                        return "Enter 1RM";
                    }
                    else if (currentExerciseGuide.value.weightType == "WORK"
                        && !roundedWorkWeight.value) {
                        return "Enter a work weight";
                    }
                }
                return ""; // false when evaluated as a boolean (falsy)
            });
            function isDigit (str) {
                if (!str) return false;
                return str[0] >= '0' && str[0] <= '9';
            }
            const totalVolume = computed(() => {
                return props.exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0);
            });
            function divClicked() {
                context.emit("select-exercise"); // handled by <workout-calc> (parent component)
                if (currentExerciseGuide.value.weightType == "1RM") {
                    globalState.calc1RM = props.exercise.ref1RM;
                    globalState.calcWeight = convert1RMtoWorkSetWeight(props.exercise.ref1RM);
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    globalState.calc1RM = props.exercise.ref1RM;
                    globalState.calcWeight = roundedWorkWeight.value;
                }
                else {
                    globalState.calcWeight = 0;
                    globalState.calc1RM = 0;
                }
            }
            watch(() => props.exercise.guideType, () => {
                if (totalVolume.value == 0) {
                    let guide = props.guides.find(g => g.name == props.exercise.guideType);
                    if (guide) {
                        props.exercise.sets = _newExercise(props.exercise.number, guide.warmUp.length, guide.workSets.length).sets;
                    }
                }
            });
            let referenceTime = 0; // the time the previous set was completed
            let currentSet = 0; // current index into `restTimers` array, updated when <grid-row> emits `reps-entered` event
            function setRestTimeCurrentSet(setIdx) {
                currentSet = setIdx;
                referenceTime = new Date().getTime();
            }
            const restTimers = ref([]); // array of rest times (in seconds) for each set
            function everySecond() {
                while(restTimers.value.length <= currentSet)
                    restTimers.value.push(0); // add extra items to array as required
                restTimers.value[currentSet] = (new Date().getTime() - referenceTime) / 1000; // calculate difference between `referenceTime` and current time
            }
            let timerId = 0;
            onMounted(() => {
                timerId = setInterval(everySecond, 1000);
            });
            onBeforeUnmount(() => {
                clearInterval(timerId);
            });
            watch(() => props.exercise, () => {
                restTimers.value = [];
                currentSet = 0;
                unroundedWorkWeight.value = 0;
                roundedWorkWeight.value = 0;
                showNotes.value = false;
            });
            const unroundedWorkWeight = ref(0);
            const roundedWorkWeight = ref(0);
            function convert1RMtoWorkSetWeight(averageMax1RM) {
                let percentage = currentExerciseGuide.value.workSets[0]; // e.g. 0.60 = 60% of 1RM
                let unrounded = averageMax1RM * percentage;
                let rounded = _roundGuideWeight(unrounded, props.exercise.name); // rounded to nearest 2 or 2.5
                return rounded;
            }
            function getNextWeight() {
                if (nextWeight.value) {
                    roundedWorkWeight.value = globalState.calcWeight = nextWeight.value;
                    props.exercise.goal = lastWeeksComment.value.replace("next:", "").trim();
                }
            }
            const nextWeight = computed(() => {
                if (!lastWeeksComment.value) return null;
                const match = lastWeeksComment.value.match(/next:\s*([\d.]+)\s*x/);
                return match ? parseFloat(match[1]) : null;
            });
            function guessWeight(event) {
                let prevMaxes = []; // maximum 1RMs
                let count = 0;
                unroundedWorkWeight.value = 0;
                roundedWorkWeight.value = 0;
                for (const exercise of props.recentWorkouts) {
                    if (exercise.name == props.exercise.name) {
                        prevMaxes.push(_calculateMax1RM(exercise.sets, props.oneRmFormula));
                        count++;
                    }
                    if (count == 10) break; // look at previous 10 attempts at this exercise only
                }
                let oneRM = props.exercise.ref1RM = globalState.calc1RM = Math.max(...prevMaxes);
                let button = event.button;
                let relative1RM = 
                    button == 0 ? oneRM * 0.8625 // Moderate+ = 86.25% of 1RM (for most work sets)
                    : button == 1 && event.shiftKey ? oneRM * 0.9313 // Half way between left and right buttons
                    : button == 1 ? oneRM * 0.775 // Deload = 77.5% of 1RM
                    : oneRM * 1; // Heavy = 100% of 1RM (for 1RM tests)
                relative1RM = Math.round(relative1RM * 10) / 10; // round to nearest 1 d.p.
                if (currentExerciseGuide.value.weightType == "1RM") {
                    globalState.calcWeight = convert1RMtoWorkSetWeight(oneRM);
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    let guideParts = props.exercise.guideType.split('-');
                    if (guideParts.length == 2) {
                        let guideLowReps = Number(guideParts[0]); // min (e.g. "8-10" -> 8)
                        unroundedWorkWeight.value = _oneRmToRepsWeight(relative1RM, guideLowReps, props.oneRmFormula); // precise weight (not rounded)
                        roundedWorkWeight.value = globalState.calcWeight = _roundGuideWeight(unroundedWorkWeight.value, props.exercise.name); // rounded to nearest 2 or 2.5
                    }
                }
            }
            const referenceWeightForGridRow = computed(() => {
                if (currentExerciseGuide.value.weightType == "1RM") {
                    return props.exercise.ref1RM;
                }
                else if (currentExerciseGuide.value.weightType == "WORK") {
                    if (props.exercise.goal) {
                        let xpos = props.exercise.goal.indexOf("x");
                        let strWeight = (xpos == -1)
                            ? props.exercise.goal.trim() // just weight
                            : props.exercise.goal.substring(0, xpos).trim(); // weight and reps, remove reps
                        return Number(strWeight); // grid-row `referenceWeight` prop is of type Number
                    } else {
                        return roundedWorkWeight.value;
                    }
                }
            });
            const showNotes = ref(!!props.exercise.comments);
            return { lastWeeksComment, addSet, currentExerciseHeadline, currentExerciseGuide, 
                enterWeightMessage, isDigit, totalVolume, divClicked, 
                restTimers, setRestTimeCurrentSet, guessWeight, unroundedWorkWeight, roundedWorkWeight,
                showNotes, referenceWeightForGridRow, /*showRI*/ 
                nextWeight, getNextWeight
            };
        }
    });
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .maintable {
        border-collapse: collapse;
        margin: 5px 0px;
    }
    .maintable td {
        text-align: right;
        border: none;
        padding-right: 5px;
    }
    .maintable td.border {
        border: solid 1px silver;
        padding-right: 0px;
    }
    .maintable td.score {
        color: gray;
        padding-right: 10px;
    }
    .maintable .number-input {
        width: 65px;
        border: none;
        padding-right: 18px; /* leave space for ✨ emoji */
    }

    input.missing {
        background-color: #fee;
    }

    input.lastweekscomment {
        background-color: #ddd; 
        color: #555; 
        width: 200px; 
        font-size: 11px; 
        border-color: #ddd; 
        border-radius: 4px;
        padding: 4px 6px;
    }

    /* .showonhover {
        opacity: 0;
    }
    .showonhover:hover {
        opacity: 1;
    } */`;
                    document.head.appendChild(componentStyles);
                }
const globalState = reactive({
    calc1RM: 0, // "One rep max" value for "Calculate weight/% from one rep max"
    calcWeight: 0, // "Weight" value for "Calculate one rep max from weight"
    includeRirInEst1RM: true // whether to include reps in reserve (RIR) when calculating estimated 1RM
});

app.component('grid-row', {
    template: "    <tr>\n"
+"        <!-- === %1RM === -->\n"
+"        <td v-if=\"guide.weightType == '1RM'\" \n"
+"            class=\"smallgray verdana\"\n"
+"            v-bind:title=\"oneRepMaxTooltip\"\n"
+"            v-bind:class=\"{ 'intensity60': oneRepMaxPercentage >= 55.0 && oneRepMaxPercentage < 70.0,\n"
+"                            'intensity70': oneRepMaxPercentage >= 70.0 && oneRepMaxPercentage < 80.0,\n"
+"                            'intensity80': oneRepMaxPercentage >= 80.0 }\">\n"
+"            {{ formattedOneRepMaxPercentage }}\n"
+"        </td>\n"
+"\n"
+"        <!-- === Set number === -->\n"
+"        <td v-if=\"!readOnly\"\n"
+"            v-bind:class=\"!set.type ? '' : 'weekreps' + guideHighReps + (set.type == 'WU' ? '-faded' : '')\">\n"
+"            <!-- {{ setIdx + 1 }} -->\n"
+"            <select v-model=\"set.type\"\n"
+"                    style=\"width: 37px; font-weight: bold\">\n"
+"                <option></option>\n"
+"                <option value=\"WU\">W - Warm up</option>\n"
+"                <option value=\"WK\">{{ potentialSetNumber }} - Work set</option>\n"
+"            </select>\n"
+"        </td>\n"
+"\n"
+"        <!-- === Weight === -->\n"
+"        <td class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.weight\" step=\"any\"\n"
+"                          v-bind:disabled=\"!set.type\"\n"
+"                          v-bind:placeholder=\"guideWeightPlaceholder\" />\n"
+"            <template     v-if=\"readOnly\"      >{{ set.weight }}</template>\n"
+"        </td>\n"
+"\n"
+"        <!-- === Reps === -->\n"
+"        <td class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.reps\" \n"
+"                          v-bind:disabled=\"!set.type\"\n"
+"                          v-bind:class=\"set.type == 'WU' ? null : 'weekreps' + set.reps\"\n"
+"                          v-bind:placeholder=\"guideRepsPlaceholder\"\n"
+"                          v-on:input=\"$emit('reps-entered')\" />\n"
+"            <template     v-if=\"readOnly\"      >{{ set.reps }}</template>\n"
+"        </td>\n"
+"\n"
+"        <!-- === RIR === -->\n"
+"        <td v-if=\"!hideRirColumn\"\n"
+"            class=\"border\"\n"
+"            v-bind:style=\"{ 'background-color': set.type == 'WU' || (guide && guide.name == '') ? '#eee' : '' }\">\n"
+"            <template v-if=\"!readOnly\">\n"
+"                <select class=\"rir-select\" v-model=\"set.rir\">\n"
+"                    <option></option>\n"
+"                    <option v-bind:value=\"-1\">-1&nbsp;&nbsp;&nbsp;&nbsp;Failed mid-rep</option>\n"
+"                    <option v-bind:value=\"0\">&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;Couldn't do any more (AMRAP)</option>\n"
+"                    <option v-bind:value=\"1\">&nbsp;1&nbsp;&nbsp;&nbsp;&nbsp;Could do 1 more</option>\n"
+"                    <option v-bind:value=\"2\">&nbsp;2&nbsp;&nbsp;&nbsp;&nbsp;Could do a couple more</option>\n"
+"                    <option v-bind:value=\"3\">&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;Could do a few more</option>\n"
+"                    <option v-bind:value=\"4\">&nbsp;4&nbsp;&nbsp;&nbsp;&nbsp;Could do a few more</option>\n"
+"                    <option v-bind:value=\"5\">&nbsp;5&nbsp;&nbsp;&nbsp;&nbsp;Could do several more</option>\n"
+"                    <option v-bind:value=\"10\">10&nbsp;&nbsp;&nbsp;&nbsp;Could do many more</option>\n"
+"                </select>\n"
+"            </template>\n"
+"            <template v-else>\n"
+"                {{ set.rir }}\n"
+"            </template>\n"
+"        </td>\n"
+"\n"
+"        <!-- === Rest === -->\n"
+"        <td v-show=\"setIdx != 0\" class=\"border\">\n"
+"            <number-input v-if=\"!readOnly\" v-model=\"set.gap\"\n"
+"                          v-bind:disabled=\"!set.type\"\n"
+"                          v-bind:placeholder=\"formatTime(restTimer)\" />\n"
+"                          <!-- v-bind:class=\"'gap' + Math.min(set.gap, 6)\"  -->\n"
+"            <template      v-if=\"readOnly\"      >{{ set.gap }}</template>\n"
+"        </td>\n"
+"        <td v-show=\"setIdx == 0\"><!-- padding --></td>\n"
+"\n"
+"        <!-- === Est 1RM === -->\n"
+"        <td class=\"smallgray verdana\">\n"
+"            <!-- v-on:mousemove=\"$emit('update:showRI', true)\" \n"
+"                 v-on:mouseout=\"$emit('update:showRI', false)\" \n"
+"            <template v-if=\"!showRI\"> -->\n"
+"                {{ formattedSet1RM }}<!-- ^^^ Sep'24 changed `roundedOneRepMax` to `oneRepMax` --><!-- \n"
+"            </template>\n"
+"            <template v-if=\"(showRI || (readOnly && exercise.id > 1730554466)) && relativeIntensity\">\n"
+"                {{ readOnly ? \" / \" : \"\" }}\n"
+"                {{ relativeIntensity.toFixed(0) }}%\n"
+"            </template> -->\n"
+"        </td>\n"
+"\n"
+"        <!-- === Volume === -->\n"
+"        <td v-if=\"showVolume\" class=\"smallgray verdana\">\n"
+"            {{ formattedVolume }}\n"
+"        </td>\n"
+"\n"
+"        <!-- === Increase/decrease message === -->\n"
+"        <!-- <td v-if=\"guide.weightType == 'WORK' && !readOnly\"\n"
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
+"                👇 Decrease weight -->\n"
+"                <!-- Help link: also used in recent-workouts-panel.vue -->\n"
+"                <!-- <a href=\"https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range\"\n"
+"                   class=\"emoji\" target=\"_blank\">ℹ</a>\n"
+"            </template>\n"
+"        </td> -->\n"
+"    </tr>\n",
    props: {
        "set": Object,
        "setIdx": Number,
        "showVolume": Boolean,
        "referenceWeight": Number, // for "1RM" guides this will be 1RM,
        "ref1RM": Number,
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "guide": Object,
        "exercise": Object,
        "restTimer": Number,
        "hideRirColumn": Boolean
    },
    setup: function (props) {
        const guidePercentages = computed(() => {
            return _getGuidePercentages(props.exercise.number, props.guide);
        });
        function guideWeight(setNumber) {
            let percentage = (setNumber >= guidePercentages.value.length) ? 0 // out of range
                : guidePercentages.value[setNumber];
            if (!props.referenceWeight || !percentage) return 0;
            return props.referenceWeight * percentage;
        }
        function roundGuideWeight(guideWeight) {
            if (!props.referenceWeight) return 0;
            if (!guideWeight) return 0;
            if (guidePercentages.value[props.setIdx] == 1.00) // 100%
                return guideWeight; // don't round
            else 
                return _roundGuideWeight(guideWeight, props.exercise.name); // round to nearest 2 or 2.5
        }
        const guideWeightPlaceholder = computed(() => { // used as placeholder text for "weight" input box
            return !props.guide.weightType ? null : roundGuideWeight(guideWeight(props.setIdx)) || '';
        });
        const workSetWeight = computed(() => {
            if (!props.referenceWeight || guidePercentages.value.length == 0)
                return 0;
            let guideMaxPercentage = guidePercentages.value[guidePercentages.value.length - 1];
            return roundGuideWeight(props.referenceWeight * guideMaxPercentage);
        });
        const guideRepsPlaceholder = computed(() => { // used as placeholder text for "reps" input box
            var setWeight = props.set.weight;
            if (!setWeight) {
                setWeight = roundGuideWeight(guideWeight(props.setIdx));
            }
            if (!props.referenceWeight || !props.oneRmFormula || !setWeight) return "";
            var reps = Math.round((1 - (setWeight / workSetWeight.value)) * 19); // see "OneDrive\Fitness\Warm up calculations.xlsx"
            return reps <= 0 ? "" : reps;
        });
        function formatTime(seconds) {
            if (!seconds) return "";
            return moment.utc(seconds*1000).format("mm:ss");
        }
        const potentialSetNumber = computed(() => {
            let thisSetIdx = props.exercise.sets.indexOf(props.set);
            if (thisSetIdx == -1) // unlikely, but avoids possible infinite loop below
                return "?";
            let number = 1;
            for (let i = 0; i < thisSetIdx; i++) {
                if (props.exercise.sets[i].type == "WK")
                    number++;
            }
            return number.toString();
        });
        const set1RM = computed(() => {
            return _calculateOneRepMax(props.set.weight, props.set.reps, props.oneRmFormula, props.set.rir);
        });
        const formattedSet1RM = computed(() => {
            if (set1RM.value == -1) return ""; // no data
            if (set1RM.value == -2) return "N/A"; // >12 reps
            return set1RM.value.toFixed(1) + "kg"; // .toFixed(1) adds ".0" for whole numbers 
        });
        const oneRepMaxPercentage = computed(() => {
            if (!props.set.weight || !props.ref1RM) return -1; // no data
            return props.set.weight * 100 / props.ref1RM;
        });
        const formattedOneRepMaxPercentage = computed(() => {
            if (oneRepMaxPercentage.value == -1) return ""; // no data
            return Math.round(oneRepMaxPercentage.value) + "%"; 
        });
        const oneRepMaxTooltip = computed(() => {
            if (oneRepMaxPercentage.value == -1) return null; // don't show a tooltip
            return parseFloat(oneRepMaxPercentage.value.toFixed(1)) + "%";
        });
        const formattedVolume = computed(() => { 
            if (!props.set.weight || !props.set.reps) return ""; // no data
            var volume = _volumeForSet(props.set);
            return volume == 0 ? "" : volume.toString();
        });
        const guideHighReps = computed(() => { 
            if (!props.guide.name) return "";
            var guideParts = props.guide.name.split('-');
            if (guideParts.length != 2) return "";
            return Number(guideParts[1]);
        });
        return { oneRepMaxTooltip, oneRepMaxPercentage, formattedOneRepMaxPercentage,
            guideWeightPlaceholder, guideRepsPlaceholder, 
            guideHighReps, potentialSetNumber, formatTime,
            formattedSet1RM, formattedVolume };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .intensity60 {
        background-color: #fff1ab;
    }
    .intensity70 {
        background-color: orange;
        color: white !important;
    }
    .intensity80 {
        background-color: purple;
        color: white !important;
    }

    .rir-select {
        width: 50px;
        border: none;
        padding-left: 9px;
        background-color: transparent;
    }
`;
                    document.head.appendChild(componentStyles);
                }
app.component('guide-info-table', {
    template: "    <div v-if=\"exercisePreset\"\n"
+"         style=\"display: inline-block; text-align: left; \n"
+"                background-color: rgb(227 227 227); padding: 5px 5px 0 5px\">\n"
+"\n"
+"        <div style=\"padding-bottom: 5px; font-weight: bold\">\n"
+"            Guide:&nbsp;\n"
+"            <span style=\"color: darkgray; float: right\">{{ exercisePreset }}</span>\n"
+"        </div>\n"
+"\n"
+"        <table>\n"
+"            <tbody>\n"
+"                <tr v-for=\"item in guideInformationTable\">\n"
+"                    <td :style=\"{ 'color': item.color }\">{{ item.text }} &nbsp;</td>\n"
+"                </tr>\n"
+"            </tbody>\n"
+"        </table>\n"
+"\n"
+"\n"
+"        <!-- <table>\n"
+"            <tr> -->\n"
+"                <!-- <th>Main</th> -->\n"
+"                <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->\n"
+"                <!-- <th>Acces.</th> -->\n"
+"            <!-- </tr>\n"
+"            <tr v-for=\"item in guideInformationTable\">\n"
+"                <td :style=\"{ 'color': item.mainColor }\">{{ item.mainText }} &nbsp;</td> -->\n"
+"                <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->\n"
+"                <!-- <td :style=\"{ 'color': item.acesColor }\">{{ item.acesText }}</td> -->\n"
+"            <!-- </tr>\n"
+"        </table> -->\n"
+"\n"
+"        <!-- <table>\n"
+"        <tr>\n"
+"            <th colspan=\"2\">Main</th>\n"
+"            <th>Acces.</th>\n"
+"        </tr><tr>\n"
+"            <td :style=\"{ 'color': weekNumber <= 3 ? 'black' : 'silver' }\">Week 1-3:</td>\n"
+"            <td :style=\"{ 'color': weekNumber <= 3 ? 'black' : 'silver' }\">12-14&nbsp;&nbsp;</td>\n"
+"            <td :style=\"{ 'color': weekNumber <= 5 ? 'black' : 'silver' }\">Week 1-5:</td>\n"
+"            <td :style=\"{ 'color': weekNumber <= 5 ? 'black' : 'silver' }\">12-14</td>\n"
+"        </tr><tr>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }\">Week 4-6:</td>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }\">9-11</td>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }\">Week 6+:</td>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }\">9-11</td>\n"
+"        </tr><tr>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 7 ? 'black' : 'silver' }\">Week 7+:</td>\n"
+"            <td v-bind:style=\"{ 'color': weekNumber >= 7 ? 'black' : 'silver' }\">6-8</td>\n"
+"        </tr>\n"
+"        </table> -->\n"
+"        <!-- <span v-bind:style=\"{ 'color': weekNumber >= 1 && weekNumber <= 3? 'black' : 'silver' }\">\n"
+"            First few (3?) weeks:<br />12-14 range<br />\n"
+"        </span>\n"
+"        <span v-bind:style=\"{ 'color': weekNumber >= 4 ? 'black' : 'silver' }\">\n"
+"            Remaining weeks:<br />6-8 range, working up in weight<br />\n"
+"        </span> -->\n"
+"    </div>\n",
    props: {
        weekNumber: Number,
        workoutPreset: String, // e.g. "tue - push"
        presets: Array,
        currentExerciseName: String
    },
    setup(props) {
        const exercisePreset = computed(() => {
            let preset = props.presets.find(z => z.name == props.workoutPreset);
            if (preset) {
                let ex = preset.exercises.find(z => z.name == props.currentExerciseName);
                if (ex) {
                    return ex.guide;
                }
            }
            return null;
        });
        const guideInformationTable = computed(() => {
            let wk = props.weekNumber;
            let guideWeeks = _getGuideWeeks(exercisePreset.value);
            return guideWeeks.map(z => ({
                text: "Week " + z.fromWeek
                        + (z.fromWeek == z.toWeek ? "" : (z.toWeek == 99 ? "+" : "-" + z.toWeek))
                        + ": " + z.guide,
                color: wk >= z.fromWeek && wk <= z.toWeek ? "black" : "silver"
            }));
        });
        return { guideInformationTable, exercisePreset };
    }
})
function _getGuides() {
    var guides = [];
    guides.push({
        name: "", // default (no guide)
        category: "",
        weightType: "",
        warmUp: [],
        workSets: [1, 1, 1] // default to 3 sets for exercises without a rep guide (used by _applyPreset)
    });
    guides.push({ name: "4-6", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.70, 0.85], workSets: [1,1,1] });
    guides.push({ name: "6-8", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.75], workSets: [1,1,1] });
    guides.push({ name: "8-10", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "8-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "10-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "12-15", category: "HIGH", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({
        name: "Deload",
        category: "LOW",
        weightType: "1RM",
        warmUp: [],
        workSets: [0.50, 0.50, 0.50] // 50% of 1RM
    });
    return guides;
}
function _getGuidePercentages (exerciseNumber, guide) {
    var percentages = [];
    var warmUp = exerciseNumber.startsWith("1");
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
function _useGuideParts(guideType) {
    return computed(() => {
        if (guideType.value && guideType.value.includes('-')) {
            let parts = guideType.value.split('-');
            if (parts.length == 2) {
                return {
                    guideLowReps: Number(parts[0]),
                    guideHighReps: Number(parts[1])
                };
            }
        }
        return {
            guideLowReps: 0,
            guideHighReps: 0
        }
    });
}

function _getHeadline(exercise) {
    let completedSets = exercise.sets.filter(set => _volumeForSet(set) > 0);
    let hasSetType = completedSets.filter(z => !!z.type).length > 0;
    return hasSetType ? getHeadlineFromWorkSets(completedSets)
                      : exercise.guideType ? getHeadlineFromGuide(exercise.guideType, completedSets)
                                           : getHeadlineWithoutGuide(completedSets);
}
function getHeadlineFromGuide(guideName, allSets) {
    if (!guideName) return [0, '', 0, 0];
    var guideParts = guideName.split('-');
    if (guideParts.length != 2) return [0, '', 0, 0];
    var guideLowReps = Number(guideParts[0]);
    var matchingSets = allSets.filter(set => set.reps >= guideLowReps);
    var maxWeight = matchingSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
    matchingSets = allSets.filter(set => set.weight == maxWeight);
    var reps = matchingSets.map(set => set.reps);
    return getHeadline_internal(maxWeight, reps);
}
function getHeadlineWithoutGuide(allSets) {
    var weights = allSets.map(set => set.weight);
    var mostFrequentWeight = weights.sort((a, b) =>
        weights.filter(v => v === a).length
        - weights.filter(v => v === b).length
     ).pop();
    var reps = allSets.filter(set => set.weight == mostFrequentWeight).map(set => set.reps);
    return getHeadline_internal(mostFrequentWeight, reps);
}
function getHeadlineFromWorkSets(allSets) {
    let workSets = allSets.filter(z => z.type == "WK");
    var maxWeight = workSets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
    var reps = workSets.filter(set => set.weight == maxWeight).map(set => set.reps);
    return getHeadline_internal(maxWeight, reps);
}
function getHeadline_internal(weight, reps) {
    reps.sort(function (a, b) { return a - b }).reverse() // sort in descending order (highest reps first) 
    reps = reps.slice(0, 3); // take top 3 items
    var maxReps = reps[0];
    var minReps = reps[reps.length - 1];
    let exactAverage = _arrayAverage(reps); // average including decimal
    let showTilde = exactAverage != maxReps;
    let roundedAverage = Math.round(exactAverage); // average rounded to nearest whole number
    let repsDisplayString = roundedAverage + (showTilde ? "~" : "");
    return [roundedAverage, repsDisplayString, reps.length, weight];
}

app.component('number-input', {
    template: "    <input class=\"number-input\"\n"
+"           type=\"text\"\n"
+"           v-model=\"textbox\"\n"
+"           inputmode=\"numeric\" />\n",
        props: {
            modelValue: Number // for use with v-model
        },
        setup: function (props, context) {
            const textbox = ref("");
            watch(() => props.modelValue, () => {
                if (props.modelValue == 0) 
                    textbox.value = "";
                else if (Number(props.modelValue) != Number(textbox.value))
                    textbox.value = props.modelValue.toString();
            }, { immediate: true });
            watch(textbox, (newValue, oldValue) => {
                var number = Number(newValue); // Note: "" will return 0; "." will return NaN
                if (isNaN(number)) {
                    textbox.value = oldValue;
                }
                else {
                    context.emit("update:modelValue", number)
                }
            });
            return { textbox };
        }
    });
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .number-input  {
        text-align: right;
    }`;
                    document.head.appendChild(componentStyles);
                }
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
function _applyPreset(preset, weekNumber, guides) {
    let exercises = [];
    preset.exercises.forEach(function (preset) {
        let guideType = preset.guide; // e.g. "MAIN"/"ACES" or a guide like "12-14"
        let guideWeeks = _getGuideWeeks(preset.guide);
        let currentWeek = guideWeeks.find(z => weekNumber >= z.fromWeek && weekNumber <= z.toWeek);
        if (currentWeek) {
            guideType = currentWeek.guide;
        }
        let exercise;
        let guide = guides.find(g => g.name == guideType);
        if (guide) {
            let warmUpSets = preset.number == "1" ? guide.warmUp.length : 0;
            exercise = _newExercise(preset.number, warmUpSets, guide.workSets.length);
        } else {
            exercise = _newExercise(preset.number, 0, 3);
        }
        exercise.name = preset.name;
        exercise.guideType = guideType;
        exercises.push(exercise);
    });
    return exercises;
}
function _getGuideWeeks(presetType) {
    if (presetType == "MAIN") { // Main lift, rep range depends on week
        return [
            { fromWeek: 1, toWeek: 2, guide: "12-14" },
            { fromWeek: 3, toWeek: 4, guide: "9-11" },
            { fromWeek: 5, toWeek: 6, guide: "6-8" },
            { fromWeek: 7, toWeek: 99, guide: "12-14" }
        ];
    }
    if (presetType == "ACES") { // Accessory lift, rep range depends on week
        return [
            { fromWeek: 1, toWeek: 3, guide: "12-14" },
            { fromWeek: 4, toWeek: 6, guide: "9-11" },
            { fromWeek: 7, toWeek: 99, guide: "12-14" }
        ]
    }
    if (presetType == "M129") { // 12- and 9- rep ranges; deload every 4 weeks (main)
        return [
            { fromWeek: 1, toWeek: 2, guide: "12-14" },
            { fromWeek: 3, toWeek: 4, guide: "9-11" },
            { fromWeek: 5, toWeek: 5, guide: "Deload" },
            { fromWeek: 6, toWeek: 7, guide: "12-14" },
            { fromWeek: 8, toWeek: 9, guide: "9-11" },
            { fromWeek: 10, toWeek: 99, guide: "Deload" },
        ]
    }
    if (presetType == "A129") { // 12- and 9- rep ranges; deload every 4 weeks (accessory)
        return [
            { fromWeek: 1, toWeek: 3, guide: "12-14" },
            { fromWeek: 4, toWeek: 4, guide: "9-11" },
            { fromWeek: 5, toWeek: 5, guide: "Deload" },
            { fromWeek: 6, toWeek: 8, guide: "12-14" },
            { fromWeek: 9, toWeek: 9, guide: "9-11" },
            { fromWeek: 10, toWeek: 99, guide: "Deload" },
        ]
    }
    return []; // unknown preset type
}

app.component('prev-table', {
    template: "    <div class=\"prev-container\">\n"
+"        \n"
+"        <h3 style=\"color: #ccc\">{{ currentExerciseName }}</h3>\n"
+"\n"
+"        <label>\n"
+"            <input type=\"checkbox\" v-model=\"colourRir\"> Colour RIR\n"
+"        </label>\n"
+"\n"
+"        <table border=\"1\" class=\"prev-table\">\n"
+"            <thead>\n"
+"                <tr>\n"
+"                    <th colspan=\"4\">Previous workouts</th>\n"
+"                </tr>\n"
+"                <tr>\n"
+"                    <th>Date</th>\n"
+"                    <th>Load</th>\n"
+"                    <th>Reps</th>\n"
+"                    <th>Volume</th>\n"
+"                </tr>\n"
+"            </thead>\n"
+"            <tbody>\n"
+"                <tr v-for=\"row in table\"\n"
+"                    v-on:mousemove=\"showTooltip(row.idx, $event)\" v-on:mouseout=\"hideTooltip\"\n"
+"                    v-bind:class=\"row.isDeload ? 'deload' : ''\">\n"
+"                    <td>{{ row.date }}<span class=\"ordinal\">{{ row.ordinal }}</span></td>\n"
+"                    <td>{{ row.load }}</td>\n"
+"                    <td>\n"
+"                        <span v-for=\"(rep, idx) in row.reps\"\n"
+"                              v-bind:class=\"[\n"
+"                                  colourRir && rep.rir != null && 'rir',\n"
+"                                  colourRir && 'rir' + rep.rir,\n"
+"                                  rep.isMaxWeight ? null : 'not-max'\n"
+"                              ]\"\n"
+"                            >{{ rep.reps }}{{ idx != row.reps.length - 1 && (!colourRir || rep.rir == null) ? ', ' : ''}}</span>\n"
+"                    </td>\n"
+"                    <td>{{ row.volume.toLocaleString() }}</td>\n"
+"                </tr>\n"
+"            </tbody>\n"
+"        </table>\n"
+"\n"
+"        <div style=\"color: #bbb\">Gray background = Deload week</div>\n"
+"\n"
+"    </div>\n",
    props: {
        recentWorkouts: Array,
        currentExerciseName: String
    },
    setup: function(props, context) {
        const table = computed(() => {
            let numberDone = 0;
            let data = [];
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != props.currentExerciseName) return;
                if (numberDone++ > 10) return;
                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
                let maxWeight = workSets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
                data.push({
                    idx: exerciseIdx, // needed for displaying tooltip
                    date: _formatDate(exercise.date, "MMM D"),
                    ordinal: _formatDate(exercise.date, "Do").replace(/\d+/g, ''), // remove digits from string, e.g. change "21st" to "st"
                    load: maxWeight,
                    reps: workSets.map(z => ({ 
                        reps: z.reps, 
                        isMaxWeight: z.weight == maxWeight, 
                        rir: z.rir })),
                    volume: volume,
                    isDeload: exercise.guideType == 'Deload'
                })
            });
            return data;
        });
        function showTooltip(recentWorkoutIdx, e) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }
        function hideTooltip() {
            context.emit("hide-tooltip");
        }
        const colourRir = ref(false);
        return { table, showTooltip, hideTooltip, colourRir };
    }
})
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .prev-container {
        font-size: smaller;
    }
    .prev-table {
        border-collapse: collapse;
        margin-right: 20px;
    }
    .prev-table th,
    .prev-table td {
        padding: 3px 0;
        border: ridge 2px #ddd;
    }
    .prev-table th {
        background-color: #D2DBEE;
    }
    .prev-table td {
        text-align: center;
        min-width: 70px;
    }
    .prev-table tr.deload {
        background-color: #eee;
        font-style: italic;
    }
    .prev-table span.not-max {
        color: silver;
        font-style: italic;
    }
    .prev-table span.ordinal {
        font-size: 67%; 
        color: gray; 
        vertical-align: top; 
        padding-left: 1px;
    }

    span.rir {
        display: inline-block;
        min-width: 21px;
    }
    .rir-1 {
        background-color: red;
        color: white;
        text-decoration: line-through;
    }
    .rir0 {
        background-color: red;
    }
    .rir1 {
        background-color: orange;
    }
    .rir2 {
        background-color: yellow;
    }
    .rir3 {
        background-color: yellowgreen;
    }
    .rir4,
    .rir5 {
        background-color: green;
    }
`;
                    document.head.appendChild(componentStyles);
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
+"                        <th>Guide</th>\n"
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
+"                        <!-- v-bind:class=\"{ 'exceeded': summary.repRangeExceeded }\" -->\n"
+"                        <td class=\"pre\" v-bind:class=\"{ 'faded': summary.headlineNumSets == 1,\n"
+"                                                         'bold': summary.headlineNumSets >= 3 }\">\n"
+"                            <span class=\"pre\"\n"
+"                                >{{ summary.headlineWeight.padStart(6) }} x {{ summary.headlineReps }} {{ ' '.repeat(5 - Math.min(5, summary.headlineReps.length)) }}\n"
+"                            </span>\n"
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
+"                        <td class=\"guide\">{{ summary.exercise.guideType }}</td>\n"
+"\n"
+"                        <td class=\"noborder\" v-on:click=\"removeRecent(summary.idx)\">x</td>\n"
+"\n"
+"                        <!-- left-click: Copy this exercise only to the clipboard -->\n"
+"                        <!-- right-click: Copy the whole workout to the clipboard -->\n"
+"                        <td class=\"noborder\" \n"
+"                            v-on:click=\"copyToClipboard(summary, false)\"\n"
+"                            v-on:contextmenu.prevent=\"copyToClipboard(summary, true)\">📋</td>\n"
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
+"    </div>\n",
    props: {
        tagList: Object,
        showVolume: Boolean,
        oneRmFormula: String,
        recentWorkouts: Array,
        currentExerciseName: String,
        currentExercise1RM: Number,
        currentExerciseGuide: String,
        guides: Array
    },
    setup: function (props, context) {
        let DEFAULT_NUMBER_TO_SHOW = 6;
        let filterType = ref("filter1"); // either 'nofilter', 'filter1' or 'filter3' 
        let numberOfRecentWorkoutsToShow = ref(DEFAULT_NUMBER_TO_SHOW);
        function resetView() { 
            numberOfRecentWorkoutsToShow.value = DEFAULT_NUMBER_TO_SHOW;
        }
        watch(filterType, () => {
            resetView(); // reset view when changing filter type
        });
        watch(() => props.currentExerciseName, (newName) => {
            if (newName) { // don't change if exercise name is blank (e.g. after clearing the form)
                filterType.value = "filter1"; // change to "same exercise" view when switching between different exercises
            }
        })
        function findNextOccurence(exerciseName, startIdx) {
            for (let i = (startIdx + 1); i < (startIdx + 50); i++) {
                if (i >= props.recentWorkouts.length) {
                    return null; // hit end of array
                }
                if (props.recentWorkouts[i].name == exerciseName) {
                    return props.recentWorkouts[i]; // found
                }
            }
            return null; // not found
        }
        const daysSinceLastWorked = computed(() => {
            let next = findNextOccurence(props.currentExerciseName, -1); // -1 to include the first item (idx 0)
            if (next != null) {
                let today = moment().startOf("day");
                let date = moment(next.date).startOf("day");
                return today.diff(date, 'days');
            }
            return 0; // exercise not found
        });
        function removeRecent(idx) {
            alert("TODO Not implemented");
        }
        function copyToClipboard(summary, all) {
            let text = "";
            if (!all) {
                text = summary.exercise.date 
                    + "\t" + "\"" + _generateExerciseText(summary.exercise) + "\""
                    + "\t" + (summary.totalVolume / 1000) // /1000 to convert kg to tonne
                    + "\t" + summary.headlineWeight + " x " + summary.headlineReps
                    + "\t" + (summary.exercise.guideType ? "Guide: " + summary.exercise.guideType + (summary.exercise.guideType.includes("-") ? " reps" : "") : "");
            }
            else {
                let exercisesOnSameDate = recentWorkoutSummaries.value
                    .filter(z=>z.exercise.date == summary.exercise.date)
                    .map(z => z.exercise); // get all the exercises performed on this date
                exercisesOnSameDate.reverse(); // sort so that exercise #1 is at the top of the list
                text = _generateWorkoutText(exercisesOnSameDate);
            }
            navigator.clipboard.writeText(text).then(function () {
            }, function () {
                alert("failed to copy");
            });
        }
        function showTooltip(recentWorkoutIdx, e) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }
        function hideTooltip() {
            context.emit("hide-tooltip");
        }
        function spanTitle(exercise) {
            let arr = [];
            if (exercise.etag) {
                arr.push(props.tagList[exercise.etag].emoji + " " + props.tagList[exercise.etag].description);
            }
            if (exercise.comments) {
                arr.push("🗨 \"" + exercise.comments + "\"");
            }
            return arr.join('\n');
        }
        const guideCategories = computed(() => {
            let guideCategories = {};
            props.guides.forEach(guide =>
                guideCategories[guide.name] = guide.category
            );
            return guideCategories;
        });
        const numberNotShown = ref(0);
        const recentWorkoutSummaries = ref([]);
        watch([() => props.recentWorkouts, filterType, numberOfRecentWorkoutsToShow], () => {
            function isGuideMatch(guide) {
                if (guideCategories.value.hasOwnProperty(guide)
                 && guideCategories.value.hasOwnProperty(props.currentExerciseGuide)) {
                    return guideCategories.value[guide] == guideCategories.value[props.currentExerciseGuide];
                } else {
                    return guide == props.currentExerciseGuide;
                }
            }
            let summaries = [];
            numberNotShown.value = 0;
            let numberShown = 0;
            let lastDate = "";
            let today = moment().startOf('day');
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (filterType.value != "nofilter" && exercise.name != props.currentExerciseName) return;
                if (filterType.value == "filter2"  && !isGuideMatch(exercise.guideType)) return;
                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(exercise);
                if (filterType.value == "filter3"  && !props.currentExercise1RM) return; // can't filter - 1RM box is empty
                if (filterType.value == "filter3"  && headlineWeight < props.currentExercise1RM) return;
                let showThisRow = (numberShown++ < numberOfRecentWorkoutsToShow.value);
                if (showThisRow) {
                    lastDate = exercise.date;
                }
                if (filterType.value == "nofilter") {
                    if (lastDate == exercise.date) {
                        showThisRow = true;
                    }
                }
                if (!showThisRow) {
                    numberNotShown.value++;
                    return;
                }
                let daysSinceLastWorked = 0;
                let next = findNextOccurence(exercise.name, exerciseIdx);
                if (next != null) {
                    let date1 = moment(exercise.date).startOf("day");
                    let date2 = moment(next.date).startOf("day");
                    daysSinceLastWorked = date1.diff(date2, "days");
                }
                let maxWeight = exercise.sets.reduce((acc, set) => Math.max(acc, set.weight), 0); // highest value in array
                let maxWeightReps = exercise.sets.filter(set => set.weight == maxWeight)
                                                 .reduce((acc, set) => Math.max(acc, set.reps), 0);
                let totalVolume = _calculateTotalVolume(exercise);
                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType
                    "maxAttempted": maxWeight.toString(),
                    "maxAttemptedReps": maxWeightReps.toString(),
                    "headlineWeight": headlineWeight.toString(),
                    "headlineReps": repsDisplayString,
                    "headlineNumSets": headlineNumSets,
                    "totalVolume": totalVolume,
                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": moment(exercise.date).from(today) // e.g. "5 days ago"
                });
            });
            recentWorkoutSummaries.value = summaries;
        });
        return {filterType, numberOfRecentWorkoutsToShow, DEFAULT_NUMBER_TO_SHOW,
            daysSinceLastWorked, removeRecent, showTooltip, hideTooltip, spanTitle, copyToClipboard, resetView,
            recentWorkoutSummaries, numberNotShown,
            formatDate: _formatDate
        };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    table.recent { 
        border-collapse: collapse;
        border: none;
    }
    table.recent th {
        background-color: #e6e6e6;
        color: #333;
        border-color: #e6e6e6;
    }
    table.recent th,
    table.recent td {
        padding: 3px 5px;
        font-size: 13px;
    }
    table.recent td {
        border: solid 1px #e6e6e6;
    }
    table.recent td.r {
        text-align: right;
    }
    table.recent td.c {
        text-align: center;
    }
    table.recent td.guide {
        min-width: 50px;
        font-size: 12px;
        text-align: center;
    }
    table.recent td.pre {
        text-align: center;
        white-space: pre;
        font-family: 'Lucida Console';
        font-size: 12px;
        padding-top: 4px;
    }
    table.recent td.bold {
        font-weight: bold;
    }
    table.recent .faded {
        color: darkgray;
    }
    table.recent td.best {
        position: relative; /* required because :after is position: absolute */
    }
    table.recent td.best:after {
        position: absolute;
        content: "🏆";
        left: 94px;
        top: 2px;
        /* stripe:   background: repeating-linear-gradient(135deg, transparent, transparent 10px, #ffd 10px, #ffd  20px); */
        /* triangle: background: linear-gradient(45deg, transparent 93%,orange 93%); */
        /* background-color: black;
        color: white; */
    }

    table.recent td.italic {
        font-style: italic;
    }

    table.recent td.noborder {
        border-top: solid 1px white;
        border-right: solid 1px white;
        border-bottom: solid 1px white;
        background-color: white;
        color: silver;
        cursor: default;
    }
    table.recent td.noborder:hover {
        background-color: red;
    }
    table.recent tr:hover td {
        background-color: #fe9;
        /* color: black; */
    }
    /* table.recent tr.highlight {
        background-color: #c1e3ef;
    } */

    h4.recent {
        color: #444;
        margin-bottom: 5px;
        /* margin-top: 50px; */
    }

    span.exceeded {
        background-color: palegreen;
        color: darkgreen;
        outline: solid 1.5px palegreen;
    }
    span.notmet {
        background-color: crimson;
        color: white;
        outline: solid 1.5px crimson;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('relative-intensity', {
    template: "<b>Relative intensity</b>\n"
+"<label class=\"verdana smallgray\">\n"
+"    <input type=\"radio\" :value=\"false\" v-model=\"show1RM\" />%RI\n"
+"</label>\n"
+"<label class=\"verdana smallgray\">\n"
+"    <input type=\"radio\" :value=\"true\" v-model=\"show1RM\" />1RM\n"
+"</label>\n"
+"\n"
+"<br />\n"
+"1RM\n"
+"<input type=\"text\" v-model.number=\"globalState.calc1RM\" size=\"4\"/>\n"
+"Weight\n"
+"<input type=\"text\" v-model.number=\"globalState.calcWeight\" size=\"4\" />\n"
+"\n"
+"<table border=\"1\">\n"
+"    <thead>\n"
+"        <tr>\n"
+"            <th>Reps</th>\n"
+"            <th>{{ evenLower }}</th>\n"
+"            <th>{{ lowerWeight }}</th>\n"
+"            <th>{{ globalState.calcWeight }}</th>\n"
+"            <th>{{ higherWeight }}</th>\n"
+"            <th>{{ evenHigher }}</th>\n"
+"        </tr>\n"
+"    </thead>\n"
+"    <tbody>\n"
+"        <tr v-for=\"row in table\">\n"
+"            <td>{{ row.reps }}</td>\n"
+"            <td v-bind:style=\"getStyle(row.evenLower.percentage) \">{{ outputValue(row.evenLower) }}</td>\n"
+"            <td v-bind:style=\"getStyle(row.lower.percentage)     \">{{ outputValue(row.lower)     }}</td>\n"
+"            <td v-bind:style=\"getStyle(row.middle.percentage)    \">{{ outputValue(row.middle)    }}</td>\n"
+"            <td v-bind:style=\"getStyle(row.higher.percentage)    \">{{ outputValue(row.higher)    }}</td>\n"
+"            <td v-bind:style=\"getStyle(row.evenHigher.percentage)\">{{ outputValue(row.evenHigher)}}</td>\n"
+"        </tr>\n"
+"    </tbody>\n"
+"</table>\n"
+"\n"
+"<!-- <span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.65) }\">TL</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.70) }\">VL</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.75) }\">LI</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.80) }\">MOD</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.85) }\">MOD+</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.90) }\">HV</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(0.95) }\">VH</span>\n"
+"<span class=\"ri-key-box\" v-bind:style=\"{ 'background-color': colourCode(1.00) }\">MAX</span> -->\n"
+"\n"
+"\n"
+"\n"
+"<label class=\"verdana smallgray\"\n"
+"       style=\"float: right; margin-right: 30px\">\n"
+"       <input type=\"checkbox\"  v-model=\"blackAndWhite\" />B&amp;W\n"
+"</label>\n"
+"\n"
+"<span class=\"ri-key-box\" v-bind:style=\"getStyle(0.65)\" title=\"65.0, 67.5% - Too light\" >TL</span> <span \n"
+"      class=\"ri-key-box\" v-bind:style=\"getStyle(0.70)\" title=\"70.0, 72.5% - Very light\">VL</span> <span \n"
+"      class=\"ri-key-box\" v-bind:style=\"getStyle(0.75)\" title=\"75.0, 77.5% - Light\"     >L</span> Deload\n"
+"<span class=\"ri-key-box\" v-bind:style=\"getStyle(0.80)\" title=\"80.0, 82.5% - Moderate\"  >MOD</span><br />\n"
+"<span class=\"ri-key-box\" v-bind:style=\"getStyle(0.85)\" title=\"85.0, 87.5% - Moderate+\" >MOD+</span> Majority<br />\n"
+"<span class=\"ri-key-box\" v-bind:style=\"getStyle(0.90)\" title=\"90.0, 92.5% - Heavy\"     >H</span> Occasional\n"
+"<span class=\"ri-key-box\" v-bind:style=\"getStyle(0.95)\" title=\"95.0, 97.5% - Very heavy\">VH</span> <span \n"
+"      class=\"ri-key-box\" v-bind:style=\"getStyle(1.00)\" title=\"100%+ - Maximum\"   >MAX</span>\n"
+"<br />\n"
+"\n"
+"<div style=\"border: solid 1px red; display: inline-block; color: red; margin-top: 10px; margin-bottom: 20px; padding: 3px 10px\"\n"
+"     title=\"AMRAPS (as many reps as possible)\">\n"
+"    TEST 1RM EVERY 4 WKS\n"
+"</div>\n"
+"\n",
        props: {
            oneRmFormula: { type: String, required: true },
            currentExerciseName: String
        },
        setup(props) {
            function calculateRelativeIntensity(workWeight, reps) {
                if (!workWeight || !globalState.calc1RM) 
                    return { oneRM: 0, percentage: 0 };
                let percentageForReps = 100 / _calculateOneRepMax(100, reps, props.oneRmFormula);
                return {
                    oneRM: _calculateOneRepMax(workWeight, reps, props.oneRmFormula),
                    percentage: workWeight / (globalState.calc1RM * percentageForReps) // relative intensity
                }
            }
            const lowerWeight = ref(0);
            const higherWeight = ref(0);
            const evenLower = ref(0);
            const evenHigher = ref(0);
            const table = computed(() => {
                let increment = _getIncrement(props.currentExerciseName, globalState.calcWeight);
                lowerWeight.value  = globalState.calcWeight - increment;
                higherWeight.value = globalState.calcWeight + increment;
                evenLower.value    = globalState.calcWeight -(increment * 2);
                evenHigher.value   = globalState.calcWeight +(increment * 2);
                let rows = [];
                for (let reps = 6; reps <= 15; reps++) {
                    rows.push({
                        reps: reps,
                        evenLower: calculateRelativeIntensity(evenLower.value, reps),
                        lower: calculateRelativeIntensity(lowerWeight.value, reps),
                        middle: calculateRelativeIntensity(globalState.calcWeight, reps),
                        higher: calculateRelativeIntensity(higherWeight.value, reps),
                        evenHigher: calculateRelativeIntensity(evenHigher.value, reps)
                    })
                }
                return rows;
            });
            const show1RM = ref(false); // show 1RM instead of RI percentage
            function outputValue(val) { // `val` is an object containing `oneRM` and `percentage` properties 
                if (show1RM.value)
                    return val.oneRM.toFixed(1);
                else 
                    return val.percentage.toFixed(2);
            }
            const blackAndWhite = ref(false);
            function getStyle(relativeIntensity) {
                if (blackAndWhite.value) {
                    let background = "";
                    /**/ if (relativeIntensity < 0.70)  background = "#FFFFFF"; // Too light
                    else if (relativeIntensity < 0.75)  background = "#EEEEEE"; // Very light
                    else if (relativeIntensity < 0.80)  background = "#DDDDDD"; // Light
                    else if (relativeIntensity < 0.85)  background = "#CCCCCC"; // Moderate
                    else if (relativeIntensity < 0.90)  background = "#AAAAAA"; // Moderate+
                    else if (relativeIntensity < 0.95)  background = "#888888"; // Heavy
                    else if (relativeIntensity < 1.00)  background = "#444444"; // Very heavy
                    else if (relativeIntensity >= 1.00) background = "#000000"; // Max
                    let modplus = (relativeIntensity >= 0.85) && (relativeIntensity < 0.90);
                    return {
                        "background-color": background,
                        "color": modplus ? "white" : (relativeIntensity < 0.95) ? "black" : (relativeIntensity >= 1.00) ? "#ccc" : "#999"
                    };
                } else {
                    let background = "";
                    /**/ if (relativeIntensity < 0.70)  background = "#D0CECE"; // Too light
                    else if (relativeIntensity < 0.75)  background = "#C6E0B4"; // Very light
                    else if (relativeIntensity < 0.80)  background = "#A9D08E"; // Light
                    else if (relativeIntensity < 0.85)  background = "#FFE699"; // Moderate
                    else if (relativeIntensity < 0.90)  background = "#FFD966"; // Moderate+
                    else if (relativeIntensity < 0.95)  background = "#F4B084"; // Heavy
                    else if (relativeIntensity < 1.00)  background = "#C65911"; // Very heavy
                    else if (relativeIntensity >= 1.00) background = "#C00000"; // Max
                    return {
                        "background-color": background
                    };
                }
            }
            return { globalState, table, 
                lowerWeight, higherWeight, evenLower, evenHigher,
                show1RM, outputValue, getStyle, blackAndWhite
            };
        }
    });
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .ri-key-box {
        padding: 0 5px;
        font-size: smaller;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('rm-calc-2d', {
    template: "    Calculate one rep max from weight\n"
+"    <div style=\"font-style: italic; font-size: 87%; color: silver\">How can I beat my 1RM score?</div>\n"
+"    <table border=\"1\" class=\"rmtable\">\n"
+"        <thead>\n"
+"            <tr>\n"
+"                <th>Reps</th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model=\"lowerWeight\" /></th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model=\"globalState.calcWeight\" /></th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model=\"higherWeight\" /></th>\n"
+"            </tr>\n"
+"        </thead>\n"
+"        <tbody>\n"
+"            <tr v-for=\"(row, idx) in tableRows\">\n"
+"                <td>{{ row.reps }}</td>\n"
+"                <td v-bind:class=\"{ 'higher-1rm': row.lo_RM > globalState.calc1RM }\">{{ row.lo_RM.toFixed(1) }}</td>\n"
+"                <td v-bind:class=\"{ 'higher-1rm': row.oneRM > globalState.calc1RM }\">{{ row.oneRM.toFixed(1) }}</td>\n"
+"                <td v-bind:class=\"{ 'higher-1rm': row.hi_RM > globalState.calc1RM }\">{{ row.hi_RM.toFixed(1) }}</td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n",
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String,
        currentExerciseName: String
    },
    setup(props) {
        const guideParts = _useGuideParts(toRef(props, "guideType"));
        const lowerWeight = ref(0);
        const higherWeight = ref(0);
        watch(() => globalState.calcWeight, () => {
            lowerWeight.value = globalState.calcWeight - _getIncrement(props.currentExerciseName, globalState.calcWeight);
            higherWeight.value = globalState.calcWeight + _getIncrement(props.currentExerciseName, globalState.calcWeight);
        });
        const tableRows = computed(function() {
            let replist = [];
            if (globalState.calcWeight > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps -1; i <= guideParts.value.guideHighReps + 3; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            return replist.map(function(reps) {
                let oneRM = _calculateOneRepMax(globalState.calcWeight, reps, props.oneRmFormula);
                let lo_RM = _calculateOneRepMax(lowerWeight.value, reps, props.oneRmFormula);
                let hi_RM = _calculateOneRepMax(higherWeight.value, reps, props.oneRmFormula);
                return {
                    reps: reps,
                    oneRM: oneRM < 0 ? 0 : oneRM, // change negative values (error codes) to zero.
                    lo_RM: lo_RM,
                    hi_RM: hi_RM
                };
            });
        });
        return { tableRows, globalState, lowerWeight, higherWeight };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .higher-1rm {
        background-color: #dff8ec;
        font-weight: bold;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('rm-calc', {
    template: "    Calculate one rep max from weight\n"
+"    <!-- ================================= -->\n"
+"    <!--      REPLACED BY rm-calc-2d       -->\n"
+"    <!-- ================================= -->\n"
+"    <div style=\"font-style: italic; font-size: 87%; color: silver\">How can I beat my 1RM score?</div>\n"
+"    <table border=\"1\" class=\"rmtable\">\n"
+"        <thead>\n"
+"            <tr>\n"
+"                <th>Reps</th>\n"
+"                <th>Weight<br />\n"
+"                    <input size=\"4\" style=\"text-align: right\" v-model=\"globalState.calcWeight\" />\n"
+"                </th>\n"
+"                <th>1RM</th>\n"
+"            </tr>\n"
+"        </thead>\n"
+"        <tbody>\n"
+"            <tr v-for=\"(row, idx) in tableRows\"\n"
+"                v-bind:class=\"{ 'higher-1rm': row.oneRM > globalState.calc1RM }\">\n"
+"                <td>{{ row.reps }}</td>\n"
+"                <td>{{ globalState.calcWeight }}</td>\n"
+"                <td>{{ row.oneRM.toFixed(1) }}</td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n",
    props: {
        oneRmFormula: { type: String, required: true },
        guideType: String
    },
    setup(props) {
        const guideParts = _useGuideParts(toRef(props, "guideType"));
        const tableRows = computed(function() {
            let replist = [];
            if (globalState.calcWeight > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps -1; i <= guideParts.value.guideHighReps + 1; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            return replist.map(function(reps) {
                let oneRM = _calculateOneRepMax(globalState.calcWeight, reps, props.oneRmFormula);
                return {
                    reps: reps,
                    oneRM: oneRM < 0 ? 0 : oneRM // change negative values (error codes) to zero.
                };
            });
        });
        return { tableRows, globalState };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .higher-1rm {
        background-color: #dff8ec;
        font-weight: bold;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('rm-table', {
    template: "    Calculate weight/% from one rep max\n"
+"    <div style=\"font-style: italic; font-size: 87%; color: silver\">How much weight am I capable of lifting?</div>\n"
+"    <table border=\"1\" class=\"rmtable\">\n"
+"        <thead>\n"
+"            <tr>\n"
+"                <th>Reps</th>\n"
+"                <th>Weight</th>\n"
+"                <th style=\"min-width: 53px\">Percent</th>\n"
+"            </tr>\n"
+"        </thead>\n"
+"        <tbody>\n"
+"            <tr v-for=\"(row, idx) in tableRows\"\n"
+"                v-bind:class=\"row.reps >= guideParts.guideLowReps && row.reps <= guideParts.guideHighReps ? 'weekreps' + row.reps : ''\">\n"
+"                <td>{{ row.reps }}</td>\n"
+"                <td>\n"
+"                    <template v-if=\"idx == 0\">\n"
+"                        One rep max:<br />\n"
+"                        <input v-model=\"globalState.calc1RM\" size=\"4\" style=\"text-align: right\" />\n"
+"                    </template>\n"
+"                    <template v-else>\n"
+"                        {{ row.weight.toFixed(1) }} kg\n"
+"                    </template>\n"
+"                </td>\n"
+"                <td>{{ row.percentage.toFixed(1) }}%</td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n",
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String
    },
    setup(props) {
        const guideParts = _useGuideParts(toRef(props, "guideType"));
        const tableRows = computed(() => {
            let replist = [1]; // first row = 1 rep (for <input> to enter 1RM)
            if (globalState.calc1RM > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps - 2; i <= guideParts.value.guideHighReps + 2; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [1,10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            var rows = [];
            for (let reps of replist) {
                let weight = _oneRmToRepsWeight(globalState.calc1RM, reps, props.oneRmFormula);
                if (weight != -1) {
                    rows.push({
                        reps: reps,
                        weight: weight,
                        percentage: !globalState.calc1RM ? 0 : ((weight * 100) / globalState.calc1RM)
                    });
                }
            }
            return rows;
        });
        return { tableRows, guideParts, globalState };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .rmtable {
        border-collapse: collapse;
        color: #666;
        /* font-family: verdana; */
        font-size: 12px;
    }
    .rmtable th {
        background-color: darkgray;
        color: white;
    }
    .rmtable td,
    .rmtable th {
        padding: 3px 8px 3px 15px;
        border: solid 1px darkgray;
    }
    .rmtable td {
        text-align: right;
    }`;
                    document.head.appendChild(componentStyles);
                }
function _calculateOneRepMax(weight, reps, formula, repsInReserve) {
    if (repsInReserve && globalState.includeRirInEst1RM)
        reps += repsInReserve; // added Jan'25
    if (!weight || !reps) return -1; // no data
    if (weight == 1) return -1; // `1` is a special value reserved for bodyweight exercises, so 1RM is N/A
    if (formula == 'Brzycki') {
        if (reps > 12) return -2; // can't calculate if >12 reps
        return weight / (1.0278 - 0.0278 * reps);
    }
    else if (formula == 'Brzycki 12+') {
        return weight / (1.0278 - 0.0278 * reps);
    }
    else if (formula == 'Epley') {
        return weight * (1 + (reps / 30));
    }
    else if (formula == 'McGlothin') {
        return (100 * weight) / (101.3 - 2.67123 * reps);
    }
    else if (formula == 'Lombardi') {
        return weight * Math.pow(reps, 0.10);
    }
    else if (formula == 'Mayhew et al.') {
        return (100 * weight) / (52.2 + 41.9 * Math.pow(Math.E, -0.055 * reps));
    }
    else if (formula == 'O\'Conner et al.') {
        return weight * (1 + (reps / 40));
    }
    else if (formula == 'Wathan') {
        return (100 * weight) / (48.8 + 53.8 * Math.pow(Math.E, -0.075 * reps));
    }
    else if (formula == 'Brzycki/Epley') {
        if (reps <= 10)
            return weight / (1.0278 - 0.0278 * reps); // Brzycki
        else
            return weight * (1 + (reps / 30)); // Epley
    }
    else 
        return -3; // unknown formula
}
function _calculateMax1RM(sets, oneRmFormula) {
    var maxEst1RM = sets.map(set => _calculateOneRepMax(set.weight, set.reps, oneRmFormula, set.rir))
        .filter(val => val > 0) // filter out error conditions
        .reduce(function(acc, val) { return Math.max(acc, val) }, 0); // highest value
    maxEst1RM = Math.round(maxEst1RM * 10) / 10; // NEW: round to 1 decimal place
    return maxEst1RM;
}
function _calculateAvg1RM(sets, oneRmFormula) {
    var oneRepMaxes = sets.filter(set => set.type == "WK") // work sets only
        .map(set => _calculateOneRepMax(set.weight, set.reps, oneRmFormula, set.rir))
        .filter(val => val > 0); // filter out error conditions
    return _arrayAverage(oneRepMaxes); // possible todo: round to 1 d.p.?
}
function _arrayAverage(array) {
    if (array.length == 0) return 0; // avoid divide by zero
    return array.reduce((a, b) => a + b, 0) / array.length;
}
function _oneRmToRepsWeight(oneRepMax, reps, oneRmFormula) {
    let tempWeight = 100; // this can be any weight, it's just used to calculate the percentage.
    let tempRM = _calculateOneRepMax(tempWeight, reps, oneRmFormula);
    if (tempRM > 0) {
        let percentage = tempWeight / tempRM;
        return oneRepMax * percentage;
    }
    return -1; // error (e.g. `oneRmFormula` does not support this number of reps)
}
function _getIncrement(exerciseName, guideWeight) {
    if ((exerciseName || '').includes('db ')) {
        if (guideWeight < 20)
            return 1; // d.b. less than 20kg - round to nearest 1
        else
            return 2; // d.b. greater than 20kg - round to nearest 2
    } else if ((exerciseName || '').startsWith('leg '))
        return 1.25; // leg ext/curl - round to nearest 1.25
    else
        return 2.5; // b.b. - round to nearest 2.5
}
function _roundGuideWeight(guideWeight, exerciseName) {
    let increment = _getIncrement(exerciseName, guideWeight);
    return Math.round(guideWeight / increment) * increment;
}
function _newWorkout() {
    return ["1", "2", "3"].map(function (number) {
        return _newExercise(number, 0, 3);
    });
}
function _newExercise(exerciseNumber, warmUpSets, workSets) {
    var sets = [];
    if (exerciseNumber.startsWith("1")) { // warm up only applies for the first exercise
        for (var s = 0; s < warmUpSets; s++) { // for each set (`numberOfSets` in total)
            sets.push(_newSet("WU"));
        }
    }
    for (var s = 0; s < workSets; s++) { // for each set (`numberOfSets` in total)
        sets.push(_newSet("WK"));
    }
    return {
        number: exerciseNumber, // e.g. 1/2/3, 1A/1B
        name: '',
        sets: sets,
        ref1RM: 0,
        comments: '',
        etag: 0, // exercise tag
        guideType: '',
        warmUp: undefined // applies to first exercise of workout only
    };
}
function _newSet(type) {
    return {
        weight: 0,
        reps: 0,
        gap: 0,
        type: type,
        rir: undefined
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
function _formatDate (datestr, dateformat) { 
    if (!datestr) return "";
    if (!dateformat) dateformat = "DD/MM/YYYY";
    return moment(datestr).format(dateformat);
} 
function _calculateTotalVolume (exercise) {
    return exercise.sets.reduce(function(acc, set) { return acc + _volumeForSet(set) }, 0); // sum array
}
function _generateWorkoutText(exercises) {
    let output = "";
    if (exercises.length > 0 && exercises[0].warmUp) {
        output += "Warm up:\n" + exercises[0].warmUp + "\n\n";
    }
    exercises.forEach(exercise => {
        var text = _generateExerciseText(exercise);
        if (text.length > 0) {
            output += exercise.number + ". " + exercise.name + "\n" + text + "\n\n";
        }
    });
    return output;
}

app.component('tool-tip', {
    template: "    <div id=\"tooltip\" v-show=\"tooltipVisible && tooltipIdx != -1\">\n"
+"        <table>\n"
+"            <tbody>\n"
+"                <tr>\n"
+"                    <td v-bind:colspan=\"colspan1\">Date</td>\n"
+"                    <td v-bind:colspan=\"colspan2\"\n"
+"                        style=\"padding-left: 5px\">{{ tooltipData.date }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"!!tooltipData.guideType\">\n"
+"                    <td v-bind:colspan=\"colspan1\">Guide type</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ tooltipData.guideType }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"!!tooltipData.ref1RM && currentExerciseGuide.weightType != 'WORK'\">\n"
+"                    <td v-bind:colspan=\"colspan1\">Ref. 1RM</td>\n"
+"                    <td v-bind:class=\"{ oneRepMaxExceeded: maxEst1RM > tooltipData.ref1RM }\">\n"
+"                        {{ tooltipData.ref1RM }}\n"
+"                    </td>\n"
+"                </tr>\n"
+"\n"
+"                <tr>\n"
+"                    <th v-if=\"currentExerciseGuide.weightType == '1RM'\">% 1RM</th>\n"
+"                    <th>Weight</th>\n"
+"                    <th>Reps</th>\n"
+"                    <th v-if=\"!hideRirColumn\">RIR</th>\n"
+"                    <th>Rest</th>\n"
+"                    <th>Est 1RM</th>\n"
+"                    <th v-if=\"showVolume\">Volume</th>\n"
+"                </tr>\n"
+"                <grid-row v-for=\"(set, setIdx) in tooltipData.sets\"\n"
+"                        v-bind:set=\"set\" \n"
+"                        v-bind:set-idx=\"setIdx\"\n"
+"                        v-bind:show-volume=\"showVolume\"\n"
+"                        v-bind:reference-weight=\"0\"\n"
+"                        v-bind:ref1-r-m=\"tooltipData.ref1RM\"\n"
+"                        v-bind:read-only=\"true\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:show-guide=\"false\"\n"
+"                        v-bind:guide=\"currentExerciseGuide\"\n"
+"                        v-bind:exercise=\"tooltipData\"\n"
+"                        v-bind:hide-rir-column=\"hideRirColumn\">\n"
+"                </grid-row>\n"
+"                <tr><td style=\"padding: 0\"></td></tr> <!-- fix for chrome (table borders) -->\n"
+"\n"
+"                <tr><!-- v-if=\"showVolume\" -->\n"
+"                    <td v-bind:colspan=\"colspan1\">Total volume</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ totalVolume.toLocaleString() }} kg</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr><!-- v-if=\"showVolume\" -->\n"
+"                    <td v-bind:colspan=\"colspan1\">Work Sets volume</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ workSetsVolume.toLocaleString() }} kg</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr>\n"
+"                    <td v-bind:colspan=\"colspan1\">Max est. 1RM</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ maxEst1RM }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"tooltipData.comments\">\n"
+"                    <td v-bind:colspan=\"colspan1 + colspan2\"\n"
+"                        style=\"text-align: left; padding-left: 5px\"\n"
+"                        >💬 &quot;{{ tooltipData.comments }}&quot;</td>\n"
+"                </tr>\n"
+"            </tbody>\n"
+"        </table>\n"
+"    </div>\n",
    props: {
        recentWorkouts: Array,
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
                    warmUp: "",
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
            let span = 3;
            if (!this.hideRirColumn)
                span += 1;
            if (this.currentExerciseGuide.weightType == "1RM")
                span += 1;
            return span;
        },
        colspan2: function () {
            return this.showVolume ? 2 : 1;
        },
        currentExerciseGuide: function () {
            for (var i = 0; i < this.guides.length; i++) {
                if (this.guides[i].name == this.tooltipData.guideType)
                    return this.guides[i];
            }
            return this.guides[0]; // not found - return default (empty) guide
        },
        totalVolume: function () {
            return _calculateTotalVolume(this.tooltipData);
        },
        workSetsVolume: function () {
            let workSets = this.tooltipData.sets.filter(z => z.type == "WK");
            let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
            return volume;
        },
        maxEst1RM: function () {
            return _calculateMax1RM(this.tooltipData.sets, this.oneRmFormula);
        },
        hideRirColumn: function () {
            let setsWithoutRir = this.tooltipData.sets.filter(z => !z.rir).length;
            return (setsWithoutRir == this.tooltipData.sets.length);
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
            var overflowX = (popupWidth + e.clientX + 5) > document.documentElement.clientWidth; // would it disappear off the right edge of the page?
            tooltip.style.left = (overflowX ? e.pageX - popupWidth : e.pageX) + "px";
            var popupHeight = tooltip.clientHeight;
            let underflowY = (e.clientY - popupHeight) < 0; // would it disappear off the top of the page?
            tooltip.style.top = (underflowY ? e.pageY + 10 : e.pageY - popupHeight - 10) + "px";
        },
        hide: function () { // this function is called by parent (via $refs) so name/params must not be changed
            this.tooltipVisible = false;
        }
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    #tooltip {
        position: absolute;
        background-color: rgb(255,255,225);
        font-size: 13px;
    }
    #tooltip table {
        border-collapse: collapse;
        border: solid 1px black;
    }
    #tooltip th {
        background-color: #e8e8b6;
    }
    #tooltip td {
        text-align: right;
        padding: 3px 5px 3px 30px;
        border: dotted 1px gray;
    }

    td.oneRepMaxExceeded {
        /* text-decoration: line-through; */
        /* color: red; */
        background-color: #fdd;
        color: #999;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('volume-table', {
    template: "\n"
+"<div style=\"text-align: left\">\n"
+"    Filter:\n"
+"    <label title=\"Current exercises only\"><input type=\"radio\" v-model=\"filter\" value=\"current\" />Current exs. only</label>\n"
+"    <label title=\"Same weekday\"          ><input type=\"radio\" v-model=\"filter\" value=\"weekday\" />{{ currentWeekdayString }}s</label>\n"
+"    <label title=\"Week total\"            ><input type=\"radio\" v-model=\"filter\" value=\"all\"     />All</label>\n"
+"    <br />\n"
+"    Show:\n"
+"    <label><input type=\"radio\" v-model=\"whatToShow\" value=\"volume\" />Volume</label>\n"
+"    <label><input type=\"radio\" v-model=\"whatToShow\" value=\"numex\"  />Exercises</label>\n"
+"    <label><input type=\"radio\" v-model=\"whatToShow\" value=\"numsets\"/>Sets</label>\n"
+"    <label><input type=\"radio\" v-model=\"whatToShow\" value=\"rest\"   />Rest</label>\n"
+"</div>\n"
+"\n"
+"<table border=\"1\" class=\"weektable\">\n"
+"    <thead>\n"
+"        <tr>\n"
+"            <!-- Table heading -->\n"
+"            <td></td>\n"
+"            <td v-for=\"heading in table.columnHeadings\"\n"
+"                style=\"width: 40px\">\n"
+"                {{ heading }}\n"
+"            </td>\n"
+"        </tr>\n"
+"    </thead>\n"
+"    <tbody>\n"
+"        <tr v-for=\"(row, rowIdx) in table.rows\">\n"
+"            <!-- Table body -->\n"
+"            <td>{{ rowIdx + 1 }}</td>\n"
+"            <td v-for=\"col in row\">\n"
+"                {{ col.values.length == 0  \n"
+"                    ? \"\" \n"
+"                    : Math.round(arrayAverage(col.values)).toLocaleString() \n"
+"                }}\n"
+"            </td>\n"
+"        </tr>\n"
+"    </tbody>\n"
+"</table>\n"
+"\n",
    props: {
        recentWorkouts: Array,
        currentWorkout: Array,
        workoutDate: String
    },
    setup(props) {
        const filter = ref("weekday");
        const whatToShow = ref("volume");
        const currentExeciseNames = computed(() => props.currentWorkout.map(z => z.name));
        const currentWeekday = computed(() => moment(props.workoutDate).weekday()); // returns NaN for invalid dates
        const currentWeekdayString = computed(() => moment(props.workoutDate).format("dddd")); // returns "Invalid date" for invalid dates
        const table = computed(() => {
            var columnHeadings = [];
            var tableRows = [];
            function merge(rowIdx, colIdx, exercise) {
                let tableCell = tableRows[rowIdx][colIdx];
                function addToCell(value) {
                    if (tableCell.values.length == 0) tableCell.values.push(value); else tableCell.values[0] += value 
                }
                if (whatToShow.value == "volume") 
                    addToCell(_calculateTotalVolume(exercise));
                else if (whatToShow.value == "numex")
                    addToCell(1); // count number of exercises
                else if (whatToShow.value == "numsets")
                    addToCell(exercise.sets.length); // count number of sets
                else if (whatToShow.value == "rest")
                    exercise.sets.forEach((set, setIdx) => {
                        if (setIdx == 0) return; // 1st set rest time is always zero
                        tableCell.values.push(set.gap); // these will be averaged
                    });
            }
            function emptyCell() { return { values: [] } } // values will be averaged
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (filter.value == "current" && !currentExeciseNames.value.includes(exercise.name)) return;
                if (filter.value == "weekday" && moment(exercise.date).weekday() != currentWeekday.value) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned
                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = exercise.weekNumber - 1; // e.g. week 1 is [0]
                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length <= colIdx)
                        tableRows[rowIdx].push(emptyCell()); // create cells as necessary
                    merge(rowIdx, colIdx, props.recentWorkouts[exerciseIdx])
                }
            });
            tableRows.forEach(function (row) {
                while (row.length < columnHeadings.length) {
                    row.push(emptyCell()); // create cells as necessary
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
        });
        return { table, filter, whatToShow, currentWeekdayString, currentWeekday,
            arrayAverage: _arrayAverage // remove underscore to avoid vue warning
         };
    }
});
app.component('week-table', {
    template: "<div>\n"
+"\n"
+"    <div style=\"text-align: left\">\n"
+"        <span>🔢</span>\n"
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"weight\" />Weight</label>\n"
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"volume\" />Volume</label>\n"
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"Avg1RM\" />Avg 1RM</label>\n"
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"Max1RM\" />Max 1RM</label>\n"
+"        <br />\n"
+"\n"
+"        <span>🎨</span>\n"
+"        <label><input type=\"radio\" v-model=\"colourCodeReps\" value=\"\"       />N/A</label>\n"
+"        <label><input type=\"radio\" v-model=\"colourCodeReps\" value=\"guide\"  />Guide reps</label>\n"
+"        <label><input type=\"radio\" v-model=\"colourCodeReps\" value=\"actual\" />Actual reps</label>\n"
+"        <label><input type=\"radio\" v-model=\"colourCodeReps\" value=\"heatmap\"/>Value</label>\n"
+"    </div>\n"
+"\n"
+"    <table border=\"1\" class=\"weektable\">\n"
+"        <thead>\n"
+"            <tr>\n"
+"                <!-- Table heading -->\n"
+"                <td></td>\n"
+"                <td v-for=\"heading in table.columnHeadings\"\n"
+"                    style=\"width: 40px\">\n"
+"                    {{ heading }}\n"
+"                </td>\n"
+"            </tr>\n"
+"        </thead>\n"
+"        <tbody>\n"
+"            <tr v-for=\"(row, rowIdx) in table.rows\">\n"
+"                <!-- Table body -->\n"
+"                <td>{{ rowIdx + 1 }}</td>\n"
+"                <td v-for=\"col in row\"\n"
+"                    v-bind:class=\"[colourCodeReps == 'actual' && ('weekreps' + col.reps),\n"
+"                                colourCodeReps == 'guide' && ('weekreps' + col.guideMiddle)]\"\n"
+"                    v-bind:style=\"[{ 'opacity': col.singleSetOnly && colourCodeReps == 'actual' ? '0.5' : null },\n"
+"                                colourCodeReps == 'heatmap' ? getHeatmapStyle(col.value) : null ]\"\n"
+"                    v-bind:title=\"col.headlineString\"\n"
+"                    v-on:mousemove=\"showTooltip(col.idx, $event)\" v-on:mouseout=\"hideTooltip\">\n"
+"                    {{ col.value == null ? \"\"\n"
+"                     : valueToDisplay == 'Avg1RM' ? col.value.toFixed(1) /* 1 d.p. */\n"
+"                     : valueToDisplay == 'Max1RM' ? col.value.toFixed(1) /* 1 d.p. */\n"
+"                     : valueToDisplay == 'volume' ? col.value.toLocaleString() /* thousands separator */\n"
+"                     : col.value }}\n"
+"                </td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n"
+"\n"
+"    <table v-if=\"colourCodeReps == 'guide' || colourCodeReps == 'actual'\">\n"
+"        <tbody>\n"
+"            <tr>\n"
+"                <td>KEY:</td>\n"
+"                <td v-for=\"number in 15\"\n"
+"                    v-bind:class=\"'weekreps' + (16 - number)\">{{ 16 - number }}</td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n"
+"\n"
+"\n"
+"\n"
+"</div>\n",
    props: {
        recentWorkouts: Array,
        currentExerciseName: String,
        oneRmFormula: String
    },
    setup: function (props, context) {
        const colourCodeReps = ref("actual");
        const valueToDisplay = ref("weight");
        function showTooltip(recentWorkoutIdx, e) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }
        function hideTooltip() {
            context.emit("hide-tooltip");
        }
        function guideMiddleNumber(guide) {
            if (!guide) return 0;
            var parts = guide.split('-');
            if (parts.length != 2) return 0;
            var first = Number(parts[0]);
            var second = Number(parts[1]);
            return Math.round(second - ((second - first) / 2));
        }
        let maxValue = 0;
        let minValue = 999999;
        const table = computed(() => {
            maxValue = 0;
            minValue = 999999;
            function getHeadline(exerciseIdx) {
                let exercise = props.recentWorkouts[exerciseIdx];
                let [headlineReps,repsDisplayString,headlineNumSets,headlineWeight] = _getHeadline(exercise);
                return {
                    weight: headlineWeight,
                    reps: headlineReps,
                    headlineString: headlineWeight + " x " + repsDisplayString,
                    singleSetOnly: headlineNumSets == 1,
                    idx: exerciseIdx, // for tooltip
                    volume: _calculateTotalVolume(props.recentWorkouts[exerciseIdx]),
                    guideMiddle: guideMiddleNumber(props.recentWorkouts[exerciseIdx].guideType),
                    value: valueToDisplay.value == "volume" ? _calculateTotalVolume(props.recentWorkouts[exerciseIdx])
                         : valueToDisplay.value == "weight" ? headlineWeight
                         : valueToDisplay.value == "Avg1RM" ? _calculateAvg1RM(exercise.sets, props.oneRmFormula)
                         : valueToDisplay.value == "Max1RM" ? _calculateMax1RM(exercise.sets, props.oneRmFormula)
                         : 0
                };
            }
            var columnHeadings = [];
            var tableRows = [];
            function merge(rowIdx, colIdx, exerciseIdx) {
                var headline = getHeadline(exerciseIdx);
                if (!tableRows[rowIdx][colIdx]) {
                    tableRows[rowIdx][colIdx] = headline;
                } else {
                    if (headline.weight > tableRows[rowIdx][colIdx].weight) {
                        tableRows[rowIdx][colIdx] = headline;
                    }
                }
                if (headline.value > maxValue) {
                    maxValue = headline.value;
                }
                if (headline.value < minValue) {
                    minValue = headline.value;
                }
            }
            function emptyCell() { return { weight: 0, reps: 0, headlineString: "", singleSetOnly: false, idx: -1, volume: 0, guideMiddle: 0, value: null } }
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != props.currentExerciseName) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned
                if (exercise.blockStart && exercise.weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = exercise.weekNumber - 1; // e.g. week 1 is [0]
                    while (tableRows.length <= rowIdx)
                        tableRows.push([]); // create rows as necessary
                    while (tableRows[rowIdx].length < colIdx)
                        tableRows[rowIdx].push(emptyCell()); // create cells as necessary
                    merge(rowIdx, colIdx, exerciseIdx)
                }
            });
            tableRows.forEach(function (row) {
                while (row.length < columnHeadings.length) {
                    row.push(emptyCell()); // create cells as necessary
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
        });
        function getHeatmapStyle(value) {
            if (!value || !maxValue) return null;
            let divideBy = maxValue - minValue;
            if (divideBy == 0) return null; // avoid returning NaN
            let gb = ((value - minValue) * 5.5) / divideBy; // (5.5 because `Math.exp(5.5)` is 244.69, which is just under 255)
            gb = 255 - Math.exp(gb); // scale exponentially and invert
            return {
                'background-color': `rgb(255,${gb},${gb})`,
                'color': gb < 150 ? 'white' : 'black'
            };
        }
        return { valueToDisplay, colourCodeReps, table, getHeatmapStyle,
            showTooltip, hideTooltip };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .weekreps1,
    .weekreps2,
    .weekreps3,
    .weekreps4,
    .weekreps5 {
        background-color: crimson;
        color: white;
    }
    .weekreps6,
    .weekreps7,
    .weekreps8 {
        background-color: purple;
        color: white;
    }
    .weekreps9,
    .weekreps10,
    .weekreps11 {
        background-color: orange;
        color: white;
    }
    .weekreps12,
    .weekreps13,
    .weekreps14 {
        background-color: #fff1ab
    }
    .weekreps15,
    .weekreps16,
    .weekreps17,
    .weekreps18,
    .weekreps19,
    .weekreps20 {
        background-color: #d5efda; /* #e0d694; */
    }





    .weekreps1-faded,
    .weekreps2-faded,
    .weekreps3-faded,
    .weekreps4-faded,
    .weekreps5-faded {
        background-color: rgba(220, 20, 60, 0.5); /* crimson, 50% opacity */
        color: white;
    }
    .weekreps6-faded,
    .weekreps7-faded,
    .weekreps8-faded {
        background-color: rgba(128, 0, 128, 0.5); /* purple, 50% opacity */
        color: white;
    }
    .weekreps9-faded,
    .weekreps10-faded,
    .weekreps11-faded {
        background-color: rgba(255, 165, 0, 0.5); /* orange, 50% opacity */
        color: white;
    }
    .weekreps12-faded,
    .weekreps13-faded,
    .weekreps14-faded {
        background-color: rgba(255, 241, 171, 0.3); /* #fff1ab, 30% opacity */
    }
    .weekreps15-faded,
    .weekreps16-faded,
    .weekreps17-faded,
    .weekreps18-faded,
    .weekreps19-faded,
    .weekreps20-faded {
        background-color: rgba(213, 239, 218, 0.3); /* #d5efda, 30% opacity */
    }




    .gap6 {
        background-color: crimson;
        color: white;
    }
    .gap5,
    .gap4 {
        background-color: purple;
        color: white;
    }
    .gap3 {
        background-color: orange;
        color: white;
    }
    .gap2 {
        background-color: #fff1ab
    }
    .gap1 {
        background-color: #d5efda;
    }`;
                    document.head.appendChild(componentStyles);
                }
app.component('workout-calc', {
    template: "     <div>\n"
+"        <div style=\"float: right; font-size: smaller; text-align: right; position: sticky; top: 0\">\n"
+"\n"
+"            <span>One Rep Max Formula\n"
+"                <select v-model=\"oneRmFormula\">\n"
+"                    <option>Brzycki/Epley</option>\n"
+"                    <option>Brzycki</option>\n"
+"                    <option>Brzycki 12+</option>\n"
+"                    <option>McGlothin</option>\n"
+"                    <option>Epley</option>\n"
+"                    <option>Wathan</option>\n"
+"                    <option>Mayhew et al.</option>\n"
+"                    <option>O'Conner et al.</option>\n"
+"                    <option>Lombardi</option>\n"
+"                </select>\n"
+"                <br />\n"
+"            </span>\n"
+"            \n"
+"            <label>\n"
+"                <input type=\"checkbox\" v-model=\"globalState.includeRirInEst1RM\" />\n"
+"                Include RIR\n"
+"            </label>\n"
+"            <br /><br />\n"
+"            \n"
+"            <span>\n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"showRmTable\" />\n"
+"                    Show calculators\n"
+"                </label>\n"
+"                <br /><br />\n"
+"            </span>\n"
+"\n"
+"            \n"
+"\n"
+"            <div style=\"float: left\">\n"
+"                <guide-info-table v-bind:week-number=\"weekNumber\"\n"
+"                                  v-bind:current-exercise-name=\"currentExercise.name\" \n"
+"                                  v-bind:presets=\"presets\"\n"
+"                                  v-bind:workout-preset=\"lastUsedPreset\" />\n"
+"            </div>\n"
+"\n"
+"            Block start date<br />\n"
+"            <input type=\"text\" style=\"width: 80px\" v-model=\"blockStartDate\" \n"
+"                    placeholder=\"YYYY-MM-DD\" />\n"
+"\n"
+"            <br /><br />\n"
+"\n"
+"            <div style=\"display: inline-block; text-align: left\">\n"
+"                Workout date<br />\n"
+"                <input type=\"text\" style=\"width: 80px\" v-model=\"workoutDate\" />\n"
+"            </div>\n"
+"\n"
+"            <br /><br />\n"
+"\n"
+"            Week number<br />\n"
+"            <!-- <template v-if=\"daysDiff != null\">\n"
+"                <template v-if=\"weekNumber != null\">\n"
+"                    {{ weekNumber }}w\n"
+"                </template>\n"
+"                <span style=\"color: silver\">\n"
+"                    {{ daysDiff % 7 }}d\n"
+"                </span>\n"
+"            </template> -->\n"
+"            <template v-if=\"daysDiff != null\">\n"
+"                <template v-if=\"weekNumber != null\">Wk <b>{{ weekNumber }}</b></template>\n"
+"                <span style=\"color: silver\">.{{ dayNumber }}</span>\n"
+"            </template>\n"
+"            <template v-else>\n"
+"                Invalid date\n"
+"            </template>\n"
+"\n"
+"           \n"
+"            <br /><br />\n"
+"            <div v-if=\"showTables\"\n"
+"                 style=\"float: left\">{{ currentExercise.name }}</div>\n"
+"            <label>\n"
+"                <input type=\"checkbox\" v-model=\"showTables\" />\n"
+"                Show tables\n"
+"            </label>\n"
+"            <week-table v-if=\"showTables\"\n"
+"                        v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                        v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-on:show-tooltip=\"showTooltip\"\n"
+"                        v-on:hide-tooltip=\"hideTooltip\" />\n"
+"            <br />\n"
+"            <volume-table v-if=\"showTables\"\n"
+"                          v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                          v-bind:current-workout=\"exercises\"\n"
+"                          v-bind:workout-date=\"workoutDate\" />\n"
+"        </div>\n"
+"\n"
+"        <div v-if=\"showRmTable\"\n"
+"             style=\"float: right; position: sticky; top: 0\">\n"
+"\n"
+"            <prev-table v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                        v-bind:current-exercise-name=\"currentExercise.name\" \n"
+"                        v-on:show-tooltip=\"showTooltip\"\n"
+"                        v-on:hide-tooltip=\"hideTooltip\" />\n"
+"            <!--<relative-intensity v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                                v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"            ></relative-intensity>\n"
+"            <br />\n"
+"            <rm-calc-2d v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:guide-type=\"currentExercise.guideType\"\n"
+"                        v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"            ></rm-calc-2d>\n"
+"            <br />\n"
+"            <rm-table v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                      v-bind:ref1-r-m=\"currentExercise.ref1RM\"\n"
+"                      v-bind:guide-type=\"currentExercise.guideType\"\n"
+"            ></rm-table>-->\n"
+"            <!--<br />\n"
+"            <rm-calc v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                     v-bind:guide-type=\"currentExercise.guideType\"\n"
+"            ></rm-calc>-->\n"
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
+"        >📋</button>\n"
+"        \n"
+"        <button class=\"pagebtn\"\n"
+"                v-on:click=\"clear\"\n"
+"                style=\"padding: 2px; vertical-align: top; height: 40px; width: 51px\"\n"
+"        >{{ outputText ? \"Save + \" : \"\" }}Clear</button>\n"
+"\n"
+"        <select style=\"height: 40.5px; width: 50px\"\n"
+"                v-on:change=\"startNewWorkout\">\n"
+"            <option style=\"display: none\">New</option>\n"
+"            <option v-for=\"preset in presets\">\n"
+"                {{ preset.name }}\n"
+"            </option>\n"
+"        </select>\n"
+"\n"
+"        <!-- <select style=\"height: 40.5px\"\n"
+"                v-on:change=\"clearAndNew\">\n"
+"            <option style=\"display: none\">Clear</option>\n"
+"            <option>Blank</option>\n"
+"            <option v-for=\"preset in presets\">\n"
+"                {{ preset.name }}\n"
+"            </option>\n"
+"        </select> -->\n"
+"        \n"
+"        <datalist id=\"exercise-names\">\n"
+"            <option v-for=\"exerciseName in exerciseNamesAutocomplete\"\n"
+"                    v-bind:value=\"exerciseName\"></option>\n"
+"        </datalist>\n"
+"\n"
+"        <div class=\"smallgray\">\n"
+"            <label>\n"
+"                <input type=\"checkbox\" v-model=\"showVolume\" /> Show volume\n"
+"            </label>\n"
+"        </div>\n"
+"\n"
+"        <!-- Warm up (stored in 1st exercise `comments` field)-->\n"
+"        <div v-if=\"exercises.length > 0\"\n"
+"             style=\"display: inline-block; border-top: solid 2px #eee; border-bottom: solid 2px #eee; padding: 20px 0; margin-top: 20px\">\n"
+"            Warm up: \n"
+"            <textarea style=\"width: 272px; height: 50px; vertical-align: top;\"\n"
+"                      v-model=\"exercises[0].warmUp\"\n"
+"            ></textarea>\n"
+"        </div>\n"
+"\n"
+"        <div v-for=\"(exercise, exIdx) in exercises\" >\n"
+"            <div class=\"exdiv\"\n"
+"                ><!-- v-show=\"exIdx == curPageIdx\"  -->\n"
+"                <div v-if=\"exIdx == curPageIdx\"\n"
+"                    class=\"leftline\"\n"
+"                    v-bind:class=\"'weekreps' + currentExerciseGuideHighReps\">\n"
+"                </div>\n"
+"                <exercise-container v-bind:exercise=\"exercise\"\n"
+"                                    v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                                    v-bind:show-volume=\"showVolume\"\n"
+"                                    v-bind:guides=\"guides\"\n"
+"                                    v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                                    v-bind:tag-list=\"tagList\"\n"
+"                                    v-on:select-exercise=\"gotoPage(exIdx)\"\n"
+"                ></exercise-container>\n"
+"            </div>\n"
+"        </div><!-- /foreach exercise -->\n"
+"        <br />\n"
+"    \n"
+"        \n"
+"        <recent-workouts-panel v-bind:tag-list=\"tagList\"\n"
+"                               v-bind:show-volume=\"showVolume\"\n"
+"                               v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                               v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                               v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"                               v-bind:current-exercise1-r-m=\"currentExercise.ref1RM\"\n"
+"                               v-bind:current-exercise-guide=\"currentExercise.guideType\"\n"
+"                               v-bind:guides=\"guides\"\n"
+"                               v-on:show-tooltip=\"showTooltip\"\n"
+"                               v-on:hide-tooltip=\"hideTooltip\"\n"
+"                               ref=\"recentWorkoutsPanel\">\n"
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
+"        <tool-tip \n"
+"            v-bind:recent-workouts=\"recentWorkouts\"\n"
+"            v-bind:show-volume=\"showVolume\"\n"
+"            v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"            v-bind:guides=\"guides\"\n"
+"            ref=\"tooltip\"\n"
+"        ></tool-tip>\n"
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
            showVolume: false,
            oneRmFormula: 'Brzycki/Epley',
            showRmTable: true,
            showTables: true,
            blockStartDate: "", // will be updated by dropboxSyncComplete()
            workoutDate: moment().format("YYYY-MM-DD"), // will be updated by startNewWorkout()
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
            var dropbox = this.$refs.dropbox;
            dropbox.dropboxSyncStage1();
        },
        dropboxSyncComplete: function (dropboxData) {
            this.recentWorkouts = dropboxData; // update local data with dropbox data
            localStorage["recentWorkouts"] = JSON.stringify(dropboxData); // save to local storage
            if (this.recentWorkouts.length > 0) {
                this.blockStartDate = this.recentWorkouts[0].blockStart;
            }
        },
        gotoPage: function (idx) {
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
                this.curPageIdx = 0;
                this.exercises = _newWorkout();
                globalState.calc1RM = 0;
                globalState.calcWeight = 0;
                let recentWorkoutsPanel = this.$refs.recentWorkoutsPanel;
                recentWorkoutsPanel.filterType = "nofilter";
                this.lastUsedPreset = "";
            }
            if (this.getTotalScore() == 0) {
                clearForm();
            }
            else if (confirm(warning + "Save current workout and clear form?")) {
                this.saveCurrentWorkoutToHistory();
                clearForm();
                this.syncWithDropbox();
            }
        },
        startNewWorkout: function (event) {
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
            localStorage["currentWorkout"] = JSON.stringify(this.exercises); // save to local storage
            this.outputText = _generateWorkoutText(this.exercises);
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
        showTooltip: function(recentWorkoutIdx, e) {
            let tooltip = this.$refs.tooltip;
            tooltip.show(recentWorkoutIdx, e);
        },
        hideTooltip: function() {
            let tooltip = this.$refs.tooltip;
            tooltip.hide();
        }
    },
    computed: {
        currentExercise: function() {
            return this.exercises[this.curPageIdx];
        },
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
                this.saveCurrentWorkoutToLocalStorage(); 
            },
            deep: true
        },
        lastUsedPreset: function (newValue) {
            sessionStorage.setItem("lastUsedPreset", newValue);
        }
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    button.pagebtn {
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
    }`;
                    document.head.appendChild(componentStyles);
                }
