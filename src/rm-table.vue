<style>
    .rmtable {
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
    }
</style>

<template>
    <div>
        Calculate weight/% from one rep max
        <div style="font-style: italic; font-size: 87%; color: silver">How much weight am I capable of lifting?</div>
        <table border="1" class="rmtable">
            <thead>
                <tr>
                    <th>Reps</th>
                    <th>Weight</th>
                    <th style="min-width: 53px">Percent</th>
                </tr>
            </thead>
            <tbody>
                <tr><!-- first row: enter 1RM -->
                    <td>1</td>
                    <td>One rep max:<br />
                        <input v-bind:value="modelValue"
                               v-on:input="$emit('update:modelValue', Number($event.target.value))"
                               size="4" style="text-align: right" />
                    </td>
                    <td>100%</td>
                </tr>
                <tr v-for="row in tableRows"
                    v-bind:class="row.reps >= guideParts.guideLowReps && row.reps <= guideParts.guideHighReps ? 'weekreps' + row.reps : ''">
                    <td>{{ row.reps }}</td>
                    <td>{{ row.weight.toFixed(1) }} kg</td>
                    <td>{{ row.percentage.toFixed(1) }}%</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { _calculateOneRepMax, _oneRmToRepsWeight } from './supportFunctions'
import { RmTableRow } from './types/app'
import { defineComponent, computed, toRef, watch } from "vue"
import { globalState } from "./globalState";
import { _useGuideParts } from './guide';

export default defineComponent({
    props: {
        ref1RM: Number,
        oneRmFormula: String,
        guideType: String,
        modelValue: Number // currentExercise.ref1RM
    },
    setup(props) {

        // Alternative (Vue 3.3+): //     toRef(() => props.guideType);
        const guideParts = _useGuideParts(toRef(props, "guideType"));

        const tableRows = computed(() => {
            let replist = [] as number[];
            if (props.modelValue > 0) {
                if (guideParts.value.guideLowReps != 0) {
                    for (let i = guideParts.value.guideLowReps - 2; i <= guideParts.value.guideHighReps + 2; i++) {
                        replist.push(i); // e.g. [12,13,14]
                    }
                } else {
                    replist = [10,11,12,13,14,15]; // e.g. for "Deload" guide
                }
            }
            var rows = [] as RmTableRow[];
            //for (var reps = 2; reps <= 15; reps++) {
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
</script>