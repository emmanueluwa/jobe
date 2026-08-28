import subprocess
import sys
import json
from job_desc_model import JobDescModel

job_url = sys.argv[1]

subprocess.run(["node", "./scrape/singleJobParser.js", job_url], check=True)

# get the scraped job description of the job given in the terminal
with open("./jobe_descrip_temp.txt") as f:
    lines = f.readlines()
    job_descrip_text = "\n".join(lines)


f = open("./scrape/job_corpus.json")
job_dataset = json.load(f)

job_descrip = JobDescModel(job_dataset=job_dataset)

job_descrip.load_model()

# vector = job_descrip.predict(job_descrip_text)

# print("Job description vector")
# print(vector)
results = job_descrip.most_similar(job_descrip_text, top_n=3)
print((results))
