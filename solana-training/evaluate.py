#!/usr/bin/env python3
"""
Solana Model Evaluation
Tests the trained Solana model on sample prompts and measures quality.

Usage:
  python evaluate.py --model /app/trained-models/solana-20240101
  python evaluate.py --model /app/trained-models/solana-20240101 --interactive
"""

import json
import argparse
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


TEST_PROMPTS = [
    {
        "name": "Quiz Generation",
        "system": "You are Solana, an expert educational AI. Generate a quiz. Return ONLY valid JSON.",
        "instruction": "Generate a 2-question quiz about: The Philippine Constitution was ratified in 1987 and established a democratic republic.",
    },
    {
        "name": "Study Notes",
        "system": "You are Solana, an expert educational AI. Generate study notes. Return ONLY valid JSON.",
        "instruction": "Generate notes about: Labor is recognized as a primary social economic force under Article II of the 1987 Constitution.",
    },
    {
        "name": "AI Tutor",
        "system": "You are Solana, the AI tutor of StudyAI. Be helpful and concise.",
        "instruction": "What is habeas corpus and when can it be suspended?",
    },
]


def load_model(model_path: str):
    print(f"Loading model from: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)

    base_meta = {}
    try:
        with open(f"{model_path}/solana_meta.json") as f:
            base_meta = json.load(f)
        base_model_name = base_meta.get("base_model", "meta-llama/Llama-3.2-3B-Instruct")
        print(f"Base model: {base_model_name}")
        base = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            device_map="auto" if torch.cuda.is_available() else "cpu",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        )
        model = PeftModel.from_pretrained(base, model_path)
    except Exception:
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            device_map="auto" if torch.cuda.is_available() else "cpu",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        )

    model.eval()
    return model, tokenizer


def generate(model, tokenizer, system: str, instruction: str, max_new_tokens: int = 500) -> str:
    prompt = f"<|system|>\n{system}\n<|user|>\n{instruction}\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated = outputs[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(generated, skip_special_tokens=True)


def run_evaluation(model, tokenizer):
    print("\n" + "=" * 60)
    print("  SOLANA MODEL EVALUATION")
    print("=" * 60)

    scores = []
    for i, test in enumerate(TEST_PROMPTS, 1):
        print(f"\n[Test {i}/{len(TEST_PROMPTS)}] {test['name']}")
        print(f"Instruction: {test['instruction'][:80]}...")
        output = generate(model, tokenizer, test["system"], test["instruction"])
        print(f"\nOutput:\n{output[:500]}")

        # Basic quality check
        is_json_task = "JSON" in test["system"]
        if is_json_task:
            try:
                clean = output.replace("```json", "").replace("```", "").strip()
                json.loads(clean)
                score = "✅ Valid JSON"
                scores.append(1)
            except json.JSONDecodeError:
                score = "⚠️  Invalid JSON"
                scores.append(0)
        else:
            score = "✅ Text response" if len(output) > 20 else "⚠️  Empty response"
            scores.append(1 if len(output) > 20 else 0)

        print(f"\nResult: {score}")
        print("-" * 60)

    total = sum(scores)
    print(f"\n📊 Evaluation Summary: {total}/{len(TEST_PROMPTS)} tests passed")
    return total / len(TEST_PROMPTS)


def interactive_mode(model, tokenizer):
    print("\n🌟 Solana Interactive Mode (type 'quit' to exit)\n")
    while True:
        instruction = input("You: ").strip()
        if instruction.lower() in ("quit", "exit", "q"):
            break
        system = "You are Solana, an expert educational AI assistant."
        output = generate(model, tokenizer, system, instruction)
        print(f"\nSolana: {output}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Solana Model Evaluation")
    parser.add_argument("--model",       required=True, help="Path to trained model")
    parser.add_argument("--interactive", action="store_true", help="Run interactive session")
    args = parser.parse_args()

    model, tokenizer = load_model(args.model)

    if args.interactive:
        interactive_mode(model, tokenizer)
    else:
        score = run_evaluation(model, tokenizer)
        print(f"\nFinal score: {score:.0%}")
