# Kilo Code + Anthropic Claude Setup

Use this guide to run Kilo Code with Anthropic Claude as the planning model for the HerdFlow Kilo + Cline workflow.

## 1) Create your Anthropic API key

1. Sign in to Anthropic Console.
2. Create a new API key.
3. Keep it private and do not commit it to git.

## 2) Set environment variables (Windows PowerShell)

Temporary for current terminal session:

```powershell
$env:ANTHROPIC_API_KEY = "your_key_here"
$env:KILO_PROVIDER = "anthropic"
$env:KILO_MODEL = "claude-sonnet-latest"
```

Persist for new terminals:

```powershell
setx ANTHROPIC_API_KEY "your_key_here"
setx KILO_PROVIDER "anthropic"
setx KILO_MODEL "claude-sonnet-latest"
```

After `setx`, open a new terminal.

## 3) Configure Kilo Code provider

In Kilo Code settings:

1. Set provider to `Anthropic`.
2. Set model to a Claude Sonnet model (recommended: latest Sonnet in your Kilo model picker).
3. Ensure API key source is environment variable `ANTHROPIC_API_KEY`.

If Kilo supports JSON settings, use equivalent values:

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-latest",
  "apiKeyEnvVar": "ANTHROPIC_API_KEY"
}
```

## 4) Verify Kilo is connected to Claude

Run a quick Kilo prompt:

- "Return exactly: Kilo Anthropic OK"

Expected:

- Kilo returns `Kilo Anthropic OK` quickly and without provider/auth errors.

## 5) Run HerdFlow Kilo + Cline flow

1. Open [KILO_CLINE_MASTER_RUN_ORDER.md](KILO_CLINE_MASTER_RUN_ORDER.md)
2. Start with [KILO_PHASE1_PROMPT.md](KILO_PHASE1_PROMPT.md)
3. Pass approved output into [CLINE_PHASE1_PROMPT.md](CLINE_PHASE1_PROMPT.md)

## Troubleshooting

- `401` or `invalid_api_key`: regenerate key and re-run `setx`.
- `model not found`: choose another Claude Sonnet model available in your Kilo model picker.
- `provider unavailable`: confirm Kilo provider is set to Anthropic, then restart Kilo/VS Code.
