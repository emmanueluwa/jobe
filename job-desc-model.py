import numpy as np
import nltk

from gensim.models import doc2vec
from gensim.utils import simple_preprocess
from gensim.models.callbacks import CallbackAny2Vec

nltk.download("punkt")


class JobDescModel:
    def __init__(self, joblist):
        self.joblist = joblist

        self.model = doc2vec.Doc2Vec(
            vector_size=32,
            min_count=10,
            window=500,
            workers=4,
            epochs=10,
            compute_loss=True,
        )
