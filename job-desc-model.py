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
            vector_size=64,
            min_count=5,
            window=20,
            workers=2,
            epochs=2,
        )

        training_data = [
            doc2vec.TaggedDocument(job_description, [index])
            for index, job_description in enumerate(job_list)
        ]
        self.model.build_vocab(training_data)

        words = list(self.model.wv.key_to_index.keys())
        print("vocab size:", len(words))

    def train(self):
        pass


if __name__ == "__main__":
    job_descrip = JobDescModel(
        [
            "This is a software engineer role",
            "This is another job",
            "This is a software developer position and not a role",
        ]
    )
