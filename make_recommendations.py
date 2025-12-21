from recommending import MovieRecommender
import sys
import pathlib
import json

def main(size="large"):
    DEFAULT_USER_ID = 123456789
    recommender = MovieRecommender(
                    f"scrapes/all_movies_info.json",
                    f"scrapes/{size}_movies.json"
                )
    
    if not pathlib.Path("my_movie_ratings.json").exists():
        print("It seems like you haven't uploaded your recommendations!")
        print("Use the 'Recommender' tab to rate some movies, click")
        print("'Export My Ratings', and then upload the file to codio.")
        return
    recommender.add_new_ratings("my_movie_ratings.json")

    similar_id = recommender.find_similar_user_by_id(DEFAULT_USER_ID)
    recommendations = recommender.make_recommendations_for_id(
                        similar_id, DEFAULT_USER_ID
                    )
    
    output = {
        "similar_user": similar_id,
        "similar_user_prefs" : recommender.all_user_preferences[similar_id],
        "your_prefs": recommender.all_user_preferences[DEFAULT_USER_ID],
        "recommended_movies": list(recommendations)
    }

    with open("out/recommendations.json", "w") as f:
        json.dump(output, f)

if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(size=sys.argv[1])
    else:
        main()