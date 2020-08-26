import os
import pty
import signal
import termios
import struct
import fcntl


class PTY():
    read_size = 1024

    def __init__(self, path, args=[]):
        self.pid, self.fd = pty.fork()
        if not self.pid:
            os.execv(path, [path] + args)

    def resize(self, row, col):
        try:
            winsize = struct.pack('HHHH', row, col, 0, 0)
            fcntl.ioctl(self.fd, termios.TIOCSWINSZ, winsize)
        except Exception as e:
            print('Resize error:', e)
    
    def write(self, data):
        if not isinstance(data, bytes):
            data = bytes(data, encoding='utf-8')
        return os.write(self.fd, data)

    def read(self):
        return os.read(self.fd, self.read_size).decode()

    def close(self):
        os.close(self.fd)
        os.kill(self.pid, signal.SIGTERM)

