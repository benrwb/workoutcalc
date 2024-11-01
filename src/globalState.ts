import { reactive } from "vue";

export const globalState = reactive({
    calc1RM: 0, // "One rep max" value for "Calculate weight/% from one rep max"
    calcWeight: 0 // "Weight" value for "Calculate one rep max from weight"
});