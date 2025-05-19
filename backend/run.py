import os
import sys
from app import main

if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    main()