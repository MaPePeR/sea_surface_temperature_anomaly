import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const div = document.querySelector("#myplot");
const locationSelect = document.getElementById('location_select')

function loadData(location) {
    div.replaceChildren('')
    // fetch(`oisst2.1_${location}_sst_day.json`) //uncomment for local files
    fetch(`https://climatereanalyzer.org/clim/sst_daily/json/oisst2.1_${location}_sst_day.json`)
        .then((resonse) => resonse.json())
        .then(createPlot)
}

locationSelect.addEventListener('change', function () {
    loadData(locationSelect.value)
})
loadData(locationSelect.value)

const PRELIMINARY_COUNT = 14

function createPlot(data) {
    const years = data.filter((d) => (d.name !== "1982-2011 mean" && d.name.indexOf('σ') === -1))

    const mean = data[data.length - 3]
    if (mean.name !== "1982-2011 mean")
        throw "Unexpected row"
    const plus = data[data.length - 2]
    if (plus.name !== "plus 2σ")
        throw "unexpected plus row"
    const minus = data[data.length - 1]
    if (minus.name !== "minus 2σ")
        throw "unexpected minus row"
    function subtractMean(d) {
        for (let i = 0; i < d.length; i++) {
            if (d[i] !== null) {
                d[i] -= mean.data[i];
            }
        }
    }
    let minVal = Infinity, maxVal = -Infinity
    years.forEach(el => {
        subtractMean(el.data)
        for (let i = 0; i < el.data.length; i++) {
            if (el.data[i] !== null) {
                if (el.data[i] < minVal) {
                    minVal = el.data[i]
                }
                if (el.data[i] > maxVal) {
                    maxVal = el.data[i]
                }
            } else {
                el.data = el.data.slice(0, i)
                break
            }
        }
    });
    years[years.length - 1].stroke = '#000000'
    years[years.length - 1].strokeWidth = 3
    // Matplotlib tab20c
    // Source: https://github.com/matplotlib/matplotlib/blob/d2cc4d0b0a2e1e9e8a5c1f311f0e10ef8acdb9ef/lib/matplotlib/_cm.py#L1345-L1366
    // Which took it from https://github.com/vega/vega/wiki/Scales
    // https://vega.github.io/vega/docs/schemes/#category20c
    // BSD 3-Clause "New" or "Revised" License
    //
    const tab20c = [
        '#3182bd', '#6baed6', '#9ecae1', '#c6dbef',
        '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2',
        '#31a354', '#74c476', '#a1d99b', '#c7e9c0',
        '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb',
        '#636363', '#969696', '#bdbdbd', '#d9d9d9',
    ];
    // End of tab20c
    const marks = [years.length - 1];
    for (let i = 0; i < tab20c.length; ++i) {
        if (years.length - 2 - i < 0) break;
        years[years.length - 2 - i].stroke = tab20c[i];
        years[years.length - 2 - i].strokeWidth = 2;
        if (i % 4 == 0) {
            marks.push(years.length - 2 - i);
        }
    }
    subtractMean(plus.data)
    subtractMean(minus.data)

    if (years[years.length - 1].data.length > PRELIMINARY_COUNT) {
        years[years.length - 1].preliminaryIndex =  years[years.length - 1].data.length - PRELIMINARY_COUNT
    } else {
        years[years.length - 1].preliminaryIndex = 0
        years[years.length - 2].preliminaryIndex = years[years.length - 2].data.length + years[years.length - 1].data.length - PRELIMINARY_COUNT
    }
    const plot = Plot.plot({
        width: 1000,
        height: 600,
        x: {
            label: "Day of year"
        },
        y: {
            grid: true,
            label: "↑ Temperature Difference (°C)",
            domain: [Math.min(-maxVal, minVal) * 1.1, Math.max(-minVal, maxVal) * 1.1],
        },
        marks: [
            Plot.ruleY([0], {strokeWidth: 2}),
            years.map((d) => Plot.lineY(d.data, {
                stroke: d.stroke || '#909090',
                strokeWidth: (y,x,arr) => {
                    if (d.preliminaryIndex !== undefined && x >= d.preliminaryIndex) {
                        return 1;
                    }
                    return d.strokeWidth || 0.5;
                },
            })),
            marks.map(yearindex => years[yearindex]).map(
                d => Plot.text(d.data, Plot.selectLast({
                    text: _ => d.name,
                    x: (y,x) => x, y: y => y,
                    fill: d.stroke,
                    dy: -6,
                    lineAnchor: 'bottom',
                    textAnchor: 'start',
                }))
            ),
            [plus, minus].map(d => [
                Plot.lineY(d.data, {
                    stroke: '#000000',
                    strokeWidth: 1,
                    strokeDasharray: [3,3],
                }),
                Plot.text(d.data, Plot.selectFirst({
                    text: _ => d.name,
                    x: (y,x) => x, y: y => y,
                    lineAnchor: 'top',
                    textAnchor: 'start',
                    dy: 6,
                }))
            ]),
        ],
      })
 
    div.replaceChildren(plot);
}
