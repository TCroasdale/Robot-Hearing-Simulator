# The Robot Designer
---
## Introduction
The purpose of this page is to put together a robot from motors and microphones.

---
## The Robot Tab
This tab contains the basic information of the robot: name and shape.

- Robot Name: The name of the robot to be used.
    - This is not stored in the config file.
- Skin Width: The radius of the bounding sphere of the robot.
    - This will change soon.

---
## The Microphones Tab
By default there is one microphone attached to the robot, and there can never be less than one.

Values:

- ID : A unique ID for this microphone
- Origin : The position of this microphone
- Orientation : The rotation values of this microphone
- Mic Response : A Text file containing the microphone response values for every angle.

---
## The Motor tab
By default there is one motor attached to the robot, and there can never be less than one.

Values:

- ID : A unique ID for this motor.
- Origin : The position of this motor.
- Motor Sound : A sound recording of this motor.

---
## The Code Tab
Here the config of the robot can be edited directly. A pre existing file can also be uploaded, replacing what is in the editor.
