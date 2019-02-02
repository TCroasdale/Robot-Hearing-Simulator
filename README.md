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
- Needs fields ``` SECRET_KEY ```

#### To Run Webserver
- Run `celery -A servertasks worker --loglevel=info` 
- Run `python server.py`

