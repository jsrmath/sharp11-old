/*
 * Sharp11 v1.0
 * chord.js
 * (c) 2012 Julian Rosenblum
 */

// Create a chord object
Sharp11.Chord = function (chord) {
  var i, root, chordSymbol, bass,
  // Array of intervals to build scale
  intervals;
  chordSymbol = chord.replace(/^[A-Ga-g][#b]{0,2}/, '');
  root = new Sharp11.Note(chord.match(/^[A-Ga-g][#b]{0,2}/)[0]);
  // Strip spaces in chord symbol.  If no chord symbol is given, assume major triad
  chordSymbol = chordSymbol ? chordSymbol.replace(/[\s]/g, '') : 'M';
  if ((/\/[A-Ga-g][#b]{0,2}$/).test(chordSymbol)) {
    bass = new Sharp11.Note(chordSymbol.match(/\/[A-Ga-g][#b]{0,2}$/)[0].replace('/', ''));  
  }
  else {
    bass = root;  
  }
  // Array of note objects
  this.chord = [root];
  intervals = this.parseChord(chordSymbol);
  for (i = 0; i < intervals.length; i += 1) {
    if (intervals[i]) {
      this.chord.push(root.transpose(intervals[i] + i));
    }
  }
  if (bass.name !== root.name) {
    // See if the bass is located in the chord
    for (i = 0; i < this.chord.length; i += 1) {
      if (this.chord[i].enharmonic(bass)) {
        this.chord[i] = bass;
        this.chord = this.chord.slice(i).concat(this.chord.slice(0, i)); 
        i = false;
        break;
      }
    }
    // If not, add the bass at the beginning
    if (i) {
      this.chord = [bass].concat(this.chord);
    }
  }
  this.root = root;
  this.symbol = Sharp11.Chord.alias(chordSymbol);
  this.bass = bass;
  this.name = root + chordSymbol;
  this.toString = function () {
    return this.chord.toString();  
  };
  this.transpose = function (interval) {
    return new Sharp11.Chord(root.transpose(interval) + (bass.name !== root.name ? chordSymbol.replace(/\/[A-Ga-g][#b]{0,2}$/, '') + '/' + bass.transpose(interval) : chordSymbol));
  };
  this.clean = function () {
    var obj = new Sharp11.Chord(root.clean() + chordSymbol + (bass.name !== root.name ? '/' + bass.clean() : ''));
    for (i = 0; i < this.chord.length; i += 1) {
      obj.chord[i] = this.chord[i].clean();
    }
    return obj;
  };
  this.scales = function () {
    var i, j, push, scale, scales = {}, hasNote = false, orderedScales = [];
    // Create array of scales
    for (scale in Sharp11.Scale.scales) {
      if (Sharp11.Scale.scales.hasOwnProperty(scale)) {
        scales[scale] = new Sharp11.Scale(root, scale).scale;  
      }
    }
    for (i = 0; i < this.chord.length; i += 1) {
      for (scale in scales) {
        if (scales.hasOwnProperty(scale)) {
          hasNote = false;
          for (j = 0; j < scales[scale].length; j += 1) {
            if (scales[scale][j].enharmonic(this.chord[i])) {
              hasNote = true;  
            }
          }
          if (!hasNote) {
            delete scales[scale];    
          }
        }
      }
    }
    // Put scale names in order
    for (i = 0; i < Sharp11.Scale.precedence.length; i += 1) {
      for (scale in scales) {
        if (scales.hasOwnProperty(scale) && Sharp11.Scale.precedence[i] === scale) {
          push = true;
          // Optimizations
          if (scale === 'bebop_dorian' && (this.symbol === 'm' || this.symbol === 'm7' || this.symbol === 'm9'||
                  this.symbol === 'm11' || this.symbol === 'm13')) {
            push = false;
          }
          if (scale === 'bebop_dominant' && (this.symbol === 'M7' || this.symbol === 'M9'||
                  this.symbol === 'M11' || this.symbol === 'M13')) {
            push = false;
          }
          if (scale === 'bebop_dominant' && (this.symbol === '7' || this.symbol === '9'||
                  this.symbol === '11' || this.symbol === '13')) {
            push = false;
          }
          if (push) {
            orderedScales.push(scale);  
          }
        }
      }
    }
    // More optimizations
    if (this.symbol === '7' || this.symbol === '7#9' || this.symbol === '7#11') {
      orderedScales.splice(2, 0, 'blues');  
    }
    return orderedScales;
  };
};

// Take a symbol and replace varias aliases
Sharp11.Chord.alias = function (symbol) {
  return symbol.replace('maj', 'M').replace('min', 'm').replace(/^-/, 'm').replace('dom', '').replace(/b/g, '-').replace(/#/g, '+');
};

Sharp11.Chord.prototype.parseChord = function (chord) {
  var intervals = [];
  // Handle various aliases
  chord = Sharp11.Chord.alias(chord);
  // Assume a M3 and P5
  intervals[3] = 'M';
  intervals[5] = 'P';
  // Chords with m3
  if ((/^(m|dim|1\/2dim)/).test(chord)) {
    intervals[3] = 'm';  
  }
  // Chords with dim5
  if ((/(dim|-5)/).test(chord)) {
    intervals[5] = 'dim';  
  }
  // Chords with aug5
  if ((/^(aug|\+)/).test(chord) || (/[#+]5/).test(chord)) {
    intervals[5] = 'aug';  
  }
  // Chords with no 3rd
  if ((/^[5n]/).test(chord) || (/no3/).test(chord)) {
    intervals[3] = '';
  }
  // Chords with m7
  if ((/(7|9|11|13)/).test(chord)) {
    intervals[7] = 'm';  
  }
  // Chords with M7
  if ((/(M7|M9|M11|M13)/).test(chord)) {
    intervals[7] = 'M';
  }
  // Chords with dim7
  if ((/(dim7|dim9|dim11|dim13)/).test(chord) && !(/1\/2dim/).test(chord)) {
    intervals[7] = 'dim';
  }
  // 6ths
  if ((/6/).test(chord)) {
    intervals[6] = 'M';
    intervals[7] = '';
  }
  // Suspended 2
  if ((/sus2/).test(chord)) {
    intervals[2] = 'M';
    intervals[3] = '';
  }
  // Suspended 4
  else if ((/sus/).test(chord)) {
    intervals[4] = 'P';
    intervals[3] = '';
  }
  // 9ths
  if ((/9/).test(chord)) {
    intervals[9] = 'M';  
  }
  if ((/\+9/).test(chord)) {
    intervals[9] = 'aug';  
  }
  if ((/-9/).test(chord)) {
    intervals[9] = 'm';  
  }
  // Special add cases
  if ((/add9/).test(chord) && !(/7/).test(chord)) {
    intervals[7] = '';  
  }
  // 11ths
  if ((/\+11/).test(chord)) {
    intervals[11] = 'aug';  
  }
  else if ((/-11/).test(chord)) {
    intervals[11] = 'dim';  
  }
  else if ((/add11/).test(chord)) {
    intervals[11] = 'P';  
  }
  else if ((/11/).test(chord)) {
    intervals[11] = 'P';
    intervals[9] = 'M';  
  }
  // 13ths
  else if ((/-13/).test(chord)) {
    intervals[13] = 'm';  
  }
  else if ((/add13/).test(chord)) {
    intervals[13] = 'M';  
  }
  else if ((/13/).test(chord)) {
    intervals[13] = 'M';
    intervals[11] = 'P';
    intervals[9] = 'M';
  }
  return intervals;
};

Sharp11.Chord.identify = function () {
  var notes = [], i, loops, root, symbol, slots = [], args = Array.prototype.slice.call(arguments), bass, keyType,
  hasNote = function (note) {
    var i;
    for (i = 0; i < notes.length; i += 1) {
      if (notes[i].enharmonic(note)) {
        return true;  
      }
    }
    return false;
  };
  loops = 0;
  do {
    root = args[0];
    notes = [];
    if (!(root instanceof Sharp11.Note)) {
      root = new Sharp11.Note(root);
    }
    for (i = 1; i < args.length; i += 1) {
      notes.push(new Sharp11.Note('C').transpose(root.getInterval(args[i])).clean());  
    }
    symbol = '';
    if (hasNote('E')) {
      if (hasNote('G#') && !(hasNote('B') || hasNote('Bb'))) {
        symbol += '+';
      }
    }
    else if (hasNote('Eb')) {
      if (hasNote('Gb') && !hasNote('G') && !hasNote('B')) {
        if (hasNote('A')) {
          symbol += 'dim7';  
        }
        else if (hasNote('Bb')) {
          symbol += 'm';  
        }
        else {
          symbol += 'dim';  
        }
      }
      else {
        symbol += 'm';    
      }
    }
    else {
      if (hasNote('F')) {
        symbol += 'sus4';
      }
      else if (hasNote('D')) {
        symbol += 'sus2';    
      }
      else {
        symbol += 'n';    
      }
    }
    if (hasNote('B') || hasNote('Bb')) {
      if (hasNote('B')) {
        symbol += 'M';    
      }
      if (hasNote('A')) {
        symbol += '13';    
      }
      else if (hasNote('F') && (hasNote('E') || hasNote('Eb'))) {
        symbol += '11';    
      }
      else if (hasNote('D') && (hasNote('E') || hasNote('Eb'))) {
        symbol += '9';    
      }
      else {
        symbol += '7';
      }
    }
    else if (hasNote('E') || hasNote('Eb')) {
      if (hasNote('A') && !hasNote('Gb')) {
        symbol += '6';
        if (hasNote('D')) {
          symbol += '/9';  
        }
      }
      if (hasNote('F')) {
        symbol += 'add11';    
      }
      if (!hasNote('A') && hasNote('D')) {
        symbol += 'add9';    
      }
    }
    if ((hasNote('E') || hasNote('Eb')) && hasNote('Gb') && !hasNote('G') && (hasNote('B') || hasNote('Bb'))) {
      symbol += 'b5';
    }
    if (hasNote('E') && hasNote('G#') && !hasNote('G') && (hasNote('B') || hasNote('Bb'))) {
      symbol += '#5';
    }
    if (hasNote('Db')) {
      symbol += 'b9';  
    }
    if (hasNote('E') && hasNote('D#')) {
      symbol += '#9';  
    }
    if ((hasNote('E') || hasNote('Eb')) && hasNote('F#') && hasNote('G') && (hasNote('B') || hasNote('Bb'))) {
      symbol += '#11';  
    }
    if ((hasNote('E') || hasNote('Eb')) && hasNote('Ab') && hasNote('G') && (hasNote('B') || hasNote('Bb'))) {
      symbol += 'b13';  
    }
    bass = arguments[0].toString();
    if (!(bass instanceof Sharp11.Note)) {
      bass = new Sharp11.Note(bass);    
    }
    root = root.clean();
    bass = bass.clean();
    // Fix accidentals
    keyType = Sharp11.keyType(root);
    if (hasNote('Eb')) {
      keyType = Sharp11.keyType(root.transpose('m3').name);  
    }
    if (!Sharp11.keyType(root)) {
      root = root.toggleAccidental();
    }
    if (keyType && keyType !== bass.accidental) {
      bass = bass.toggleAccidental();  
    }
    // Special case for C dominants over Bb
    if (hasNote('Bb') && bass.name === 'A#') {
      bass = bass.toggleAccidental();    
    }
    if (!root.enharmonic(bass)) {
      symbol += '/' + bass.name;    
    }
    // Prepare next inversion
    loops += 1;
    args.push(args[0]);
    args = args.slice(1);
  } while (loops <= args.length && (// Try next inversion if current one is weird
    (!symbol.match(/b5|#5|dim/) && !hasNote('G')) || // Catches most things
    ((hasNote('G') || hasNote('Gb')) && hasNote('Eb') && hasNote('Ab') && !hasNote('Bb') && !hasNote('B')) // Catches E, G, B(b), C
    ));
  return root + symbol;
};

Sharp11.Note.prototype.chord = function (chordSymbol) {
  return new Sharp11.Chord(this.toString() + chordSymbol);
};