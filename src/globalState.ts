import { reactive } from "vue";

export const globalState = reactive({
    calc1RM: 0, // "One rep max" value for "Calculate weight/% from one rep max"
    calcWeight: 0, // "Weight" value for "Calculate one rep max from weight"
    includeRirInEst1RM: true, // whether to include reps in reserve (RIR) when calculating estimated 1RM
    tagList: {
        // object keys have to be strings (i.e. "10" not 10)
        // note: the key is what's saved into workouts.json
        // e.g. "etag": "70",
        "10": { emoji: "💪", description: "high energy" },
        "20": { emoji: "😓", description: "low energy" },
        "21": { emoji: "🔻", description: "had to reduce weight", hidden: true },
        "25": { emoji: "🤕", description: "injury", hidden: true  },
        "30": { emoji: "🆗", description: "productive if unremarkable", hidden: true },
        "40": { emoji: "📈", description: "increase over previous workout", hidden: true },
        "50": { emoji: "🏆", description: "new PR", hidden: true  },
        "60": { emoji: "🐢", description: "long gaps between sets", hidden: true },
        "61": { emoji: "🐇", description: "short gaps between sets", hidden: true },
        "70": { emoji: "🐌", description: "preworkout took a while to kick in", hidden: true },
        "80": { emoji: "☕", description: "too much caffeine", hidden: true },
        "98": { emoji: "🛑", description: "stop sign", hidden: true },
        "99": { emoji: "☝", description: "need to increase the weight", hidden: true },
        "9a": { emoji: "👇", description: "need to decrease the weight", hidden: true },
        "9b": { emoji: "📏", description: "1RM attempt", hidden: true }, // i.e. ruler = measure
        "DL": { emoji: "⚖️", description: "deload" },
        "DN": { emoji: "↘️", description: "deload next week" },
    }
});