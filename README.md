# nicechat
Extensible command-line chat for OpenAI's models.

## How to use it?

Create a configuration file at `~/.nicechat.json`.

```json
{
  "openai_key": "<YOUR OPEN_AI TOKEN>",
  "model": "gpt-3.5-turbo",
  "system": "You are a helpful chatbot. You answer straight and to the point. With no bullshit."
}
```

Run chat With

```
$ nicechat
```

## Settings

There are just three options for now:

- `openai_key` - your OpenAI key required to communicate with OpenAI Apis. [Find it here](https://platform.openai.com/account/api-keys).
- `model` - one of the GPT models. Don't forget to control your spendings
- `system` - sets up the initial role of your assistant.
