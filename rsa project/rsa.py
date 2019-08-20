# rsa
from random import randint


def gcd(num1, num2):
    if num1 == 0:
        return num2
    if num2 == 0:
        return num1
    return gcd(num2, num1 % num2)


def prime(num):
    if num < 3:
        return num == 2
    if num % 2 == 0:
        return False
    for diviser in range(3, int(num ** 0.5) + 1, 2):
        if num % diviser == 0:
            return False
    return True


class Rsa:
    def __init__(self, prime_min_bites=2):
        self.min_bites = prime_min_bites

    def generate_prime(self):
        num = randint(2 ** self.min_bites - 1, 2 ** 8 - 1)
        num += (num % 2 + 1) % 2
        while True:
            if prime(num):
                return num
            num += 2

    def get_data(self):
        # get two prime numbers
        p, q = self.generate_prime(), self.generate_prime()
        # get their product (n is the product)
        n = p * q
        # get 𝜙(N) totient function
        phi = (p - 1) * (q - 1)
        return p, q, n, phi

    def get_keys(self):

        def get_encryption_key(n, phi):
            for key in range(2, phi):
                if gcd(key, n) == 1 and gcd(key, phi) == 1:
                    return key

        def get_decryption_key(encryption_key, phi):
            key = 1
            while True:
                if (encryption_key * key) % phi == 1:
                    return key
                key += 1

        p, q, n, phi = self.get_data()

        # get keys
        while True:
            encryption_key = get_encryption_key(n, phi)
            if encryption_key is None:
                p, q, n, phi = self.get_data()
                continue

            decryption_key = get_decryption_key(encryption_key, phi)
            if decryption_key is None:
                p, q, n, phi = self.get_data()
            else:
                break

        self.keys = {'encryption': (encryption_key, n),
                     'decryption': (decryption_key, n)}

        return self.keys

    def encrypt(self, string, key):
        # encrypted_string is going to be a list
        encrypted_string = ['None'] * len(string)
        for index, letter in enumerate(string):
            encrypted_string[index] = pow(ord(letter), key[0], key[1])
        return encrypted_string

    def decrypt(self, encrypted_string, key):
        # encrypted_string is a list
        decrypted_string = ''
        for num in encrypted_string:
            decrypted_string += chr(pow(num, key[0], key[1]))
        return decrypted_string


# rsa = Rsa()
# rsa.get_keys()
# msg = 'hi'
# e_msg = rsa.encrypt(msg, rsa.keys['encryption'])
# print(e_msg)
# d_msg = rsa.decrypt(e_msg, rsa.keys['decryption'])
# print(d_msg)
