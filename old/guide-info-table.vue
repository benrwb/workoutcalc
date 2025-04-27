<template>
    <div v-if="exercisePreset"
         style="display: inline-block; text-align: left; 
                background-color: rgb(227 227 227); padding: 5px 5px 0 5px">

        <div style="padding-bottom: 5px; font-weight: bold">
            Guide:&nbsp;
            <span style="color: darkgray; float: right">{{ exercisePreset }}</span>
        </div>

        <table>
            <tbody>
                <tr v-for="item in guideInformationTable">
                    <td :style="{ 'color': item.color }">{{ item.text }} &nbsp;</td>
                </tr>
            </tbody>
        </table>


        <!-- <table>
            <tr> -->
                <!-- <th>Main</th> -->
                <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->
                <!-- <th>Acces.</th> -->
            <!-- </tr>
            <tr v-for="item in guideInformationTable">
                <td :style="{ 'color': item.mainColor }">{{ item.mainText }} &nbsp;</td> -->
                <!-- Sep'23: Acces. hidden, because Main and Acces. are the same at the moment -->
                <!-- <td :style="{ 'color': item.acesColor }">{{ item.acesText }}</td> -->
            <!-- </tr>
        </table> -->

        <!-- <table>
        <tr>
            <th colspan="2">Main</th>
            <th>Acces.</th>
        </tr><tr>
            <td :style="{ 'color': weekNumber <= 3 ? 'black' : 'silver' }">Week 1-3:</td>
            <td :style="{ 'color': weekNumber <= 3 ? 'black' : 'silver' }">12-14&nbsp;&nbsp;</td>
            <td :style="{ 'color': weekNumber <= 5 ? 'black' : 'silver' }">Week 1-5:</td>
            <td :style="{ 'color': weekNumber <= 5 ? 'black' : 'silver' }">12-14</td>
        </tr><tr>
            <td v-bind:style="{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }">Week 4-6:</td>
            <td v-bind:style="{ 'color': weekNumber >= 4 && weekNumber <= 6 ? 'black' : 'silver' }">9-11</td>
            <td v-bind:style="{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }">Week 6+:</td>
            <td v-bind:style="{ 'color': weekNumber >= 6                    ? 'black' : 'silver' }">9-11</td>
        </tr><tr>
            <td v-bind:style="{ 'color': weekNumber >= 7 ? 'black' : 'silver' }">Week 7+:</td>
            <td v-bind:style="{ 'color': weekNumber >= 7 ? 'black' : 'silver' }">6-8</td>
        </tr>
        </table> -->
        <!-- <span v-bind:style="{ 'color': weekNumber >= 1 && weekNumber <= 3? 'black' : 'silver' }">
            First few (3?) weeks:<br />12-14 range<br />
        </span>
        <span v-bind:style="{ 'color': weekNumber >= 4 ? 'black' : 'silver' }">
            Remaining weeks:<br />6-8 range, working up in weight<br />
        </span> -->
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { _getGuideWeeks } from './presets';
import { GuideWeek, Preset } from './types/app';

export default defineComponent({
    props: {
        weekNumber: Number,
        workoutPreset: String, // e.g. "tue - push"
        presets: Array as PropType<Preset[]>,
        currentExerciseName: String
    },
    setup(props) {

        const exercisePreset = computed(() => {
            let preset = props.presets.find(z => z.name == props.workoutPreset);
            if (preset) {
                let ex = preset.exercises.find(z => z.name == props.currentExerciseName);
                if (ex) {
                    return ex.guide;
                }
            }
            return null;
        });

        const guideInformationTable = computed(() => {
            // Shows which guide is being used for each week
            // See also presets.ts/_applyPreset and presets.ts/_getGuideWeeks
            let wk = props.weekNumber as number;
            let guideWeeks = _getGuideWeeks(exercisePreset.value);
            return guideWeeks.map(z => ({
                text: "Week " + z.fromWeek
                        + (z.fromWeek == z.toWeek ? "" : (z.toWeek == 99 ? "+" : "-" + z.toWeek))
                        + ": " + z.guide,
                color: wk >= z.fromWeek && wk <= z.toWeek ? "black" : "silver"
            }));
        });


        // const guideInformationTable = computed(() => {
        //     // Shows which guide is being used for each week
        //     // See also presets.ts/_applyPreset and presets.ts/_getGuideWeeks
        //     var wk = props.weekNumber as number;
        //     function guideToList(guideWeeks: GuideWeek[]) {
        //         return guideWeeks.map(z => ({
        //             text: "Week " + z.fromWeek
        //                   + (z.fromWeek == z.toWeek ? "" : (z.toWeek == 99 ? "+" : "-" + z.toWeek))
        //                   + ": " + z.guide,
        //             color: wk >= z.fromWeek && wk <= z.toWeek ? "black" : "silver"
        //         }));
        //     }
        //     var mainList = guideToList(_getGuideWeeks("MAIN"));
        //     var acesList = guideToList(_getGuideWeeks("ACES"));

        //     // combine `mainList` and `acesList` into a table
        //     return mainList.map((mainItem, idx) => ({
        //         mainText: mainItem.text,
        //         mainColor: mainItem.color,
        //         acesText: idx >= acesList.length ? "" : acesList[idx].text,
        //         acesColor: idx >= acesList.length ? "" : acesList[idx].color
        //     }));
        // });

        return { guideInformationTable, exercisePreset };
    }
})
</script>