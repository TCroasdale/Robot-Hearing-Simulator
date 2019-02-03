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

class RobotHearingSim:
    #Converts a string to a true/false boolean, used to process bool arguments
    def arg_to_bool(arg):
        if arg.lower() in ('yes', 'true', 't', 'y'):
            return True
        else:
            return False

    # Runs one simulation
    # conf[0] is the sound data
    # conf[1] is the room dimensions
    # conf[2] is the rt60 value
    # conf[3] is the sample rate
    # conf[4] is the robot object
    # conf[5] is the unique name to use
    # example conf = (data, room_dim, rt60, 16000, unique_name)
    def run_sim(robot_pos, src_pos, i, conf):
        robot = conf[4] # Setting position of the robot
        robot.set_pos(robot_pos[0], robot_pos[1], robot_pos[2])

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
                for mic in conf[4].microphones]

        sim_rir = roomsimove_single.RoomSim(sample_rate, room, mics, RT60=rt60)
        rir = sim_rir.create_rir(src_pos)

        data = conf[0]
        data_rev = []
        for x in range(0, len(mics)): # Simulate a channel for each micophone in the scene
            data_simmed = olafilt.olafilt(rir[:,x], data)
            data_rev += [data_simmed]

        data_rev = np.array(data_rev) #put the data together
        sf.write('temp_data/{0}/data_gen_{1}.{2}'.format(conf[5], i, SIM_FILE_EXT), data_rev.T, sample_rate) #Write new file into a folder called temp_data

    def parse_random_number(r_str, rand):
        inner_str = r_str[r_str.find("{")+1:r_str.find("}")].strip()
        index = inner_str.find(";")
        min = max = 0
        if index > 0:
            min_s = inner_str[:index].strip()
            max_s = inner_str[index+1:].strip()
            min = float(min_s)
            max = float(max_s)
        else:
            print("d b")
            max = float(inner_str)

        print("d")
        print(rand.random())
        r_num = rand.random()
        print("d {0}".format(r_num))
        length = max - min
        print("d {0}".format(length))

        return min + round((r_num * length), 2)
        
    def check_value(val, rand):
        print("c")
        if type(val) is str:
            print("c str")
            return RobotHearingSim.parse_random_number(val, rand)
        else:
            print("c num")
            return val


    def run_from_json_config(sim_config, robot_config, filename):
        print('b')
        simConfig = sim_config['simulation_config']
        print('b')
        roboConfig = robot_config['robot_config']
        print('b')
        rand = random.Random()
        rand.seed(simConfig['seed'])
        print('b')

        rt60 = RobotHearingSim.check_value(simConfig['rt60'], rand)
        print('b')
        sampling_rate = int(simConfig['sample_rate'])
        print('b')
        room_dim = [simConfig['room_dimensions']['x'], simConfig['room_dimensions']['y'], simConfig['room_dimensions']['z']]
        print('b')
        room_dim = [RobotHearingSim.check_value(x, rand) for x in room_dim] # Check for random numbers
        print("room_dim: {0}".format(room_dim))
        print('b')


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

        print("e")
        mics = []
        print("e")
        for mic in roboConfig['microphones']:
            print("e")
            pos = [mic['local_pos']['x'], mic['local_pos']['y'], mic['local_pos']['z']]
            print("e")
            rot = [mic['local_rot']['x'], mic['local_rot']['y'], mic['local_rot']['z']]
            print("e")
            microphone = roboconf.RobotMicrophone(pos, rot, 'cardioid', mic['id'])
            print("e")
            mics.append(microphone)

        # Do motors
        motors = []

        robopos = [simConfig['robot_pos']['x'], simConfig['robot_pos']['y'], simConfig['robot_pos']['z']]
        roborot = [0.0,0.0,0.0] #[simConfig['robot_rot']['x'], simConfig['robot_rot']['y'], simConfig['robot_rot']['z']]
        all_robot_pos = [robopos] * len(source_positions)
        print("fuck me")
        all_pos = [[RobotHearingSim.check_value(val, rand) for val in pos] for pos in all_robot_pos]
        print(all_pos)
        robot = roboconf.Robot(all_pos[0], roborot, mics, motors, roboConfig['skin_width'])
        print("f")

        # Reading the data from the source file
        [data, fs] = sf.read(simConfig['source_config']['input_utterance']['path'], always_2d=True)
        print("f")
        data =  data[:,0]
        print("f")

        unique_num = uuid.uuid4()

        ## Multithreaded
        config = (data, room_dim, rt60, fs, robot, unique_num)
        os.mkdir('temp_data/{0}'.format(unique_num)) # Create folder for temp data
        print("f")

        Parallel(n_jobs=int(1))(delayed(RobotHearingSim.run_sim)(all_pos[i], source_positions[i], i, config) for i in range(len(source_positions)))

        print("f")
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
        midpoint = [setup['origin']['x'],
                    setup['origin']['y'],
                    setup['origin']['z']]

        #Append the 8 corners
        allPositions.append([midpoint[0] - (dim[0]/2), midpoint[1] - (dim[1]/2), midpoint[2] - (dim[2]/2)])
        allPositions.append([midpoint[0] - (dim[0]/2), midpoint[1] - (dim[1]/2), midpoint[2] + (dim[2]/2)])
        allPositions.append([midpoint[0] + (dim[0]/2), midpoint[1] - (dim[1]/2), midpoint[2] - (dim[2]/2)])
        allPositions.append([midpoint[0] + (dim[0]/2), midpoint[1] - (dim[1]/2), midpoint[2] + (dim[2]/2)])

        allPositions.append([midpoint[0] - (dim[0]/2), midpoint[1] + (dim[1]/2), midpoint[2] - (dim[2]/2)])
        allPositions.append([midpoint[0] - (dim[0]/2), midpoint[1] + (dim[1]/2), midpoint[2] + (dim[2]/2)])
        allPositions.append([midpoint[0] + (dim[0]/2), midpoint[1] + (dim[1]/2), midpoint[2] - (dim[2]/2)])
        allPositions.append([midpoint[0] + (dim[0]/2), midpoint[1] + (dim[1]/2), midpoint[2] + (dim[2]/2)])

        x_divs = int(setup['divisions']['x'])
        y_divs = int(setup['divisions']['y'])
        z_divs = int(setup['divisions']['z'])
        for x in range(x_divs):
            x_pos = midpoint[0] + x * ((dim[0]/x_divs)-dim[0])
            for y in range(y_divs):
                y_pos = midpoint[1] + y * ((dim[1]/y_divs)-dim[1])
                for z in range(z_divs):
                    z_pos = midpoint[2] + z * ((dim[2]/z_divs)-dim[2])
                    allPositions.append([x_pos, y_pos, z_pos])

        print(allPositions)
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



