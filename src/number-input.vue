<style>
    .number-input  {
        text-align: right;
    }
</style>

<template>
    <input class="number-input"
           type="text"
           v-model="textbox"
           inputmode="numeric" />
</template>

<script lang="ts">
    // ^^^ `inputmode="numeric"` is to display the correct type of keyboard on mobile

    
    // Input that always returns a number (never a string)
    // If the box is empty, it returns 0

    import { defineComponent, computed, watch, ref } from "vue"

    export default defineComponent({
        props: {
            modelValue: Number // for use with v-model
        },
        setup: function (props, context) {

            const textbox = ref("");
            
            watch(() => props.modelValue, () => {
                if (props.modelValue == 0) 
                    textbox.value = "";
                else if (Number(props.modelValue) != Number(textbox.value))
                    // ^^^ only update if numbers are different (this is to avoid removing trailing decimal point)
                    textbox.value = props.modelValue.toString();
            }, { immediate: true });

            watch(textbox, (newValue, oldValue) => {
                // accept numbers only
                var number = Number(newValue); // Note: "" will return 0; "." will return NaN
                if (isNaN(number)) {
                    // restore previous value
                    textbox.value = oldValue;
                    //textboxValue.value = (props.modelValue == 0 ? "" : props.modelValue.toString()); 
                }
                else {
                    // emit new value
                    context.emit("update:modelValue", number)
                }
            });

            return { textbox };
        }
    });
</script>