/*
 * Sharp11 v1.0
 * scale.js
 * (c) 2012 Julian Rosenblum
 */

// Scale constructor
Sharp11.Scale = function (key, scaleName, descending) {
  var i,
  // Array of intervals to build scale
  intervals;
  // If the key is a double accidental, throw an error
  if (key.accidental === 'bb' || key.accidental === '##') {
    throw new Error('Can\'t build scale in double sharp or double flat key.');
  }
  if (!(key instanceof Sharp11.Note)) {
    key = new Sharp11.Note(key);  
  }
  // Convert spaces to underscores and make lowercase.  If no scale name given, assume major
  scaleName = scaleName ? scaleName.replace(/[\s]/g, '_').toLowerCase() : 'major';
  // Scale aliases
  switch (scaleName) {
  case 'ionian':
    scaleName = 'major';
    break;
  case 'major_pentatonic':
    scaleName = 'pentatonic';
    break;
  case 'minor':
  case 'aeolian':
    scaleName = 'natural_minor';
    break;
  case 'octatonic':
  case 'halfwhole':
    scaleName = 'diminished';
    break;
  case 'super_locrian':
  case 'superlocrian':
  case 'diminished_whole_tone':
    scaleName = 'altered';
    break;
  case 'dorian_b9':
    scaleName = 'dorian_b2';
    break;
  case 'mixolydian_b13':
    scaleName = 'mixolydian_b6';
    break;
  case 'aeolian_b5':
  case 'locrian_#2':
    scaleName = 'half_diminished';
    break;
  }
  // Array of note objects
  this.scale = [key];
  intervals = Sharp11.Scale.scales[scaleName];
  if (!intervals) {
    throw new Error('Invalid scale name');
  }
  if (descending) {
    if (scaleName === 'melodicminor') { // Melodic minor is different descending
      intervals = ['2', 'm3', '4', '5', 'm6', 'm7']; 
    }
    for (i = intervals.length - 1; i >= 0; i -= 1) {
      this.scale.push(key.transpose(intervals[i]));
    }
  }
  else {
    for (i = 0; i < intervals.length; i += 1) {
      this.scale.push(key.transpose(intervals[i]));
    }
  }
  this.scale.push(key);
  this.key = key;
  this.name = scaleName;
  this.toString = function () {
    return this.scale.toString();  
  };
  this.clean = function () {
    var obj = new Sharp11.Scale(key, scaleName, descending);
    for (i = 0; i < this.scale.length; i += 1) {
      obj.scale[i] = this.scale[i].clean();
    }
    return obj;
  };
  this.transpose = function (interval) {
    return new Sharp11.Scale(key.transpose(interval), scaleName);
  };
};

Sharp11.Note.prototype.scale = function (scaleName, descending) {
  return new Sharp11.Scale(this, scaleName, descending);
};

// Maps scale names to interval arrays
Sharp11.Scale.scales = {
  major: ['2', '3', '4', '5', '6', '7'],
  natural_minor: ['2', 'm3', '4', '5', 'm6', 'm7'],
  harmonic_minor: ['2', 'm3', '4', '5', 'm6', '7'],
  melodic_minor: ['2', 'm3', '4', '5', '6', '7'],
  dorian: ['2', 'm3', '4', '5', '6', 'm7'],
  phrygian: ['m2', 'm3', '4', '5', 'm6', 'm7'],
  lydian: ['2', '3', 'aug4', '5', '6', '7'],
  mixolydian: ['2', '3', '4', '5', '6', 'm7'],
  locrian: ['m2', 'm3', '4', 'dim5', 'm6', 'm7'],
  whole_tone: ['2', '3', 'aug4', 'aug5', 'aug6'],
  blues: ['m3', '4', 'aug4', '5', 'm7'],
  pentatonic: ['2', '3', '5', '6'],
  minor_pentatonic: ['m3', '4', '5', 'm7'],
  diminished: ['m2', 'm3', '3', 'dim5', '5', '6', 'm7'],
  whole_half: ['2', 'm3', '4', 'dim5', 'm6', '6', '7'],
  dorian_b2: ['m2', 'm3', '4', '5', '6', 'm7'],
  lydian_augmented: ['2', '3', 'aug4', 'aug5', '6', '7'],
  lydian_dominant: ['2', '3', 'aug4', '5', '6', 'm7'],
  mixolydian_b6: ['2', '3', '4', '5', 'm6', 'm7'],
  half_diminished: ['2', 'm3', '4', 'dim5', 'm6', 'm7'],
  altered: ['m2', 'm3', 'dim4', 'dim5', 'm6', 'm7'],
  augmented: ['m3', '3', '5', 'aug5', '7'],
  bebop_dominant: ['2', '3', '4', '5', '6', 'm7', '7'],
  bebop_major: ['2', '3', '4', '5', 'm6', '6', '7'],
  bebop_minor: ['2', 'm3', '4', '5', 'm6', '6', 'm7'],
  bebop_dorian: ['2', 'm3', '3', '4', '5', '6', 'm7'],
  major_blues: ['2', 'm3', '3', '5', '6']
};

// Order of scale precedence
Sharp11.Scale.precedence = ['major', 'dorian', 'natural_minor', 'mixolydian', 'bebop_dominant', 'bebop_dorian', 'bebop_minor', 'harmonic_minor', 'melodic_minor', 'whole_tone', 'bebop_major', 'lydian', 'pentatonic', 'phrygian', 'locrian', 'altered', 'diminished', 'whole_half', 'lydian_dominant', 'lydian_augmented', 'half_diminished', 'dorian_b2', 'mixolydian_b6', 'minor_pentatonic', 'major_blues', 'augmented'];