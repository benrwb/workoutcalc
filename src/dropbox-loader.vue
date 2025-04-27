<template>
    <div v-if="dropboxSyncInProgress">
        Loading {{ filename }}
    </div>
</template>

<script lang="ts">
    import { defineComponent, ref } from "vue";

    export default defineComponent({
        props: {
            filename: String
        },
        setup: function (props, context) {

            let dropboxAccessToken = localStorage["dropboxAccessToken"] || "";
            const dropboxSyncInProgress = ref(false);
            
            if (dropboxAccessToken) {
                dropboxSyncInProgress.value = true;
                // See https://dropbox.github.io/dropbox-sdk-js/Dropbox.html#filesDownload__anchor
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
</script>