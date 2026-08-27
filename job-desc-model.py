"""
Things to consider:
some new jobs will have words we do not know
- way around this is to tag words that we do not know with vocab we do know
"""

import numpy as np

# import nltk

from gensim.models import doc2vec
from gensim.utils import simple_preprocess
from gensim.models.callbacks import CallbackAny2Vec

# nltk.download("punkt")


class JobDescModel:
    def __init__(self, job_list):
        # list of large strings for each job
        self.joblist = job_list

        self.model = doc2vec.Doc2Vec(
            vector_size=2,
            min_count=1,
            window=3,
            workers=2,
            epochs=2,
        )

        self.training_data = [
            doc2vec.TaggedDocument(job_description, [index])
            for index, job_description in enumerate(job_list)
        ]
        self.model.build_vocab(self.training_data)

        words = list(self.model.wv.key_to_index.keys())
        print("vocab size:", len(words))

    def train(self):
        self.model.train(
            self.training_data,
            total_examples=self.model.corpus_count,
            epochs=self.model.epochs,
        )

        print("successfully trained the model")

    def predict(self, job_descrip):
        vector = self.model.infer_vector(job_descrip.split(" ")).tolist()

        return vector


if __name__ == "__main__":
    job_descrip = JobDescModel(
        [
            "This is a software engineer role",
            "This is another job",
            "This is a software developer position and not a role",
            "This is a job for a software engineer",
            "This is not a role at all",
        ]
    )

    job_descrip.train()

    # _input = "This is a role"
    # print(_input)
    # prediction = job_descrip.predict(_input)
    # print(prediction)
