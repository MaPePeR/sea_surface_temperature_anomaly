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
    years[years.length - 2].stroke = '#FF8000'
    years[years.length - 2].strokeWidth = 2
    years[years.length - 1].stroke = '#000000'
    years[years.length - 1].strokeWidth = 3
    subtractMean(plus.data)
    subtractMean(minus.data)

    const firstUnkownValue = years[years.length - 1].data.length
    const preliminaryData = new Array(firstUnkownValue)
    if (firstUnkownValue > PRELIMINARY_COUNT) {
        for (let i = 1; i <= PRELIMINARY_COUNT; i++) {
            preliminaryData[firstUnkownValue - i] = years[years.length - 1].data[firstUnkownValue - i]
            years[years.length - 1].data[firstUnkownValue - i] = null
            firstUnkownValue
        }
        preliminaryData[firstUnkownValue - PRELIMINARY_COUNT - 1] = years[years.length - 1].data[firstUnkownValue - PRELIMINARY_COUNT - 1]
    } else {
        // TODO
    }
    const plot = Plot.plot({
        width: 1000,
        height: 600,
        x: {
            label: "Day of year"
        },
        y: {
            grid: true,
            label: "↑ Temperature (°C)",
            domain: [Math.min(-maxVal, minVal) * 1.1, Math.max(-minVal, maxVal) * 1.1],
        },
        marks: [
            Plot.ruleY([0], {strokeWidth: 2}),
            years.map((d) => Plot.lineY(d.data, {
                stroke: d.stroke || '#909090',
                strokeWidth: d.strokeWidth || 0.5,
            })),
            [years[years.length - 2], {data:preliminaryData, name: years[years.length - 1].name}].map(
                d => Plot.text(d.data, Plot.selectLast({
                    text: _ => d.name,
                    x: (y,x) => x, y: y => y,
                    fill: d.stroke,
                    dy: -6,
                    lineAnchor: 'bottom',
                }))
            ),
            Plot.lineY(preliminaryData, {
                stroke: '#000000',
                strokeWidth: 1,
            }),
            [plus, minus].map(d => Plot.lineY(d.data, {
                stroke: '#000000',
                strokeWidth: 1,
                strokeDasharray: [3,3],
            })),
        ],
      })
 
    div.replaceChildren(plot);
}
