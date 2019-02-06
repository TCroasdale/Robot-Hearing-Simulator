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
from rir_simulator import roomsimove_single, olafilt
import robotconfig as roboconf
import numpy as np
import shutil as zipper
import os
import uuid
import math
import random
from utilities import Utilities as util
import time
from config import *
import json

class SimulationConfig:
    def __init__(self, sound_data, room_dim, rt60, sample_rate, robot, unique_name, bg_sound=None):
        self.sound_data = sound_data
        self.bg_sound = bg_sound
        self.room_dim = room_dim
        self.rt60 = rt60
        self.sample_rate = sample_rate
        self.robot = robot
        self.unique_name = unique_name

class RobotHearingSim:
    # Runs one simulation
    def run_sim(robot_pos, src_pos, i, conf, file_prefix):
        offset = conf.room_dim / 2

        # The src_pos and robot position need to be re adjusted into the correct position.
        robot = conf.robot # Setting position of the robot
        r_w_p = robot_pos + offset
        robot.transform.set_world_pos(r_w_p)


        source_position = src_pos + offset

        print("\n--Generation {0}\n----\t Robot Position:\t{1}\n----\tSource Position:\t{2}\n".format(i, robot.transform.get_world_pos(), source_position))
        
        absorption = roomsimove_single.rt60_to_absorption(conf.room_dim.to_array(), conf.rt60)
        room = roomsimove_single.Room(conf.room_dim.to_array(), abs_coeff=absorption)

        # Using list comprehension to create a list of all mics
        mics = [roomsimove_single.Microphone(mic.transform.get_world_pos().to_array(), mic.id,  \
                orientation=mic.transform.get_world_rot(), direction=mic.style) \
                for mic in robot.microphones]

        sim_rir = roomsimove_single.RoomSim(conf.sample_rate, room, mics, RT60=conf.rt60)
        rir = sim_rir.create_rir(source_position.to_array())

        data = conf.sound_data
        data_rev = []
        for x in range(0, len(mics)): # Simulate a channel for each microphone in the scene
            data_simmed = olafilt.olafilt(rir[:,x], data)
            data_rev += [data_simmed]

        data_rev_array = np.array(data_rev) #put the data together
        sf.write('temp_data/{0}/{3}_{1}.{2}'.format(conf.unique_name, i, SIM_FILE_EXT, file_prefix), data_rev_array.T, conf.sample_rate) #Write new file into a folder called temp_data

        # Write file with Background-noise
        if conf.bg_noise is not None:
            data_with_noise = np.add(data_rev_array, np.array(conf.bg_noise))
            sf.write('temp_data/{0}/{3}_with_noise_{1}.{2}'.format(conf.unique_name, i, SIM_FILE_EXT, file_prefix), data_with_noise.T, conf.sample_rate) #Write new file into a folder called temp_data

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
        room_dim = roboconf.Vector3(simConfig['room_dimensions']['x'], simConfig['room_dimensions']['y'], simConfig['room_dimensions']['z'])
        room_dim = roboconf.Vector3(RobotHearingSim.check_value(room_dim.x, rand), \
                                    RobotHearingSim.check_value(room_dim.y, rand), \
                                    RobotHearingSim.check_value(room_dim.z, rand))# Check for random numbers
        print("room_dim: {0}".format(room_dim))


        source_positions = []
        for source_setup in simConfig['source_config']['simulation_setups']:
            if source_setup['style'] == "single":
                x = RobotHearingSim.check_value(source_setup['origin']['x'], rand)
                y = RobotHearingSim.check_value(source_setup['origin']['y'], rand)
                z = RobotHearingSim.check_value(source_setup['origin']['z'], rand)
                source_positions.append(roboconf.Vector3(x, y, z))
            elif source_setup['style'] == "box":
                posArray = RobotHearingSim.parse_box_source_setup(source_setup)
                source_positions += (posArray)
            elif source_setup['style'] == 'sphere':
                posArray = RobotHearingSim.parse_sphere_source_setup(source_setup)
                source_positions += (posArray)
            elif source_setup['style'] == 'pyramid':
                posArray = RobotHearingSim.parse_pyramid_source_setup(source_setup)
                source_positions += (posArray)

        mics = []
        for mic in roboConfig['microphones']:
            pos = roboconf.Vector3(mic['local_pos']['x'], mic['local_pos']['y'], mic['local_pos']['z'])
            rot = [mic['local_rot']['x'], mic['local_rot']['y'], mic['local_rot']['z']]
            microphone = roboconf.RobotMicrophone(pos, rot, mic['mic_style']['path'], mic['id'])
            mics.append(microphone)

        # Do motors
        motors = []

        robopos = roboconf.Vector3(simConfig['robot_pos']['x'], simConfig['robot_pos']['y'], simConfig['robot_pos']['z'])
        roborot = [0.0,0.0,0.0] #[simConfig['robot_rot']['x'], simConfig['robot_rot']['y'], simConfig['robot_rot']['z']]
        all_robot_pos = [robopos] * len(source_positions)
        all_pos = [roboconf.Vector3(RobotHearingSim.check_value(pos.x, rand), \
                    RobotHearingSim.check_value(pos.y, rand),\
                    RobotHearingSim.check_value(pos.z, rand)) for pos in all_robot_pos] # Checking random values
        robot = roboconf.Robot(all_pos[0], roborot, mics, motors, roboConfig['skin_width'])

        # Reading the data from the source file
        [data, fs] = sf.read(simConfig['source_config']['input_utterance']['path'], always_2d=True)
        data =  data[:,0]

        unique_num = uuid.uuid4()

        config = SimulationConfig(data, room_dim, rt60, fs, robot, unique_num)

        # If a BG noise has been specified, add that to the config after processing it.
        use_bg_noise = 'path' in simConfig['source_config']['background_noise']
        if use_bg_noise:
            [bg_data, bg_fs] = sf.read(simConfig['source_config']['background_noise']['path'], always_2d=True)
            bg_data = bg_data[:,0] # Converts to mono
            # Then convert to the correct shape and amplify/quiten it
            bg_data = util.resample_sound(bg_data, fs, bg_fs)
            bg_data = util.resize_sound(bg_data, len(data))
            bg_data = util.amplify_sound(bg_data, simConfig['source_config']['background_noise']['volume'])
            config.bg_noise = bg_data

        os.mkdir('temp_data/{0}'.format(unique_num)) # Create folder for temp data

        # Parallel(n_jobs=int(4))(delayed(RobotHearingSim.run_sim)(all_pos[i], source_positions[i], i, config, "data") for i in range(len(source_positions)))
        for i in range(len(source_positions)): RobotHearingSim.run_sim(all_pos[i], source_positions[i], i, config, "data") 

        # Zip up new files, and delete old ones.
        zip_name = 'static/dl/{0}'.format(filename)
        directory_name = 'temp_data/{0}'.format(unique_num)
        zipper.make_archive(zip_name, 'zip', directory_name)
        for i in range(len(source_positions)):
            os.remove('temp_data/{0}/{3}_{1}.{2}'.format(unique_num, i, SIM_FILE_EXT, "data"))
            if use_bg_noise:
                os.remove('temp_data/{0}/{3}_{1}.{2}'.format(unique_num, i, SIM_FILE_EXT, "data_with_noise"))

        os.rmdir('temp_data/{0}'.format(unique_num))
        return zip_name + ".zip"




    def parse_box_source_setup(setup):
      allPositions = []
      dim = roboconf.Vector3(setup['dimensions']['x'], setup['dimensions']['y'], setup['dimensions']['z'])
      midpoint = roboconf.Vector3(setup['origin']['x'], setup['origin']['y'], setup['origin']['z'])

      x_divs = int(setup['divisions']['x'])
      x_space = (dim.x/(x_divs-1))
      y_divs = int(setup['divisions']['y'])
      y_space = (dim.y/(y_divs-1))
      z_divs = int(setup['divisions']['z'])
      z_space = (dim.z/(z_divs-1))
      for x in range(x_divs):
          x_pos = midpoint.x + (x * x_space) - dim.x/2
          if x_divs == 1: x_pos = midpoint.x
          for y in range(y_divs):
              y_pos = midpoint.y + (y * y_space) - dim.y/2
              if y_divs == 1: y_pos = midpoint.y
              for z in range(z_divs):
                  z_pos = midpoint.z + (z * z_space) - dim.z/2
                  if z_divs == 1: z_pos = midpoint.z
                  allPositions.append(roboconf.Vector3(x_pos, y_pos, z_pos))

      return allPositions


    def parse_sphere_source_setup(setup):
        allPositions = []

        origin = roboconf.Vector3(setup['origin']['x'], setup['origin']['y'], setup['origin']['z'])
        r = float(setup['radius'])

        #Top and bottom ring
        top = roboconf.Vector3(origin.x, origin.y+r, origin.z)
        bottom = roboconf.Vector3(origin.x, origin.y-r, origin.z)
        allPositions.append(top)
        allPositions.append(bottom)

        for ring in range(1, int(setup['rings'])-1):
            for seg in range(int(setup['segments'])):
                theta = math.radians((360.0 / setup['segments']))
                phi = math.radians((180.0 / setup['rings']-1))

                y = r * math.cos(phi * ring)
                x = r * math.sin(theta * seg) * math.sin(phi * ring)
                z = r * math.cos(theta * seg) * math.sin(phi * ring)
                
                pos = roboconf.Vector3(x, y, z)
                allPositions.append((pos + origin))
 
        return allPositions

    def parse_pyramid_source_setup(setup):
        allPositions = []
        origin = roboconf.Vector3(float(setup['origin']['x']), float(setup['origin']['y']), float(setup['origin']['z']))
        theta = math.radians(float(setup['angle_from_normal']))

        divisions = int(setup['divisions'])

        # Adds the top point
        allPositions.append(origin)

        for layer in range(1, int(setup['layers'])):
            # Create the corner vertex for eacg layer
            h = layer/int(setup['layers']) * float(setup['length'])
            d = h * math.sin(theta)

            l = origin.y - h
            allPositions.append(roboconf.Vector3(d+origin.x, l, d+origin.z))
            allPositions.append(roboconf.Vector3(d+origin.x, l, -d+origin.z))
            allPositions.append(roboconf.Vector3(-d+origin.x, l, d+origin.z))
            allPositions.append(roboconf.Vector3(-d+origin.x, l, -d+origin.z))

            for div in range(divisions-1):
                # Add each division to each side.
                pos = div / (divisions-1)
                d1 = -d + (pos*d*2)

                allPositions.append(roboconf.Vector3(d+origin.x, l, d1+origin.z))
                allPositions.append(roboconf.Vector3(-d+origin.x, l, d1+origin.z))
                allPositions.append(roboconf.Vector3(d1+origin.x, l, d+origin.z))
                allPositions.append(roboconf.Vector3(d1+origin.x, l, -d+origin.z))

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

    RobotHearingSim.run_from_json_config(sim_config, robot_config, "test")

    box = RobotHearingSim.parse_box_source_setup({"style": "box","origin": {"x": 0,"y": 0,"z": 0},"dimensions": {"x": 5,"y": 5,"z": 5}, "divisions": {"x": 3,"y": 3,"z": 3}})
    sphere = RobotHearingSim.parse_sphere_source_setup({"style": "sphere","origin": {"x": 0,"y": 0,"z": 0}, "rings": 8,"segments": 12,"radius": 2})
    pyramid = RobotHearingSim.parse_pyramid_source_setup({"style":"pyramid","origin": {"x": 0,"y": 0.0, "z": 0}, "layers": 4,"divisions": 2,"angle_from_normal": 30,"length": 5})
    # for coord in pyramid: print(coord)

    print("Execution took {0} seconds".format(time.time() - start_time))
