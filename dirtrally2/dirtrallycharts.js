var stageData = null;
var category = "none";

var chart = new Chart('graph', {
    type: 'scatter'
});

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
    console.log(category);
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

    return {
        data: data
    }
}

function plotData() {
    chart.options.title.text = 'Stage Times'

    let finishers = stageData['entries'].filter((entry) => !entry['dnf']);
    let times = finishers.map((entry) => entry['totalTime']);

    let xValues = getXValues(times);

    let distribution = getDistribution(times, xValues);

    chart.data = {
        datasets: [{
            label: 'Distribution',
            data: distribution.data,
            borderColor: 'red',
            borderWidth: 1,
            showLine: true
        }]
    }

    chart.options = {
        title: {
            display: true,
            test: 'Distribution of Stage Times'
        },
        legend: {
            display: false // true for multicategory
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

    chart.options.scales = {
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

    chart.update();
}
