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
	while (string.length < i+2) {
		str = string.substring(i, i+2);
		out[map[str]] = true;
	}
	return out;
}
function parseTime(string) {
	var out = [0, 0];
	var time = string.split(':');
	out[0] = +time[0] + (time[1].substring(2,4) == "PM" && !time[0] == "12" ? 12 : 0);
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
		nc.name = line.splice(0, 3).join(' ');//the name of the class, minus the major, number and dash from the line
		i++;//skip the second line, it has no information
		nc.enrolled = "Enrolled" == lines[i++];
		nc.credits = lines[i++];
		i += 4;
		carryOver = lines[i++].split(' ', 1)[0];
		console.log(carryOver);
		
		var parentClass = 0;//null
		var unParented = [];
		while (!isNaN(carryOver) && carryOver != '') {//while carryOver is numeric
			console.log("carryOver:" + carryOver + " was numberic");
			var toAdd = nc.clone();
			
			toAdd.classNumber = carryOver;
			toAdd.section = lines[i++];
			toAdd.type = lines[i++];
			line = lines[i++].split(' ');
			toAdd.days = parseDays(line[0]);
			console.log(line);
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
			console.log(i +": " + carryOver);
		}
	}
	return classes;
}

function parseAndPrint(text) {
	console.log('beginning');
	var cl = parseSchedule(text);
	console.log('completed--------------');
	console.log(cl);
	return false;
}