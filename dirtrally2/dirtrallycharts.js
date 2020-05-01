var stageData = null;
var category = 'vehicleName';
var chartType = 'stacked';
var colors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba'];
var chartDists = null;
var chartCount = null;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var stage = 'none';
var dataUrl = 'https://www.chrisraff.com/dirtrally2-event-data/'
if (urlParams.has('stage')) {
    stage = urlParams.get('stage') + '.json';
}
var selectorYear = 2020;
var selectorCategory = 'daily';

var categoryNames = {
    'vehicleName': {
        '': 'Car'
    },
    'wheel': {
        '': 'Controller',
        'false': 'Controller',
        'true': 'Wheel'
    },
    'assist': {
        '': 'Assists',
        'false': 'No Assists',
        'true': 'Assists'
    },
    'platform': {
        '': 'Platform',
        'Steam': 'PC',
        'MicrosoftLive': 'Xbox One',
        'PlaystationNetwork': 'PS4',
        'unknown': 'Other'
    },
    'dnf': {
        '': 'DNF',
        'false': 'Finished',
        'true': 'DNF'
    },
}

window.onload = function() {
    chartDists = new Chart('distributions', {
        type: 'line',
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

    if (stage != 'none')
        this.getStageData(stage);

    // pressing enter triggers user search
    document.getElementById('username').addEventListener('keydown', function(event) {
        if (event.keyCode == 13) {
            userUpdate();
        }
    })
}

function getStageData(stage) {
    var xhrStageData = new XMLHttpRequest();
    xhrStageData.open('GET', dataUrl + stage, true);
    xhrStageData.responseType = 'json';
    xhrStageData.onload = function() {
        var status = xhrStageData.status;
        if (status === 200) {
            stageData = xhrStageData.response;
            
            document.getElementById('stageInfo').innerHTML = `${stageData.challengeName}: ${stageData.stageName} - ${stageData.eventName}`;
            
            let dateStr = stageData.entryWindow.start;
            document.getElementById('stageDate').innerHTML = `${dateStr.slice(8, 10)}.${dateStr.slice(5, 7)}.${dateStr.slice(0, 4)}`;

            document.title = `${stageData.stageName} - DR2 Graphed | Chris Raff`;

            let currUrl = window.location.href.split('?')[0];
            document.getElementById('stageLink').href = `${currUrl}?stage=${stage.slice(0, -5)}`;

            window.scrollTo(0,0);

            plotData();
        } else {
            document.getElementById('stageInfo').innerHTML = 'Failed to load stage';
        }
    };
    xhrStageData.onerror = function() {
        document.getElementById('stageInfo').innerHTML = 'Failed to load stage';
    }
    xhrStageData.send();
}

// fetch available stages
var xhrStages = new XMLHttpRequest();
xhrStages.open('GET', dataUrl + `${selectorCategory}/${selectorYear}/info.json`);
xhrStages.responseType = 'json';
xhrStages.onload = function() {
    var status = xhrStages.status;
    if (status === 200) {
        let stages = xhrStages.response;
        let table = document.getElementById('challengeTable');
        
        // clear table
        while (table.rows.length > 1)
            table.deleteRow(1);

        if (stage == 'none') {
            getStageData(`${selectorCategory}/${selectorYear}/${stages.files[0].name}`);
        }
        
        let displayFields = ['date', 'vehicleClass', 'eventName', 'stageName', 'country', 'challengeName'];

        // add to table
        stages.files.forEach(function(stage) {
            let row = document.createElement('tr');
            displayFields.forEach(function(field) {
                let cell = document.createElement('td');
                let text = '';
                if (field == 'date') {
                    text = stage.entryWindow.start;
                    text = `${text.slice(8, 10)}.${text.slice(5, 7)}.${text.slice(0, 4)}`;
                } else {
                    text = stage[field];
                }

                cell.appendChild(
                    document.createTextNode(text)
                );
                row.appendChild(cell);
            });
            row.classList.add("w3-hover-dark-grey");
            row.onclick =  function() {
                getStageData(`${selectorCategory}/${selectorYear}/${stage.name}`);
            };
            table.appendChild(row);
        });
    } else {
        document.getElementById('stage-selector').hidden = true;
    }
};
xhrStages.onerror = function() {
    document.getElementById('stage-selector').style.display = 'none';
}
xhrStages.send();

function categoryUpdate() {
    let e = document.getElementById('category');
    category = e.options[e.selectedIndex].value;
    plotData();
}

function chartTypeUpdate() {
    let e = document.getElementById('chartType');
    chartType = e.options[e.selectedIndex].value;
    plotData();
}

function userUpdate() {
    let input = document.getElementById('username');
    let container = document.getElementById('userInfoContainer');
    let table = document.getElementById('userTable');
    let searchWarning = document.getElementById('userNotFound');
    
    if (input.value == '') {
        container.hidden = true;
    } else {
        let searchTerm = input.value.toLowerCase();

        let matches = []
        
        let displayFields = ['rank', 'name', 'vehicleName', 'totalTime']

        // clear table
        while (table.rows.length > 1)
            table.deleteRow(1);

        stageData.entries.forEach(function(entry) {
            if (matches.length > 5) return;

            let name = entry['name'];
            if (name == 'DiRT Player') return;
            let match = name.toLowerCase().includes(searchTerm);

            if (match) {
                matches.push(entry);

                // add to table
                let row = document.createElement('tr');
                displayFields.forEach(function(field) {
                    let cell = document.createElement('td');
                    let text = '';
                    if (field == 'totalTime') {
                        if (entry['dnf']) {
                            text = 'DNF';
                        } else {
                            text = timeToString(entry[field]);
                        }
                    } else {
                        text = entry[field];
                    }

                    cell.appendChild(
                        document.createTextNode(text)
                    );
                    row.appendChild(cell);
                })
                table.appendChild(row);
            }
        });

        container.hidden = false;
        if (matches.length == 0) {
            searchWarning.hidden = false;
            table.style.display = 'none';
        } else {
            searchWarning.hidden = true;
            table.style.display = 'table';
        }
    }
}

function safeDictionary(dictionary, key) {
    if (dictionary[key] !== undefined) return dictionary[key];
    return key;
}

function sortByKey(array, key){
    return array.sort(function(a, b) {
        var x = key(a); var y = key(b);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function convertHexToRGBA(hex, opacity) {
    const tempHex = hex.replace('#', '');
    const r = parseInt(tempHex.substring(0, 2), 16);
    const g = parseInt(tempHex.substring(2, 4), 16);
    const b = parseInt(tempHex.substring(4, 6), 16);
  
    return `rgba(${r},${g},${b},${opacity})`;
}

function timeToString(value, precision=3) {
    let seconds = (value % 60).toFixed(precision);
    if (value % 60 < 10)
        seconds = '0' + seconds;
    return `${Math.floor(value / 60)}:${seconds}`;
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

function getDistribution(times, xValueArray, normalizationMax=null) {
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
        }
    });

    let multiplier = 1;
    if (normalizationMax !== null) {
        multiplier = normalizationMax / Math.max(...dist);
    }

    // compile the final results into (x, y) points
    for (var i = 0; i < data.length; i++) {
        data[i] = {
            x: xValueArray[i],
            y: dist[i] * multiplier
        }
    }

    return data;
}

function plotData() {
    let finishers = stageData['entries'].filter((entry) => !entry['dnf']);
    let times = finishers.map((entry) => entry['totalTime']);

    let xValues = getXValues(times);

    if (category == 'none') {
        let distribution = getDistribution(times, xValues, 97);

        chartDists.data = {
            datasets: [{
                label: 'Distribution',
                data: distribution,
                borderColor: 'red',
                borderWidth: 2,
                showLine: true,
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
            }]
        }
        
        // show DNFs on the count chart
        let timeLists = groupTimesByCategory(stageData['entries'], 'dnf');
        let keys = Object.keys(timeLists);
        keys = sortByKey(keys, (key) => -timeLists[key].length);
        chartCount.data = {
            labels: keys.map((key) => safeDictionary(categoryNames['dnf'], key)),
            datasets: [{
                backgroundColor: colors.slice(0,keys.length),
                data: keys.map((key) => timeLists[key].length)
            }]
        }
    } else {
        let timeLists = groupTimesByCategory(finishers, category);

        let keys = Object.keys(timeLists);
        keys = sortByKey(keys, (key) => -timeLists[key].length);

        let colorMap = {};
        keys.forEach(function(key) {
            colorMap[key] = colors[Object.keys(colorMap).length % colors.length];
        });

        let i = 0;

        // simple distribution plot
        chartDists.data = {
            datasets: (chartType == 'stacked' ? keys.slice().reverse() : keys)
                    .filter((key) => timeLists[key].length >= 100)
                    .map(function(key) {
                return {
                    label: safeDictionary(categoryNames[category], key),
                    data: getDistribution(timeLists[key], xValues, chartType=='normal' ? 97 : null),
                    borderColor: colorMap[key],
                    borderWidth: 2,
                    showLine: true,
                    backgroundColor: convertHexToRGBA(colorMap[key], chartType == 'stacked' ? 1 : 0.1)
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

    let titleDist = 'Distribution of Stage Times';
    if (category != 'none') {
        titleDist += ' by ' + categoryNames[category][''];
    }
    let titleCount = 'Entries by ' + categoryNames[category == 'none' ? 'dnf' : category][''];

    chartDists.options = {
        title: {
            display: true,
            text: titleDist
        },
        legend: {
            display: category != 'none'
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
            type: 'linear',
            scaleLabel: {
                labelString: 'Time',
                display: true
            },
            ticks: {
                stepSize: 30,
                min: xValues[0],
                max: xValues[xValues.length - 1],
                callback: function(x) {
                    if (x%30 == 0)
                        return timeToString(x, 0);
                }
            }
        }],
        yAxes: [{
            type: 'linear',
            stacked: chartType == 'stacked',
            scaleLabel: {
                labelString: 'Frequency',
                display: true
            },
            ticks: {
                display: false
            }
        }]
    };

    chartCount.options.title = {
        display: true,
        text: titleCount
    }

    chartDists.update();
    chartCount.update();
}
