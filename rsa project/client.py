import socket
import errno
import sys
from rsa import *
from datetime import datetime
import select
import pickle
from _thread import start_new_thread


def encrypt_key(key):
    global public_key
    msg = (str(key[0]), str(key[1]))
    return (rsa.encrypt(msg[0], public_key), rsa.encrypt(msg[1], public_key))


def encrypt(msg):
    global public_key
    return pickle.dumps(rsa.encrypt(msg, public_key))


def setup_client():
    global IP, PORT, client_socket, public_key, rsa
    IP = '127.0.0.1'
    # socket.gethostname()
    PORT = 1234
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # Connect to a given ip and port
    client_socket.connect((IP, PORT))
    client_socket.setblocking(False)
    # receive servers public key
    select.select([client_socket], [], [])
    public_key = pickle.loads(client_socket.recv(2048))
    # print('Servers public key: ', public_key)
    username = input('\n\nPlease enter your username >  ')
    msg = {'key': encrypt_key(rsa.keys['encryption']),
           'username': rsa.encrypt(username, public_key)}
    client_socket.send(pickle.dumps(msg))
    print('\n\n')
    print(datetime.now(), '\n\n')


def send_data():
    global client_socket, public_key, running
    while True:
        message = input()
        if message == 'close()':
            print('SHUTTING DOWN ...')
            running = False
            sys.exit()
            exit()
        print("\033[A\033[A")
        print('Me >  ', message)
        if message:
            msg = pickle.dumps(rsa.encrypt(message, public_key))
            client_socket.send(msg)


# get keys
rsa = Rsa()
rsa.get_keys()
setup_client()

# data
running = True

start_new_thread(send_data, ())

while running:
    try:
        while True:
            msg = client_socket.recv(2048)
            # If we received no data, server gracefully closed a connection,
            # for example using socket.close()
            # or socket.shutdown(socket.SHUT_RDWR)
            if not len(msg) or not msg:
                print('Connection closed by the server')
                sys.exit()
                exit()
            # 'data' is a dictionary with the message and username
            data = pickle.loads(msg)
            username = rsa.decrypt(data['username'], rsa.keys['decryption'])
            msg = rsa.decrypt(data['msg'], rsa.keys['decryption'])
            print(username, '>  ' + msg)

    except IOError as e:
        if e.errno != errno.EAGAIN and e.errno != errno.EWOULDBLOCK:
            print('Reading error: {}'.format(str(e)))
            running = False
            sys.exit()
        continue

    except Exception as e:
        # Any other exception - something happened, exit
        print('Reading error: '.format(str(e)))
        sys.exit()
