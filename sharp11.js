/*
 * Sharp11 v1.0
 * sharp11.js
 * (c) 2012 Julian Rosenblum
 */

var Sharp11 = (function () {
  // Various object literals that are used as maps
  var maps = {
    // Distance from C minus 1
    number: {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    },
    // An array that is used like a map.  It's the number map inside out
    cScale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    // Number of half-steps from C for naturals
    quality: {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    },
    // Number of half-steps for each major/perfect interval
    major: {
      '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11  
    },
    // Legit names for interval abbreviations
    intervalName: {
      '1': 'Unison', '2': 'Second', '3': 'Third', '4': 'Fourth', '5': 'Fifth', '6': 'Sixth', '7': 'Seventh', '8': 'Octave', '9': 'Ninth', '10': 'Tenth', '11': 'Eleventh', '12': 'Twelfth', '13': 'Thirteenth', '14': 'Fourteenth', 'M': 'Major', 'm': 'Minor', 'P': 'Perfect', 'dim': 'Diminished', 'aug': 'Augmented'  
    }
  },
  // Maps that we want to turn inside out
  prop,
  num,
  // Private Interval constructor
  Interval = function (number, quality) {
    number = String(number);
    // If no quality is given, see if quality is given in "number" argument
    if (!quality) {
      // If quality is not given in "number" argument, assume major/perfect
      if (String(+number) === number) {
        // Perfect
        if (number === '1' || number === '4' || number === '5' || number === '8') {
          quality = 'P';  
        }
        // Major
        else {
          quality = 'M';  
        }
      }
      // Assume "number" argument contains full interval
      else {
        quality = number.match(/\D+/)[0];
        number = number.match(/\d+/)[0];
      }
    }
    // Handle quality aliases
    quality = quality.replace('A', 'aug').replace('d', 'dim').replace('dimim', 'dim').replace('maj', 'M').replace('min', 'm').replace('perf', 'P');
    this.number = number;
    this.quality = quality;
    // Abbreviated interval name
    // Example: M6
    this.name = quality + number;
    // Full interval name
    // Example : Major Sixth
    this.fullName = maps.intervalName[quality] + ' ' + maps.intervalName[number];
    this.toString = function () {
      return this.name;    
    };
  };
  // Add accidentals to quality map
  for (prop in maps.quality) {
    if (maps.quality.hasOwnProperty(prop)) { 
      num = maps.quality[prop];
      maps.quality[prop + '#'] = num + 1 > 11 ? 12 - (num + 1) : num + 1;
      maps.quality[prop + '##'] = num + 2 > 11 ? 12 - (num + 2) : num + 2;
      maps.quality[prop + 'b'] = num - 1 < 0 ? 12 + num - 1 : num - 1;
      maps.quality[prop + 'bb'] = num - 2 < 0 ? 12 + num - 2 : num - 2;
    }
  }
  return {
    // Sharp11 version
    version: '1.0',
    // Utility function, retuns whether key is sharp key or flat key
    keyType: function (key) {
      var sharps = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'],
      flats = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'],
      i;
      for (i = 0; i < 7; i += 1) {
        if (sharps[i] === key.name) {
          return '#';  
        }
        if (flats[i] === key.name) {
          return 'b';  
        }
      }
      return null;
    },
    // Note constructor given a string name
    Note: function (name) {
      // Strip spaces and handle "x" alias for double sharp
      name = name.replace(/[\s]/g, '').replace('x', '##').replace('s', '#');
      if (!(/^[A-Ga-g](bb|##|[b#n])?$/).test(name)) {
        throw new Error('Invalid note name: ' + name);
      }
      // Force uppercase and strip unneeded "n" from note name
      this.name = name[0].toUpperCase() + name.slice(1).replace('n', '');
      // Name with 's' instead of '#'
      this.nameFormat = this.name.replace('#', 's');
      this.letter = this.name[0];
      // If no accidental is given, assume natural
      this.acc = this.accidental = name.slice(1) || 'n';
      // Raise letter by interval
      // Example: if letter is A and num is 3, return C
      var addNumber = function (num) {
        num = Number(num);
        if (num > 8) {
          num -= 7;    
        }
        var noteName = maps.number[name[0].toUpperCase()] + num - 1;
        if (noteName > 6) {
          noteName -= 7;  
        }
        return maps.cScale[noteName];
      };
      // Return the interval to a given note object or string name
      this.getInterval = function (newNote, octaveJump) {
        var number, quality, halfSteps;
        // If the note that is being raised is a double accidental, throw an error
        // It's theoretically possible but it gets messy
        if (this.accidental === 'bb' || this.accidental === '##') {
          throw new Error('Can\'t use double sharp or double flat as base key.');
        }
        if (!(newNote instanceof Sharp11.Note)) {
          newNote = new Sharp11.Note(newNote);
        }
        // Find the number of the interval using the number map
        number = maps.number[newNote.letter] - maps.number[this.letter] + 1;
        // Find the number of half-steps using the quality map
        halfSteps = maps.quality[newNote.name] - maps.quality[this.name];
        // If we wind up with a number below one
        if (number < 1) {
          number += 7;    
        }
        // If we wind up with a number of half-steps below 0
        if (halfSteps < 0) {
          halfSteps += 12;    
        }
        quality = '';
        // Handle various abnormalities
        if (halfSteps - maps.major[number] === 11) {
          halfSteps -= 12;
        }
        if (halfSteps - maps.major[number] === -11) {
          halfSteps += 12;
        }
        // Handle perfect intervals
        if (number === 1 || number === 4 || number === 5 || number === 8) {
          // Number of half steps away from the perfect interval
          switch (halfSteps - maps.major[number]) {
          case 0:
            quality = 'P';
            break;
          case 1:
            quality = 'aug';
            break;
          case -1:
            quality = 'dim';
            break;
          default:
            throw new Error('Invalid interval');
          }
        }
        // Handle major intervals
        else {
          // Number of half steps away from the major interval
          switch (halfSteps - maps.major[number]) {
          case 0:
            quality = 'M';
            break;
          case 1:
            quality = 'aug';
            break;
          case -1:
            quality = 'm';
            break;
          case -2:
            quality = 'dim';
            break;
          default:
            throw new Error('Invalid interval');
          }
        }
        // Handle octave jumps if applicable
        if (octaveJump !== undefined) {
          if (octaveJump >= 1 && (maps.number[this.letter] <= maps.number[newNote.letter] || octaveJump > 1)) {
            number += 7;
          }
        }
        return new Interval(number, quality);
      };
      // Sharp the note
      this.sharp = function () {
        // Change the accidental depending on what it is
        switch (this.accidental) {
        case 'b':
          return new Sharp11.Note(this.letter);
        // When sharping a double sharp, we need to go to the next letter
        case '##':
          if (this.letter === 'B' || this.letter === 'E') { // B and E are weird
            return new Sharp11.Note(addNumber(2) + '##');
          }
          else {
            return new Sharp11.Note(addNumber(2) + '#');    
          }
        case 'bb':
          return new Sharp11.Note(this.letter + 'b');
        default:
          return new Sharp11.Note(name + '#');
        }
      };
      // Flat the note
      this.flat = function () {
        // Change the accidental depending on what it is
        switch (this.accidental) {
        case '#':
          return new Sharp11.Note(this.letter);
        // When flatting a double flat, we need to go to the previous letter
        case 'bb':
          if (this.letter === 'C' || this.letter === 'F') { // C and F are weird
            return new Sharp11.Note(addNumber(7) + 'bb');
          }
          else {
            return new Sharp11.Note(addNumber(7) + 'b');    
          }
        case '##':
          return new Sharp11.Note(this.letter + '#');
        default:
          return new Sharp11.Note(name + 'b');
        }    
      };
      // Get rid of double sharps, double flats, B#, E#, Cb, and Fb
      this.clean = function () {
        var newName = name.replace('B#', 'C').replace('E#', 'F').replace('Cb', 'B').replace('Fb', 'E');
        if (newName.slice(1) === '##') {
          newName = addNumber(2);
        }
        if (newName.slice(1) === 'bb') {
          newName = addNumber(7);
        }
        return new Sharp11.Note(newName);
      };
      // Transpose the note up a given interval
      this.transpose = function (interval) {
        var noteName,
        i,
        // Array of possible accidentals
        testArray = ['', '#', 'b', '##', 'bb'];
        // If the note that is being raised is a double accidental, throw an error
        // It's theoretically possible but it gets messy
        if (this.accidental === 'bb' || this.accidental === '##') {
          throw new Error('Can\'t use double sharp or double flat as base key.');
        }
        if (!(interval instanceof Interval)) {
          interval = new Interval(interval);    
        }
        // Find the letter value of the new note
        noteName = addNumber(interval.number);
        // If we're dealing with an interval above an octave, reduce it
        if (interval.number > 8) {
          interval = new Interval(interval.number - 7, interval.quality);    
        }
        // Check all the different accidentals with that letter to see which one is right
        for (i = 0; i < testArray.length; i += 1) {
          try {
            if (this.getInterval(noteName + testArray[i]).name === interval.name) {
              return new Sharp11.Note(noteName + testArray[i]);
            }
          } catch (e) {}
        }
        throw new Error('Invalid interval: ' + interval);
      };
      this.toString = function () {
        return this.name;    
      };
      this.toHTML = function () {
        return this.name[0] + (this.name.slice(1) ? '<sup>' + this.name.slice(1) + '</sup>' : '');  
      };
      // Return true if current note is enharmonic with a given note
      this.enharmonic = function (note) {
        if (!(note instanceof Sharp11.Note)) {
          note = new Sharp11.Note(note);
        }
        if (this.clean().name === note.clean().name) {
          return true;    
        }
        try {
          if (this.clean().getInterval(note.clean()).name === 'dim2' || this.clean().getInterval(note.clean()).name === 'aug7') {
            return true;
          }
        } catch (e) {
          try {
            if (note.clean().getInterval(this.clean()).name === 'dim2' || note.clean().getInterval(this.clean()).name === 'aug7') {
              return true;  
            }
          } catch (e2) {}
        }
        return false;
      };
      // Changes sharp to flat, flat to sharp
      this.toggleAccidental = function () {
        if (this.acc === '#') {
          return this.transpose('dim2');    
        }
        else if (this.acc === 'b') {
          return this.transpose('aug7');    
        }
        else {
          return this.clean();    
        }
      };
      // Returns true if note is lower (within a C-bound octave) than the given note
      this.lower = function (note) {
        var n1, n2;
        if (!(note instanceof Sharp11.Note)) {
          note = new Sharp11.Note(note);
        }
        n1 = this.clean();
        n2 = note.clean();
        if (n1.letter === n2.letter) {
          if (n1.acc === n2.acc) {
            return false;  
          }
          if (n1.acc === '#') {
            return false;
          }
          if (n1.acc === 'n') {
            if (n2.acc === 'b') {
              return false;
            }
            else {
              return true;    
            }
          }
          if (n1.acc === 'b') {
            return true;  
          }
        }
        return maps.number[n1.letter] < maps.number[n2.letter]; 
      };
      // Returns true if note is higher (within a C-bound octave) than the given note
      this.higher = function (note) {
        if (!(note instanceof Sharp11.Note)) {
          note = new Sharp11.Note(note);
        }
        return (this.clean().name === note.clean().name ? false : !(this.lower(note)));
      }
    }
  };
}());