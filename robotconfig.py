#######################################
# Author: Thomas Croasdale
#
# This file is responsible for 
# representing a robot's microphones
# and motors
# 
#######################################

from rir_simulator import roomsimove_single

class Transform(object):
    '''
        Representing the position and orientation of an object
    '''
    def __init__(self, localpos, orientation, parent):
        self.x_pos = localpos[0]
        self.y_pos = localpos[1]
        self.z_pos = localpos[2]

        self.orientation = orientation
        self.parent = parent

    def translate(self, s):
        self.x_pos += s[0]
        self.y_pos += s[0]
        self.z_pos += s[0]

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

    def get_world_pos(self):
        if self.parent == None:
            return [self.x_pos, self.y_pos, self.z_pos]
        else:
            return [self.parent.get_world_pos()[0] + self.x_pos, 
                    self.parent.get_world_pos()[1] + self.y_pos, 
                    self.parent.get_world_pos()[2] + self.z_pos]
    
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

    def __init__(self, localpos, localrot, rir_mic, id):
        self.id = id
        self.rir_mic = rir_mic
        self.transform = Transform(localpos, localrot, None)

    def __str__(self):
        info = "id: {0}, transform: {1}".format(self.id, self.transform)
        return info


class Robot(object):
    '''
        Representing a robot.
    '''

    def __init__(self, pos, rot, robo_mics, robo_motors):
        self.transform = Transform(pos, rot, None)
        self.microphones = robo_mics
        self.motors = robo_motors
        #Set the world position of the microphones and motors
        for mic in robo_mics: self.attach_transform(mic.transform) 
        for mot in robo_motors: self.attach_transform(mot.transform) 

    def attach_transform(self, transform):
        transform.parent = self.transform

    def __str__(self):
        info = "{0} motors, {1} mics, transform: {2}".format(len(self.microphones), len(self.motors), self.transform)
        return info

if __name__ == '__main__': #Main Entry point
    # Creating a test robot
    mic1 = RobotMicrophone([0.25, 0.25, 0.5], [0.0, 0.0, 45.0], None, 0)
    mic2 = RobotMicrophone([-0.25, 0.25, 0.5], [0.0, 0.0, -45.0],  None, 1)
    mics = [mic1, mic2]

    mot1 = RobotMotor([0.3, 0, 0], None, 0)
    mot2 = RobotMotor([0.3, 0, 0], None, 1)
    motors = [mot1, mot2]

    MIRo = Robot([0, 0, 0], [30.0, 0.0, 90.0], mics, motors)
    print(MIRo)
    print("===== Mics =====")
    for mic in MIRo.microphones: print(mic)
    print("===== Motors =====")
    for mot in MIRo.motors: print(mot) 