# Simulates one mic in a 5x5x5 room wit h both the source and mic positions randomised
# Generates 30 utterances
if __name__ == '__main__': #Main Entry point
    parser = argparse.ArgumentParser() # Parsing program arguments
    parser.add_argument('-i', help='The input utterance', default='test_data/data.wav')
    parser.add_argument('-o', help='The output files', default='test_data/data.zip')
    parser.add_argument('-g', help='Number of Generations', default='10')
    parser.add_argument('-t', help='Number of Threads', default='1')
    parser.add_argument('-rx', help='Room Width', default='5')
    parser.add_argument('-ry', help='Room Length', default='5')
    parser.add_argument('-rz', help='Room Height', default='5')
    parser.add_argument('-DEBUG', help='Show output', default='TRUE')
    parser.add_argument('-TIMED', help='Time the generation', default='FALSE')
    args = parser.parse_args()

    show_output = RobotHearingSim.arg_to_bool(args.DEBUG)
    timed = RobotHearingSim.arg_to_bool(args.TIMED)

    start_time = time.time()
    if timed:
        print("Starting Timer") if show_output else 0

    rt60 = 0.4 # in seconds
    room_dim = [float(args.rx), float(args.ry), float(args.rz)] # in meters
    sampling_rate = 16000

    mic1 = roboconf.RobotMicrophone([0.25, 0.25, 0.5], [0.0, 0.0, 45.0], 'cardioid', 0)
    mic2 = roboconf.RobotMicrophone([-0.25, 0.25, 0.5], [0.0, 0.0, -45.0],  'cardioid', 1)
    mot1 = roboconf.RobotMotor([0.3, 0, 0], None, 0)
    mot2 = roboconf.RobotMotor([0.3, 0, 0], None, 1)

    MIRo = roboconf.Robot([0, 0, 0], [30.0, 0.0, 90.0], [mic1, mic2], [mot1, mot2], 0.5)

    # Generating a list of random mic and source positions
    number_generations = int(args.g)
    all_robot_pos = np.asarray([np.random.uniform(MIRo.skin_width, room_dim[0]-MIRo.skin_width, size=number_generations),
                np.random.uniform(MIRo.skin_width, room_dim[1]-MIRo.skin_width, size=number_generations),
                np.random.uniform(MIRo.skin_width, room_dim[2]-MIRo.skin_width, size=number_generations)])

    all_source_pos = np.asarray([np.random.uniform(0.1, room_dim[0]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[1]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[2]-0.1, size=number_generations)])

    # Reading the data from the source file
    [data, fs] = sf.read(args.i, always_2d=True)
    data =  data[:,0]

    print("Starting work") if show_output else 0

    ## Multithreaded
    config = (data, room_dim, rt60, fs, MIRo)
    Parallel(n_jobs=int(args.t))(delayed(RobotHearingSim.run_sim)(all_robot_pos[:, i], all_source_pos[:, i], i, config) for i in range(number_generations))

    # Zip up new files, and delete old ones.
    zip_name = args.o
    directory_name = 'temp_data'
    print("Zipping output to: {0}".format(zip_name)) if show_output else 0
    zipper.make_archive(zip_name, 'zip', directory_name)
    print("Deleting temporary files") if show_output else 0
    for i in range(number_generations):
        os.remove('temp_data/data_gen_{0}.wav'.format(i))

    print("Execution took {0} seconds".format(time.time() - start_time)) if timed else 0
