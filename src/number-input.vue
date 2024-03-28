<template>
    <input class="number-input"
           type="text"
           v-bind:value="parsedValue"
           v-on:input="updateValue"
           inputmode="numeric" />
</template>
<script lang="ts">
    // ^^^ `inputmode="numeric"` is to display the correct type of keyboard on mobile

    
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

                // accept numbers only
                var number = Number(eventTarget.value); // Note: "" will return 0; "." will return NaN
                if (isNaN(number)) {
                    // restore previous value
                    eventTarget.value = (this.modelValue == 0 ? "" : this.modelValue.toString()); 
                }
                else {
                    // emit new value
                    this.$emit("update:modelValue", number)
                }
            }
        }
    });
</script>