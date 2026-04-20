import enum


class ReactionType(str, enum.Enum):
    LIKE = "like"
    HEART = "heart"
    FIRE = "fire"
    LAUGH = "laugh"
