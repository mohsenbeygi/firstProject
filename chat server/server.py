import socket
# import threading
# from queue import Queue
import select


# Create socket ( connect two computers )
def create_socket():
    try:
        global HOST, PORT, server_socket
        HOST = socket.gethostname()
        PORT = 1234
        # Create a socket
        #
        # socket.AF_INET - address family, IPv4, some otehr possible are
        # AF_INET6, AF_BLUETOOTH, AF_UNIX
        #
        # socket.SOCK_STREAM - TCP, conection-based, socket.SOCK_DGRAM - UDP,
        # connectionless, datagrams, socket.SOCK_RAW - raw IP packets
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    except socket.error as msg:
        print("Socket creation error " + str(msg))


# Binding the socket and listening for connections
def bind_socket():
    try:
        global HOST, PORT, server_socket

        # modify socket to reuse
        # SO_ - socket option
        # SOL_ - socket option level
        # Sets REUSEADDR (as a socket option) to 1 on socket
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        print("binding the port: " + str(PORT))

        server_socket.bind((HOST, PORT))
        server_socket.listen(5)
        print(' -- done --\n')

    except socket.error as msg:
        print("Socket binding error " + str(msg) + "\n" + "Retrying...")
        bind_socket()


# Handling connections from multiple clients and saving to a list
# Closing previus connections when server.py file is restarted
# def accept_connections():
#     global all_sockets
#
#     # close old users
#     for c in all_sockets:
#         c.close()
#
#     # start with only servers socket
#     all_sockets = [server_socket]
#     del all_addresses[:]
#
#     while True:
#         try:
#             # accept anyone requesting to connect
#             client_socket, address = server_socket.accept()
#             server_socket.setblocking(1)  # prevents timeout
#
#             all_sockets.append(client_socket)
#             all_addresses.append(address)
#
#             print("Connection has been established : " + address[0])
#
#         except Exception as err:
#             print("Error while accepting connections")
#             print('error: ', err)


# Handles message receiving
def receive_message(client_socket):
    global HEADER_LEN
    try:

        # Receive our "header" containing message length, it's size is
        # defined and constant
        message_header = client_socket.recv(HEADER_LEN)

        # If we received no data, client gracefully closed a connection,
        # for example using socket.close() or socket.shutdown(socket.SHUT_RDWR)
        if not len(message_header):
            return False

        # Convert header to int value
        message_length = int(message_header.decode('utf-8').strip())

        # Return an object of message header and message data
        msg = {'header': message_header,
               'data': client_socket.recv(message_length)}
        return msg

    except Exception as err:

        # If we are here, client closed connection violently, for example
        # by pressing ctrl+c on his script
        # or just lost his connection
        # socket.close() also invokes socket.shutdown(socket.SHUT_RDWR)
        # what sends information about closing the socket (shutdown read/write)
        # and that's also a cause when we receive an empty message
        print('error in receive message: ', err)
        return False


def show_clients():
    global clients, addresses
    print('\n < -- all clients -- >\n')
    for client in clients:
        print('  # {}'.format(clients[client]['data'].decode('utf-8')))
        print('   IP: {0}  |  PORT:  {1}\n'.format(*addresses[client]))
    print('\n')


# if a user sends a message receive and send it for other users
def updateUsers():
    # print(' ---- updating users ---- ')
    global all_sockets, HEADER_LEN, clients, addresses
    while True:

        # Calls Unix select() system call or Windows select() WinSock call
        # with three parameters:
        #   - rlist - sockets to be monitored for incoming data
        #   - wlist - sockets for data to be send to (checks if for example
        # buffers are not full and socket is ready to send some data)
        #   - xlist - sockets to be monitored for exceptions (we want to
        # monitor all sockets for errors, so we can use rlist)
        # Returns lists:
        #   - active - sockets we received some data on (that way we don't
        # have to check sockets manually)
        #   - writing - sockets ready for data to be send thru them
        #   - errors  - sockets with some exceptions
        # This is a blocking call, code execution will "wait" here and "get"
        # notified in case any action should be taken
        read_sockets, _, exception_sockets = \
            select.select(all_sockets, [], all_sockets)

        # Iterate over notified sockets
        for notified_socket in read_sockets:

            # If notified socket is a server socket - new connection, accept it
            if notified_socket == server_socket:

                # Accept new connection
                # That gives us new socket - client socket, connected to
                # this given client only, it's unique for that client
                # The other returned object is ip/port set
                client_socket, client_address = server_socket.accept()

                # Client should send his name right away, receive it
                user = receive_message(client_socket)

                # If False - client disconnected before he sent his name
                if user is False:
                    continue

                # Add accepted socket to our list of all sockets list
                all_sockets.append(client_socket)

                # Also save username and username header
                clients[client_socket] = user
                addresses[client_socket] = client_address

                msg = '\nAccepted new connection from {0}, username: {1}\n' \
                    .format(client_address, user['data'].decode('utf-8'))

                print(msg)
                show_clients()

            # Else existing socket is sending a message
            else:

                # Receive message
                message = receive_message(notified_socket)

                # If False, client disconnected, cleanup
                if message is False:
                    user = clients[notified_socket]['data'].decode('utf-8')
                    print('\nClosed connection from: {}\n'.format(user))

                    # Remove from list for socket.socket()
                    all_sockets.remove(notified_socket)
                    # Remove from our list of users
                    del clients[notified_socket]

                    show_clients()

                    continue

                # Get user by notified socket, so we
                # will know who sent the message
                user = clients[notified_socket]

                msg = 'Received message from {0}: {1}'\
                    .format(user["data"].decode("utf-8"),
                            message["data"].decode("utf-8"))
                print(msg)

                # Iterate over connected clients and broadcast message
                for client_socket in clients:

                    # But don't sent it to sender
                    if client_socket != notified_socket:

                        # Send user and message (both with their headers)
                        # We are reusing here message header sent by sender, and
                        # saved username header send by user when he connected
                        msg = user['header'] + user['data'] + \
                            message['header'] + message['data']
                        client_socket.send(msg)

        # It's not really necessary to have this, but will
        # handle some socket exceptions just in case
        for notified_socket in exception_sockets:
            # Remove from all our sockets
            all_sockets.remove(notified_socket)
            # Remove from our list of users
            del clients[notified_socket]


HEADER_LEN = 15

create_socket()
bind_socket()

all_sockets = [server_socket]
clients = {}
addresses = {}

updateUsers()
