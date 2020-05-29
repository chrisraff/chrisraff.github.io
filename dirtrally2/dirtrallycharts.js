var stageData = null;
var category = 'vehicleName';
var chartType = 'stacked';
var selectorYear = 2020;
var selectorCategory = 'daily';
var selectorData = null;
var stage = 'none';
var dataUrl = 'https://www.chrisraff.com/dirtrally2-event-data/'

var colors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba'];
var chartDists = null;
var chartCount = null;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if (urlParams.has('stage')) {
    stage = urlParams.get('stage') + '.json';
}

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
    // init charts
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
    
    // set up graph params if specified
    if (urlParams.has('cat') && urlParams.get('cat')) {
        let valid = false;
        let e = document.getElementById('category');
        Array.from(e.options).forEach(function(o) {
            if (o.value == urlParams.get('cat'))
                valid = true;
        })
        if (valid) {
            category = urlParams.get('cat');
            e.value = category;
        }
    }
    if (urlParams.has('ctyp') && urlParams.get('ctyp')) {
        let valid = false;
        let e = document.getElementById('chartType');
        Array.from(e.options).forEach(function(o) {
            if (o.value == urlParams.get('ctyp'))
                valid = true;
        })
        if (valid) {
            chartType = urlParams.get('ctyp')
            e.value = chartType;
        }
    }

    // pressing enter triggers user search
    document.getElementById('username').addEventListener('keydown', function(event) {
        if (event.keyCode == 13) {
            userUpdate();
        }
    })

    // load stage if it was specified
    if (stage != 'none')
        this.getStageData(stage);

    // populate the challenge selection list
    this.getAvailableChallenges();
}

function getStageData(stageFName) {
    var xhrStageData = new XMLHttpRequest();
    xhrStageData.open('GET', dataUrl + stageFName, true);
    xhrStageData.responseType = 'json';
    xhrStageData.onload = function() {
        var status = xhrStageData.status;
        if (status === 200) {
            stageData = xhrStageData.response;
            
            document.getElementById('stageName').innerHTML = `${stageData.challengeName}: ${stageData.stageName} - ${stageData.eventName}`;
            
            let dateStr = stageData.entryWindow.start;
            document.getElementById('stageInfo').innerHTML =
                    `${dateStr.slice(8, 10)}.${dateStr.slice(5, 7)}.${dateStr.slice(0, 4)} &#x2022 ${stageData.entries.length} players`;

            document.title = `${stageData.stageName} - DR2 Graphed | Chris Raff`;

            stage = stageFName;

            updateLink();
            userUpdate();

            window.scrollTo(0,0);

            plotData();

            // show / hide appropriate tables / columns for challenges with multiple stages
            let multistageSelector = document.getElementById('multistage-selector');
            let totalCols = document.getElementsByClassName('player-col-total');
            if (stageData.challengeType == 'daily') {
                multistageSelector.style.display = 'none';
                Array.prototype.forEach.call(
                    totalCols,
                    function(e) {
                        e.style.display = 'none';
                    }
                );
            } else {
                multistageSelector.style.display = 'block';
                updateMultistageTable(stageData.challengeId);
                Array.prototype.forEach.call(
                    totalCols,
                    function(e) {
                        e.style.display = 'table-cell';
                    }
                );
            }

            updateSelectorHighlighting();
        } else {
            document.getElementById('stageName').innerHTML = 'Failed to load stage';
        }
    };
    xhrStageData.onerror = function() {
        document.getElementById('stageName').innerHTML = 'Failed to load stage';
    }
    xhrStageData.send();
}

