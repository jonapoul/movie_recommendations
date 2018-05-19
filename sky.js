/*
	Class to store a single XML element, with basic info about a film and four
	mood values that I think they have, to match with later
*/
function XMLElement(name, path, year, calm, happy, awake, fearless) {
	/* strings */
	this.name    = name;      /* e.g. "Snatch" */
	this.path    = path;      /* e.g. "images/Snatch.jpg" */
	this.year    = year;      /* e.g. "2000" */

	/* integers, from 0 to 100 */
	this.calm     = calm;
	this.happy    = happy;
	this.awake    = awake;
	this.fearless = fearless;

	this.calculateScore = function(calm, happy, awake, fearless) {
		/* 4-dimensional distance between the given mood values and my
		   (personally-judged) mood values for the film, from the XML data */
		const distance4D = Math.sqrt(Math.pow(this.calm     - calm,     2) +
		                             Math.pow(this.happy    - happy,    2) +
		                             Math.pow(this.awake    - awake,    2) +
		                             Math.pow(this.fearless - fearless, 2) );

		/* distance4D has a max value of 100 for an awful match, and 0 for a perfect
		   match. So we apply this shift to return a percentage value from 0 (bad
		   match) to 100 (good match) */
		return (200 - distance4D) / 2.0;
	}

	/* Convert a film's XML element into a Sky Movies website searh URL.
	   e.g. "The Terminal" becomes:
	   "http://www.sky.com/tv/movie/the-terminal-2004?term=the%20terminal" */
	this.getSkyMoviesURL = function() {
		const baseURL = "http://www.sky.com/tv/movie/";
		const lowerCase = this.name.toLowerCase();
		const wordsInTitle = lowerCase.split(" ");
		var titleWithDashes = ""; // e.g. "the-terminal"
		var titleWithSpaces = ""; // e.g. "the%20terminal"
		var i;
		for (i = 0; i < wordsInTitle.length; i++) {
			titleWithDashes += wordsInTitle[i] + "-";
			titleWithSpaces += wordsInTitle[i];
			if (i != wordsInTitle.length - 1) {
				titleWithSpaces += "%20";
			}
		}
		return baseURL + titleWithDashes + this.year + "?term=" + titleWithSpaces;
	}
}

/*
	Class to store an array of XMLElements, intended to help keep track of XML
	data between functions
*/
function XMLTree() {
	this.hasBeenLoaded = false;
	this.elements = []; /* array of XMLElements */
	this.length   = 0;

	/* Add a new element to the array */
	this.add = function(name, path, year, calm, happy, awake, fearless) {
		const newElement = new XMLElement(name, path, year, calm, happy, awake, fearless);
		this.elements.push(newElement);
		this.length++;
	}
	/* Remove all XML data, so we can read some new data in */
	this.empty = function() {
		var i;
		for (i = 0; i < this.length; i++) {
			this.elements.pop();
		}
		this.length = 0;
	}

	/* Calculate compatibility scores for each XML film, then pick the best five
	   and add them to the suggestions boxes at the bottom. */
	this.findSuggestions = function() {
		/* Can't do anything if there isn't any XML data to evaluate from */
		if (!this.hasBeenLoaded) {
			return;
		}

		/* Current mood values from 0->100 */
		const calm     = $("#agitated_calm_slider")  .slider("value");
		const happy    = $("#sad_happy_slider")      .slider("value");
		const awake    = $("#tired_wideawake_slider").slider("value");
		const fearless = $("#scared_fearless_slider").slider("value");

		var scores = [];
		var i;
		/* Compatibility scores from 0 (bad) to 100 (good) */
		for (i = 0; i < this.length; i++) {
			const score = this.elements[i].calculateScore(calm, happy, awake, fearless);
			scores.push(score);
		}

		/* Now go through the calculated scores and save:
				a) the 5 largest match scores, in order
				b) the indices of each in the global arrays */
		var largestScores = [], largestIndices = [];
		var scoresTemp = scores;
		for (i = 0; i < 5; i++) {
			var maxScore = scoresTemp[0], maxIndex = 0, j;
			for (j = 0; j < scoresTemp.length; j++) {
				if (maxScore < scoresTemp[j]) {
					maxScore = scoresTemp[j];
					maxIndex = j;
				}
			}
			largestScores.push( roundToPrecision(maxScore, 1) );
			largestIndices.push(maxIndex);
			scoresTemp[maxIndex] = -1;
		}

		/* Now update the suggestion boxes at the bottom of the html page */
		for (i = 0; i < 5; i++) {
			const suggestionIndex = (i+1).toString();
			const xmlElement      = this.elements[ largestIndices[i] ];

			/* add a clickable link to the suggestion box */
			const linkID   = "suggestion_link" + suggestionIndex;
			var link       = document.getElementById(linkID);
			link.href      = xmlElement.getSkyMoviesURL();
			link.innerHTML = "More Info"

			/* change the displayed image */
			const imageID = "suggestion_image" + suggestionIndex;
			var image     = document.getElementById(imageID);
			image.src     = xmlElement.path;

			/* change the displayed film's name */
			const nameID   = "suggestions_text_name" + suggestionIndex;
			var name       = document.getElementById(nameID);
			name.innerHTML = xmlElement.name;

			/* change the displayed release year */
			const yearID   = "suggestions_text_year" + suggestionIndex;
			var year       = document.getElementById(yearID);
			year.innerHTML = xmlElement.year;

			/* change the displayed match score as a percentage */
			const scoreID   = "suggestions_text_score" + suggestionIndex;
			var score       = document.getElementById(scoreID);
			score.innerHTML = "Match: " + largestScores[i] + "%";

			/* give the suggestion box a colour along the red->yellow->green scale,
			   from bad->neutral->good */
			const containerID = "suggestion_container" + suggestionIndex;
			setSuggestionColours(largestScores[i], containerID);
		}
	}

	/* Go through the given XML file and fill up our data tree */
	this.loadXML = function(xml) {
		/* clear any existing elements */
		this.empty();

		/* fill up the global tree with XML data */
		const films = xml.responseXML.getElementsByTagName("Film"); // number of parent nodes
		var i;
		for (i = 0; i < films.length; i++) {
			/* strings */
			const name = films[i].getElementsByTagName("Name")[0].childNodes[0].nodeValue;
			const path = films[i].getElementsByTagName("ImagePath")[0].childNodes[0].nodeValue;
			const year = films[i].getElementsByTagName("Year")[0].childNodes[0].nodeValue;
			/* integers from 0 -> 100 */
			const calm     = parseInt(films[i].getElementsByTagName("Calm")[0].childNodes[0].nodeValue);
			const happy    = parseInt(films[i].getElementsByTagName("Happy")[0].childNodes[0].nodeValue);
			const awake    = parseInt(films[i].getElementsByTagName("Awake")[0].childNodes[0].nodeValue);
			const fearless = parseInt(films[i].getElementsByTagName("Fearless")[0].childNodes[0].nodeValue);

			this.add(name, path, year, calm, happy, awake, fearless);
		}
		this.hasBeenLoaded = true;
		document.getElementById("submit_xml").innerHTML = "Read XML File";

		/* Evaluate the current scores and give suggestions */
		this.findSuggestions();
	}

}

