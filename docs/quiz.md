# Quiz Configuration

Quizzes live in `config/quizz/*.json`, see [Configuration](configuration.md).

Quizzes can be created in two ways:

- **Via the Quiz Editor**: use the built-in editor available in the manager dashboard (recommended)
- **Via JSON files**: manually create files in the `config/quizz/` directory

You can have multiple quiz files and select which one to use when starting a game.

Example quiz configuration (`config/quizz/example.json`):

```json
{
  "gameMode": "quiz",
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

- `gameMode`: `"quiz"` (default) or `"survey"`, see [Survey mode](#survey-mode)
- `subject`: Title/topic of the quiz
- `questions`: Array of question objects containing:
  - `type`: `"single"` (exactly one answer) or `"multi"` (one or more). Defaults to `"single"` when omitted
  - `question`: The question text
  - `answers`: Array of possible answers (2-4 options)
  - `media`: Optional media object displayed with the question:
    - `type`: `"image"`, `"video"`, or `"audio"`
    - `url`: URL of the media, either a full `http(s)://` URL or a `/media/...` path for a file uploaded from the editor (stored in `config/media`)
  - `solutions`: Array of correct answer indices (0-based). Use multiple indices for multi-answer questions. Required in `"quiz"` mode, omitted in `"survey"` mode
  - `cooldown`: Time in seconds before answers are revealed (3-15)
  - `time`: Time in seconds allowed to answer (5-120)
  - `maxPoints`: Maximum points awarded for a correct answer (default: `1000`, min: `0`)
  - `penalty`: Points deducted for a wrong answer (default: none, min: `0`). The player's total cannot go below 0. Unanswered questions are not penalised.
  - `options.scoringMode`: For `"multi"` questions only — `"strict"` (full points only if the selection matches exactly), `"balanced"` (correct picks minus wrong ones, the default) or `"lenient"` (points per correct pick, no penalty for wrong ones)

> **Note:** the app automatically adds and manages an `id` field inside each quiz file the first time it's loaded — you don't need to set it yourself, and editing it manually may cause conflicts if it collides with another quiz's id.

## Survey mode

A quiz with `"gameMode": "survey"` collects opinions instead of testing knowledge: there is no scoring, no leaderboard and no podium, and no answer is correct. The host still controls the pace and still sees how the answers are distributed after each question, but players see neither points nor a rank, and the game ends on a summary screen rather than a podium.

Because a survey question has no right answer, `solutions` is left out entirely, and the scoring fields (`maxPoints`, `penalty`, `options.scoringMode`) are ignored:

```json
{
  "gameMode": "survey",
  "subject": "Sprint retro",
  "questions": [
    {
      "type": "single",
      "question": "How did this sprint feel?",
      "answers": ["Great", "Fine", "Hard", "Very hard"],
      "cooldown": 5,
      "time": 20
    },
    {
      "type": "multi",
      "question": "What slowed you down the most?",
      "answers": ["Meetings", "Unclear specs", "CI", "Reviews"],
      "cooldown": 5,
      "time": 30
    }
  ]
}
```

`type` keeps its meaning in a survey: it decides whether a player may pick several answers, not how they are scored.

The mode belongs to the quiz rather than to a single game, because whether the questions have right answers is a property of the content. Switching an existing quiz to survey mode in the editor keeps its `solutions` on file so you can switch back; they are simply never sent to the clients while the mode is `"survey"`. A quiz without `gameMode` is read as `"quiz"`, so files written before this option keep working untouched.
