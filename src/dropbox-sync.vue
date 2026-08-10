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
            <!-- Filename <input type="text" v-model="filename" readonly="readonly" />
            <br /> -->
            <button v-show="!dropboxLastSyncTimestamp && !!dropboxAccessToken"
                    v-bind:disabled="dropboxSyncInProgress"
                    v-on:click="syncWithDropbox">Connect to Dropbox</button>
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
            filename: String, // user needs to create this file manually, initial contents should be an empty array []
            dataToSync: {
                type: Array as PropType<RecentWorkout[]>,
                required: true
            }
        },
        setup: function(props, context) { 
            const dropboxAccessToken = ref(localStorage["dropboxAccessToken"] || "");
            const dropboxSyncInProgress = ref(false);
            const dropboxLastSyncTimestamp = ref("");


            async function syncWithDropbox() {
                if (!dropboxAccessToken.value) return;
                dropboxSyncInProgress.value = true;
                try {
                    // See https://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
                    const dbx = new Dropbox.Dropbox({ accessToken: dropboxAccessToken.value });

                    // STAGE 1: Download existing data from Dropbox
                    const downloadRes = await dbx.filesDownload({ path: '/' + props.filename });
                    const jsonText = await downloadRes.fileBlob.text();
                    // ^ Note: If I switch to a newer version of the Dropbox API in future,
                    //   (currently using version 4), the above line will need to change to
                    //   const jsonText = await downloadRes.result.fileBlob.text();
                    //                                      ^^^^^^
                    const dropboxData = JSON.parse(jsonText) as RecentWorkout[];

                    // STAGE 2: Merge local data with remote data
                    const mergedData = mergeWorkoutData(props.dataToSync, dropboxData);

                    // Emit merged result back to parent component
                    context.emit("sync-complete", mergedData);

                    // STAGE 3: Save merged data back to Dropbox
                    // See https://github.com/dropbox/dropbox-sdk-js/blob/master/examples/javascript/upload/index.html
                    await dbx.filesUpload({
                        path: '/' + props.filename,
                        contents: JSON.stringify(mergedData, null, 2), // pretty print JSON (2 spaces)
                        mode: { '.tag': 'overwrite' },
                    });

                    // Update local sync status on success
                    localStorage["dropboxAccessToken"] = dropboxAccessToken.value;
                    dropboxLastSyncTimestamp.value = new Date().toISOString();

                } catch (error/*: any*/) {
                    console.error('Dropbox sync failed:', error);
                    alert(`Dropbox sync failed for ${props.filename} - ${error?.message || error}`);
                    dropboxLastSyncTimestamp.value = "";
                } finally {
                    // Guaranteed cleanup regardless of success or failure
                    dropboxSyncInProgress.value = false;
                }
            }



            // Isolated function for Stage 2 (Merge Logic)
            function mergeWorkoutData(localData: RecentWorkout[], remoteData: RecentWorkout[]): RecentWorkout[] {
                // Build lookup table: Key = ID, Value = Array Index
                // e.g. {
                //     1521245786: 0,
                //     1521418547: 1
                // }
                const dropLookup = {} as Record<string, number>;

                for (let i = 0; i < remoteData.length; i++) {
                    dropLookup[remoteData[i].id] = i;
                    // *** Temporary patches would go here (see comment after this function) ***
                }

                // Add & "delete" items
                for (let i = 0; i < localData.length; i++) {
                    const localItem = localData[i];
                    if (localItem.id != null) {
                        if (!dropLookup.hasOwnProperty(localItem.id)) {
                            // New local item missing from Dropbox — add it
                            remoteData.push(localItem);
                        } else if (localItem.name === "DELETE") {
                            // Soft delete: leave placeholder tombstone behind
                            // e.g. {"id":1521245786,"name":"DELETE"}
                            // This is so that the deletion status can be propagated to all other synced devices.
                            // (otherwise it would keep re-appearing when other devices synced)
                            remoteData[dropLookup[localItem.id]] = {
                                id: localItem.id,
                                name: "DELETE",
                            }; // as RecentWorkout;
                        }
                    }
                }

                // Sort DESC by date (most recent first)
                return remoteData.sort((a, b) => {
                    // If 'a' and/or 'b' don't have a date property*,
                    // then fallback to the Unix epoch (0)
                    // (*for example "DELETE" items don't have a date)
                    const dateA = new Date(a.date || 0).getTime();
                    const dateB = new Date(b.date || 0).getTime();
                    return dateB - dateA;
                });
            }


            // ==========================
            // EXAMPLE TEMPORARY PATCHES:
            // (these would be added to `mergeWorkoutData`)
            // ==========================
            // BEGIN Temporary patch 3-Aug-18: Add "id" field
            //       var dayTicks = moment(dropboxData[i].date).startOf("day").valueOf();
            //       var milliTicks = moment(dropboxData[i].date).milliseconds();
            //       dropboxData[i].id = Math.round((dayTicks / 1000) + milliTicks);
            // END   Temporary patch
            //
            // BEGIN Temporary patch 17-Feb-21: Convert ref1RM from string to number
            //if (dropboxData[i].ref1RM != null) {
            //    dropboxData[i].ref1RM = Number(dropboxData[i].ref1RM);
            //}
            // END Temporary patch
            //
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


            return {
                dropboxLastSyncTimestamp,
                dropboxAccessToken,
                dropboxSyncInProgress,
                syncWithDropbox, // called by parent
                formatDate: _formatDate
            };
        }
    });
</script>