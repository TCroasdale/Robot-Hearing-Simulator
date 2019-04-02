# The Code Files
---
## Introduction
Both robots and simulations are compiled down into JSON objects representing the data you enter. 
These files can be seen in the code editor tab for both pages.


---
## The Robot File
```javascript
{
 "robot_config": {
  "dimensions": { "x": 1, "y": 1, "z": 1 },
  "microphones": [
   {
    "id": 0,
    "local_pos": { "x": 0, "y": 0, "z": 0 },
    "local_rot": { "x": 0, "y": 0, "z": 0 },
    "mic_style": { "uid": -1 }
   }
  ],
  "motors": [
   {
    "id": 0,
    "local_pos": { "x": 0, "y": 0, "z": 0 },
    "sound": { "uid": -1 }
   }
  ]
 }
}
```
All of the code is within the robot_config object. It has 3 elements, ```dimensions```, ```microphones```, and ```motors```.

- ```dimensions```, A Vector 3 object with x, y, and z coordinates representing width, height and depth of the robot's bounding box.
- ```microphones```, An array of objects containing all the values needed to represent a microphone.
    - ```id```, A unique ID for this microphone. This is set automatically when adding a microphone through the UI. if not unique it will have problems when uploading microphone responses.
    - ```local_pos```, The position of this microphone.
    - ```local_rot```, The rotation of this microphone, in euler angles, degrees.
    - ```mic_style```, The microphone response of this microphone, uploaded through UI or selected. Only public files, or ones you upload yourself can be used.
- ```motors```, An array of objects containing all the values needed to represent a motor.
    - ```id```, A unique ID for this motor. This is set automatically when adding a motor through the UI. if not unique it will have problems when uploading motor sound files.
    - ```local_pos```, The position of this microphone.
    - ```sound```, The sound made by this motor, This is not simulated, and should be what the robot's microphones actually hear for best effect.

## The Simulation File
```javascript
{
 "simulation_config": {
  "robot_pos": { "x": 0, "y": -1, "z": 0 },
  "room_dimensions": { "x": 5, "y": 5, "z": 5 },
  "rt60": 0.4,
  "source_config": {
   "simulation_setups": [
    {
     "style": "single",
     "origin": { "x": 0, "y": 0, "z": 0 }
    },
    {
     "style": "box",
     "origin": { "x": 0, "y": 0, "z": 0 },
     "dimensions": { "x": 1, "y": 1, "z": 1 },
     "divisions": { "x": 2, "y": 2, "z": 2 }
    },
    {
     "style": "sphere",
     "origin": { "x": 0, "y": 0, "z": 0 },
     "rings": 4,
     "segments": 8,
     "radius": 4
    },
    {
     "style": "pyramid",
     "origin": { "x": 0, "y": 0, "z": 0 },
     "layers": 4,
     "divisions": 3,
     "angle_from_normal": 30,
     "length": 8
    }
   ],
   "background_noise": { "uid": -1 },
   "input_utterance": { "uid": -1 }
  },
  "robot_config": { "uid": -1 }
 },
 "variables": {}
}
```
Most of the code is within the robot_config object. It has 3 elements, ```robot_pos```, ```room_dimensions```, ```rt60```, and ```source_config```.
There is also a section where variables can be defined, information on this can be seen in the Variables subsection.

- ```robot_pos```, A Vector 3 object representing the robots positions.
- ```room_dimensions```, A Vector 3 object representing the width, height and depth of the room.
- ```rt60```, The rt60 value used for the simulation. This is the time it takes for a sound to decrease by 60db.
- ```source_config```, This contains the information for all the sources in the scene.
    - ```input_utterance```, The ID for the utterance file, only a user's own files or a public sound can be used.
    - ```background_noise```, The ID for a background noise sound file, only a user's own files or a public sound can be used.
    - ```simulation_setups```, An array of all the source set ups in the scene. The options needed for the 4 different styles can be seen above.
- ```robot_config```, The robot config file which will be used in the simulation

### Random Values
To insert a random number into the config insert an object which looks like this
```
{ "min": 0, "max": 5}
```
in place of a number.

The fields which accept random numbers are:

- ```simulation_config.room_dimensions```
- ```simulation_config.robot_pos```
- ```simulation_config.rt60```
- ```simulation_config.source_config.simulation_setups.single.origin```
- ```simulation_config.room_dimensions```

### Variables
To define a variable, place a definition in the variables container.
```
"variables": {
    "X": 5
}
```
This defines a variable called X with the value 5.

To use a variable place one of these objects where a number would go.
```
{ "val": "X" }
{ "value": "X" }
{ "var": "X" }
```
The X, would be the name of your variable, all 3 of these obejcts are equivalent.

For example, This will insert the value 5 in the y coordinate of the robot's position
```
{
  "simulation_config": {
  "robot_pos": { "x": 0, 
    "y": { "value": "X"},
    "z": 0
  },
  "room_dimensions": { "x": 5, "y": 5, "z": 5 },
  "rt60": 0.4,
  "source_config": {
   "simulation_setups": [
    {
     "style": "single",
     "origin": { "x": 0, "y": 0, "z": 0 }
    }
   ],
   "background_noise": { "uid": -1 },
   "input_utterance": { "uid": -1 }
  },
  "robot_config": { "uid": -1 }
 },
 "variables": {
     "X": 5
 }
}
```