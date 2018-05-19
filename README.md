# Movie Recommendations

This application was mostly tested with Firefox 58.0.1 on Ubuntu. As such, I
recommend that you judge it on that browser/platform combination, if possible.

I've included XML data for 31 of my favourite films, each with personally-judged
values for the four mood values. The application uses these values to find the
compatibility score (between the user's mood and the film) by treating moods as
4-dimensional vectors and calculating the distance between the two, then
converting that to a percentage match. The app uses Javascript, HTML and CSS for
layout and functionality.

To use the app, you must first click the "Choose File" dialog and pick a
compatible XML file, then click "Load XML File" to load that data into the
application. The user can then drag the four sliders from left to right, with
appropriate colour scales on each. The bottom of the screen contains five
appropriate suggestions, each listed with its DVD cover, its title, the
compatibility score as a percentage, and generates a link to more information
on the Sky website. The colour of each card gradually changes along with user
input, based on the compatibility score: green at 100%, yellow at 75% and red
for below 50%.