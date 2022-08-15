<template>
    <input type="number" 
           v-bind:value="parsedValue"
           v-on:input="updateValue"
    />
</template>

<script lang="ts">

    // Input that always returns a number (never a string)
    // If the box is empty, it returns 0

    import { defineComponent } from "vue"

    export default defineComponent({
        props: {
            modelValue: Number // for use with v-model
        },
        computed: {
            parsedValue: function (): string {
                if (this.modelValue == 0) 
                    return "";
                else 
                    return this.modelValue.toString();
            }
        },
        methods: {
            updateValue: function (event: Event) {
                var eventTarget = event.target as HTMLInputElement;
                if (eventTarget.value == "") 
                    this.$emit("update:modelValue", 0);
                else
                    this.$emit("update:modelValue", Number(eventTarget.value))
            }
        }
    });
</script>