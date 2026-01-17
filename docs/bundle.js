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
    app.component('dropbox-loader', {
    template: "    <div v-if=\"dropboxSyncInProgress\">\n"
+"        Loading {{ filename }}\n"
+"    </div>\n",
        props: {
            filename: String
        },
        setup: function (props, context) {
            let dropboxAccessToken = localStorage["dropboxAccessToken"] || "";
            const dropboxSyncInProgress = ref(false);
            if (dropboxAccessToken) {
                dropboxSyncInProgress.value = true;
                let dbx = new Dropbox.Dropbox({ accessToken: dropboxAccessToken });
                dbx.filesDownload({ path: '/' + props.filename })
                    .then(function (data) {
                        let reader = new FileReader();
                        reader.addEventListener("loadend", function () {
                            context.emit("loaded", reader.result);
                        });
                        reader.readAsText(data.fileBlob);
                        dropboxSyncInProgress.value = false;
                    })
                    .catch(function (error) {
                        console.error(error);
                        alert("Failed to download " + props.filename + " from Dropbox - " + JSON.stringify(error));
                        dropboxSyncInProgress.value = false;
                    });
            }
            return { dropboxSyncInProgress };
        }
    });
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
+"            <progress v-show=\"dropboxSyncInProgress\"></progress>\n"
+"            <span v-show=\"!!dropboxLastSyncTimestamp && !dropboxSyncInProgress\">\n"
+"                Last sync at {{ formatDate(dropboxLastSyncTimestamp, 'DD/MM/YYYY HH:mm') }}\n"
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
+"        <div class=\"header-highlight\"\n"
+"            :class=\"headerHighlightClass\"><!-- to highlight the selected exercise -->\n"
+"\n"
+"            <div style=\"padding-top: 10px; margin-top: 5px; margin-bottom: 2px; font-weight: bold\">\n"
+"                Exercise\n"
+"                <input type=\"text\" v-model=\"exercise.number\" style=\"width: 30px; font-weight: bold\" />:\n"
+"                <input type=\"text\" v-model=\"exercise.name\"   class=\"exercise-name-input\"\n"
+"                    list=\"exercise-names\" autocapitalize=\"off\" />\n"
+"            </div>\n"
+"\n"
+"            <div style=\"padding-bottom: 5px; margin-bottom: 10px; font-size: 14px\">\n"
+"                <!-- Guide -->\n"
+"                <span>\n"
+"                    <label class=\"guide-label\">Guide:&nbsp;</label>\n"
+"                    <select v-model=\"exercise.guideType\">\n"
+"                            <option v-for=\"guide in guides\"\n"
+"                                    v-bind:key=\"guide.name\"\n"
+"                                    v-bind:value=\"guide.name\"\n"
+"                                    v-bind:style=\"{ 'color': guide.weightType == '1RM' ? 'dodgerblue' : '' }\">\n"
+"                                {{ guide.name + (isDigit(guide.name[0]) ? \" reps\" : \"\") }}\n"
+"                            </option>\n"
+"                    </select>\n"
+"                </span>\n"
+"\n"
+"                <!-- Reference -->\n"
+"                <span v-if=\"false\"><!-- v-if=\"currentExerciseGuide.weightType\" -->\n"
+"\n"
+"                    <template v-if=\"currentExerciseGuide.weightType == 'WORK'\">\n"
+"                        <label style=\"margin-left: 20px\">Work weight:\n"
+"                        </label>\n"
+"                        <span v-if=\"unroundedWorkWeight\"\n"
+"                            style=\"position: absolute; margin-top: 30px; width: 69px; text-align: right; color: pink\">\n"
+"                            {{ unroundedWorkWeight.toFixed(2) }}\n"
+"                        </span>\n"
+"                        <number-input v-model=\"roundedWorkWeight\" style=\"width: 65px\" class=\"verdana\"\n"
+"                                    v-bind:class=\"{ 'missing': enterWeightMessage }\" /> kg\n"
+"                    </template>\n"
+"\n"
+"                    <template v-if=\"currentExerciseGuide.weightType == '1RM'\">\n"
+"                        <label style=\"margin-left: 20px\">1RM: \n"
+"                        </label>\n"
+"                        <number-input v-model=\"exercise.ref1RM\" style=\"width: 65px\" class=\"verdana\"\n"
+"                                    v-bind:class=\"{ 'missing': enterWeightMessage }\" /> kg\n"
+"                    </template>\n"
+"\n"
+"                    <!-- <button style=\"padding: 3px 5px\"\n"
+"                            v-on:mousedown.prevent=\"guessWeight\"\n"
+"                            v-on:contextmenu.prevent\n"
+"                            >Guess</button> -->\n"
+"                            <!-- hidden feature: different mouse button = different target\n"
+"                                                * left = average of last 10\n"
+"                                                * middle = midpoint between average and max\n"
+"                                                * right = max of last 10 -->\n"
+"                    <span v-if=\"currentExerciseGuide.weightType == 'WORK' && exercise.ref1RM\"\n"
+"                        style=\"color: pink\"> 1RM = {{ exercise.ref1RM.toFixed(1) }}</span>\n"
+"                </span>\n"
+"\n"
+"                <label style=\"margin-left: 11px\">Goal:&nbsp;</label>\n"
+"\n"
+"                <!-- Note that `goal` is saved into `exercise`, \n"
+"                    which means that it will persist between page reloads.\n"
+"                    (because of workout-calc/saveCurrentWorkoutToLocalStorage)\n"
+"                    It *won't* however be saved to workouts.json,\n"
+"                    because it's not listed in workout-calc/saveCurrentWorkoutToHistory() -->\n"
+"                <input type=\"text\" class=\"goal-input\" v-model=\"exercise.goal\" />\n"
+"            </div>\n"
+"        </div><!-- /headerHighlightClass -->\n"
+"\n"
+"        <div v-if=\"lastWeeksComment\"\n"
+"             class=\"lastweekscomment-container\"> \n"
+"                <span class=\"lastweekscomment-label\">🗨 Last week's comment:</span>\n"
+"                <div class=\"lastweekscomment\">{{ lastWeeksComment }}</div>\n"
+"                <!-- <button v-if=\"!exercise.goal\"\n"
+"                        v-bind:disabled=\"goalNumbers.length != 2\"\n"
+"                        style=\"margin-left: 5px\"\n"
+"                        v-on:click=\"getNextWeight\">Apply</button> -->\n"
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
+"                        v-bind:ref1-r-m=\"exercise.ref1RM\"\n"
+"                        v-bind:read-only=\"false\"\n"
+"                        v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:guide-name=\"exercise.guideType\"\n"
+"                        v-bind:guide=\"currentExerciseGuide\"\n"
+"                        v-bind:exercise=\"exercise\"\n"
+"                        v-bind:rest-timer=\"restTimers.length <= setIdx ? 0 : restTimers[setIdx]\"\n"
+"                        v-on:reps-entered=\"setRestTimeCurrentSet(setIdx + 1)\"\n"
+"                        v-bind:goal-work-set-reps=\"goalWorkSetReps\"\n"
+"                        v-bind:goal-work-set-weight=\"referenceWeightForGridRow\">\n"
+"                   <!-- v-bind:reference-weight=\"referenceWeightForGridRow\" -->\n"
+"                   <!-- v-model:show-r-i=\"showRI\" -->\n"
+"                    </grid-row>\n"
+"                    <tr>\n"
+"                        <!-- <td v-if=\"show1RM\"></td> -->\n"
+"                        <td style=\"vertical-align: top; padding-top: 3px;\">\n"
+"                            <button v-on:click=\"addSet\">+</button>\n"
+"                        </td>\n"
+"                        <td colspan=\"5\" class=\"verdana\"\n"
+"                            style=\"text-align: left\">\n"
+"\n"
+"                            <button v-on:click=\"showNotes = !showNotes\"\n"
+"                                    style=\"margin-right: 5px\">📝</button>\n"
+"                                    \n"
+"                            <span v-if=\"exercise.goal || exercise.next || showNotes\"\n"
+"                                  style=\"display: inline-block; padding-top: 15px\">\n"
+"                                <span style=\"font-size: 12.5px\">Next: </span>\n"
+"                                <input type=\"text\" v-model=\"exercise.next\" \n"
+"                                       class=\"next-box\" style=\"font-size: smaller\"\n"
+"                                       placeholder=\"weight x reps\" />\n"
+"                                <button v-if=\"!exercise.next\"\n"
+"                                        @click=\"guessNext\">Guess</button>\n"
+"                            </span>\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                    <tr v-if=\"showNotes\">\n"
+"                        <td colspan=\"6\">\n"
+"                            <!-- <span style=\"font-size: smaller\">Comment:</span> -->\n"
+"                            <input type=\"text\" v-model=\"exercise.comments\" \n"
+"                                    class=\"comment-box\"\n"
+"                                    style=\"font-size: smaller\"\n"
+"                                    placeholder=\"Comment\" />\n"
+"                            \n"
+"                            <span style=\"font-size: smaller\">&nbsp;&nbsp;Tag:</span>\n"
+"                            <!-- (this helps put the workout \"headlines\" in context) -->\n"
+"                            <select v-model=\"exercise.etag\"\n"
+"                                    style=\"vertical-align: top; min-height: 25px; margin-bottom: 1px; width: 45px\">\n"
+"                                <option v-bind:value=\"0\"></option>\n"
+"                                <option v-for=\"(value, key) in tagList\"\n"
+"                                        v-bind:value=\"key\"\n"
+"                                    >{{ value.emoji }} - {{ value.description }}</option>\n"
+"                            </select>\n"
+"                        </td>\n"
+"                    </tr>\n"
+"                    <tr v-if=\"showVolume\">\n"
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
+"                    <tr>\n"
+"                        <td style=\"padding-bottom: 7px\"></td>\n"
+"                    </tr>\n"
+"                </tbody>\n"
+"            </table>\n"
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
            tagList: Object,
            weekNumber: Number,
            headerHighlightClass: String,
            getNextExerciseNumber: Function
        },
        setup(props, context) {
            const lastWeeksComment = computed(() => {
                let found = props.recentWorkouts.find(z => z.name == props.exercise.name);
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
                    globalState.calcWeight = referenceWeightForGridRow.value ;// roundedWorkWeight.value;
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
                        props.exercise.sets = _newExerciseFromGuide(guide, props.exercise.number, props.exercise.name).sets;
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
            function shouldShowNotes() { 
                return !!props.exercise.comments // show if comments have been written... (e.g. on page refresh)
            }
            const showNotes = ref(shouldShowNotes());
            watch(() => props.exercise, () => {
                restTimers.value = [];
                currentSet = 0;
                unroundedWorkWeight.value = 0;
                roundedWorkWeight.value = 0;
                showNotes.value = shouldShowNotes();
            });
            const unroundedWorkWeight = ref(0);
            const roundedWorkWeight = ref(0);
            function convert1RMtoWorkSetWeight(averageMax1RM) {
                let percentage = currentExerciseGuide.value.workSets[0]; // e.g. 0.60 = 60% of 1RM
                let unrounded = averageMax1RM * percentage;
                let rounded = _roundGuideWeight(unrounded, props.exercise.name); // rounded to nearest 2 or 2.5
                return rounded;
            }
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
            const goalWorkSetReps = computed(() => {
                if (currentExerciseGuide.value.weightType == "WORK") {
                    if (props.exercise.goal) {
                        let goalParts = props.exercise.goal.split("x")
                        if (goalParts.length >= 2) {
                            return Number(goalParts[1]);
                        }
                    }
                }
                return 0;
            });
            const guideParts = _useGuideParts(toRef(() => props.exercise.guideType));
            function guessNext() {
                if (!props.exercise.goal) {
                    alert("Goal not set");
                    return;
                }
                if (props.exercise.guideType.startsWith("Double")) {
                    let nextWeight = referenceWeightForGridRow.value; // same weight as currently (this is derived from `goal`)
                    let nextReps = goalWorkSetReps.value + 1; // one more rep
                    let suffix = "";
                    if ((props.weekNumber+1) % 4 == 0) {
                        nextReps = guideParts.value.guideLowReps;
                        suffix = " x 2 (Deload)"; // 2 sets instead of 3
                    }
                    else if (nextReps > guideParts.value.guideHighReps) {
                        nextWeight = _smallIncrement(nextWeight, props.exercise.name);
                        nextReps = guideParts.value.guideLowReps;
                    }
                    props.exercise.next = nextWeight + " x " + nextReps + suffix;
                } else if (props.exercise.guideType.startsWith("Wave")) {
                    if ((guideParts.value.guideHighReps - guideParts.value.guideLowReps) != 2) {
                        alert("Only works with guides 2 reps apart, e.g. 4-6");
                        return;
                    }
                    let nextReps = goalWorkSetReps.value - 1; // reduce reps 
                    let nextWeight = _smallIncrement(referenceWeightForGridRow.value, props.exercise.name); // increase weight
                    let suffix = "";
                    if (nextReps < guideParts.value.guideLowReps) {
                        if (!props.exercise.goal.includes("Deload")) {
                            nextReps = guideParts.value.guideLowReps;
                            for (let i = 0; i < 3; i++) { // reduce weight 3 times, to get it back to the same weight...
                                nextWeight = _smallDecrement(nextWeight, props.exercise.name); // ...used at the start of this cycle
                            }
                            suffix = " x 2 (Deload)"; // 2 sets instead of 3
                        }
                        else {
                            nextReps = guideParts.value.guideHighReps;
                        }
                    }
                    props.exercise.next = nextWeight + " x " + nextReps + suffix;
                } else {
                    if (!props.exercise.guideType)
                        alert("No guide selected");
                    else
                        alert("Unknown progression strategy for guide '" + props.exercise.guideType + "'");
                }
            }
            watch(() => props.exercise.sets, () => {
                if (props.exercise.number == "A" 
                    && totalVolume.value > 0 // don't auto-number when exercise is first populated (after choosing a preset)
                    && props.getNextExerciseNumber) {
                    props.exercise.number = props.getNextExerciseNumber();
                }
            }, { deep: true });
            return { lastWeeksComment, addSet, currentExerciseHeadline, currentExerciseGuide, 
                enterWeightMessage, isDigit, totalVolume, divClicked, 
                restTimers, setRestTimeCurrentSet, guessWeight, unroundedWorkWeight, roundedWorkWeight,
                showNotes, referenceWeightForGridRow, /*showRI*/ 
                goalWorkSetReps, guessNext
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

    input.missing {
        background-color: #fee;
    }

    div.lastweekscomment-container {
        margin: 20px 0;
        font-size: 11px;
        color: #888;
    }
    @media (max-width: 768px) {
        div.lastweekscomment-container {
            margin-left: 25px;
            margin-top: 10px;
        }
    }
    div.lastweekscomment {
        background-color: #ddd; 
        color: #555; 
        width: 220px; 
        border-radius: 4px;
        padding: 4px 6px;
        vertical-align: top;
        display: inline-block;
    }
    span.lastweekscomment-label {
        display: inline-block;
        margin-top: 3px;
        margin-right: 4px;
    }

    /* .showonhover {
        opacity: 0;
    }
    .showonhover:hover {
        opacity: 1;
    } */

    .exercise-name-input {
        width: 225px;
    }
    .guide-label {
        width: 120px;
        display: inline-block;
        text-align: right;
    }
    .goal-input {
        width: 125px;
    }
    .comment-box { width: 300px; }
    .next-box { width: 140px; }

    @media (max-width: 768px) {
        /* reduce width of exercise-name-input on mobile */
        .exercise-name-input {
            width: 180px;
        }
        /* reduce amount of padding (width) of guide-label on mobile  */
        .guide-label {
            width: 71px;
        }
        /* reduce width of goal-input on mobile */
        .goal-input {
            width: 80px;
        }
        /* reduce width of comment-box on mobile */
        .comment-box { width: 200px; }
        /* reduce width of next-box on mobile */
        .next-box { width: 120px; }
    }`;
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
+"                    <option v-bind:value=\"-1\">-1&nbsp;&nbsp;&nbsp;&nbsp;Failed to meet goal</option>\n"
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
+"                          class=\"rest-input\"\n"
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
        "ref1RM": Number,
        "readOnly": Boolean, // for tooltip
        "oneRmFormula": String,
        "guide": Object,
        "exercise": Object,
        "restTimer": Number,
        "hideRirColumn": Boolean,
        "goalWorkSetReps": Number,
        "goalWorkSetWeight": Number
    },
    setup: function (props) {
        const guideWeightPlaceholder = computed(() => {
            if (props.set.type == "WK") {
                return props.goalWorkSetWeight || "";
            } 
        });
        const guideRepsPlaceholder = computed(() => {
            if (props.set.type == "WK") {
                return props.goalWorkSetReps || "";
            } 
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


    .maintable .number-input {
        width: 65px;
        border: none;
        padding-right: 18px; /* leave space for ✨ emoji */
    }

    .rir-select {
        width: 50px;
        border: none;
        padding-left: 9px;
        background-color: transparent;
    }
    @media (max-width: 768px) {
        /* reduce the width of number-input on mobile */
        .maintable .number-input {
            width: 40px;
        }
        /* reduce the width of rir-select on mobile */
        .rir-select {
            width: 35px;
            padding-left: 0;
        }
        /* reduce padding on "rest" input on mobile (to reduce its width) */
        .maintable .rest-input {
           padding-right: 8px; /* reduce from 18px (from .number-input) to 7px */
        }
    }`;
                    document.head.appendChild(componentStyles);
                }
function _getGuides() {
    var guides = [];
    guides.push({
        name: "", // default (no guide)
        category: "",
        weightType: "",
        warmUp: [],
        workSets: [1, 1, 1] // default to 3 sets for exercises without a rep guide (used by _applyPreset)
    });
    guides.push({ name: "Wave 4-6", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.70, 0.85], workSets: [1,1,1] });
    guides.push({ name: "Wave 6-8", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.75], workSets: [1,1,1] });
    guides.push({ name: "Wave 8-10", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Wave 8-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "Wave 10-12", category: "MEDIUM", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    guides.push({ name: "Double 6-8", category: "LOW", weightType: "WORK", warmUp: [0.50, 0.75], workSets: [1,1,1] });
    guides.push({ name: "Double 8-10", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 8-12", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 10-12", category: "MEDIUM", weightType: "WORK", warmUp: [0.67], workSets: [1,1,1] });
    guides.push({ name: "Double 12-15", category: "HIGH", weightType: "WORK", warmUp: [], workSets: [1,1,1] });
    return guides;
}
function _getGuidePercentages (exerciseNumber, guide) {
    var percentages = [];
    var warmUp = exerciseNumber == "1" || exerciseNumber == "1A";
    if (warmUp) {
        percentages = percentages.concat(guide.warmUp);
    }
    percentages = percentages.concat(guide.workSets);
    return percentages;
}
function _useGuideParts(guideType) {
    return computed(() => {
        if (guideType.value) {
            const regex = /(\d+)-(\d+)/;
            const match = guideType.value.match(regex);
            if (match) {
                return {
                    guideLowReps: parseInt(match[1]),
                    guideHighReps: parseInt(match[2])
                }
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

app.component('lbs-to-kg', {
    template: "    Convert lbs to kg<br />\n"
+"\n"
+"    Increment\n"
+"    <label>\n"
+"        <input type=\"radio\" :value=\"10\" v-model=\"increment\"> \n"
+"        10 lbs\n"
+"    </label>\n"
+"    <label>\n"
+"        <input type=\"radio\" :value=\"15\" v-model=\"increment\">\n"
+"        15 lbs\n"
+"    </label>\n"
+"\n"
+"    <table class=\"lbstokg-table\">\n"
+"        <thead>\n"
+"            <tr>\n"
+"                <th rowspan=\"2\">lbs</th>\n"
+"                <th rowspan=\"2\">kg</th>\n"
+"                <th colspan=\"4\">Add lbs</th>\n"
+"            </tr>\n"
+"            <tr>\n"
+"                <th>+2.5</th>\n"
+"                <th>+5.0</th>\n"
+"                <th>+7.5</th>\n"
+"                <template v-if=\"increment == 15\">\n"
+"                    <th>+10</th>\n"
+"                </template>\n"
+"            </tr>\n"
+"        </thead>\n"
+"        <tbody>\n"
+"            <tr v-for=\"row in rows\"\n"
+"                :class=\"{ 'lbstokg-highlight': row.highlight }\">\n"
+"                <td>{{ row.weightLbs }}</td>\n"
+"                <td v-for=\"(kgWeight, idx) in row.kgWeights\"\n"
+"                    :style=\"{ 'font-weight': idx == 0 ? 'bold' : null }\"\n"
+"                    :class=\"{ 'lbstokg-highlight': kgWeight == globalState.calcWeight }\">\n"
+"                    {{ kgWeight }}\n"
+"                </td>\n"
+"            </tr>\n"
+"        </tbody>\n"
+"    </table>\n",
    setup() {
        const increment = ref(15);
        function lbsToKg(lbs) {
            return Math.round(lbs * 0.453592);
        }
        const rows = computed(() => {
            let output = [];
            let startingWeight = 10; // start at 10lbs
            for (let i = 0; i < 15; i++) {
                let baseWeight = startingWeight + (i * increment.value);
                let kgWeights = [
                    lbsToKg(baseWeight),
                    lbsToKg(baseWeight + 2.5),
                    lbsToKg(baseWeight + 5),
                    lbsToKg(baseWeight + 7.5)
                ];
                if (increment.value == 15)
                    kgWeights.push(lbsToKg(baseWeight + 10));
                let thisKgWeight = lbsToKg(baseWeight); // for highlight
                let nextKgWeight = lbsToKg(baseWeight + increment.value); // for highlight
                output.push({
                    weightLbs: baseWeight,
                    kgWeights,
                    highlight: globalState.calcWeight >= thisKgWeight && globalState.calcWeight < nextKgWeight
                });
            }
            return output;
        });
        return { rows, increment, globalState };
    }
});
                {   // this is wrapped in a block because there might be more than 
                    // one component with styles, in which case we will have 
                    // multiple 'componentStyles' variables and don't want them to clash!
                    const componentStyles = document.createElement('style');
                    componentStyles.textContent = `    .lbstokg-table  {
        border-collapse: collapse;
        font-size: 14px;
    }
    .lbstokg-table th {
        background-color: darkgray;
        color: white;
        padding: 2px 0;
    }
    .lbstokg-table td {
        padding: 3px 8px 3px 15px;
        border: solid 1px darkgray;
        min-width: 20px;
    }
    .lbstokg-table td {
        text-align: right;
    }

    tr.lbstokg-highlight { 
        background-color: yellow;
    }
    td.lbstokg-highlight {
        background-color: gold;
    }`;
                    document.head.appendChild(componentStyles);
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
function _parsePresets(str) {
    var presets = [];
    if (!str) return [];
    var lines = str.split(/\r?\n/); // optional \r followed by \n (to handle both Unix \n and Windows \r\n newlines)
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
function _applyPreset(preset, weekNumber, guides, recentWorkouts) {
    let exercises = [];
    preset.exercises.forEach(function (preset) {
        let guideName = preset.guide; // e.g. a guide like "12-14"
        guideName = guideName.replace(/^D/, "Double ");
        guideName = guideName.replace(/^W/, "Wave ");
        guideName = guideName.replace(/^L/, "Linear "); // not currently used but might be in future
        let guide = guides.find(g => g.name == guideName);
        let exercise = _newExerciseFromGuide(guide, preset.number, preset.name);
        exercise.name = preset.name;
        exercise.guideType = guideName;
        exercise.goal = extractGoalFromPreviousComment(recentWorkouts, exercise.name)
        exercises.push(exercise);
    });
    return exercises;
}
function _newExerciseFromGuide(guide, exerciseNumber, exerciseName) {
    let exercise;
    if (guide) {
        let doWarmup = exerciseNumber == "1" || exerciseNumber == "1A" || exerciseName.endsWith("machine");
        let warmUpSets = doWarmup ? guide.warmUp.length : 0; // warmup on 1st exercise only
        exercise = _newExercise(exerciseNumber, warmUpSets, guide.workSets.length);
    } else {
        exercise = _newExercise(exerciseNumber, 0, 3);
    }
    return exercise;
}
function extractGoalFromPreviousComment(recentWorkouts, exerciseName) {
    let found = recentWorkouts.find(z => z.name == exerciseName);
    if (found) {
        let daysDiff = moment().diff(found.date, "days");
        if (daysDiff < 17) { // Oct'25: only apply the goal if the previous workout was less than 17 days ago
            if (found.next) {
                return found.next; // 22/06/25 added new field `next` to use instead of `comments`
            } else if (found.etag == "DL" && found.goal) {
                return found.goal;
            }
        }
    }
    return null;
}

app.component('prev-table', {
    template: "    <div class=\"prev-container\">\n"
+"        \n"
+"        <h3 style=\"color: #aaa\">{{ currentExerciseName }}</h3>\n"
+"\n"
+"        <div v-if=\"daysSinceLastWorked > 8\"\n"
+"             class=\"days-since\"\n"
+"            :class=\"daysSinceLastWorked > 16 ? 'days-since-red' : 'days-since-orange'\">\n"
+"            <!-- see also presets.ts / extractGoalFromPreviousComment(), \n"
+"                 where goals are discarded after 16 days -->\n"
+"            {{ daysSinceLastWorked }} days since last worked\n"
+"        </div>\n"
+"\n"
+"        <label>\n"
+"            <input type=\"checkbox\" v-model=\"colourRir\"> Colour RIR\n"
+"        </label>\n"
+"        <label v-if=\"colourRir\">\n"
+"            <input type=\"checkbox\" v-model=\"colourRirBW\"> B&amp;W\n"
+"        </label>\n"
+"\n"
+"        <table border=\"1\" class=\"prev-table\">\n"
+"            <thead>\n"
+"                <tr>\n"
+"                    <th colspan=\"4\">Previous workouts</th>\n"
+"                </tr>\n"
+"                <tr>\n"
+"                    <th @click=\"dateDisplayType++\">Date</th>\n"
+"                    <th>Load</th>\n"
+"                    <th>Reps</th>\n"
+"                    <th>Volume</th>\n"
+"                </tr>\n"
+"            </thead>\n"
+"            <tbody>\n"
+"                <tr v-for=\"row in table\"\n"
+"                    v-on:mousemove=\"showTooltip(row.idx, $event)\" v-on:mouseout=\"hideTooltip\"\n"
+"                    v-bind:class=\"row.isDeload ? 'deload' : ''\">\n"
+"                    <td :style=\"row.borderStyle\">\n"
+"                        <template v-if=\"dateDisplayType % 3 == 0\">\n"
+"                            {{ row.formattedDate.monthDay }}<span class=\"ordinal\">{{ row.formattedDate.ordinal }}</span>\n"
+"                        </template>\n"
+"                        <template v-else-if=\"dateDisplayType % 3 == 1\">\n"
+"                            {{ row.weeksRounded }}w <span class=\"days\">{{ row.daysOffset }}d</span>\n"
+"                        </template>\n"
+"                        <template v-else-if=\"dateDisplayType % 3 == 2\">\n"
+"                            {{ row.daysSinceLastWorked }}\n"
+"                        </template>\n"
+"                    </td>\n"
+"                    <td :style=\"row.borderStyle\">{{ row.load }}</td>\n"
+"                    <td :style=\"row.borderStyle\">\n"
+"                        <span v-for=\"(rep, idx) in row.reps\"\n"
+"                            v-bind:class=\"[\n"
+"                                colourRir && rep.rir != null && 'rir',\n"
+"                                colourRir && 'rir' + rep.rir + (colourRirBW ? 'bw' : ''),\n"
+"                                rep.isMaxWeight ? null : 'not-max'\n"
+"                            ]\"\n"
+"                            >{{ rep.reps }}{{ idx != row.reps.length - 1 && (!colourRir || rep.rir == null) ? ', ' : ''}}</span>\n"
+"                    </td>\n"
+"                    <td :style=\"row.borderStyle\">{{ row.volume.toLocaleString() }}</td>\n"
+"                </tr>\n"
+"            </tbody>\n"
+"        </table>\n"
+"        <pre style=\"color: #bbb\">\n"
+"<!-- Gray background = Deload week -->\n"
+"<!-- POSSIBLE TODO: highlight rows in gray which have only 2 work sets (instead of the usual 3) -->\n"
+"Deloads:\n"
+"* Every 4 weeks\n"
+"* Lowest reps in range x 2 sets\n"
+"\n"
+"Example 1 (wave loading):\n"
+"Week 1: 100 x 6 (3 sets)\n"
+"Week 2: 105 x 5 (3 sets)\n"
+"Week 3: 110 x 4 (3 sets)\n"
+"Week 4: 100 x 4 (2 sets, deload)\n"
+"Week 5: 105 x 6 (3 sets)\n"
+"\n"
+"Example 2 (double progression):\n"
+"Week 1: 18 x 12,12,12\n"
+"Week 2: 18 x 13,13,13\n"
+"Week 2: 18 x 14,13,14\n"
+"Week 3: 18 x 14,14,14\n"
+"Week 4: 18 x 12,12 (deload)\n"
+"Week 5: 18 x 15,14,14\n"
+"        </pre>\n"
+"\n"
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
                if (numberDone++ > 11) return;
                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
                let maxWeight = workSets.reduce(function(acc, set) { return Math.max(acc, set.weight) }, 0); // highest weight
                const daysAgo = moment().diff(exercise.date, 'days'); // example: 9 weeks and 6 days
                const weeksRounded = Math.round(daysAgo / 7); // rounds to 10 weeks
                const daysOffset = daysAgo - (weeksRounded * 7); // 69 - (10 * 7) = -1
                data.push({
                    idx: exerciseIdx, // needed for displaying tooltip
                    date: exercise.date, // used in `daysSinceLastWorked` calculation below
                    formattedDate: {
                        monthDay: _formatDate(exercise.date, "MMM D"),
                        ordinal: _formatDate(exercise.date, "Do").replace(/\d+/g, ''), // remove digits from string, e.g. change "21st" to "st"
                    },
                    weeksRounded: weeksRounded,
                    daysOffset: daysOffset,
                    daysSinceLastWorked: null, // set below
                    borderStyle: {}, // set below
                    load: maxWeight,
                    reps: workSets.map(z => ({ 
                        reps: z.reps, 
                        isMaxWeight: z.weight == maxWeight, 
                        rir: z.rir })),
                    volume: volume,
                    isDeload: exercise.guideType == 'Deload' || workSets.length == 2 || exercise.etag == "DL"
                })
            });
            let prevDate = "";
            for (let i = data.length - 1; i >= 0; i--) {
                if (prevDate) {
                    let date1 = moment(data[i].date).startOf("day");
                    let date2 = moment(prevDate).startOf("day");
                    data[i].daysSinceLastWorked = date1.diff(date2, "days");
                    data[i].borderStyle = { 'border-bottom-width': Math.round(data[i].daysSinceLastWorked / 3.5) + 'px' };
                }
                prevDate = data[i].date;
            }
            if (data.length > 10)
                data.pop(); // remove extra item (see `numberDone` note above)
            return data;
        });
        function showTooltip(recentWorkoutIdx, e) {
            context.emit("show-tooltip", recentWorkoutIdx, e);
        }
        function hideTooltip() {
            context.emit("hide-tooltip");
        }
        const colourRir = ref(false);
        const colourRirBW = ref(false);
        const dateDisplayType = ref(0);
        const daysSinceLastWorked = computed(() => {
            if (table.value.length == 0)
                return 0;
            let firstRow = table.value[0];
            let exercise = props.recentWorkouts[firstRow.idx];
            let date1 = moment().startOf("day"); // today's date
            let date2 = moment(exercise.date).startOf("day");
            return date1.diff(date2, "days");
        });
        return { table, showTooltip, hideTooltip, colourRir, colourRirBW, 
            dateDisplayType, daysSinceLastWorked
         };
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
        color: gray;
    }
    .prev-table tr:hover td {
        background-color: #fe9;
        /* color: black; */
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
    .prev-table span.days {
        color: silver;
        font-size: 70%; 
    }

    span.rir {
        display: inline-block;
        min-width: 21px;
    }
    .rir-1 {
        background-color: firebrick;
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
        background-color: green; /* possibly change to skyblue */
    }

    /* .rir-1bw {
        background-color: firebrick;
        color: white;
        text-decoration: line-through;
    }
    .rir0bw {
        background-color: red;
        color: #fc0;
    }
    .rir1bw {
        background-color: orange;
    }
    .rir2bw {
        background-color: #fe9;
    }
    .rir3bw {
        background-color: #afe;
    }
    .rir4bw,
    .rir5bw {
        background-color: lightcyan;
        color: darkgray;
    } */

    .rir-1bw {
        background-color: #a20;
        color: white;
    }
    .rir0bw {
        background-color: #f60;
    }
    .rir1bw {
        background-color: #fa0;
    }
    .rir2bw {
        background-color: #fca;
    }
    .rir3bw {
        background-color: #fec;
    }
    .rir4bw,
    .rir5bw {
        background-color: #fff;
    }

    .days-since {
        margin-bottom: 13px;
        font-weight: bold;
        width: fit-content; /* alternative to display: inline-block */
        padding: 0 3px;
    }
    .days-since-orange {
        color: darkgoldenrod;
    }
    .days-since-red {
        background-color: crimson;
        color: white;
    }`;
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
+"                        <!-- <th>Max</th> -->\n"
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
+"                        <!--<td class=\"pre\">\n"
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
+"                                 --><!-- Help link: also used in grid-row.vue --><!--\n"
+"                                <a href=\"https://legionathletics.com/double-progression/#:~:text=miss%20the%20bottom%20of%20your%20rep%20range\"\n"
+"                                   class=\"emoji\" target=\"_blank\">ℹ</a>\n"
+"                            </template>\n"
+"                        </td>-->\n"
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
            for (let i = (startIdx + 1); i < (startIdx + 100); i++) {
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
        watch([filterType, numberOfRecentWorkoutsToShow, () => props.recentWorkouts, () => props.currentExerciseName], () => {
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
                let totalVolume = _calculateTotalVolume(exercise);
                let relativeDateString = moment(exercise.date).from(today); // e.g. "5 days ago"
                if (relativeDateString == "a few seconds ago")
                    relativeDateString = "today";
                else if (relativeDateString == "a day ago")
                    relativeDateString = "yesterday";
                summaries.push({
                    "idx": exerciseIdx, // needed for displaying tooltips and deleting items from history
                    "exercise": exercise, // to provide access to date, name, comments, etag, guideType
                    "headlineWeight": headlineWeight.toString(),
                    "headlineReps": repsDisplayString,
                    "headlineNumSets": headlineNumSets,
                    "totalVolume": totalVolume,
                    "daysSinceLastWorked": daysSinceLastWorked,
                    "relativeDateString": relativeDateString
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
+"                <th style=\"background-color: white; border-top-color: white; border-left-color: white\"></th>\n"
+"                <th colspan=\"3\">Weight</th>\n"
+"            </tr>\n"
+"            <tr>\n"
+"                <th>Reps</th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model.number=\"lowerWeight\" /></th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model.number=\"globalState.calcWeight\" /></th>\n"
+"                <th style=\"padding: 0\"><input size=\"4\" style=\"text-align: right\" v-model.number=\"higherWeight\" /></th>\n"
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
+"                    <input size=\"4\" style=\"text-align: right\" v-model.number=\"globalState.calcWeight\" />\n"
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
    template: "    <div>\n"
+"        Calculate weight/% from one rep max\n"
+"        <div style=\"font-style: italic; font-size: 87%; color: silver\">How much weight am I capable of lifting?</div>\n"
+"        <table border=\"1\" class=\"rmtable\">\n"
+"            <thead>\n"
+"                <tr>\n"
+"                    <th>Reps</th>\n"
+"                    <th>Weight</th>\n"
+"                    <th style=\"min-width: 53px\">Percent</th>\n"
+"                </tr>\n"
+"            </thead>\n"
+"            <tbody>\n"
+"                <tr><!-- first row: enter 1RM -->\n"
+"                    <td>1</td>\n"
+"                    <td>One rep max:<br />\n"
+"                        <input v-bind:value=\"modelValue\"\n"
+"                               v-on:input=\"$emit('update:modelValue', Number($event.target.value))\"\n"
+"                               size=\"4\" style=\"text-align: right\" />\n"
+"                    </td>\n"
+"                    <td>100%</td>\n"
+"                </tr>\n"
+"                <tr v-for=\"row in tableRows\"\n"
+"                    v-bind:class=\"row.reps >= guideParts.guideLowReps && row.reps <= guideParts.guideHighReps ? 'weekreps' + row.reps : ''\">\n"
+"                    <td>{{ row.reps }}</td>\n"
+"                    <td>{{ row.weight.toFixed(1) }} kg</td>\n"
+"                    <td>{{ row.percentage.toFixed(1) }}%</td>\n"
+"                </tr>\n"
+"            </tbody>\n"
+"        </table>\n"
+"    </div>\n",
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String,
        modelValue: Number // currentExercise.ref1RM
    },
    setup(props) {
        const guideParts = _useGuideParts(toRef(props, "guideType"));
        const tableRows = computed(() => {
            let replist = [];
            if (props.modelValue > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps - 2; i <= guideParts.value.guideHighReps + 2; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            var rows = [];
            for (let reps of replist) {
                let weight = _oneRmToRepsWeight(props.modelValue, reps, props.oneRmFormula);
                if (weight != -1) {
                    rows.push({
                        reps: reps,
                        weight: weight,
                        percentage: !props.modelValue ? 0 : ((weight * 100) / props.modelValue)
                    });
                }
            }
            return rows;
        });
        watch(() => props.ref1RM, newValue => {
            globalState.calc1RM = newValue; // used by <rm-calc>, <rm-calc-2d> and <relative-intensity>
        }, { immediate: true });
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
function _smallIncrement(weight, exerciseName) {
    if ((exerciseName || '').endsWith('machine')) return weight + 2; // adjust by 2kg (approx 5lbs)
    if ((exerciseName || '').includes('db ')) return weight + 1;
    if ((exerciseName || '').startsWith('leg ')) return weight + 1.25;
    return weight + ((weight % 2.5 == 0) ? 1 : 1.5);
}
function _smallDecrement(weight, exerciseName) {
    if ((exerciseName || '').endsWith('machine')) return weight - 2; // adjust by 2kg (approx 5lbs)
    if ((exerciseName || '').includes('db ')) return weight - 1;
    if ((exerciseName || '').startsWith('leg ')) return weight - 1.25;
    return weight - ((weight % 2.5 == 0) ? 1.5 : 1);
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
    for (var s = 0; s < warmUpSets; s++) { // for each set (`numberOfSets` in total)
        sets.push(_newSet("WU"));
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
    return exercise.sets.reduce((acc, set) => acc + _volumeForSet(set), 0); // sum array
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
function _getWeekNumber(blockStartDate, workoutDate) {
    if (!blockStartDate || !workoutDate) {
        return { weekNumber: null, dayNumber: null };
    }
    const refTime = new Date(blockStartDate).getTime();
    const woTime = new Date(workoutDate).getTime();
    if (isNaN(refTime) || isNaN(woTime)) {
        return { weekNumber: null, dayNumber: null };
    }
    const diffMs = woTime - refTime;
    const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) {
        return { weekNumber: null, dayNumber: null };
    }
    return {
        weekNumber: Math.floor(daysDiff / 7) + 1,
        dayNumber: (daysDiff % 7) + 1,
    };
}

app.component('tool-tip', {
    template: "    <div id=\"tooltip\" v-show=\"tooltipVisible && tooltipIdx != -1\" ref=\"elementRef\">\n"
+"        <table>\n"
+"            <tbody>\n"
+"                <template v-if=\"debuggingInformation\">\n"
+"                    <tr>\n"
+"                        <td colspan=\"99\" style=\"white-space: pre-line\">{{ debuggingInformation }}</td>\n"
+"                    </tr>\n"
+"                </template>\n"
+"                <template v-else><!-- BEGIN hide all but debugging information -->\n"
+"                \n"
+"                <tr>\n"
+"                    <td v-bind:colspan=\"colspan1 - 1\">Date</td>\n"
+"                    <td v-bind:colspan=\"colspan2 + 1\"\n"
+"                        style=\"padding-left: 5px\">{{ formatDate(tooltipData.date) }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"!!tooltipData.guideType\">\n"
+"                    <td v-bind:colspan=\"colspan1 - 1\">Guide</td>\n"
+"                    <td v-bind:colspan=\"colspan2 + 1\">{{ tooltipData.guideType }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"!!tooltipData.goal\">\n"
+"                    <td v-bind:colspan=\"colspan1 - 1\">Goal</td>\n"
+"                    <td v-bind:colspan=\"colspan2 + 1\">{{ tooltipData.goal }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"!!tooltipData.ref1RM && currentExerciseGuide.weightType != 'WORK'\">\n"
+"                    <td v-bind:colspan=\"colspan1 - 1\">Ref. 1RM</td>\n"
+"                    <td v-bind:colspan=\"colspan2 + 1\"\n"
+"                        v-bind:class=\"{ oneRepMaxExceeded: maxEst1RM > tooltipData.ref1RM }\">\n"
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
+"                <tr v-if=\"!!tooltipData.next\">\n"
+"                    <td v-bind:colspan=\"colspan1 - 1\">Next</td>\n"
+"                    <td v-bind:colspan=\"colspan2 + 1\">{{ tooltipData.next }}</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr><!-- v-if=\"showVolume\" -->\n"
+"                    <td v-bind:colspan=\"colspan1\">Work Sets volume</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ workSetsVolume.toLocaleString() }} kg</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr><!-- v-if=\"showVolume\" -->\n"
+"                    <td v-bind:colspan=\"colspan1\">Total volume</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ totalVolume.toLocaleString() }} kg</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr>\n"
+"                    <td v-bind:colspan=\"colspan1\">Max est. 1RM</td>\n"
+"                    <td v-bind:colspan=\"colspan2\">{{ maxEst1RM }} kg</td>\n"
+"                </tr>\n"
+"\n"
+"                <tr v-if=\"tooltipData.comments\">\n"
+"                    <td v-bind:colspan=\"colspan1 + colspan2\"\n"
+"                        class=\"comment\"\n"
+"                        >💬 &quot;{{ tooltipData.comments }}&quot;</td>\n"
+"                </tr>\n"
+"            </template><!-- END hide all but debugging information -->\n"
+"            </tbody>\n"
+"        </table>\n"
+"    </div>\n",
    props: {
        recentWorkouts: Array,
        showVolume: Boolean,
        oneRmFormula: String,
        guides: Array
    },
    setup: function(props) { 
        const tooltipIdx = ref(-1);
        const tooltipData = computed(function()  {
            if (tooltipIdx.value == -1 // nothing selected
                || tooltipIdx.value >= props.recentWorkouts.length) { // outside array bounds
                return {
                    number: "",
                    name: "",
                    sets: [],
                    ref1RM: 0,
                    comments: "",
                    etag: "",
                    guideType: "",
                    warmUp: "",
                    goal: "",
                    id: 0,
                    date: "",
                    blockStart: "", // date
                    weekNumber: 0
                }
            } else {
                return props.recentWorkouts[tooltipIdx.value];
            }
        });
        const hideRirColumn = computed(() => {
            let setsWithoutRir = tooltipData.value.sets.filter(z => !z.rir).length;
            return (setsWithoutRir == tooltipData.value.sets.length);
        });
        const currentExerciseGuide = computed(() => {
            for (var i = 0; i < props.guides.length; i++) {
                if (props.guides[i].name == tooltipData.value.guideType)
                    return props.guides[i];
            }
            return props.guides[0]; // not found - return default (empty) guide
        });
        const colspan1 = computed(() => {
            let span = 3;
            if (!hideRirColumn.value)
                span += 1;
            if (currentExerciseGuide.value.weightType == "1RM")
                span += 1;
            return span;
        });
        const colspan2 = computed(() => {
            return props.showVolume ? 2 : 1;
        });
        const totalVolume = computed(() => {
            return _calculateTotalVolume(tooltipData.value);
        });
        const workSetsVolume = computed(() => {
            let workSets = tooltipData.value.sets.filter(z => z.type == "WK");
            let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
            return volume;
        });
        const maxEst1RM = computed(() => {
            return _calculateMax1RM(tooltipData.value.sets, props.oneRmFormula);
        });
        const debuggingInformation = ref("");
        const elementRef = ref(null);
        function moveTooltip(e) {
            let tooltip = elementRef.value;
            let popupWidth = tooltip.offsetWidth; // using offsetWidth instead of clientWidth to ensure the border is included
            let overflowX = (popupWidth + e.clientX + 5) > document.documentElement.clientWidth; // would it disappear off the right edge of the page?
            let leftPos = (overflowX ? e.pageX - popupWidth - 5 : e.pageX + 5);
            if (leftPos < 0) leftPos = 0; // prevent tooltip from disappearing off left edge of screen
            tooltip.style.left = leftPos + "px";
            let popupHeight = tooltip.offsetHeight; // using offsetHeight instead of clientHeight to ensure the border is included
            let underflowY = (e.clientY - (popupHeight + 10)) < 0; // would it disappear off the top of the page?
            let topPos = (underflowY ? e.pageY + 10 : e.pageY - popupHeight - 10);
            tooltip.style.top = topPos + "px";
        }
        const tooltipVisible = ref(false);
        function show(recentWorkoutIdx, e) { // this function is called by parent (via $refs) so name/params must not be changed
            tooltipIdx.value = recentWorkoutIdx;
            if (!tooltipVisible.value) {
                tooltipVisible.value = true;
                nextTick(() => { moveTooltip(e) }); // allow tooltip to appear before moving it
            } else {
                moveTooltip(e);
            }
        }
        function hide() { // this function is called by parent (via $refs) so name/params must not be changed
            tooltipVisible.value = false;
        }
        return { elementRef, tooltipVisible, tooltipIdx, 
            debuggingInformation,
            colspan1, colspan2, tooltipData,
            currentExerciseGuide, maxEst1RM, 
            hideRirColumn, 
            totalVolume, workSetsVolume, 
            show, hide, // `show` and `hide` are called by parent component
            formatDate: _formatDate
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
        border: solid 5px #ddd;
        z-index: 100; /* so it appears in front of "top-nav-bar" on mobile */
    }
    #tooltip table {
        border-collapse: collapse;
        border: solid 1px black;
    }
    #tooltip td {
        text-align: right;
        padding: 3px 5px 3px 5px;
        border: dotted 1px gray;
    }
    #tooltip td.comment {
        text-align: left;
        padding-left: 5px;
    }

    #tooltip th {
        background-color: #e8e8b6;
        width: 40px;
        min-width: 40px;
    }
    #tooltip th:first-child {
        width: 55px; /* make first column a little wider */
        min-width: 55px;
    }
    #tooltip th:last-child {
        width: 60px; /* make last column wider */
        min-width: 60px;
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
                let { weekNumber } = _getWeekNumber(exercise.blockStart, exercise.date);
                if (weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = weekNumber - 1; // e.g. week 1 is [0]
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
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"Avg1RM\" />Avg <span style=\"font-size: smaller\">1RM</span></label>\n"
+"        <label><input type=\"radio\" v-model=\"valueToDisplay\" value=\"Max1RM\" />Max <span style=\"font-size: smaller\">1RM</span></label>\n"
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
                let workSets = exercise.sets.filter(z => z.type == "WK");
                let volume = workSets.reduce((acc, set) => acc + _volumeForSet(set), 0);
                return {
                    weight: headlineWeight,
                    reps: headlineReps,
                    headlineString: headlineWeight + " x " + repsDisplayString,
                    singleSetOnly: headlineNumSets == 1,
                    idx: exerciseIdx, // for tooltip
                    guideMiddle: guideMiddleNumber(exercise.guideType),
                    value: valueToDisplay.value == "volume" ? volume
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
            function emptyCell() { return { weight: 0, reps: 0, headlineString: "", singleSetOnly: false, idx: -1, guideMiddle: 0, value: null } }
            props.recentWorkouts.forEach(function (exercise, exerciseIdx) {
                if (exercise.name == "DELETE") return;
                if (exercise.name != props.currentExerciseName) return;
                if (exerciseIdx > 1000) return; // stop condition #1: over 1000 exercises scanned
                let { weekNumber } = _getWeekNumber(exercise.blockStart, exercise.date);
                if (weekNumber) {
                    if (columnHeadings.indexOf(exercise.blockStart) == -1) { // column does not exist
                        if (columnHeadings.length == 6) {
                            return; // stop condition #2: don't add more than 6 columns to the table
                        }
                        columnHeadings.push(exercise.blockStart); // add new column
                    }
                    var colIdx = columnHeadings.indexOf(exercise.blockStart);
                    var rowIdx = weekNumber - 1; // e.g. week 1 is [0]
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
            let normalizedValue = (value - minValue) / divideBy;
            let intensity = Math.pow(normalizedValue, 2.2);
            let gb = 255 - Math.round(intensity * 255);
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
                    componentStyles.textContent = `    .weekreps {
        background-color: #eee; /* so the background of the "set" column matches div.leftline.weekreps0 (defined in workout-calc) */
    }
    .weekreps1,
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
+"\n"
+"        <div class=\"top-nav-bar hide-on-desktop\">\n"
+"            <button class=\"top-nav-button\"\n"
+"                    @click=\"changeMobileView(1)\" \n"
+"                    :class=\"{ 'selected': showWorkout }\">Workout</button>\n"
+"            <button class=\"top-nav-button\"\n"
+"                    @click=\"changeMobileView(2)\" \n"
+"                    :class=\"{ 'selected': showPreviousTable }\">History</button>\n"
+"            <button class=\"top-nav-button\"\n"
+"                    @click=\"changeMobileView(3)\" \n"
+"                    :class=\"{ 'selected': showCalculator }\">Calc</button>\n"
+"            <button class=\"top-nav-button\" \n"
+"                    @click=\"changeMobileView(4)\" \n"
+"                    :class=\"{ 'selected': showTables }\">Tables</button>\n"
+"            <button class=\"top-nav-button\" \n"
+"                    @click=\"changeMobileView(5)\" \n"
+"                    :class=\"{ 'selected': showSettings }\">⚙️</button>\n"
+"        </div>\n"
+"\n"
+"        <div class=\"right-div\"\n"
+"             style=\"font-size: smaller; text-align: right\">\n"
+"\n"
+"            <div v-show=\"showSettings\">\n"
+"                <span>One Rep Max Formula\n"
+"                    <select v-model=\"oneRmFormula\">\n"
+"                        <option>Brzycki/Epley</option>\n"
+"                        <option>Brzycki</option>\n"
+"                        <option>Brzycki 12+</option>\n"
+"                        <option>McGlothin</option>\n"
+"                        <option>Epley</option>\n"
+"                        <option>Wathan</option>\n"
+"                        <option>Mayhew et al.</option>\n"
+"                        <option>O'Conner et al.</option>\n"
+"                        <option>Lombardi</option>\n"
+"                    </select>\n"
+"                    <br />\n"
+"                </span>\n"
+"                \n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"globalState.includeRirInEst1RM\" />\n"
+"                    Include RIR\n"
+"                </label>\n"
+"                <br /><br />\n"
+"                \n"
+"                <div>\n"
+"                    <label>\n"
+"                        <input type=\"checkbox\" v-model=\"showVolume\" /> Show volume\n"
+"                    </label>\n"
+"                </div>\n"
+"            \n"
+"                <br />\n"
+"\n"
+"                <!-- <div style=\"float: left\">\n"
+"                    <guide-info-table v-bind:week-number=\"weekNumber\"\n"
+"                                    v-bind:current-exercise-name=\"currentExercise.name\" \n"
+"                                    v-bind:presets=\"presets\"\n"
+"                                    v-bind:workout-preset=\"lastUsedPreset\" />\n"
+"                </div> -->\n"
+"\n"
+"                Block start date<br />\n"
+"                <input type=\"text\" style=\"width: 80px\" v-model=\"blockStartDate\" \n"
+"                        placeholder=\"YYYY-MM-DD\" />\n"
+"\n"
+"                <br /><br />\n"
+"\n"
+"                <div style=\"display: inline-block; text-align: left\">\n"
+"                    Workout date<br />\n"
+"                    <input type=\"text\" style=\"width: 80px\" v-model=\"workoutDate\" />\n"
+"                </div>\n"
+"\n"
+"                <br /><br />\n"
+"\n"
+"                Week number<br />\n"
+"                <template v-if=\"wk.weekNumber != null\">\n"
+"                    Wk <b>{{ wk.weekNumber }}</b>\n"
+"                    <span style=\"color: silver\">.{{ wk.dayNumber }}</span>\n"
+"                </template>\n"
+"                <template v-else>\n"
+"                    Invalid date\n"
+"                </template>\n"
+"                <br /><br />\n"
+"            </div><!-- /showSettings -->\n"
+"            \n"
+"            \n"
+"            <label class=\"hide-on-mobile\"\n"
+"                   style=\"float: right\">\n"
+"                <input type=\"checkbox\" v-model=\"showTables\" />\n"
+"                Show tables\n"
+"            </label>\n"
+"\n"
+"            <div v-show=\"showTables\">\n"
+"                <div style=\"float: left\">{{ currentExercise.name }}</div>\n"
+"                <div style=\"clear: both\"></div>\n"
+"\n"
+"                <week-table v-if=\"currentExercise.name\"\n"
+"                            v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                            v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"                            v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                            v-on:show-tooltip=\"showTooltip\"\n"
+"                            v-on:hide-tooltip=\"hideTooltip\" />\n"
+"                <br />\n"
+"                <volume-table v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                              v-bind:current-workout=\"exercises\"\n"
+"                              v-bind:workout-date=\"workoutDate\" />\n"
+"            </div><!-- /showTables -->\n"
+"        </div>\n"
+"\n"
+"        <div class=\"middle-div\">\n"
+"\n"
+"            <button v-if=\"!showWorkout || !showSettings\"\n"
+"                    class=\"hide-on-mobile\"\n"
+"                    @click=\"resetView\"\n"
+"            >Reset view</button>\n"
+"\n"
+"            <div class=\"hide-on-mobile\"\n"
+"                 style=\"font-size: smaller; text-align: right\">\n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"showPreviousTable\" />\n"
+"                    Show previous\n"
+"                </label>\n"
+"                <label>\n"
+"                    <input type=\"checkbox\" v-model=\"showCalculator\" />\n"
+"                    Show calculator\n"
+"                </label>\n"
+"            </div>\n"
+"\n"
+"            <div v-show=\"showCalculator\">\n"
+"                <br />\n"
+"                <rm-table v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:ref1-r-m=\"currentExercise.ref1RM\"\n"
+"                        v-bind:guide-type=\"currentExercise.guideType\"\n"
+"                        v-model=\"currentExercise.ref1RM\"\n"
+"                ></rm-table>\n"
+"             \n"
+"                <br />\n"
+"                <lbs-to-kg />\n"
+"                \n"
+"                <div class=\"hide-on-mobile\"\n"
+"                    style=\"font-size: smaller; text-align: left; margin: 10px 0\">\n"
+"                    <label>\n"
+"                        <input type=\"checkbox\" v-model=\"showCalculator2\" />\n"
+"                        Show second calculator\n"
+"                    </label>\n"
+"                </div>\n"
+"\n"
+"                <rm-table v-show=\"showCalculator2\"\n"
+"                          v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                          v-bind:ref1-r-m=\"currentExercise.ref1RM\"\n"
+"                          v-bind:guide-type=\"currentExercise.guideType\"\n"
+"                          v-model=\"globalState.calc1RM\"\n"
+"                ></rm-table>\n"
+"            </div>\n"
+"\n"
+"            <prev-table v-show=\"showPreviousTable\"\n"
+"                        v-bind:recent-workouts=\"recentWorkouts\"\n"
+"                        v-bind:current-exercise-name=\"currentExercise.name\" \n"
+"                        v-on:show-tooltip=\"showTooltip\"\n"
+"                        v-on:hide-tooltip=\"hideTooltip\" />\n"
+"            <!-- <relative-intensity v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                                v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"            ></relative-intensity> -->\n"
+"\n"
+"            <!-- <br />\n"
+"            <rm-calc v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                     v-bind:guide-type=\"currentExercise.guideType\"\n"
+"            ></rm-calc>\n"
+"            <br />\n"
+"            <rm-calc-2d v-bind:one-rm-formula=\"oneRmFormula\"\n"
+"                        v-bind:guide-type=\"currentExercise.guideType\"\n"
+"                        v-bind:current-exercise-name=\"currentExercise.name\"\n"
+"            ></rm-calc-2d>-->\n"
+"        </div>\n"
+"\n"
+"        <div v-show=\"showWorkout\">\n"
+"            <!-- <div style=\"display: inline-block; min-width: 298px\">\n"
+"                <button v-for=\"(exercise, idx) in exercises\"\n"
+"                        v-on:click=\"gotoPage(idx)\"\n"
+"                        class=\"pagebtn\"\n"
+"                        v-bind:class=\"{ activeBtn: curPageIdx == idx }\">\n"
+"                    {{ exercise.number }}\n"
+"                </button>\n"
+"                <button v-on:click=\"addExercise\">+</button>\n"
+"            </div> -->\n"
+"\n"
+"            <button style=\"padding: 8.8px 3px 9.5px 3px; margin-right: 5px\"\n"
+"                    v-on:click=\"copyWorkoutToClipboard\"\n"
+"                    :disabled=\"!outputText\"\n"
+"            >📋Copy</button>\n"
+"            \n"
+"            <button class=\"pagebtn\"\n"
+"                    v-on:click=\"clear\"\n"
+"                    style=\"padding: 2px; vertical-align: top; height: 40px\"\n"
+"            >{{ outputText ? \"💾 Save + \" : \"❌\" }}Clear</button>\n"
+"\n"
+"            <!-- Note: sometimes the <select> closes immediately after opening.\n"
+"                 To reproduce:\n"
+"                   1. Scroll the page to the top (using the scroll wheel)\n"
+"                   2. Immediately open the <select>\n"
+"                   3. It will appear briefly then disappear\n"
+"                 The reason for this seems to be because the mouse\n"
+"                 continues to send scroll events for a short\n"
+"                 while longer than it should, and when the\n"
+"                 <select> receives a \"scroll\" event it closes. \n"
+"                 (I tested this by creating a blank HTML page containing\n"
+"                 nothing but a <select> element and lots of <br>'s,\n"
+"                 which confirmed the problem wasn't caused by this app.\n"
+"                 The problem also occured on a different computer\n"
+"                 with a different app) -->\n"
+"            <select style=\"height: 40.5px\"\n"
+"                    v-on:change=\"startNewWorkout\"\n"
+"                    :disabled=\"presets.length == 0\">\n"
+"                <option style=\"display: none\">📄New...</option>\n"
+"                <option v-for=\"preset in presets\">\n"
+"                    {{ preset.name }}\n"
+"                </option>\n"
+"            </select>\n"
+"\n"
+"            <br />\n"
+"\n"
+"            <!-- <select style=\"height: 40.5px\"\n"
+"                    v-on:change=\"clearAndNew\">\n"
+"                <option style=\"display: none\">Clear</option>\n"
+"                <option>Blank</option>\n"
+"                <option v-for=\"preset in presets\">\n"
+"                    {{ preset.name }}\n"
+"                </option>\n"
+"            </select> -->\n"
+"            \n"
+"            <datalist id=\"exercise-names\">\n"
+"                <option v-for=\"exerciseName in exerciseNamesAutocomplete\"\n"
+"                        v-bind:value=\"exerciseName\"></option>\n"
+"            </datalist>\n"
+"\n"
+"\n"
+"            <!-- Warm up (stored in 1st exercise `comments` field)-->\n"
+"            <div v-if=\"exercises.length > 0\"\n"
+"                style=\"display: inline-block; border-top: solid 2px #eee; border-bottom: solid 2px #eee; padding: 20px 0; margin-top: 20px\">\n"
+"                Warm up: \n"
+"                <textarea style=\"width: 272px; height: 50px; vertical-align: top;\"\n"
+"                        v-model=\"exercises[0].warmUp\"\n"
+"                ></textarea>\n"
+"            </div>\n"
+"\n"
+"            <div v-for=\"(exercise, exIdx) in exercises\" >\n"
+"                <div class=\"exdiv\"\n"
+"                    ><!-- v-show=\"exIdx == curPageIdx\"  -->\n"
+"                    <div v-if=\"exIdx == curPageIdx\"\n"
+"                        class=\"leftline\"\n"
+"                        v-bind:class=\"'weekreps' + currentExerciseGuideHighReps\">\n"
+"                    </div>\n"
+"                    <exercise-container :exercise=\"exercise\"\n"
+"                                        :recent-workouts=\"recentWorkouts\"\n"
+"                                        :show-volume=\"showVolume\"\n"
+"                                        :guides=\"guides\"\n"
+"                                        :one-rm-formula=\"oneRmFormula\"\n"
+"                                        :tag-list=\"tagList\"\n"
+"                                        :week-number=\"wk.weekNumber\"\n"
+"                                        :header-highlight-class=\"exIdx == curPageIdx ? 'weekreps' + currentExerciseGuideHighReps : null\"\n"
+"                                        @select-exercise=\"gotoPage(exIdx)\"\n"
+"                                        :get-next-exercise-number=\"getNextExerciseNumber\"\n"
+"                    ></exercise-container>\n"
+"                </div>\n"
+"            </div><!-- /foreach exercise -->\n"
+"\n"
+"            <button v-on:click=\"addExercise\">+</button>\n"
+"        </div><!-- /showWorkout -->\n"
+"        \n"
+"        <br />\n"
+"    \n"
+"        <!-- vvv Possible todo: Make this visible on mobile\n"
+"                 by replacing `class=\"hide-on-mobile\"` with `v-show=\"showPreviousTable\"`\n"
+"                 (but would need to reduce the table width first) -->\n"
+"        <recent-workouts-panel class=\"hide-on-mobile\"\n"
+"                               v-bind:tag-list=\"tagList\"\n"
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
+"        <div v-show=\"showSettings\">\n"
+"            <dropbox-sync ref=\"dropbox\"\n"
+"                        dropbox-filename=\"json/workouts.json\"\n"
+"                        v-bind:data-to-sync=\"recentWorkouts\"\n"
+"                        v-on:sync-complete=\"dropboxSyncComplete\">\n"
+"            </dropbox-sync>\n"
+"            <dropbox-loader filename=\"json/presets.txt\"\n"
+"                            v-on:loaded=\"presets = parsePresets($event)\">\n"
+"            </dropbox-loader>\n"
+"        </div><!-- /showSettings -->\n"
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
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        return {
            curPageIdx: 0,
            exercises: exercises,
            recentWorkouts: recentWorkouts,
            outputText: '',
            showVolume: false,
            oneRmFormula: 'Brzycki/Epley',
            showWorkout: true,
            showPreviousTable: isDesktop,
            showCalculator: false,
            showCalculator2: false,
            showTables: isDesktop,
            showSettings: isDesktop,
            savedScrollPosition: 0, // used when switching to the "workout" tab on mobile
            blockStartDate: "", // will be updated by dropboxSyncComplete()
            workoutDate: moment().format("YYYY-MM-DD"), // will be updated by startNewWorkout()
            tagList: {
                "10": { emoji: "💪", description: "high energy" },
                "20": { emoji: "😓", description: "low energy" },
                "21": { emoji: "🔻", description: "had to reduce weight" },
                "25": { emoji: "🤕", description: "injury" },
                "50": { emoji: "🏆", description: "new PR" },
                "60": { emoji: "🐢", description: "long gaps between sets" },
                "61": { emoji: "🐇", description: "short gaps between sets" },
                "70": { emoji: "🐌", description: "preworkout took a while to kick in" },
                "80": { emoji: "☕", description: "too much caffeine" },
                "98": { emoji: "🛑", description: "stop sign" },
                "99": { emoji: "☝", description: "need to increase the weight" },
                "9a": { emoji: "👇", description: "need to decrease the weight" },
                "9b": { emoji: "📏", description: "1RM attempt" }, // i.e. ruler = measure
                "DL": { emoji: "⚖️", description: "deload" }
            },
            guides: _getGuides(),
            presets: [], // will be loaded by <dropbox-loader>
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
                this.exercises = _applyPreset(preset, this.wk.weekNumber, this.guides, this.recentWorkouts);
                this.curPageIdx = 0;
                this.lastUsedPreset = presetName; // save to sessionStorage
            }
            event.target.selectedIndex = 0; // select the first option in the list ("New")
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
                        name: exercise.name,
                        number: exercise.number,
                        sets: setsWithScore,
                        guideType: exercise.guideType,
                        ref1RM: exercise.ref1RM,
                        comments: exercise.comments,
                        goal: exercise.goal,
                        next: exercise.next, // goal for next time (orginally stored in comments, moved to its own field 22/06/25)
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
        },
        parsePresets: _parsePresets,
        changeMobileView: function(tab) {
            if (this.showWorkout && tab != 1) {
                this.savedScrollPosition = window.scrollY;
            }
            this.showWorkout = tab == 1;
            this.showPreviousTable = tab == 2;
            this.showCalculator = tab == 3;
            this.showTables = tab == 4;
            this.showSettings = tab == 5;
            nextTick(() => { // wait for tab to change before adjusting scroll position
                if (tab == 1) {
                    window.scrollTo({ top: this.savedScrollPosition });
                } else {
                    window.scrollTo({ top: 0 });
                }
            });
        },
        resetView: function () {
            this.showWorkout = true;
            this.showCalculator = false;
            this.showPreviousTable = true;
            this.showTables = true;
            this.showSettings = true;
        },
        getNextExerciseNumber: function() {
            let max = 0;
            for (const exercise of this.exercises) {
                const n = parseInt(exercise.number, 10);
                if (!Number.isNaN(n)) {
                    max = Math.max(max, n);
                }
            }
            return String(max + 1);
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
        wk: function () {
            return _getWeekNumber(this.blockStartDate, this.workoutDate);
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
        width: 10px;
        left: -10px;
        top: 5px;
        height: calc(100% - 5px);
        position: absolute;
        z-index: -1;
    }
    div.leftline.weekreps0,
    div.header-highlight.weekreps0 {
        background-color: #eee; /* to make the background of a selected exercise
                                     gray instead of white (for exercises without a guide) */
    }

    @media (max-width: 768px) {
        .hide-on-mobile {
            display: none;
        }
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
        .hide-on-desktop {
            display: none;
        }
    }

    div.top-nav-bar {
        position: sticky;
        top: 0;
        background-color: #eee;
        border-bottom: solid 1px gray;
        padding: 10px;
        z-index: 99;
        margin-bottom: 15px;
    }
    button.top-nav-button {
        height: 30px;
        padding: 0 5px;
        vertical-align: middle;
    }
    .top-nav-button.selected {
        background-color: darkblue;
        color: white;
    }`;
                    document.head.appendChild(componentStyles);
                }
