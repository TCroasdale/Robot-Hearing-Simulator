# Robot-Hearing-Simulator


# Dependancies
- PySoundFile
- Joblib
- Flask
- Room Impulse Response Generator, https://github.com/sunits/rir_simulator_python
- celery
- RabbitMQ server

# How to use
#### To Install Dependancies
- Run `pip install -r requirements.txt`

### Setup Config.py
- Create Config.py file
- Needs fields
    - ``` SECRET_KEY ``` A string used for secrecy.
    - ``` DATABASE ``` Can be 'SQLite', or in the future 'MongoDB'.
    - ``` SIM_FILE_EXT ``` The file extension for sound files generated, 'flac' or 'wav' recomended.
    - ``` FILE_EXPIRY_DAYS ``` The number of days to keep generated files on the server for.

#### To Run Webserver
- Run `celery -A servertasks worker --loglevel=info` 
- Run `python server.py`

