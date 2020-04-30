var stageData = null;
var category = "none";
var colors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba'];
var chartDists = null;
var chartCount = null;

var categoryNames = {
    "vehicleName": {},
    "wheel": {
        "false": "Controller",
        "true": "Wheel"
    },
    "assist": {
        "false": "No Assists",
        "true": "Assists"
    },
    "platform": {
        "Steam": "PC",
        "MicrosoftLive": "Xbox One",
        "PlaystationNetwork": "PS4",
        "unknown": "Other"
    },
    "dnf": {
        "false": "Finished",
        "true": "DNF"
    },
}

window.onload = function() {
    chartDists = new Chart('distributions', {
        type: 'scatter',
        options: {
            scales: {
                xAxes: [{
                    scaleType: 'linear',
                    scaleLabel: {
                        labelString: 'Time',
                        display: true
                    },
                }],
                yAxes: [{
                    scaleType: 'linear',
                    scaleLabel: {
                        labelString: 'Frequency',
                        display: true
                    },
                    ticks: {
                        display: false
                    }
                }]
            }
        }
    });
    chartCount = new Chart('counts', {
        type: 'bar',
        options: {
            legend: {display: false},
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

// fetch the stage data
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://www.chrisraff.com/dirtrally2-event-data/test.json', true);
xhr.responseType = 'json';
xhr.onload = function() {
    var status = xhr.status;
    if (status === 200) {
        stageData = xhr.response;
        plotData();
    } else {
        console.log('couldn\'t get data');
    }
};
xhr.send();

function categoryUpdate() {
    let e = document.getElementById("category");
    category = e.options[e.selectedIndex].value;
    plotData();
}

function safeDictionary(dictionary, key) {
    if (dictionary[key] !== undefined) return dictionary[key];
    return key;
}

function getXValues(times, resolution=150) {
    // assumes times are sorted
    var xmin = times[0]; // Math.min(...times)
    var xmax = times[Math.floor(times.length * 0.99)];
    let diff = xmax - xmin;
    let buffer = 0.05;
    xmin -= buffer * diff;
    xmax += buffer * diff;
    diff = xmax - xmin;

    let xs = new Array(resolution);

    for (let i = 0; i < resolution; i++) {
        let x = xmin + diff * (i / (resolution - 1));
        xs[i] = x;
    }

    return xs;
}

function groupTimesByCategory(times, category) {
    let timeLists = {};

    times.forEach(function(entry) {
        let categoryValue = entry[category].toString();
        if (!Object.keys(timeLists).includes(categoryValue)) {
            timeLists[categoryValue] = [];
        }
        timeLists[categoryValue].push(entry['totalTime']);
    })

    return timeLists;
}

function getDistribution(times, xValueArray) {
    let dist = new Array(xValueArray.length).fill(0);

    let data = new Array(xValueArray.length);

    let bandwidth = 5;

    times.forEach(function(time) {
        for (var i = 0; i < xValueArray.length; i++) {
            let x = xValueArray[i];
            let numerator = (x - time);
            numerator *= numerator;
            gauss_result = Math.exp(-numerator/(2*bandwidth*bandwidth));
            dist[i] += gauss_result;

            data[i] = {
                x: x,
                y: dist[i]
            }
        }
    });

    return data;
}

function plotData() {
    chartDists.options.title.text = 'Stage Times'

    let finishers = stageData['entries'].filter((entry) => !entry['dnf']);
    let times = finishers.map((entry) => entry['totalTime']);

    let xValues = getXValues(times);

    if (category == "none") {
        let distribution = getDistribution(times, xValues);

        chartDists.data = {
            datasets: [{
                label: 'Distribution',
                data: distribution,
                borderColor: 'red',
                borderWidth: 2,
                showLine: true,
                fill: false
            }]
        }
        
        // show DNFs on the count chart
        let timeLists = groupTimesByCategory(stageData["entries"], "dnf");
        let keys = Object.keys(timeLists);
        keys.sort();
        chartCount.data = {
            labels: keys.map((key) => safeDictionary(categoryNames["dnf"], key)),
            datasets: [{
                backgroundColor: colors.slice(0,keys.length),
                data: keys.map((key) => timeLists[key].length)
            }]
        }
    } else {
        let timeLists = groupTimesByCategory(finishers, category);

        let i = 0;
        let keys = Object.keys(timeLists);
        keys.sort();

        chartDists.data = {
            datasets: keys.filter((key) => timeLists[key].length >= 100)
                            .map(function(key) {
                return {
                    label: safeDictionary(categoryNames[category], key),
                    data: getDistribution(timeLists[key], xValues),
                    borderColor: colors[i++ % colors.length],
                    borderWidth: 2,
                    showLine: true,
                    fill: false
                }
            })
        }

        chartCount.data = {
            labels: keys.map((key) => safeDictionary(categoryNames[category], key)),
            datasets: [{
                backgroundColor: colors.slice(0,keys.length),
                data: keys.map((key) => timeLists[key].length)
            }]
        }
    }

    chartDists.options = {
        title: {
            display: true,
            text: 'Distribution of Stage Times'
        },
        legend: {
            display: category != "none"
        },
        elements: {
            line: {
                display: true
            },
            point: {
                radius: 0,
                hitRadius: 0
            }
        }
    }

    chartDists.options.scales = {
        xAxes: [{
            scaleType: 'linear',
            scaleLabel: {
                labelString: 'Time',
                display: true
            },
            ticks: {
                stepSize: 30,
                min: xValues[0],
                max: xValues[xValues.length - 1],
                callback: function(value) {
                    if (value % 30 == 0) {
                        let padded_seconds = ("0" + value%60).slice(-2);
                        return Math.floor(value / 60) + ":" + padded_seconds;
                    }
                }
            }
        }],
        yAxes: [{
            scaleType: 'linear',
            scaleLabel: {
                labelString: 'Frequency',
                display: true
            },
            ticks: {
                display: false
            }
        }]
    };

    chartDists.update();
    chartCount.update();
}
