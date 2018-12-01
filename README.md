# Robot-Hearing-Simulator


# Dependancies
- PySoundFile
- Joblib
- Flask
- Room Impulse Response Generator, https://github.com/sunits/rir_simulator_python

# How to use
#### To Install Dependancies
- Run `pip install -r requirements.txt`


#### To Run Webserver
- Run `python server.py`


#### To Run Simulation Engine
- Run `python robothearingsim.py `

###### Program Arguments
* -i Input File _The file which will be used, default `test_data/data.wav`_
* -o Output File _The zip file which will be generated, filled with the simulations, default `test_data/data_gen.zip`_
* -g _The number of simulations to run, integer, default `10`_
* -rx x _The width of the room, decimal, default `5.0`_
* -ry x _The length of the room, decimal, default `5.0`_
* -rz x _The height of the room, decimal, default `5.0`_
* -t x _The number of threads to use, integer, default `1`_
* -DEBUG True/False _Show debug output or not, default `True`_
* -TIMED True/False _Time the execution of the simulation or not, default `False`_
