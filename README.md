# nicechat

The simplest way to chat with LLM models in your terminal.

![Demo GIF](./media/intro.gif)

------

Currently supports:

- [OpenAI](https://platform.openai.com/docs/models)
- [Anthropic](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [DeepSeek](https://api-docs.deepseek.com/)
- [Replicate](https://replicate.com/collections/language-models)

## Installation

```bash
npm install -g nicechat
```

## How to use it?

Before starting, make sure you have the required environment variables set up for your API keys:

```bash
export OPENAI_API_KEY="your_openai_api_key"
export ANTHROPIC_API_KEY="your_anthropic_api_key"
export DEEPSEEK_API_KEY="your_deepseek_api_key"
export REPLICATE_API_TOKEN="your_replicate_api_token"
```

Create a configuration file at `~/.nicechat.json` with profiles.

```json
{
  "profiles": {
    "default": {
      "vendor": "openai",
      "model": "gpt-4-1106-preview",
      "system": "You are a helpful assistant. You answer concisely and to the point."
    },
    "claude": {
      "vendor": "anthropic",
      "model": "claude-3-opus-20240229",
      "system": "You are a helpful assistant. You answer concisely and to the point."
    },
    "r1": {
      "vendor": "deepseek",
      "model": "deepseek-reasoner",
      "system": "You are a helpful assistant. You answer concisely and to the point."
    },
    "llama3-8b": {
      "vendor": "replicate",
      "model": "meta/meta-llama-3-8b-instruct",
      "system": "You are a pirate."
    }
}
```

## Start the chat:

```
$ nicechat chat claude
```

Omit the arguments to run the default profile:

```
$ nicechat
```
