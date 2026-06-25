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
            <progress v-show="dropboxSyncInProgress"></progress>
            <span v-show="!!dropboxLastSyncTimestamp && !dropboxSyncInProgress">
                Last sync at {{ formatDate(dropboxLastSyncTimestamp, 'DD/MM/YYYY HH:mm') }}
            </span>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, PropType, ref } from "vue"
    import { RecentWorkout } from './types/app'
    import { _formatDate } from './supportFunctions'

    export default defineComponent({
        props: {
            dropboxFilename: String, // user needs to create this file manually, initial contents should be an empty array []
            dataToSync: {
                type: Array as PropType<RecentWorkout[]>,
                required: true
            }
        },
        setup: function(props, context) { 
            const dropboxAccessToken = ref(localStorage["dropboxAccessToken"] || "");
            const dropboxSyncInProgress = ref(false);
            const dropboxLastSyncTimestamp = ref("");

            function dropboxSyncStage1() {
                // Dropbox sync stage 1 - Load existing data from Dropbox
                if (!dropboxAccessToken.value) return;
                dropboxSyncInProgress.value = true;

                // See https://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
                var dbx = new Dropbox.Dropbox({ accessToken: dropboxAccessToken.value });
                dbx.filesDownload({ path: '/' + props.dropboxFilename })
                    .then(function (data) {
                        var reader = new FileReader();
                        reader.addEventListener("loadend", function () {
                            var dropboxData = JSON.parse(reader.result);
                            dropboxSyncStage2(dropboxData);
                        });
                        reader.readAsText(data.fileBlob);
                    })
                    .catch(function (error) {
                        console.error(error);
                        alert("Failed to download " + props.dropboxFilename + " from Dropbox - " + error.message);
                        dropboxSyncInProgress.value = false;
                    });
            }

            function dropboxSyncStage2(dropboxData: RecentWorkout[]) {
                // Dropbox sync stage 2 - 
                // Merge props.dataToSync with dropboxData, using 'id' field as a key

                // Build lookup "dropLookup"
                //     Key = ID (unique)
                //     Value = Item index
                // e.g. {
                //     1521245786: 0,
                //     1521418547: 1
                // }
                var dropLookup = {}; // as {[key: number]: number}; // see comment above
                //                 -OR- as Record<string, number>;
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
                for (var i = 0; i < props.dataToSync.length; i++) {
                    var id = props.dataToSync[i].id;
                    if (id != null) { // check 'id' exists (not null/undefined)
                        if (!dropLookup.hasOwnProperty(id)) {
                            // dropData doesn't contain item - add it
                            dropboxData.push(props.dataToSync[i]);
                        } else {
                            // dropData contains item - check deletion status
                            if (props.dataToSync[i].name == "DELETE") {
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
                context.emit("sync-complete", dropboxData); //this.recentWorkouts = dropboxData;
                dropboxSyncStage3(dropboxData);
            }

            function dropboxSyncStage3(dropboxData: RecentWorkout[]) {
                // Dropbox sync stage 3 - Save data back to Dropbox
                if (!dropboxAccessToken.value) return;
                // See https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/upload/index.html
                var dbx = new Dropbox.Dropbox({ accessToken: dropboxAccessToken.value });
                dbx.filesUpload({ 
                    path: '/' + props.dropboxFilename, 
                    contents: JSON.stringify(dropboxData, null, 2), // pretty print JSON (2 spaces)
                    mode: { '.tag': 'overwrite' }
                })
                .then(function () {
                    localStorage["dropboxAccessToken"] = dropboxAccessToken.value;
                    dropboxSyncInProgress.value = false;
                    dropboxLastSyncTimestamp.value = new Date().toISOString();
                })
                .catch(function (error) {
                    console.error(error);
                    alert("Failed to upload " + props.dropboxFilename + " to Dropbox - " + error.message);
                    dropboxSyncInProgress.value = false;
                    dropboxLastSyncTimestamp.value = "";
                });
            }

            return {
                dropboxLastSyncTimestamp,
                dropboxAccessToken,
                dropboxSyncInProgress,
                dropboxSyncStage1,
                formatDate: _formatDate
            };
        }
    });
</script>