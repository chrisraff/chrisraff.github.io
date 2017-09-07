var globalClasses = []
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
class SimpleDate {
	constructor(d, m, y) {
		this.day = d;
		this.month = m;
		this.year = y;
	}
	clone() {
		return new SimpleDate(this.day, this.month, this.year);
	}
}

/*function daysToString(dayMap) {
	var out = "";
	for (var i = 0; i<5; i++) {
		if (days[i]) {
			out += dayMap[i];
		}
	}
	return out;
}*/

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
		this.sdate = new SimpleDate(0,0,0);
		this.edate = new SimpleDate(0,0,0);
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
				
				if (carryOver != "URL" && carryOver != "") {
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

function parseAndUpdate(text) {
	try{
		globalClasses = parseSchedule(text);
		updateCanvas(document.getElementById('image'), globalClasses);
		document.getElementById("output").innerHTML = "";
	}
	catch(err) {
		document.getElementById("output").innerHTML = "Schedule failed to parse, make sure you copied the entire schedule and nothing else";
	}
	return false;
}

//hue is out of 1
function hueToRed(hue) {
	hue += 1/3;
	hue %= 1;
	while (hue < 0) {
		hue += 1;
	}
	//return Math.floor(255*Math.max(0, 3*(Math.abs(0.5-hue)-1/6)));
	return Math.floor(255* Math.max(0, Math.min(1, 2 - Math.abs(2 - hue * 6) ) ) );
}
//v from -1 to 1
function hueVal(h, v) {
	var r = hueToRed(h);
	var g = hueToRed(h-1/3) * 0.8;
	var b = hueToRed(h-2/3);
	if (v < 0) {
		r *= 1+v;
		g *= 1+v;
		b *= 1+v;
	} else {
		r = 255*v + (1-v)*r;
		g = 255*v + (1-v)*g;
		b = 255*v + (1-v)*b;
	}
	return '#' + padMinutes(Math.round(r).toString(16)) + padMinutes(Math.round(g).toString(16)) + padMinutes(Math.round(b).toString(16));
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
	var hue = Math.random(); //random number
	
	var parentClasses = [];
	for (var i = 0; i < classes.length; i++) {
		if (classes[i].type == "Lecture") {
			parentClasses.push(classes[i]);
		}
	}
	for (var i = 0; i < parentClasses.length; i++) {
		var c = parentClasses[i];
		if (c.type == "Lecture") {
			c.displayColor = hueVal(hue, 0);
			//go through subclasses, same hue but 0.3 or something for the val
			for (var j = 0; j < c.subClasses.length; j++) {
				c.subClasses[j].displayColor = hueVal(hue, 0.6);
			}
		}
		hue += 1/parentClasses.length;
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
		var dur = c.etime[0] + (c.etime[1]/60) - stime; //duration
		
		for (d = 0; d < c.days.length; d++) {
			if (c.days[d]) {
				ctx.fillStyle = c.displayColor;
				
				ctx.fillRect(gX + d*gsX + 1, gY + (stime*gsY - 8*gsY), gsX - 2, (dur*gsY));
				
				//shadow text
				ctx.fillStyle = '#222';
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
	
	
	document.getElementById('downloadImage').addEventListener('click', function() {
		downloadCanvas(this, 'image', document.getElementById('filename').value + '.png');
	}, false);	
}

//jsfiddle.net/wboykinm/fL0q2uce/
function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
}

function getIcalString(classes) {
	var out = "BEGIN:VCALENDAR\n"
				+ "CALSCALE:GREGORIAN\n"
				+ "VERSION:2.0\n"
				+ "PRODID:-//SpireWithFewerTears//IcalExport Version 0.9.2//EN\n"
				+ "METHOD:PUBLISH\n";
	
	//time zone
	out += "BEGIN:VTIMEZONE\n"
				+ "TZID:America/New_York\n"
				+ "X-LIC-LOCATION:America/New_York\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:18831118T120358\n"
				+ "RDATE;VALUE=DATE-TIME:18831118T120358\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0456\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19180331T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19190330T070000Z;BYDAY=-1SU;BYMONTH=3\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19181027T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19191026T060000Z;BYDAY=-1SU;BYMONTH=10\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19200101T000000\n"
				+ "RDATE;VALUE=DATE-TIME:19200101T000000\n"
				+ "RDATE;VALUE=DATE-TIME:19420101T000000\n"
				+ "RDATE;VALUE=DATE-TIME:19460101T000000\n"
				+ "RDATE;VALUE=DATE-TIME:19670101T000000\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19200328T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19200328T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19740106T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19750223T020000\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19201031T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19201031T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19450930T020000\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19210424T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19410427T070000Z;BYDAY=-1SU;BYMONTH=4\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19210925T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19410928T060000Z;BYDAY=-1SU;BYMONTH=9\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19420209T020000\n"
				+ "RDATE;VALUE=DATE-TIME:19420209T020000\n"
				+ "TZNAME:EWT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19450814T190000\n"
				+ "RDATE;VALUE=DATE-TIME:19450814T190000\n"
				+ "TZNAME:EPT\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19460428T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19660424T070000Z;BYDAY=-1SU;BYMONTH=4\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19460929T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19540926T060000Z;BYDAY=-1SU;BYMONTH=9\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19551030T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19661030T060000Z;BYDAY=-1SU;BYMONTH=10\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19670430T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19730429T070000Z;BYDAY=-1SU;BYMONTH=4\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:19671029T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=20061029T060000Z;BYDAY=-1SU;BYMONTH=10\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19760425T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=19860427T070000Z;BYDAY=-1SU;BYMONTH=4\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:19870405T020000\n"
				+ "RRULE:FREQ=YEARLY;UNTIL=20060402T070000Z;BYDAY=1SU;BYMONTH=4\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:DAYLIGHT\n"
				+ "DTSTART:20070311T020000\n"
				+ "RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3\n"
				+ "TZNAME:EDT\n"
				+ "TZOFFSETFROM:-0500\n"
				+ "TZOFFSETTO:-0400\n"
				+ "END:DAYLIGHT\n"
				+ "BEGIN:STANDARD\n"
				+ "DTSTART:20071104T020000\n"
				+ "RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11\n"
				+ "TZNAME:EST\n"
				+ "TZOFFSETFROM:-0400\n"
				+ "TZOFFSETTO:-0500\n"
				+ "END:STANDARD\n"
				+ "END:VTIMEZONE\n";
				
	function classToIcalEvent(cl) {
		var timeZone = "America/New_York";
		
		var out = "BEGIN:VEVENT\n"
				+ "DESCRIPTION:Instructor: " + cl.instructor + "\\n" //the description becomes the notes section
					+ "Credits: " + cl.credits + "\\n"
					+ "Section number: " + cl.section + "\\n"
					+ "Class number: " + cl.classNumber + "\\n"
					+ "\\nGenerated by Spire With Fewer Tears\n"; 
			
		//Date(year, month, day, hours, minutes, seconds, milliseconds);
		//first occurrence of event - must find the first day the class occurs, not the first day of the semester
		var date = new Date(cl.sdate[2], cl.sdate[0] - 1, cl.sdate[1], cl.stime[0], cl.stime[1], 0, 0);
		var day = date.getDay();
		var sdateOffset = 0;
		for (var i = day - 1; i < day - 2 + 7; i++) {
			if (i%7<5 && cl.days[i%7]) {
				break;
			} else sdateOffset++;
		}
		
		date.setDate(date.getDate() + sdateOffset);
		
		out += "DTEND;TZID=" + timeZone + ":" + date.getFullYear() + padMinutes(date.getMonth()+1) + padMinutes(date.getDate()) + "T" + padMinutes(cl.etime[0]) + padMinutes(cl.etime[1]) + "00\n";
		out += "DTSTART;TZID=" + timeZone + ":" + date.getFullYear() + padMinutes(date.getMonth()+1) + padMinutes(date.getDate()) + "T" + padMinutes(cl.stime[0]) + padMinutes(cl.stime[1]) + "00\n";
		
		out += "LOCATION:" + cl.location + "\n";
		//recurrence
		var days = "";
		var dayMap = ["MO", "TU", "WE", "TH", "FR"];
		for (var i = 0; i < 5; i++) {
			if (cl.days[i]) {
				days += dayMap[i] + ",";
			}
		}
		days = days.substring(0, days.length - 1);//shave off final comma
		out += "RRULE:FREQ=WEEKLY;UNTIL=" + cl.edate[2] + padMinutes(cl.edate[0]) + padMinutes(cl.edate[1] + 1) + "T045959Z;BYDAY=" + days + "\n";
		//sequence could go here, set it to 0, I guess
		out += "SUMMARY:" + cl.major + " " + cl.number + " - " + cl.name + ", " + cl.type + "\n";
		out += "TRANSP:OPAQUE\n"; //this seems to indicate that the event is "busy" aka not free time
		var uidTail = cl.major + "-" + cl.number + "-" + cl.name + "-" + cl.type;
		uidTail = uidTail.split(' ').join('-');//replace spaces
		out += "UID:SWFT-" + cl.sdate[0]+"-"+cl.sdate[1]+"-"+cl.sdate[2] + "-" + uidTail + "\n";
		//date stamp
		var cal = new Date();
		out += "DTSTAMP:" + cal.getFullYear() + "" + padMinutes(cal.getMonth() + 1) + "" + padMinutes(cal.getDate()) + "T" + padMinutes(cal.getHours()) + padMinutes(cal.getMinutes()) + padMinutes(cal.getSeconds()) + "\n";
		
		out += "END:VEVENT\n";
		
		return out;
	}
				
	for (var i = 0; i < classes.length; i++) {
		out += classToIcalEvent(classes[i]);
	}
	out += "END:VCALENDAR";
	
	return out;
}