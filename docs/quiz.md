# Quiz Configuration

Quizzes live in `config/quizz/*.json` (alongside `config/game.json`, see [Configuration](configuration.md)).

Quizzes can be created in two ways:

- **Via the Quiz Editor**: use the built-in editor available in the manager dashboard (recommended)
- **Via JSON files**: manually create files in the `config/quizz/` directory

You can have multiple quiz files and select which one to use when starting a game.

Example quiz configuration (`config/quizz/example.json`):

```json
{
  "subject": "Example Quiz",
  "questions": [
    {
      "question": "What is the correct answer?",
      "answers": ["No", "Yes", "No", "No"],
      "solutions": [1],
      "cooldown": 5,
      "time": 15
    },
    {
      "question": "Which of these are primary colors?",
      "answers": ["Red", "Green", "Blue", "Yellow"],
      "solutions": [0, 2, 3],
      "cooldown": 5,
      "time": 20
    },
    {
      "question": "What is the correct answer with an image?",
      "answers": ["No", "Yes", "No", "No"],
      "media": {
        "type": "image",
        "url": "https://placehold.co/600x400.png"
      },
      "solutions": [1],
      "cooldown": 5,
      "time": 20
    }
  ]
}
```

Quiz Options:

- `subject`: Title/topic of the quiz
- `questions`: Array of question objects containing:
  - `question`: The question text
  - `answers`: Array of possible answers (2-4 options)
  - `media`: Optional media object displayed with the question:
    - `type`: `"image"`, `"video"`, or `"audio"`
    - `url`: URL of the media
    - Images are shown during the question countdown and the answer phase. Audio and video play during the question phase (autoplaying) and stay available on the answer screen with a replay control, no longer autoplaying there. Audio uses an in-app player with no download control.
  - `solutions`: Array of correct answer indices (0-based). Use multiple indices for multi-answer questions
  - `cooldown`: Time in seconds before answers are revealed (3-15). For image and no-media questions this is the fixed length of the question phase. For audio/video questions it is the **minimum** length: the phase holds for at least `cooldown` (so a short clip still gets the full window), then ends when the media finishes playing, bounded by a safety cap of `cooldown + 120` seconds so a blocked or missing autoplay never stalls the game. The manager can also press **Skip** during the question phase to end it once `cooldown` has elapsed (useful when the browser blocks autoplay).
  - `time`: Time in seconds allowed to answer (5-120)
  - `maxPoints`: Maximum points awarded for a correct answer (default: `1000`, min: `0`)
  - `penalty`: Points deducted for a wrong answer (default: none, min: `0`). The player's total cannot go below 0. Unanswered questions are not penalised.

> **Note:** the app automatically adds and manages an `id` field inside each quiz file the first time it's loaded — you don't need to set it yourself, and editing it manually may cause conflicts if it collides with another quiz's id.
