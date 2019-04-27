import tempfile
import pytest
import os

from server import WebServer
from database.db_manager_sqlite import DB_Manager_SQLite

@pytest.fixture
def client():
    db_fd, db_fl = tempfile.mkstemp()

    db = DB_Manager_SQLite(db_fl)
    db.set_test_db()

    server = WebServer(db)

    server.start()
    yield server.get_app()

    os.close(db_fd)
    os.unlink(db_fl)

def login(client, username, password):
    return client.post('/login', data=dict(
        email=username,
        password=password
    ), follow_redirects=True)


def logout(client):
    return client.get('/logout', follow_redirects=True)

def signup(client, email, pwd):
    return client.post('/signup', data=dict(
        email=email,
        password=pwd,
        confpass=pwd
    ), follow_redirects=True)


def test_index_page(client):
    """ tests index """

    rv = client.get('/')
    assert b'Robot Hearing Simulator' in rv.data




def test_signup_login_logout(client):
    rv = signup(client, 'tecroasdale1@email.ac.uk', 'password')
    print(rv.data)
    assert b'tecroasdale1@email.ac.uk' in rv.data

    rv = logout(client)
    assert b'tecroasdale1@email.ac.uk' not in rv.data

    rv = login(client, 'tecroasdale1@email.ac.uk', 'password')
    assert b'tecroasdale1@email.ac.uk' in rv.data

    rv = logout(client)
    assert b'tecroasdale1@email.ac.uk' not in rv.data
