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
from joblib import Parallel, delayed
import time

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
    # example conf = (data, room_dim, rt60, 16000)
    def run_sim(robot_pos, src_pos, i, conf):
        print("--Generation {0}\n----\t Robot Position:\t{1}\n----\tSource Position:\t{2}\n----\t\t   rt60:\t{3}\n----\tRoom Dimensions:\t{4}\n----\t    Sample Rate:\t{5}\n".format(i, robot_pos, src_pos, conf[2], conf[1], conf[3]))
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
        for i in range(0, len(mics)): # Simulate a channel for each micophone in the scene
            print(i)
            data_simmed = olafilt.olafilt(rir[:,i], data)
            data_rev += [data_simmed]
        data_rev = np.array(data_rev) #put the data together
        sf.write('temp_data/data_gen_{0}.wav'.format(i), data_rev.T, sample_rate) #Write new file into a folder called temp_data


    def run_from_json_config(config):
        simConfig = config['simulation_config']
        roboConfig = config['robot_config']
        rt60 = simConfig['rt60']
        sampling_rate = int(simConfig['sample_rate'])
        room_dim = [simConfig['room_dimensions']['x'], simConfig['room_dimensions']['y'], simConfig['room_dimensions']['z']]

        mics = []
        for mic in roboConfig['microphones']:
            pos = [mic['local_pos']['x'], mic['local_pos']['y'], mic['local_pos']['z']]
            rot = [mic['local_rot']['x'], mic['local_rot']['y'], mic['local_rot']['z']]
            microphone = roboconf.RobotMicrophone(pos, rot, 'cardioid', mic['id'])
            mics.append(microphone)

        # Do motors
        motors = []

        robopos = [simConfig['robot_pos']['x'], simConfig['robot_pos']['y'], simConfig['robot_pos']['z']]
        roborot = [simConfig['robot_rot']['x'], simConfig['robot_rot']['y'], simConfig['robot_rot']['z']]
        robot = roboconf.Robot(robopos, roborot, mics, motors, roboConfig['skin_width'])

        source_positions = []
        for source_setup in simConfig['source_config']['simulation_setups']:
            if source_setup['style'] == "box":
                posArray = RobotHearingSim.parse_box_source_setup(source_setup)
                source_positions += (posArray)
            # Calculate other source setups

        # Reading the data from the source file
        [data, fs] = sf.read('test_data/data.wav', always_2d=True)
        data =  data[:,0]

        ## Multithreaded
        config = (data, room_dim, rt60, fs, robot)
        all_robot_pos = [robopos] * len(source_positions)
        Parallel(n_jobs=int(4))(delayed(RobotHearingSim.run_sim)(all_robot_pos[i], source_positions[i], i, config) for i in range(len(source_positions)))

        # Zip up new files, and delete old ones.
        zip_name = 'static/dl/data'
        directory_name = 'temp_data'
        zipper.make_archive(zip_name, 'zip', directory_name)
        for i in range(len(source_positions)):
            os.remove('temp_data/data_gen_{0}.wav'.format(i))
        return "data.zip"




    def parse_box_source_setup(setup):
        allPositions = []
        dim = [setup['dimensions']['x'], setup['dimensions']['y'], setup['dimensions']['z']]
        midpoint = [setup['origin']['x'] + (dim[0]/2),
                    setup['origin']['y'] + (dim[1]/2),
                    setup['origin']['z'] + (dim[2]/2)]

        # These for loops can be combined
        xes = [midpoint[0] + i * ((dim[0]/2)-dim[0]) for i in range(int(setup['divisions']['x']))]
        yes = [midpoint[1] + i * ((dim[1]/2)-dim[1]) for i in range(int(setup['divisions']['y']))]
        zes = [midpoint[2] + i * ((dim[2]/2)-dim[2]) for i in range(int(setup['divisions']['z']))]

        for x in xes:
            for y in yes:
                for z in zes:
                    allPositions.append([x, y, z])

        return allPositions


    def parse_sphere_source_setup(setup):
        return
    def parse_cone_source_setup(setup):
        return



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
