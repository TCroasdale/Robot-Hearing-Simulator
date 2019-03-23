# The Simulator
---
## Introduction
The purpose of this page is to set up a scene which can be simulated.

---
## The Simulation Tab
This tab contains the basic setup of the scene.

- Room Dimensions: This is the size of the room in metres.
- Robot Position: This is where the robot is positioned inside the room.
- RT60: The RT-60 value of the surfaces in the room.
    - This is the time it takes for an audio signal to fall by 60db
- Sample Rate: 

---
## The Sources Tab
This tab allows you to set up sources in a variety of different ways, in the 3D view a red sphere represents a single sound source.

- Single
    - A single source.
- Box
    - Sets up the sources in a box based on the dimensions provided, with the amount of subdivisions provided. Not hollow.
- Sphere
    - Sets up the sources into a sphere, with as many rings and segments as provided. Is hollow.
- Pyramid
    - Sets up the sources into a pyramid shape, based on layers and divisions and an angle from the normal. Is hollow.

## The Input Files
Below the tabs the input files can be found.
Utterance file is an utterance file which will be played to the robot from each sound source.

Background noise is an optional file which represents noise in the environment

Robot is the robot which will be simulated.

---
## The Code Tab
Here the config of the robot can be edited directly. A pre existing file can also be uploaded, replacing what is in the editor.