function getAvailableChallenges() {
    var xhrStages = new XMLHttpRequest();
    xhrStages.open('GET', dataUrl + `${selectorCategory}/${selectorYear}/info.json`);
    xhrStages.responseType = 'json';

    function onFail() {
        Array.prototype.forEach.call(
            document.getElementsByClassName('challenge-table'),
            function(e) {e.style.display = 'none';}
        );
        document.getElementById('challenge-failed').style.display = 'block';
    }

    xhrStages.onload = function() {
        var status = xhrStages.status;
        if (status === 200) {
            selectorData = xhrStages.response;
            let table = document.getElementById(`${selectorCategory}-challenge-table`);

            table.style.display = 'table';

            // clear table
            while (table.rows.length > 1)
                table.deleteRow(1);

            if (stage == 'none') {
                getStageData(`${selectorCategory}/${selectorYear}/${selectorData.files[0].name}`);
            }

            let displayFields = {
                'daily':    ['date', 'vehicleClass', 'eventName', 'stageName', 'country', 'challengeName'],
                'weekly':   ['date', 'vehicleClass', 'eventName', 'country', 'stageCount'],
            }[selectorCategory];

            // add to table
            selectorData.files.forEach(function(stage) {
                let challengeRow = document.getElementById(`challenge-row-${stage.challengeId}`);

                // if the challenge already has a row, update necessary fields
                if (challengeRow != null) {
                    let stageCountCell = document.getElementById(`cell-${stage.challengeId}-stageCount`);
                    if (stageCountCell != null) {
                        stageCountCell.innerText = 1 + Number(stageCountCell.innerText);
                    }
                } else {
                    // otherwise, create the challenge row
                    let row = document.createElement('tr');
                    row.id = `challenge-row-${stage.challengeId}`;
                    displayFields.forEach(function(field) {
                        let cell = document.createElement('td');
                        let text = '';
                        switch (field) {
                        case 'date':
                            text = stage.entryWindow.start;
                            text = `${text.slice(8, 10)}.${text.slice(5, 7)}.${text.slice(0, 4)}`;
                            break;
                        case 'stageCount':
                            text = '1';
                            break;
                        default:
                            text = stage[field];
                        }

                        cell.id = `cell-${stage.challengeId}-${field}`;

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
                }
            });

            updateSelectorHighlighting();

            document.getElementById('challenge-failed').style.display = 'none';
        } else {
            onFail();
        }
    };
    xhrStages.onerror = onFail;
    xhrStages.send();
}

function categoryUpdate() {
    let e = document.getElementById('category');
    category = e.options[e.selectedIndex].value;
    updateLink();
    plotData();
}

function chartTypeUpdate() {
    let e = document.getElementById('chartType');
    chartType = e.options[e.selectedIndex].value;
    updateLink();
    plotData();
}

// update the user table
function userUpdate() {
    let input = document.getElementById('username');
    let table = document.getElementById('userTable');
    let searchWarning = document.getElementById('userNotFound');

    let searchTerm = input.value.toLowerCase();

    let displayFields = ['rank', 'name', 'vehicleName', 'stageTime', 'stageDiff', 'totalTime', 'totalDiff'];

    if (stageData.challengeType == 'daily') {
        displayFields = displayFields.slice(0, -2);
    }

    // clear table
    while (table.rows.length > 1)
        table.deleteRow(1);

    let displayCount = 0;
    let bestTime = 0;

    searchWarning.hidden = false;

    let sortedStages = sortByKey([...stageData.entries], (e) => e['totalTime']);

    let bestStageTime = Infinity;
    let bestTotalTime = Infinity;

    sortedStages.forEach(function(entry) {
        if (entry.stageTime < bestStageTime) {
            bestStageTime = entry.stageTime;
        }
        if (entry.totalTime < bestTotalTime) {
            bestTotalTime = entry.totalTime;
        }
    });

    // sortedStages.forEach(function(entry) {
    for (let i = 0; i < sortedStages.length; i++) {
        entry = sortedStages[i];

        if (displayCount >= 5) break;

        let name = entry['name'];
        if (name == 'DiRT Player' && searchTerm != '') continue;
        let match = name.toLowerCase().includes(searchTerm);

        if (match) {
            searchWarning.hidden = true;
        }

        if (match || i == 0) {
            displayCount += 1;

            if (entry['rank'] == 1) {
                bestTime = entry.totalTime;
            }

            // add to table
            let row = document.createElement('tr');
            displayFields.forEach(function(field) {
                let cell = document.createElement('td');
                let text = '';

                // set the text value according to the field
                switch (field) {
                    case 'rank':
                        text = i + 1;
                        break;
                    case 'stageTime':
                    case 'totalTime':
                        if (entry['dnf']) {
                            text = 'DNF';
                        } else {
                            text = timeToString(entry[field]);
                        }
                        break;
                    case 'stageDiff':
                        if (entry['dnf'] || i == 0) {
                            text = '--';
                        } else {
                            text = `+${timeToString(entry.stageTime - bestStageTime)}`;
                        }
                        break;
                    case 'totalDiff':
                        if (entry['dnf'] || i == 0) {
                            text = '--';
                        } else {
                            text = `+${timeToString(entry.totalTime - bestTotalTime)}`;
                        }
                        break;
                    default:
                        text = entry[field];
                }

                cell.appendChild(
                    document.createTextNode(text)
                );
                row.appendChild(cell);
            })
            table.appendChild(row);
        }
    }
}

function updateMultistageTable(challengeId) {
    let table = document.getElementById('multistage-table');

    let displayFields = ['stageId', 'stageName', 'eventName'];

    // clear table
    while (table.rows.length > 1)
        table.deleteRow(1);

    selectorData.files.forEach(function(stage) {
        if (stage.challengeId == challengeId) {
            // add to table
            let row = document.createElement('tr');
            displayFields.forEach(function(field) {
                let cell = document.createElement('td');
                let text = '';
                if (field == 'stageId') {
                    text = stage.stageId + 1;
                } else {
                    text = stage[field];
                }

                cell.appendChild(
                    document.createTextNode(text)
                );
                row.appendChild(cell);
            });

            row.id = `stage-row-${stage.stageId}`;

            row.classList.add("w3-hover-dark-grey");

            let currSelectorCategory = selectorCategory;
            row.onclick =  function() {
                getStageData(`${currSelectorCategory}/${stage.entryWindow.start.slice(0,4)}/${stage.name}`);
            };

            table.children[0].insertBefore(row, table.children[0].children[1]);
        }
    });
}

function updateMultistageElements() {
    let multistageSelector = document.getElementById('multistage-selector');
    let totalCols = document.getElementsByClassName('player-col-total');
    if (stageData.challengeType) {
        multistageSelector.style.display = 'none';
        Array.prototype.forEach.call(
            totalCols,
            function(e) {
                e.style.display = 'none';
            }
        );
    } else {
        multistageSelector.style.display = 'block';
        updateMultistageTable(stageData.challengeId);
        Array.prototype.forEach.call(
            totalCols,
            function(e) {
                e.style.display = 'table-cell';
            }
        );
    }
}

function updateSelectorHighlighting() {
    // first, de-highlight the old one
    Array.prototype.forEach.call(
        document.getElementsByClassName('challenge-selected'),
        function(e) {
            e.classList.remove('w3-light-blue');
            e.classList.remove('challenge-selected');
        }
    );
    // then, highlight the new one
    if (stageData != undefined) {
        let challengeRow = document.getElementById(`challenge-row-${stageData.challengeId}`);
        if (challengeRow != null) {
            challengeRow.classList.add('w3-light-blue');
            challengeRow.classList.add('challenge-selected');
        }
        let stageRow = document.getElementById(`stage-row-${stageData.stageId}`);
        if (stageRow != null) {
            stageRow.classList.add('w3-light-blue');
            stageRow.classList.add('challenge-selected');
        }
    }
}

function updateLink() {
    let currUrl = window.location.href.split('?')[0];
    let extras = '';
    let catSelector = document.getElementById('category');
    let typSelector = document.getElementById('chartType');
    if (catSelector.value != 'vehicleName')
        extras += `&cat=${catSelector.value}`
    if (typSelector.value != 'stacked')
        extras += `&ctyp=${typSelector.value}`
    document.getElementById('stageLink').href = `${currUrl}?stage=${stage.slice(0, -5)}${extras}`;
}

function updateCategoryTab(event, category) {
    selectorCategory = category;

    // update which table is showing
    Array.prototype.forEach.call(
        document.getElementsByClassName('category-tab-target'),
        function(e) {
            if (e.id == `${category}-challenge-table`) {
                e.style.display = 'table';
            } else {
                e.style.display = 'none';
            }
        }
    );
    // populate the table
    getAvailableChallenges();

    // update which tab link is highlighted
    Array.prototype.forEach.call(
        document.getElementsByClassName('category-tab-link'),
        function(e) {
            e.classList.remove('w3-light-blue');
        }
    );

    event.currentTarget.classList.add('w3-light-blue');
}

// -------- convenience functions

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

// ------- functions related to graphing

function getXValues(times, resolution=150) {
    // assumes times are sorted
    var xmin = times[0]; // Math.min(...times)
    var xmax = times[Math.floor(times.length * 0.99)];
    let diff = xmax - xmin;
    let buffer = 0.05;
    xmin -= buffer * diff;
    xmax += buffer * diff;

    // if within 5 seconds of a multiple of 30, take that multiple
    let nearness = xmin % 30;
    if (nearness <= 5) {
        xmin -= nearness;
    }
    else if (nearness >= 25) {
        xmin += (30 - nearness);
    }
    if (nearness <= 5) {
        xmax -= nearness;
    }
    else if (nearness >= 25) {
        xmax += (30 - nearness);
    }

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

        // Oculus players are PC players, put them both in a PC category
        if (Object.keys(timeLists).includes('Oculus')) {
            if (!Object.keys(timeLists).includes('Steam')) {
                timeLists['Steam'] = [];
            }
            timeLists['PC'] = timeLists['Steam'].concat(timeLists['Oculus']);
            delete timeLists.Steam;
            delete timeLists.Oculus;
        }

        let keys = Object.keys(timeLists);
        keys = sortByKey(keys, (key) => -timeLists[key].length);

        let colorMap = {};
        keys.forEach(function(key) {
            colorMap[key] = colors[Object.keys(colorMap).length % colors.length];
        });

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
                    if (x%5 == 0)
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
