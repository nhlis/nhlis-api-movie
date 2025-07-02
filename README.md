# 🎬 NestJS Movie API

This service handles user comments on movies, including creating, retrieving, editing, and deleting comments. Built as part of the modular monolith architecture for the NestJS Movie API platform.

---

## 🔧 Getting Started

> Clone monorepo or individual service depending on your architecture.

```bash
# Clone repo
git clone https://github.com/nhlis/NestJS-Movie.git
cd NestJS-Movie

# Install dependencies using Bun
bun install

# Run
bun run start:dev
```

> ⚠️ Make sure the following are **already running** before starting:
>
> -   MongoDB
> -   Redis
> -   OAuth2 Auth Service (e.g. https://auth.knite.online)
>
> These are required for full functionality (authentication, session management, etc.)

---

## 🔌 API Endpoints

### 📥 Get Movie Overviews

- **URL**: `GET /api/v1/overviews`
- **Method**: `GET`
- **Auth**: `Not Required`
- **Content-Type**: `application/json`
- **Body**: `None`


### 🔎 Query Parameters

| Name                  | Type           | Required | Description                                                                 |
|-----------------------|----------------|----------|-----------------------------------------------------------------------------|
| `last_id`             | `string`       | No       | Cursor-based pagination (Mongo `_id`)                                       |
| `limit`               | `number`       | No       | Max number of items (default: `50`, max: `100`)                             |
| `genres`              | `string[]`     | No       | List of genres (e.g. `action,drama`)                                        |
| `type`                | `EMovieType`   | No       | Movie type enum (e.g. `MOVIE`, `TV_SHOW`)                                   |
| `start_date`          | `Date (ISO)`   | No       | Start of release date range (e.g. `2024-01-01`)                             |
| `end_date`            | `Date (ISO)`   | No       | End of release date range                                                   |
| `age_rating`          | `EAgeRating`   | No       | Minimum age rating (e.g. `13`, `18`)                                        |
| `subtitle_languages`  | `string[]`     | No       | Subtitle language codes (e.g. `en`, `vi`)                                   |
| `dub_languages`       | `string[]`     | No       | Dubbed language codes (e.g. `ja`, `ko`)                                     |
| `release_date`        | `EMovieSort`   | No       | Sort by release date (`1` = ASC, `-1` = DESC)                               |
| `most_rated`          | `EMovieSort`   | No       | Sort by number of ratings                                                   |
| `highest_rated`       | `EMovieSort`   | No       | Sort by average rating                                                      |
| `most_viewed`         | `EMovieSort`   | No       | Sort by view count                                                          |

> ℹ️ Enum values for `EMovieGenre`, `EMovieType`, `EAgeRating`, `EMovieLanguage`, and `EMovieSort` should be listed separately for reference.

### 📄 Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/overviews?genres=action,drama&limit=20&most_viewed=-1&start_date=2024-01-01"
```

### ✅ Example Response

```json
{
  "statusCode": 200,
  "timestamp": "2025-07-02T12:34:56.789Z",
  "path": "/api/v1/overviews",
  "method": "GET",
  "data": {
    "overviews": [
       {
            "_id": "175489971111600168",
            "original_title": "I May Be a Guild Receptionist, but I’ll Solo Any Boss to Clock Out on Time",
            "alternative_titles": [
                "ギルドの受付嬢ですが、残業は嫌なのでボスをソロ討伐しようと思います",
                "uild no Uketsukejō desu ga, Zangyō wa Iya nanode Boss wo Solo Tōbatsu Shiyō to Omoimasu"
            ],
            "description": "Alina thought she had found the perfect job as a guild receptionist. It’s stable, safe, and has a super cute uniform. But this dream gig turns into an overtime nightmare whenever adventurers get stuck clearing a dungeon. Tired of the long nights, Alina starts taking down the bosses herself! She even earns the name Executioner for her impressive skills. Can she keep her identity a secret?",
            "genres": [
                "comedy",
                "adventure",
                "action",
                "science_fiction",
                "fantasy"
            ],
            "type": "tv_series",
            "release_date": "2024-12-31T17:00:00.000Z",
            "subtitle_languages": [],
            "dub_languages": [],
            "logo": "https://image.knite.online/1qFx7kDgvHMnofpErSfWAvzCz4NWq6jbj",
            "poster": "https://image.knite.online/1kk0o4VlB4xkRnTguj6AiQICg350MVe_c",
            "backdrop": "https://image.knite.online/15YRKn6h1le9xMtwILoZeBCYilge60K0k",
            "age_rating": 14,
            "total_rating": 0,
            "count_rating": 0,
            "average_rating": 0,
            "count_season": 0,
            "count_episode": 0,
            "count_view": 0,
            "created_at": "2025-01-17T03:48:01.291Z",
            "updated_at": "2025-02-19T05:01:53.346Z"
        },...
    ],
    "hasMore": true
  }
}
```

---

## 📫 Contact

Feel free to connect or reach out for collaboration:

-   💼 [LinkedIn](https://www.linkedin.com/in/hải-lý-nguyễn-a0a5942a0)
-   🌐 Portfolio: [https://portfolio.knite.online](https://portfolio.knite.online)
-   📧 Email: nhly.dev@gmail.com

---

## 📄 License

MIT License – free to use with attribution.