/* Global namespace with one instance of the above */
Global = {
	xmlTree: XMLTree(),
};

/*
	Class to help simplify working with colours in HTML/CSS
*/
function RGB(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;

	/* Convert an RGB object to a string like "rgb(255,255,255)" */
	this.toString = function(factor = 1) {
		const r_round = Math.round(this.r * factor);
		const g_round = Math.round(this.g * factor);
		const b_round = Math.round(this.b * factor);
		return 'rgb(' + r_round + ',' + g_round + ',' + b_round + ')';
	}

	/* Interpolate between two colours, from:
			a) first colour to white
			b) white to second colour
		See https://www.desmos.com/calculator/jolvnp9iii for a graphical demo. */
	this.interpRGB = function(other, t) {
		const white = 255;
		var r, g, b;
		if (t < 0.5) {
			r = white - 4 * (white-this.r) * Math.pow(t-0.5, 2);
			g = white - 4 * (white-this.g) * Math.pow(t-0.5, 2);
			b = white - 4 * (white-this.b) * Math.pow(t-0.5, 2);
		} else {
			r = white - 4 * (white-other.r) * Math.pow(t-0.5, 2);
			g = white - 4 * (white-other.g) * Math.pow(t-0.5, 2);
			b = white - 4 * (white-other.b) * Math.pow(t-0.5, 2);
		}
		return new RGB(Math.round(r), Math.round(g), Math.round(b));
	}

	/* Same as above, except without going through a white phase in the middle. */
	this.lininterpRGB = function(other, t) {
		var r = this.r + (other.r - this.r) * t;
		var g = this.g + (other.g - this.g) * t;
		var b = this.b + (other.b - this.b) * t;
		return new RGB(r, g, b);
	}
}

