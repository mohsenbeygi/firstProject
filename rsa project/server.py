import socket
import pickle
import select
from rsa import *
from _thread import start_new_thread
import sys


def create_socket():
    try:
        global HOST, PORT, server_socket
        HOST = socket.gethostname()
        PORT = 1234
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    except socket.error as msg:
        print("Socket creation error " + str(msg))


def bind_socket():
    try:
        global HOST, PORT, server_socket
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((HOST, PORT))
        server_socket.listen(5)
        print("binded the port: " + str(PORT))
    except socket.error as msg:
        print("Socket binding error " + str(msg) + "\n" + "Retrying...")
        bind_socket()


def remove_client(client):
    global all_clients, keys, usernames, addrs
    # output to screen the client who disconnected
    print('\n\n **** client disconnected ! ****\n')
    print('  # address: ', addrs[notified_socket])
    print('  # key: ', keys[notified_socket])
    print('  # username: ', usernames[notified_socket], '\n\n')
    # delete a clients data (we no longer need the data)
    all_clients.remove(client)
    if client in keys:
        del keys[client], usernames[client], addrs[client]


def decrypt(msg):
    # decrypt a message (with a rsa key)
    global rsa
    return rsa.decrypt(pickle.loads(msg), rsa.keys['decryption'])


def decrypt_key(key):
    # decrypt key which is a tuple with two encrypted numbers
    # (the key is a perticulat clients public key)
    global rsa
    key = (int(rsa.decrypt(key[0], rsa.keys['decryption'])),
           int(rsa.decrypt(key[1], rsa.keys['decryption'])))
    return key


def get_user_data(client):
    # get new clients data (key and username)
    global rsa, keys, usernames
    # 'data' is a dictionary with the public key and username
    data = pickle.loads(client.recv(2048))
    # save data
    keys[client] = decrypt_key(data['key'])
    usernames[client] = rsa.decrypt(
        data['username'], rsa.keys['decryption'])


def send_msg(client, msg, username, key):
    # broadcast a perticulat clients message to all clients
    msg = {'msg': rsa.encrypt(msg, key),
           'username': rsa.encrypt(username, key)}
    client.send(pickle.dumps(msg))


def show_clients():
    # output all clients (with their data)
    global all_clients, keys, usernames, addrs, server_socket
    print('\n\n ~~~~ All clients connected ~~~~\n')
    if len(all_clients) == 1:
        print('  # No cients connected !')
    else:
        for client in all_clients:
            if client != server_socket:
                print('  - username: ', usernames[client])
                print('  # address: ', addrs[client])
                print('  # key: ', keys[client], '\n')
    print('\n')


def dubugging():
    global usernames, running
    while True:
        cmd = input()
        if cmd == 'show':
            show_clients()
        elif cmd[:10] == 'disconnect':
            user = cmd[11:]
            print('''\nDisconnected client with username "{}" !'''.format(user))
            # delete a clients data (we no longer need the data)
            for client in usernames:
                if usernames[client] == user:
                    remove_client(client)
                    break
        elif cmd == 'shut down':
            print('SHUTTING DOWN ...')
            running = False
            # sys.exit()
            quit()


# get rsa keys for cryptography
rsa = Rsa()
rsa.get_keys()

# setup server
create_socket()
bind_socket()

# data
all_clients = [server_socket]
keys = {}
usernames = {}
addrs = {}
running = True

# for debuging cases (such as showing all clients)
start_new_thread(dubugging, ())

# loop for handling clients
while running:
    # wait for a client to send a message or for a new client
    # (wanting to connect to server also delete clients with errors)
    active_sockets, _, exception_sockets = select.select(
        all_clients, [], all_clients)
    # Iterate over notified sockets
    for notified_socket in active_sockets:
        # If notified socket is the server - new connection, accept it
        if notified_socket == server_socket:
            client_socket, addr = server_socket.accept()
            # save clients socket
            all_clients.append(client_socket)
            # send servers public key for rsa encryption
            client_socket.send(pickle.dumps(rsa.keys['encryption']))
            # save users address
            addrs[client_socket] = addr

        # Else existing socket is sending a message
        else:
            # if client hasn't sent his public key and username, get it
            if notified_socket not in keys:
                # get the new clients key and username
                get_user_data(notified_socket)
                print('\n\n --- New client connected ! ---\n')
                print('  # address: ', addrs[notified_socket])
                print('  # key: ', keys[notified_socket])
                print('  # username: ', usernames[notified_socket], '\n\n')
                continue

            # Receive message
            message = notified_socket.recv(2048)
            # If False, client disconnected, cleanup
            if message is False or len(message) == 0:
                # Remove user from data
                remove_client(notified_socket)
                continue
            message = decrypt(message)
            # output clients message (with username)
            username = usernames[notified_socket]
            msg = '''~ Message from "{}"'''.format(username)
            print(msg, '>  ', message)
            # Iterate over connected clients and broadcast message
            for client_socket in all_clients:
                # But don't sent it to sender
                if client_socket != notified_socket:
                    # Also don't send to server
                    if client_socket != server_socket:
                        # send encrypted message
                        # (with each users specific key)
                        key = keys[client_socket]
                        send_msg(client_socket, message, username, key)

    # remove clients with errors
    for notified_socket in exception_sockets:
        # Remove user from data
        remove_client(notified_socket)
