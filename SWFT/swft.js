//var classes = []
//var numParentClasses = 0;

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

class Time {
	constructor(h, m) {
		this.hour = h;
		this.minute = m;
	}
	clone() {
		return new Time(this.hour, this.minute);
	}
}
class Date {
	constructor(d, m, y) {
		this.day = d;
		this.month = m;
		this.year = y;
	}
	clone() {
		return new Date(this.day, this.month, this.year);
	}
}

function parseDays(string) {
	var out = [false, false, false, false, false];
	var map = { "Mo":0, "Tu":1, "We":2, "Th":3, "Fr":4 };
	var i = 0;
	while (string.length >= i+2) {
		str = string.substring(i, i+2);
		out[map[str]] = true;
		i+=2;
	}
	return out;
}
function parseTime(string) {
	var out = [0, 0];
	var time = string.split(':');
	out[0] = +time[0] + (time[1].substring(2,4) == "PM" && time[0] != "12" ? 12 : 0);
	out[1] = +time[1].substring(0, 2);
	return out;
}

class Class {
	constructor() {
		this.major = "";
		this.name = "";
		this.type = "";
		this.location = "";
		this.instructor = "";
		this.section = "";
		
		this.stime = new Time(0,0);
		this.etime = new Time(0,0);
		this.sdate = new Date(0,0,0);
		this.edate = new Date(0,0,0);
		this.number = "";
		this.classNumber = "";
		this.days = [false, false, false, false, false];
		this.enrolled = true;
		this.credits = "";
		this.subClasses = [];
	}
	clone() {
		var newClass = new Class();
		newClass.major = this.major;
		newClass.name = this.name;
		newClass.type = this.type;
		newClass.location = this.location;
		newClass.instructor = this.instructor;
		newClass.section = this.section;
		
		newClass.stime = this.stime.clone();
		newClass.etime = this.etime.clone();
		newClass.sdate = this.sdate.clone();
		newClass.edate = this.edate.clone();
		newClass.number = this.number;
		newClass.classNumber = this.classNumber;
		newClass.days = [];
		for (var i = 0; i < this.days.length; i++) {
			newClass.days.push(this.days[i]);
		}
		newClass.enrolled = this.enrolled;
		newClass.credits = this.credits;
		//subclasses are not cloned
		return newClass;
	}
	log() {
		console.log(this.major + ' ' + this.number);
		console.log(this.name);
		console.log(this.stime + ' - ' + this.etime);
	}
}

function parseSchedule(text) {
	var classes = [];
	var numParentClasses = 0;
	
	var lines = text.split('\n');
	var carryOver = lines[0].split(' ', 1)[0];
	
	var i = 1;
	while (i < lines.length) {
		i--;
		var nc = new Class();
		nc.major = carryOver;
		var line = lines[i++].split(' ');
		nc.number = line[1];
		nc.name = line.splice(3).join(' ');//the name of the class, minus the major, number and dash from the line
		i++;//skip the second line, it has no information
		nc.enrolled = "Enrolled" == lines[i++];
		nc.credits = lines[i++];
		i += 4;
		carryOver = lines[i++].split(' ', 1)[0];
		//console.log(carryOver);
		
		var parentClass = 0;//null
		var unParented = [];
		while (!isNaN(carryOver) && carryOver != '') {//while carryOver is numeric
			//console.log("carryOver:" + carryOver + " was numberic");
			var toAdd = nc.clone();
			
			toAdd.classNumber = carryOver;
			toAdd.section = lines[i++];
			toAdd.type = lines[i++];
			line = lines[i++].split(' ');
			toAdd.days = parseDays(line[0]);
			//console.log(line);
			toAdd.stime = parseTime(line[1]);
			toAdd.etime = parseTime(line[3]);//line[2] is '-'
			toAdd.location = lines[i++];
			toAdd.instructor = lines[i++];
			while (toAdd.instructor.endsWith(", ")) {
				toAdd.instructor += lines[i++];
			}
			toAdd.sdate[0] = +lines[i].substring(0,2);
			toAdd.sdate[1] = +lines[i].substring(3,5);
			toAdd.sdate[2] = +lines[i].substring(6,10);
			toAdd.edate[0] = +lines[i].substring(13,15);
			toAdd.edate[1] = +lines[i].substring(16,18);
			toAdd.edate[2] = +lines[i].substring(19,23);
			i++;
			
			if (toAdd.type == "Lecture") {
				parentClass = toAdd;
				
				for (var c = 0; c < unParented.length; c++) {
					parentClass.subClasses.push(unParented[c]);
				}
				numParentClasses++;
			} else if (parentClass != 0) {
				parentClass.subClasses.push(toAdd);
			} else {
				unParented.push(toAdd);
			}
			
			classes.push(toAdd);
			
			while (i < lines.length) {
				carryOver = lines[i++].split(' ', 1)[0];
				
				if (carryOver != "URL") {
					break;
				}
			}
			if (i >= lines.length) {
				carryOver = "I'm not a number";
			}
			//console.log(i +": " + carryOver);
		}
	}
	return classes;
}

