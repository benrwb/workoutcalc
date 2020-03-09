import { _calculateOneRepMax } from './supportFunctions.js'

export default {
    props: {
        ref1RM: String,
        oneRmFormula: String,
        showGuide: Boolean,
        guideType: String
    },
    template: /* html */`
<table border="1" class="rmtable">
    <tr>
        <th>Reps</th>
        <th>Weight</th>
        <th style="min-width: 53px">Percent</th>
    </tr>
    <tr v-for="row in rows"
    v-bind:class="{ 'intensity60': showGuide && guideType == '12-15' && row.reps >= 12 && row.reps <= 15,
                    'intensity70': showGuide && guideType == '8-10'  && row.reps >= 8  && row.reps <= 10,
                    'intensity80': showGuide && guideType == '5-7'   && row.reps >= 5  && row.reps <= 7 }">
        <td>{{ row.reps }}</td>
        <td>{{ row.weight.toFixed(1) }}</td>
        <td>{{ row.percentage.toFixed(1) }}%</td>
    </tr>
</table>
    `,
    computed: {
        rows: function() {
            var rows = [];
            for (var reps = 1; reps <= 20; reps++) {
                var tempWeight = 100; // this can be any weight, it's just used to calculate the percentage.
                var tempRM = _calculateOneRepMax({ weight: tempWeight, reps: reps }, this.oneRmFormula);
                if (tempRM > 0) {
                    var percentage = tempWeight / tempRM;
                    rows.push({
                        reps: reps,
                        weight: this.ref1RM * percentage,
                        percentage: percentage * 100
                    });
                }
            }
            return rows;
        }
    }
}