# Robot-Hearing-Simulator

# Dependancies
- PySoundFile
- Joblib

# How to use
#### To Install Dependancies
- Run `pip install -r requirements.txt`

#### To Run Simulation
- Run `python robothearingsim.py `
###### Program Arguemnts
* -i Input File _The file which will be used, default `test_data/data.wav`_
* -o Output File _The zip file which will be generated, filled with the simulations, default `test_data/data_gen.zip`_
* -g _The number of simulations to run, integer, default `10`_
* -rx x _The width of the room, decimal, default `5.0`_
* -ry x _The length of the room, decimal, default `5.0`_
* -rz x _The height of the room, decimal, default `5.0`_
* -t x _The number of threads to use, integer, default `1`_
* -DEBUG True/False _Show debug output or not, default `True`_
* -TIMED True/False _Time the execution of the simulation or not, default `False`_
