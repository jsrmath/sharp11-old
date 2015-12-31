/*
 * Sharp11 v1.0
 * improv.js
 * (c) 2012 Julian Rosenblum
 */
 
Sharp11.Improv = function () {
  this.settings = {
    dissonance: 0.5, // Likelihood of picking a more dissonant scale, function is y = -2d(ln x), where d = dissonance, range 0 to 1
    changeDirection: 0.5, // Likelihood of changing chromatic direction, range 0 to 1
    jumpiness: 0.5, // Likelihood of jumping intervals
    rests: 0.5, // Likelihood of a note being a rest (previous note is sustained)
    rhythm: 0.5, // Likelihood of rhythmic variety
    range: [['F', 1], ['C', 3]], // Piano range
    tempo: 120,
    ratio: 1.5
  };
  this.bars = 8;
  this.beats = 4;
  this.changes = {};
  this.addChord = function (chord, bar, beat) {
    if (!(chord instanceof Sharp11.Chord)) {
      chord = new Sharp11.Chord(chord);    
    }
    this.changes[(bar - 1) * this.beats + beat] = chord;
  };
  this.improvise = function () {
    var that = this,
    notes = [],
    currentNotes = [],
    direction = 1,
    interval,
    // Returns a random octave number within bounds
    randomOctave = function () {
      return Math.floor(Math.random() * (that.settings.range[1][1] - that.settings.range[0][1] + 1)) + that.settings.range[0][1];
    },
    octaveNumber = randomOctave(),
    randomNote = function () {
      do {
        interval = Math.floor(Math.random() * scale.length);
        octaveNumber = randomOctave();
      }
      while ((octaveNumber === that.settings.range[0][1] && scale[interval].lower(that.settings.range[0][0])) ||
            (octaveNumber === that.settings.range[1][1] && scale[interval].higher(that.settings.range[1][0])))
    },
    grouping = 2,
    group = [],
    lastNote = null,
    i, j, scale, dissonance, chord, scaleName, current, rhythm,
    intervalMove = function (n) {
      n = n || 1;
      interval += direction * n;
      // Wrap around the scale
      if (interval < 0) {
        interval = interval + scale.length;
      }
      else if (interval >= scale.length) {
        interval = interval - scale.length;
      }
      // Wrap around piano octaves
      if (lastNote && lastNote.lower(scale[interval]) && direction === -1) {
        octaveNumber -= 1;
      }
      else if (lastNote && lastNote.higher(scale[interval]) && direction === 1) {
        octaveNumber += 1;
      }
      if ((octaveNumber <= that.settings.range[0][1]) && scale[interval].lower(that.settings.range[0][0]) || // Below the piano range
         (octaveNumber >= that.settings.range[1][1]) && scale[interval].higher(that.settings.range[1][0])) { // Above the piano range
        // Crude method of preventing stack overflow
        if (n === 2) {
          randomNote();
          return;
        }
        direction = -direction;
        intervalMove(2);
      }
    };
    for (i = 1; i <= this.bars * this.beats; i += 1) {
      if (this.changes[i]) {
        if (scaleName) {
          notes.push([chord.name, scaleName, currentNotes]);
          currentNotes = [];
        }
        chord = this.changes[i];
        current = scale ? scale[interval] : null;
        scale = chord.scales();
        dissonance = Math.floor(-2 * this.settings.dissonance * Math.log(Math.random()));
        scaleName = scale[dissonance < scale.length ? dissonance : 0];
        scale = chord.root.scale(scaleName).clean().scale.slice(0, -1);
        if (current) { // If possible, find equivelant note to current in new scale
          for (j = 0; j < scale.length; j += 1) {
            if (scale[j].enharmonic(current)) {
              interval = j;
              break;
            }
          }
        }
      }
      if (i === 1 || (Math.random() < this.settings.jumpiness)) {
        randomNote();
      }
      rhythm = Math.random();
      grouping = 2;
      group = [];
      if (rhythm < 2 * this.settings.rhythm / 3) {
        grouping = (rhythm < this.settings.rhythm / 3) ? 3 : 4;
      }
      for (j = 0; j < grouping; j += 1) {
        if (Math.random() < this.settings.rests / 2) {
          group.push(null);
        }
        else {
          lastNote = scale[interval];
          group.push([scale[interval], octaveNumber]);
          direction = Math.random() < this.settings.changeDirection / 2 ? -direction : direction;
          intervalMove();
        }
      }
      currentNotes.push(group);
    }
    notes.push([chord.name, scaleName, currentNotes]);
     notes.toString = function () {
      var i, retVal = '';
      for (i = 0; i < notes.length; i += 1) {
        retVal += notes[i][0] + ' => ' + notes[i][1] + ': ' + notes[i][2] + '<br />';  
      }
      return retVal;
    };
    return notes;
  };
};

Sharp11.Improv.songs = {
 valentine: {
    bars: 8,
    beats: 4,
    changes: [['C-', 1, 1],
    ['C-M7/B', 2, 1],
    ['C-7/Bb', 3, 1],
    ['F7', 4, 1],
    ['AbM7', 5, 1],
    ['F-7', 6, 1],
    ['D-7b5', 7, 1],
    ['G7#5', 8, 1]]
  },
  atrain: {
    bars: 8,
    beats: 4,
    changes: [['C6', 1, 1],
    ['D7#5', 3, 1],
    ['Dm7', 5, 1],
    ['G9', 6, 1],
    ['C6', 7, 1],
    ['Dm7', 8, 1],
    ['G7/Db', 8, 3]] 
  },
  takefive: {
    bars: 8,
    beats: 5,
    changes: [['C-', 1, 1],
    ['G-7', 1, 4],
    ['C-', 2, 1],
    ['G-7', 2, 4],
    ['C-', 3, 1],
    ['G-7', 3, 4],
    ['C-', 4, 1],
    ['C+7', 4, 4],
    ['F-7', 5, 1],
    ['Bb7', 5, 4],
    ['Gm7', 6, 1],
    ['Cm7', 6, 4],
    ['F-7', 7, 1],
    ['Bb7', 7, 4],
    ['EbM7', 8, 1]]
  }
};