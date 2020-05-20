import os
import pty
import signal
import termios
import struct
import fcntl

class PTY():
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
    
    def close(self):
        os.close(self.fd)
        os.kill(self.pid, signal.SIGTERM)