window.onload = function ready () {
	/* Initialise an empty global XML data structure */
	Global.xmlTree = new XMLTree();

	/* Initialise our four mood sliders and their respective colour ranges */
	var slider1 = $('#agitated_calm_slider').slider({
		min:   0,
		max:   100,
		value: 50,
		step:  0.5,
		/* Input responeonse function */
		slide: function(event, ui) {
			const left  = new RGB(199,   0,  57); // red = agitated
			const right = new RGB(87 , 199, 133); // green = calm

			/* change colours based on the slider position */
			const interped  = left.interpRGB(right, ui.value/100);
			const rgbString = interped.toString();
			$(this).css({ 'background': rgbString });
			const rgbDarker = interped.toString(0.5);
			$(this).find('.ui-slider-handle').css({'background': rgbDarker});

			/* Print the current value on a scale of -100 to +100 */
			const sliderValueText = (2*ui.value - 100).toString();
			document.getElementById("centre_slider_text1").innerHTML = sliderValueText;
			Global.xmlTree.findSuggestions();
		}
	});

	var slider2 = $('#sad_happy_slider').slider({
		min:   0,
		max:   100,
		value: 50,
		step:  0.5,
		/* Input responeonse function */
		slide: function(event, ui) {
			const left  = new RGB( 81,  24, 73); // purple = sad
			const right = new RGB(237, 221, 83); // yellow = happy

			/* change colours based on the slider position */
			const interped  = left.interpRGB(right, ui.value/100);
			const rgbString = interped.toString();
			$(this).css({ 'background': rgbString });
			const rgbDarker = interped.toString(0.5);
			$(this).find('.ui-slider-handle').css({'background': rgbDarker});

			/* Print the current value on a scale of -100 to +100 */
			const sliderValueText = (2*ui.value - 100).toString();
			document.getElementById("centre_slider_text2").innerHTML = sliderValueText;
			Global.xmlTree.findSuggestions();
		}
	});

	var slider3 = $('#tired_wideawake_slider').slider({
		min:   0,
		max:   100,
		value: 50,
		step:  0.5,
		/* Input responeonse function */
		slide: function(event, ui) {
			var left  = new RGB( 61,  61, 107); // dark blue = tired
			var right = new RGB(255, 195,   0); // orange = awake

			/* change colours based on the slider position */
			const interped  = left.interpRGB(right, ui.value/100);
			const rgbString = interped.toString();
			$(this).css({ 'background': rgbString });
			const rgbDarker = interped.toString(0.5);
			$(this).find('.ui-slider-handle').css({'background': rgbDarker});

			/* Print the current value on a scale of -100 to +100 */
			const sliderValueText = (2*ui.value - 100).toString();
			document.getElementById("centre_slider_text3").innerHTML = sliderValueText;
			Global.xmlTree.findSuggestions();
		}
	});

	var slider4 = $('#scared_fearless_slider').slider({
		min:   0,
		max:   100,
		value: 50,
		step:  0.5,
		/* Input responeonse function */
		slide: function(event, ui) {
			var left  = new RGB(114, 159, 209); // cyan = scared
			var right = new RGB(255,  87,  51); // dark orange = fearless

			/* change colours based on the slider position */
			const interped  = left.interpRGB(right, ui.value/100);
			const rgbString = interped.toString();
			$(this).css({ 'background': rgbString });
			const rgbDarker = interped.toString(0.5);
			$(this).find('.ui-slider-handle').css({'background': rgbDarker});

			/* Print the current value on a scale of -100 to +100 */
			const sliderValueText = (2*ui.value - 100).toString();
			document.getElementById("centre_slider_text4").innerHTML = sliderValueText;
			Global.xmlTree.findSuggestions();
		}
	});

	/* Default all slider handles to grey */
	$('.ui-slider-handle').css({ 'background': 'rgb(128,128,128)' });
};

/* Take the file input dialog's results and wait until we can read it in */
function submitXMLfile() {
	/* If the user hasn't chosen a file to read yet, or they chose more than one,
	   change the button text for 2 seconds to let them know */
	const numberOfFilesChosen = $('#xml_uploads').prop('files').length;
	var button = document.getElementById("submit_xml");
	if (numberOfFilesChosen == 0) {
		button.innerHTML = "Select an XML file first!";
		setTimeout( function() { button.innerHTML = "Read XML File"; }, 2000);
		return;
	} else if (numberOfFilesChosen > 1) {
		button.innerHTML = "Only select one XML file!";
		setTimeout( function() { button.innerHTML = "Read XML File"; }, 2000);
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			Global.xmlTree.loadXML(xhr);
		}
	}
	/* We only want the one file, hence the [0] */
	xhr.open("GET", $('#xml_uploads').prop('files')[0].name, true);
	xhr.send();
}

/* Round a decimal number to the given number of decimal places */
function roundToPrecision(val, precision) {
	var factor = Math.pow(10, precision);
	return Math.round(val * factor) / factor;
}

/* Determines which colour to apply to the suggestion card as a gradient between
   green, yellow and red. */
function setSuggestionColours(score, containerID) {
	const red    = new RGB(255,   0,   0);
	const yellow = new RGB(255, 255,   0);
	const green  = new RGB(  0, 255,   0);

	var rgbString;
	if (score < 50) {
		rgbString = red.toString();
	} else if (score < 75) {
		const interped = red.lininterpRGB(yellow, (score-50)/25);
		rgbString = interped.toString();
	} else { /* score > 75 */
		const interped = yellow.lininterpRGB(green, (score-75)/25);
		rgbString = interped.toString();
	}
	$("#" + containerID).css({ 'background': rgbString });
}