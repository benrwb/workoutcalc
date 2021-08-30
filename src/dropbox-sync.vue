<template>
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
                Last sync at {{ _formatDate(dropboxLastSyncTimestamp) }}
            </span>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue, { PropType } from './types/vue'
    import { RecentWorkout } from './types/app'
    import { _formatDate } from './supportFunctions'

    export default Vue.extend({
        props: {
            dropboxFilename: String, // user needs to create this file manually, initial contents should be an empty array []
            dataToSync: Array as PropType<RecentWorkout[]>
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
                // Dropbox sync stage 1 - Load existing data from Dropbox
                if (!this.dropboxAccessToken) return;
                this.dropboxSyncInProgress = true;

                // See https://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
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
            dropboxSyncStage2: function (dropboxData: RecentWorkout[]) {
                // Dropbox sync stage 2 - 
                // Merge this.dataToSync with dropboxData, using 'id' field as a key

                // Build lookup "dropLookup"
                //     Key = ID (unique)
                //     Value = Item index
                // e.g. {
                //     1521245786: 0,
                //     1521418547: 1
                // }
                var dropLookup = {}; // as {[key: number]: number}; // see comment above
                for (var i = 0; i < dropboxData.length; i++){
                    dropLookup[dropboxData[i].id] = i;

                    // BEGIN Temporary patch 3-Aug-18: Add "id" field
                    //       var dayTicks = moment(dropboxData[i].date).startOf("day").valueOf();
                    //       var milliTicks = moment(dropboxData[i].date).milliseconds();
                    //       dropboxData[i].id = Math.round((dayTicks / 1000) + milliTicks);
                    // END   Temporary patch

                    // BEGIN Temporary patch 17-Feb-21: Convert ref1RM from string to number
                    //if (dropboxData[i].ref1RM != null) {
                    //    dropboxData[i].ref1RM = Number(dropboxData[i].ref1RM);
                    //}
                    // END Temporary patch

                    // BEGIN Temporary patch 17-Feb-21: Convert sets/reps/gap from string to number
                    //if (dropboxData[i].sets != null) {
                    //    var sets = dropboxData[i].sets;
                    //    for (var z = 0; z < sets.length; z++) {
                    //        sets[z].weight = Number(sets[z].weight);
                    //        sets[z].reps = Number(sets[z].reps);
                    //        sets[z].gap = Number(sets[z].gap);
                    //    }
                    //}
                    // END Temporary patch
                }

                // Add & "delete" items
                for (var i = 0; i < this.dataToSync.length; i++) {
                    var id = this.dataToSync[i].id;
                    if (id != null) { // check 'id' exists (not null/undefined)
                        if (!dropLookup.hasOwnProperty(id)) {
                            // dropData doesn't contain item - add it
                            dropboxData.push(this.dataToSync[i]);
                        } else {
                            // dropData contains item - check deletion status
                            if (this.dataToSync[i].name == "DELETE") {
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
                dropboxData.sort(function (a, b) {
                    // If 'a' and/or 'b' don't have a date property*,
                    // then fallback to the Unix epoch (0)
                    // (*for example "DELETE" items don't have a date)
                    var c = new Date(a.date || 0);
                    var d = new Date(b.date || 0);
                    return d - c; 
                });

                // Save changes
                this.$emit("sync-complete", dropboxData); //this.recentWorkouts = dropboxData;
                this.dropboxSyncStage3(dropboxData);
            },
            dropboxSyncStage3: function (dropboxData: RecentWorkout[]) {
                // Dropbox sync stage 3 - Save data back to Dropbox
                if (!this.dropboxAccessToken ) return;
                // See https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/upload/index.html
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
            _formatDate: _formatDate
        }
    });
</script>