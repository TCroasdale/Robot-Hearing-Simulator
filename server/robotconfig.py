#######################################
# Author: Thomas Croasdale
#
# This file is responsible for
# representing a robot's microphones
# and motors
#
#######################################

from rir_simulator import roomsimove_single

class Vector3(object):
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

    def to_array(self):
        return [self.x, self.y, self.z]

    def __add__(self, other):
        x = self.x + other.x
        y = self.y + other.y
        z = self.z + other.z
        return Vector3(x, y, z)

    def __sub__(self, other):
        x = self.x - other.x
        y = self.y - other.y
        z = self.z - other.z
        return Vector3(x, y, z)

    def __truediv__(self, other):
        if isinstance(other, float) or isinstance(other, int):
            x = self.x / other
            y = self.y / other
            z = self.z / other
            return Vector3(x, y, z)
        else:
            print("Cannot divide vector by type {0}".format(type(other))) 
            return Vector3(0, 0, 0)

    def __str__(self):
        return "({0}, {1}, {2})".format(self.x, self.y, self.z)

    def __iter__(self):
        self.iter_value = 0
        return self

    def __next__(self):
        if self.iter_value > 2:
            raise StopIteration
        else:
            if self.iter_value == 0:
                self.iter_value += 1
                return self.x
            if self.iter_value == 1:
                self.iter_value += 1
                return self.y
            if self.iter_value == 2:
                self.iter_value += 1
                return self.z


class Transform(object):
    '''
        Representing the position and orientation of an object
    '''
    def __init__(self, localpos, orientation, parent):
        self.position = localpos

        self.orientation = orientation
        self.parent = parent

    def translate(self, s):
        self.position += s


    def rotate(self, q):
        self.orientation[0] + q[0]
        if self.orientation[0] > 360: self.orientation[0] = 0
        if self.orientation[0] < 0: self.orientation[0] = 360

        self.orientation[1] + q[1]
        if self.orientation[1] > 360: self.orientation[1] = 0
        if self.orientation[1] < 0: self.orientation[1] = 360

        self.orientation[2] + q[2]
        if self.orientation[2] > 360: self.orientation[2] = 0
        if self.orientation[2] < 0: self.orientation[2] = 360

    def set_world_pos(self, vec):
        if self.parent is None: # Only the root transform can move
            self.position = vec


    def get_world_pos(self):
        if self.parent == None:
            return self.position
        else:
            return self.parent.get_world_pos() + self.position
                    


    def get_world_rot(self):
        if self.parent == None:
            return self.orientation
        else:
            return [self.parent.get_world_rot()[0] + self.orientation[0],
                    self.parent.get_world_rot()[1] + self.orientation[1],
                    self.parent.get_world_rot()[2] + self.orientation[2]]

    def __str__(self):
        info = "pos: {0}, orientation: {1}, parent: \n\t\t{2}".format(self.get_world_pos(), self.get_world_rot(), self.parent)
        return info

class RobotMotor(object):
    '''
        Representing a motor in a robot.
    '''

    def __init__(self, localpos, sounddata, id):
        self.id = id
        self.transform = Transform(localpos, [0.0, 0.0, 0.0], None)

    def __str__(self):
        info = "id: {0}, transform: {1}".format(self.id, self.transform)
        return info


class RobotMicrophone(object):
    '''
        Representing a microphone within a robot.
    '''

    def __init__(self, localpos, localrot, mic_style, id):
        self.id = id
        self.style = mic_style
        self.transform = Transform(localpos, localrot, None)

    def __str__(self):
        info = "id: {0}, transform: {1}".format(self.id, self.transform)
        return info



class Robot(object):
    '''
        Representing a robot.
    '''

    def __init__(self, pos, rot, robo_mics, robo_motors, skin_width=0.1):
        self.transform = Transform(pos, rot, None)
        self.microphones = robo_mics
        self.motors = robo_motors
        self.skin_width = skin_width

        #Set the world position of the microphones and motors
        for mic in robo_mics: self.attach_transform(mic.transform)
        for mot in robo_motors: self.attach_transform(mot.transform)

    def set_pos(self, pos):
        self.transform.set_world_pos(pos)

    def attach_transform(self, transform):
        transform.parent = self.transform

    def __str__(self):
        info = "{0} motors, {1} mics, transform: {2}".format(len(self.microphones), len(self.motors), self.transform)
        return info

if __name__ == '__main__': #Main Entry point
    # Creating a test robot
    mic1 = RobotMicrophone(Vector3(0.25, 0.25, 0.5), [0.0, 0.0, 45.0], None, 0)
    mic2 = RobotMicrophone(Vector3(-0.25, 0.25, 0.5), [0.0, 0.0, -45.0],  None, 1)
    mics = [mic1, mic2]

    mot1 = RobotMotor(Vector3(0.3,0,0), None, 0)
    mot2 = RobotMotor(Vector3(-0.3,0,0), None, 1)
    motors = [mot1, mot2]

    MIRo = Robot(Vector3(0,0,0), [30.0, 0.0, 90.0], mics, motors)
    print(MIRo)
    print("===== Mics =====")
    for mic in MIRo.microphones: print(mic)
    print("===== Motors =====")
    for mot in MIRo.motors: print(mot)
