from collections import defaultdict
import json
from math import sqrt
import random


class MovieRecommender:
    def __init__(self, movie_info_filename: str, user_ratings_filename: str):
        """
        Inputs:
        movie_info_filename: name of JSON file containing mapping of movie IDs
                             to info
        user_ratings_filename: name of JSON file containing mapping of user
                               IDs to ratings
        """
        movie_info_file = open(movie_info_filename, "r")
        user_ratings_file = open(user_ratings_filename, "r")

        self.movie_info = MovieRecommender.read_from_json(movie_info_file)
        self.all_user_ratings = MovieRecommender.read_from_json(
            user_ratings_file
        )

        movie_info_file.close()
        user_ratings_file.close()

        self.all_user_preferences = {
            int(user_id): self.ratings_to_preferences(user_ratings)
            for user_id, user_ratings in self.all_user_ratings.items()
        }

    @staticmethod
    def read_from_json(file):
        """
        You don't need to do anything with this function!
        Inputs:
        file:   pointer to file containing the dictionary to process

        Returns:
        The dictionary represented by the JSON, transforming all string
        keys into int keys for consistency.
        """
        dictionary = {int(k): v for k, v in json.load(file).items()}
        for key in dictionary:
            value = dictionary[key]
            if isinstance(value, dict):
                dictionary[key] = {int(k): v for k, v in value.items()}
        return dictionary

    def add_new_ratings(self, new_ratings_filename: str):
        """
        You don't need to do anything with this function!
        Inputs:
        new_ratings_filename:   file of new ratings JSON to include.
        """
        new_ratings_file = open(new_ratings_filename, "r")
        new_ratings = MovieRecommender.read_from_json(new_ratings_file)
        new_ratings_file.close()

        new_preferences = {
            int(user_id): self.ratings_to_preferences(user_ratings)
            for user_id, user_ratings in new_ratings.items()
        }
        self.all_user_ratings.update(new_ratings)
        self.all_user_preferences.update(new_preferences)

    def ratings_to_preferences(
        self, user_ratings: dict[int, float]
    ) -> dict[str, float]:
        """
        Inputs:
        user_ratings        -   mapping of movie IDs to ratings,
                                representing one user's ratings.

        Returns:
        dict mapping movie genres to the average rating that the user awards
        to movies from that genre. If the user has never seen a movie
        belonging to some particular genre, then that genre will not be
        present as a key in dictionary that is returned
        """
        genre_ratings = {}
        for movie_id, rating in user_ratings.items():
            title, genres = self.movie_info[movie_id]
            for genre in genres:
                if genre not in genre_ratings:
                    genre_ratings[genre] = []
                genre_ratings[genre].append(rating)
        averages = {}
        for genre, ratings in genre_ratings.items():
            averages[genre] = sum(ratings) / len(ratings)
        return averages

    @staticmethod
    def cosine_similarity(
        first: dict[str, float], second: dict[str, float]
    ) -> float:
        """Calculates the cosine similarity between the two users'
        ratings profiles.

        Args:
            first (dict[str, float]): first user's ratings profile
            second (dict[str, float]): second user's ratings profile

        Returns:
            float: cosine similarity of the two users' ratings profiles.
        """

        shared = first.keys() & second.keys()
        if not shared:
            return 0.0

        numerator = 0
        for g in shared:
            numerator += first[g] * second[g]

        sum_square_one = 0
        for value in first.values():
            sum_square_one += value ** 2
        sqrt_one = sum_square_one ** 0.5

        sum_square_two = 0
        for value in second.values():
            sum_square_two += value ** 2
        sqrt_two = sum_square_two ** 0.5

        if sqrt_one == 0 or sqrt_two == 0:
            return 0.0
        return float(numerator / (sqrt_one * sqrt_two))

    def find_similar_user_by_id(self, user_id: int) -> int:
        """Find the ID of a user who has the preferences
        that are most similar to the user whose ID was
        passed in as input.

        Args:
            user_id (int): ID of the user to find another similar user to

        Returns:
            int: id of the user with preferences most similar to the input
                 user; ties broken in favor of higher ID values.
        """
        target_pref = self.all_user_preferences[user_id]
        b_user = None
        b_score = -1
        for id, pref in self.all_user_preferences.items():
            if id != user_id:
                score = MovieRecommender.cosine_similarity(target_pref, pref)
                if (score > b_score or (score == b_score and id > b_user)):
                    b_score = score
                    b_user = id
        return b_user

    def remove_seen(self, recommender_pref, recipient_pref):
        """Returns a list of movies that have not been seen by the user."""
        unseen = []
        for movie, rating in recommender_pref.items():
            if movie not in recipient_pref:
                unseen.append((movie, rating))
        return unseen

    def matching_genres(self, movies, top_genres):
        """Only keeps movies that are one of the top genres."""
        matches = []
        for movie, rating in movies:
            genres = self.movie_info[movie][1]
            for genre in genres:
                if genre in top_genres:
                    matches.append((movie, rating))
                    break
        return matches

    def make_recommendations_for_id(
        self, recommender_id: int, recipient_id: int
    ) -> set[str]:
        """Given a user who wants recommendations and another user,
        return a set of up to five
        movie names as recommendations.

        Args:
            recommender_id (int): id of the user whose ratings will be
            used as recommendation recipient_id (int): id of the user
            who wants a recommendation

        Returns:
            set[str]: a set of up to five movie titles. These movies must meet
            the criteria that the recipient has not rated them, they are tagged
            with at least one of the recipient's top two rated genres,
            and they are the most highly rated movies by the recommender
            that meet the previous two conditions.
        """
        recommender_ratings = self.all_user_ratings[recommender_id]
        recipient_ratings = self.all_user_ratings[recipient_id]
        recipient_pref = self.all_user_preferences[recipient_id]

        top_genres = sorted(recipient_pref, key=lambda g:
                            recipient_pref[g],
                            reverse=True)[:2]
        unseen_movies = self.remove_seen(recommender_ratings,
                                         recipient_ratings)
        matched_genres = self.matching_genres(unseen_movies, top_genres)
        top_five = sorted(matched_genres, key=lambda x: x[1], reverse=True)[:5]
        titles = []
        for movie, rating in top_five:
            t, g = self.movie_info[movie]
            titles.append(t)
        return set(titles)
