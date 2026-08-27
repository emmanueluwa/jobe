"""
Things to consider:
some new jobs will have words we do not know
- way around this is to tag words that we do not know with vocab we do know
"""

import json
import time
import numpy as np

import nltk

from gensim.models import doc2vec
from gensim.utils import simple_preprocess
from gensim.models.callbacks import CallbackAny2Vec

nltk.download("punkt")


class callback(CallbackAny2Vec):
    """Callback to print loss after each epoch"""

    def __init__(self):
        self.epoch = 0
        self.epoch_start_time = 0

    def on_epoch_begin(self, model):
        # model.running_training_loss=0
        print("Epoch #{} start".format(self.epoch))
        self.epoch_start_time = time.time()

    def on_epoch_end(self, model):
        # computing loss doesn't work
        # loss = model.get_latest_training_loss()
        # print("Loss: {}".format(loss))
        epoch_time = time.time() - self.epoch_start_time
        print("Time of execution:", str(epoch_time) + "s")

        self.epoch += 1


class JobDescModel:
    def __init__(self, job_dataset):
        # list of large strings for each job
        self.job_dataset = job_dataset

        self.model = doc2vec.Doc2Vec(
            vector_size=32,
            min_count=1,
            window=20,
            workers=2,
            epochs=2,
            compute_loss=True,
        )

        self.training_data = self.process_training_data()

        self.model.build_vocab(self.training_data)

        words = list(self.model.wv.key_to_index.keys())
        print("vocab size:", len(words))

    def process_training_data(self):
        training_data = [
            doc2vec.TaggedDocument(simple_preprocess(job["description"]), [index])
            for index, job in enumerate(job_dataset)
        ]

        return training_data

    def train(self):
        print("Training model...")
        self.model.train(
            self.training_data,
            total_examples=self.model.corpus_count,
            epochs=self.model.epochs,
            compute_loss=True,
            callbacks=[callback()],
        )

        print("successfully trained the model")

    def generate_embeddings_for_dataset(self):
        print("Generating dataset...")
        for i, job in enumerate(self.job_dataset):
            embedding = self.predict(job["description"])
            self.job_dataset[i]["embedding"] = embedding

    def save_dataset(self):
        print("Saving embeddings for dataset...")

        with open("./job_dataset.json", "w+") as f:
            f.write(json.dumps(self.job_dataset))

    def predict(self, job_descrip):
        vector = self.model.infer_vector(simple_preprocess(job_descrip)).tolist()

        return vector


if __name__ == "__main__":
    f = open("./scrape/job_corpus.json")
    job_dataset = json.load(f)

    job_descrip = JobDescModel(job_dataset)

    job_descrip.train()

    job_descrip.generate_embeddings_for_dataset()
    job_descrip.save_dataset()

    # _input = "This is a role"
    # print(_input)
    # prediction = job_descrip.predict(_input)
    # print(prediction)
