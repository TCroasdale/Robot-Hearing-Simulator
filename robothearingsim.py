import argparse
import soundfile as sf
from rir_simulator import roomsimove_single
from rir_simulator import olafilt
import numpy as np
import shutil as zipper
import os

# Simulates one mic in a 5x5x5 room with both the source and mix positions randomised
# Generates 30 utterances
if __name__ == '__main__': #Main Entry point
    parser = argparse.ArgumentParser()
    parser.add_argument('in_file', help='The input utterance', default='test_data/data.wav')
    parser.add_argument('out_file', help='The output files', default='test_data/data.zip')
    parser.add_argument('generations', help='Number of Generations')
    parser.add_argument('room_x', help='Room Width')
    parser.add_argument('room_y', help='Room Length')
    parser.add_argument('room_z', help='Room Height')
    args = parser.parse_args()

    rt60 = 0.4 # in seconds
    room_dim = [float(args.room_x), float(args.room_y), float(args.room_z)] # in meters
    sampling_rate = 16000

    #Generating a list of mic and source positions
    number_generations = int(args.generations)
    all_mic_pos = np.asarray([np.random.uniform(0.1, room_dim[0]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[1]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[2]-0.1, size=number_generations)])
    
    all_source_pos = np.asarray([np.random.uniform(0.1, room_dim[0]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[1]-0.1, size=number_generations),
                np.random.uniform(0.1, room_dim[2]-0.1, size=number_generations)])

    # Reading the data from the source file
    [data, fs] = sf.read(args.in_file, always_2d=True)
    data =  data[:,0] 

    print("Starting work")
    for i in range(number_generations):
        mic_pos = all_mic_pos[:, i]
        src_pos = all_source_pos[:, i]
        
        print("--Generation {0}".format(i))
        print( "----Microphone Position:    {0}".format(mic_pos))
        print( "----    Source Position:    {0}".format(src_pos))

        mic_positions = [mic_pos]
        rir = roomsimove_single.do_everything(room_dim, mic_positions, src_pos, rt60)

        data_rev = olafilt.olafilt(rir[:,0], data)  #Simulate room
        sf.write('temp_data/data_gen_{0}.wav'.format(i), data_rev.T, fs) #Write new file
    
    #Zip up new files, and delete old ones.
    zip_name = args.out_file
    directory_name = 'temp_data'
    print("Zipping output to: {0}".format(zip_name))
    zipper.make_archive(zip_name, 'zip', directory_name)
    print("Deleting temporary files")
    for i in range(number_generations):
        os.remove('temp_data/data_gen_{0}.wav'.format(i))