import socket
import select
import errno
import sys
import threading
from queue import Queue
import datetime


def connect_client():
    global IP, PORT, MY_USERNAME, client_socket, HEADER_LEN
    IP = '192.168.1.34'
    # socket.gethostname()
    PORT = 1234
    MY_USERNAME = input("\n\n\nPlease enter your username\n==>  ")
    print('\n\n' + str(datetime.datetime.now()), '\n\n\n\n\n\n')

    # Create a socket
    # socket.AF_INET - address family, IPv4, some other
    # possible are AF_INET6, AF_BLUETOOTH, AF_UNIX
    #
    # socket.SOCK_STREAM - TCP, conection-based, socket.SOCK_DGRAM - UDP,
    # connectionless, datagrams, socket.SOCK_RAW - raw IP packets
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to a given ip and port
    client_socket.connect((IP, PORT))

    # Set connection to non-blocking state, so .recv() call wont block,
    # just return some exception we'll handle
    client_socket.setblocking(False)

    # Prepare username and header and send them
    # We need to encode username to bytes, then count number of
    # bytes and prepare header of fixed size, that we encode to bytes as well
    name_header = '{}{}'.format(len(MY_USERNAME),
                                ' ' * (HEADER_LEN - len(str(len(MY_USERNAME)))))
    msg = (name_header + MY_USERNAME).encode('utf-8')
    client_socket.send(msg)


# send to server what user messages
def get_users_acticities():
    # print('getting input for messages started')
    while True:
        # Wait for user to input a message
        message = input()
        print("\033[A                             \033[A")

        # If message is not empty - send it
        if message:
            # Encode message to bytes, prepare header and convert to bytes and send
            message = message
            msg_header = '{}{}'.format(len(message),
                                       ' ' * (HEADER_LEN - len(str(len(message)))))
            msg = (msg_header + message).encode('utf-8')
            client_socket.send(msg)
            print('\nMe ({0}) >>  {1}'.format(MY_USERNAME, message))


# get other users messages and show them
def update_other_users():
    # print(' --- updating other users started --- ')
    while True:
        try:

            # Receive our "header" containing username length,
            # it's size is defined and constant
            username_header = client_socket.recv(HEADER_LEN)

            # If we received no data, server gracefully closed a connection,
            # for example using socket.close() or
            # socket.shutdown(socket.SHUT_RDWR)
            if not len(username_header):
                print('Connection closed by the server')
                sys.exit()

            # Convert header to int value
            username_length = int(username_header.decode('utf-8').strip())
            # Receive and decode username
            username = client_socket.recv(username_length).decode('utf-8')

            # Now do the same for message (as we received
            # username, we received whole message, there's
            # no need to check if it has any length)
            message_header = client_socket.recv(HEADER_LEN)
            message_length = int(message_header.decode('utf-8').strip())
            message = client_socket.recv(message_length).decode('utf-8')

            # Print message
            print('\n{} >>  {}\n'.format(username, message))

        except IOError as e:
            # This is normal on non blocking connections - when there are
            # no incoming data error is going to be raised
            # Some operating systems will indicate that using AGAIN,
            # and some using WOULDBLOCK error code
            # We are going to check for both - if one of them - that's expected,
            # means no incoming data, continue as normal
            # If we got different error code - something happened
            if e.errno != errno.EAGAIN and e.errno != errno.EWOULDBLOCK:
                print('Reading error (in IOerror) :  {}'.format(str(e)))
                sys.exit()
            # else:
            #     print('server had nothing to send')

            # We just did not receive anything
            continue

        except Exception as e:
            # Any other exception - something happened, exit
            print('Reading error: '.format(str(e)))
            sys.exit()


def threader():
    # print('new thread')
    # gets a job from the queue
    job = que.get()
    # get other users activites (messages) from server and show them
    if job == 'updateUsers':
        update_other_users()
    # get users activites (messages) and send to server
    if job == 'getInput':
        get_users_acticities()

    # completed with the job
    print('task done')
    que.task_done()


HEADER_LEN = 15

connect_client()

# Create the queue and threader
que = Queue()
jobs = ['updateUsers', 'getInput']

# how many threads are we going to allow for
for work in range(len(jobs)):
    thread = threading.Thread(target=threader)

    # classifying as a daemon, so they will die when the main dies
    thread.daemon = False

    # begins, must come after daemon definition
    thread.start()

# 2 jobs assigned.
for job in jobs:
    que.put(job)
