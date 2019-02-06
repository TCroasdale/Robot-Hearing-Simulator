#######################################
# Author: Thomas Croasdale
#
# This file is responsible for taking
# an audio file and generating a
# number of simulations based on what
# a robot would hear.
#
#######################################

import argparse
import soundfile as sf
from rir_simulator import roomsimove_single
from rir_simulator import olafilt
import robotconfig as roboconf
import numpy as np
import shutil as zipper
import os
import uuid
import math
import random
from joblib import Parallel, delayed
import time
from config import *
import json

class RobotHearingSim:
    # Runs one simulation
    # conf[0] is the sound data
    # conf[1] is the room dimensions
    # conf[2] is the rt60 value
    # conf[3] is the sample rate
    # conf[4] is the robot object
    # conf[5] is the unique name to use
    # example conf = (data, room_dim, rt60, 16000, unique_name)
    def run_sim(robot_pos, src_pos, i, conf):
        offset = [conf[1][0] / 2, conf[1][1] / 2, conf[1][2] / 2, ]

        robot = conf[4] # Setting position of the robot
        r_w_p = [robot_pos[0] + offset[0], robot_pos[1]+offset[1], robot_pos[2]+offset[2]]
        robot.transform.set_world_pos(r_w_p)

        src_pos = [src_pos[0] + offset[0], src_pos[1]+offset[1], src_pos[2]+offset[2]]

        print("\n--Generation {0}\n----\t Robot Position:\t{1}\n----\tSource Position:\t{2}\n".format(i, robot.transform.get_world_pos(), src_pos))
        # Advanced Method
        room_dim = conf[1]
        rt60 = conf[2]
        sample_rate = conf[3]


        absorption = roomsimove_single.rt60_to_absorption(conf[1], rt60)
        room = roomsimove_single.Room(room_dim, abs_coeff=absorption)

        # Using list comprehension to create a list of all mics
        mics = [roomsimove_single.Microphone(mic.transform.get_world_pos(), mic.id,  \
                orientation=mic.transform.get_world_rot(), direction=mic.style) \
                for mic in robot.microphones]

        sim_rir = roomsimove_single.RoomSim(sample_rate, room, mics, RT60=rt60)
        rir = sim_rir.create_rir(src_pos)

        data = conf[0]
        data_rev = []
        for x in range(0, len(mics)): # Simulate a channel for each micophone in the scene
            data_simmed = olafilt.olafilt(rir[:,x], data)
            data_rev += [data_simmed]

        data_rev = np.array(data_rev) #put the data together
        sf.write('temp_data/{0}/data_gen_{1}.{2}'.format(conf[5], i, SIM_FILE_EXT), data_rev.T, sample_rate) #Write new file into a folder called temp_data

    def get_random_number(r_dict, rand):

        min = max = 0
        min = float(r_dict['min'])
        max = float(r_dict['max'])

        r_num = rand.random()
        length = max - min

        return min + round((r_num * length), 2)

    def check_value(val, rand):
        if type(val) is dict:
            return RobotHearingSim.parse_random_number(val, rand)
        else:
            return val


    def run_from_json_config(sim_config, robot_config, filename):
        simConfig = sim_config['simulation_config']
        roboConfig = robot_config['robot_config']
        rand = random.Random()
        rand.seed(simConfig['seed'])

        rt60 = RobotHearingSim.check_value(simConfig['rt60'], rand)
        sampling_rate = int(simConfig['sample_rate'])
        room_dim = [simConfig['room_dimensions']['x'], simConfig['room_dimensions']['y'], simConfig['room_dimensions']['z']]
        room_dim = [RobotHearingSim.check_value(x, rand) for x in room_dim] # Check for random numbers
        print("room_dim: {0}".format(room_dim))


        source_positions = []
        for source_setup in simConfig['source_config']['simulation_setups']:
            if source_setup['style'] == "single":
                x = RobotHearingSim.check_value(source_setup['origin']['x'], rand)
                y = RobotHearingSim.check_value(source_setup['origin']['y'], rand)
                z = RobotHearingSim.check_value(source_setup['origin']['z'], rand)
                source_positions.append([x, y, z])
            elif source_setup['style'] == "box":
                posArray = RobotHearingSim.parse_box_source_setup(source_setup)
                source_positions += (posArray)
            elif source_setup['style'] == 'sphere':
                posArray = RobotHearingSim.parse_sphere_source_setup(source_setup)
                source_positions += (posArray)
            # Calculate other source setups

        mics = []
        for mic in roboConfig['microphones']:
            pos = [mic['local_pos']['x'], mic['local_pos']['y'], mic['local_pos']['z']]
            rot = [mic['local_rot']['x'], mic['local_rot']['y'], mic['local_rot']['z']]
            microphone = roboconf.RobotMicrophone(pos, rot, mic['mic_style']['path'], mic['id'])
            mics.append(microphone)

        # Do motors
        motors = []

        robopos = [simConfig['robot_pos']['x'], simConfig['robot_pos']['y'], simConfig['robot_pos']['z']]
        roborot = [0.0,0.0,0.0] #[simConfig['robot_rot']['x'], simConfig['robot_rot']['y'], simConfig['robot_rot']['z']]
        all_robot_pos = [robopos] * len(source_positions)
        all_pos = [[RobotHearingSim.check_value(val, rand) for val in pos] for pos in all_robot_pos] # Checking random values
        robot = roboconf.Robot(all_pos[0], roborot, mics, motors, roboConfig['skin_width'])

        # Reading the data from the source file
        [data, fs] = sf.read(simConfig['source_config']['input_utterance']['path'], always_2d=True)
        data =  data[:,0]

        unique_num = uuid.uuid4()

        ## Multithreaded
        config = (data, room_dim, rt60, fs, robot, unique_num)
        # os.mkdir('temp_data')
        os.mkdir('temp_data/{0}'.format(unique_num)) # Create folder for temp data

        Parallel(n_jobs=int(1))(delayed(RobotHearingSim.run_sim)(all_pos[i], source_positions[i], i, config) for i in range(len(source_positions)))

        # Zip up new files, and delete old ones.
        zip_name = 'static/dl/{0}'.format(filename)
        directory_name = 'temp_data/{0}'.format(unique_num)
        zipper.make_archive(zip_name, 'zip', directory_name)
        for i in range(len(source_positions)):
            os.remove('temp_data/{0}/data_gen_{1}.{2}'.format(unique_num, i, SIM_FILE_EXT))
        os.rmdir('temp_data/{0}'.format(unique_num))
        return zip_name + ".zip"




    def parse_box_source_setup(setup):
      allPositions = []
      dim = [setup['dimensions']['x'], setup['dimensions']['y'], setup['dimensions']['z']]
      midpoint = [setup['origin']['x'], setup['origin']['y'], setup['origin']['z']]

      x_divs = int(setup['divisions']['x'])
      x_space = (dim[0]/(x_divs-1))
      y_divs = int(setup['divisions']['y'])
      y_space = (dim[1]/(y_divs-1))
      z_divs = int(setup['divisions']['z'])
      z_space = (dim[2]/(z_divs-1))
      for x in range(x_divs):
          x_pos = midpoint[0] + (x * x_space) - dim[0]/2
          if x_divs == 1: x_pos = midpoint[0]
          for y in range(y_divs):
              y_pos = midpoint[1] + (y * y_space) - dim[1]/2
              if y_divs == 1: y_pos = midpoint[1]
              for z in range(z_divs):
                  z_pos = midpoint[2] + (z * z_space) - dim[2]/2
                  if z_divs == 1: z_pos = midpoint[2]
                  allPositions.append([x_pos, y_pos, z_pos])

      return allPositions


    def parse_sphere_source_setup(setup):
        allPositions = []

        origin = [setup['origin']['x'], setup['origin']['y'], setup['origin']['z']]
        r = setup['radius']

        #Top and bottom ring
        top = [origin[0], origin[1]+setup['radius'], origin[2]]
        bottom = [origin[0], origin[1]-setup['radius'], origin[2]]
        allPositions.append(top)
        allPositions.append(bottom)

        for ring in range(int(setup['rings'])-2):
            # print("ring: {0}".format(ring+1))
            for seg in range(int(setup['segments'])):
                # print("seg{0}".format(seg))
                theta = math.radians((360.0 / setup['segments']) * seg)
                phi = math.radians((180.0 / setup['rings']) * ring+1)
                x = r * math.cos(theta) * math.sin(phi)
                y = r * math.sin(theta) * math.cos(phi)
                z = r * math.cos(phi)

                allPositions.append([x+origin[0], y+origin[1], z+origin[2]])

        print(allPositions)
        return allPositions

    def parse_cone_source_setup(setup):
        allPositions = []

        return allPositions



# Test Harness for this system
if __name__ == '__main__': #Main Entry point
    parser = argparse.ArgumentParser() # Parsing program arguments
    parser.add_argument('-c', help='The config file', default='../configexample.json')
    parser.add_argument('-r', help='The robot config', default='../config_robot.json')

    args = parser.parse_args()

    start_time = time.time()

    sim_config_json=open(args.c).read()
    sim_config = json.loads(sim_config_json)

    robot_config_json=open(args.r).read()
    robot_config = json.loads(robot_config_json)

    # RobotHearingSim.run_from_json_config(sim_config, robot_config, "test")

    box = RobotHearingSim.parse_box_source_setup({"style": "box","origin": {"x": 0,"y": 0,"z": 0},"dimensions": {"x": 5,"y": 5,"z": 5}, "divisions": {"x": 3,"y": 3,"z": 3}})
    for coord in box: print(coord)

    print("Execution took {0} seconds".format(time.time() - start_time))
