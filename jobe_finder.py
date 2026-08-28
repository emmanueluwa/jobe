import subprocess
import sys
from job_desc_model import JobDescModel

job_url = sys.argv[1]

subprocess.run(["node", "./scrape/singleJobParser.js", job_url], check=True)

# job_descrip = JobDescModel()

# job_descrip.load_modal()

# job_descrip.predict()
