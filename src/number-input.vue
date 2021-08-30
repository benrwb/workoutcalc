<template>
    <input type="number" 
           v-bind:value="parsedValue"
           v-on:input="updateValue"
    />
</template>

<script lang="ts">

    // Input that always returns a number (never a string)
    // If the box is empty, it returns 0

    import Vue from './types/vue'

    export default Vue.extend({
        props: {
            value: Number // for use with v-model
        },
        computed: {
            parsedValue: function (): string {
                if (this.value == 0) 
                    return "";
                else 
                    return this.value.toString();
            }
        },
        methods: {
            updateValue: function (event: Event) {
                var eventTarget = event.target as HTMLInputElement;
                if (eventTarget.value == "") 
                    this.$emit("input", 0);
                else
                    this.$emit("input", Number(eventTarget.value))
            }
        }
    });
</script>