function parseAndPrint(text) {
	console.log('beginning');
	var cl = parseSchedule(text);
	console.log('completed--------------');
	//for (var i = 0; i < cl.length; i++) {
	//	cl[i].log();
	//}
	//console.log(cl);
	updateCanvas(document.getElementById('image'), cl);
	return false;
}

//hue is out of 1
function hueToRed(hue) {
	hue %= 1;
	if (hue < 0) {
		hue += 1;
	}
	return Math.floor(255*Math.max(0, 3*(Math.abs(0.5-hue)-1/6)));
}
function hueVal(h, v) {
	r = hueToRed(h);
	g = hueToRed(h-1/3);
	b = hueToRed(h-2/3);
	if (v < 0.5) {
		r *= v*2;
		g *= v*2;
		b *= v*2;
	} else {
		r = 1 - (1 - r)*(1-v)*2;
		g = 1 - (1 - g)*(1-v)*2;
		b = 1 - (1 - b)*(1-v)*2;
	}
	return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

function padMinutes(number) {
	var numAsString = number.toString();
	if (numAsString.length == 1) {
		return '0' + numAsString;
	}
	return numAsString;
}
function updateCanvas(canvas, classes) {
	var hours = 12;
	var gX = 25, gY = 10, gsX = 200, gsY = 50;
	var ctx = canvas.getContext('2d');
	
	//evenly space colors between parent classes
	var hue = 0; //random number
	for (var i = 0; i < classes.length; i++) {
		var c = classes[i];
		if (c.type == "Lecture") {
			c.displayColor = hueVal(hue, 0.5);
			//go through subclasses, same hue but 0.7 or something for the val
			for (var j = 0; j < c.subClasses.length; j++) {
				c.subClasses[j].displayColor = hueVal(hue, 0.7);
			}
		}
	} 
	
	ctx.fillStyle = '#fff';
	ctx.fillRect(0,0, canvas.width, canvas.height);
	
	//background grid
	ctx.font = '16px sans-serif';
	ctx.textAlign = 'right';
    ctx.fillStyle = '#888';
	ctx.strokeStyle = '#888';
    ctx.beginPath();
	for (var i = 0; i < 6; i++) {
		ctx.moveTo(gX + i*gsX, gY);
		ctx.lineTo(gX + i*gsX, gY + hours*gsY);
	}
	for (var i = 0; i <= hours; i++) {
		ctx.moveTo(gX, gY + gsY*i);
		ctx.lineTo(gX + 5*gsX, gY + gsY*i);
		if (i%2 == 0) {
			ctx.fillText(i + 8, gX - 4, gY + gsY*i + 5);
		}
	}
    ctx.stroke();
	
	ctx.textAlign = 'left';
	
	for (var i = 0; i < classes.length; i++) {
		var c = classes[i];
		
		var stime = c.stime[0] + (c.stime[1]/60); //start time
		var dur = c.etime[0] + (c.etime[1]/60) - stime; //start time
		
		console.log(c.days);
		for (d = 0; d < c.days.length; d++) {
			if (c.days[d]) {
				console.log(d);
				ctx.fillStyle = c.displayColor;
				
				ctx.fillRect(gX + d*gsX + 1, gY + (stime*gsY - 8*gsY), gsX - 1, (dur*gsY));
				
				//shadow text
				ctx.fillStyle = '#bbb';
				var sOffX = 1, sOffY = 1;
				ctx.fillText(c.major + ' ' + c.number, gX + gsX/30 + gsX*d + sOffX, gY + gsY/10 + 10 + (stime*gsY - 8*gsY) + sOffY);
				ctx.font = '12px sans-serif';
				ctx.fillText(c.location, gX + gsX/30 + gsX*d + sOffX, gY + gsY/10 + 10 + 10 + (stime*gsY - 8*gsY) + sOffY);
				ctx.fillText(c.stime[0] + ':' + padMinutes(c.stime[1]) + ' - ' + c.etime[0] + ':' + padMinutes(c.etime[1]), gX + gsX/30 + gsX*d + sOffX, gY + gsY/10 + 10 + 10 + 10 + (stime*gsY - 8*gsY) + sOffY);
				ctx.font = '16px sans-serif';
				
				ctx.fillStyle = '#fff';
				ctx.fillText(c.major + ' ' + c.number, gX + gsX/30 + gsX*d, gY + gsY/10 + 10 + (stime*gsY - 8*gsY));
				ctx.font = '12px sans-serif';
				ctx.fillText(c.location, gX + gsX/30 + gsX*d, gY + gsY/10 + 10 + 10 + (stime*gsY - 8*gsY));
				ctx.fillText(c.stime[0] + ':' + padMinutes(c.stime[1]) + ' - ' + c.etime[0] + ':' + padMinutes(c.etime[1]), gX + gsX/30 + gsX*d, gY + gsY/10 + 10 + 10 + 10 + (stime*gsY - 8*gsY));
				ctx.font = '16px sans-serif';
			}
		}
	}
}

//http://jsfiddle.net/wboykinm/fL0q2uce/
function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
}