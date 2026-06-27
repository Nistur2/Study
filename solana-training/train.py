#!/usr/bin/env python3
"""
Solana AI Training Module
Fine-tunes open-source LLMs on custom educational datasets using LoRA/QLoRA.
Supports: Llama 3, Qwen, Mistral, Gemma, Phi and any HuggingFace-compatible model.

Usage:
  python train.py --base-model meta-llama/Llama-3.2-3B-Instruct --epochs 3
  python train.py --resume-from /app/trained-models/solana-20240101-120000
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    BitsAndBytesConfig,
    EarlyStoppingCallback,
)
from peft import LoraConfig, get_peft_model, TaskType, PeftModel
from trl import SFTTrainer
from accelerate import Accelerator


def print_banner():
    print("\n" + "=" * 60)
    print("   🌟 SOLANA AI TRAINING MODULE")
    print("=" * 60 + "\n")


def load_datasets(dataset_dir: str) -> Dataset:
    """Load all JSONL files from the dataset directory."""
    all_data = []
    dataset_path = Path(dataset_dir)

    for f in sorted(dataset_path.glob("*.jsonl")):
        print(f"  Loading: {f.name}")
        with open(f, "r", encoding="utf-8") as fp:
            for line in fp:
                line = line.strip()
                if line:
                    try:
                        all_data.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        print(f"  Warning: Skipping malformed line in {f.name}: {e}")

    if not all_data:
        print(f"❌ No JSONL files found in {dataset_dir}")
        print("   Expected format: {\"instruction\": \"...\", \"output\": \"...\", \"system\": \"...\"}")
        sys.exit(1)

    print(f"  ✅ Loaded {len(all_data)} training examples\n")
    return Dataset.from_list(all_data)


def format_prompt(example: dict) -> dict:
    """Format a dataset example into Solana's instruction-following format."""
    system = example.get("system", "You are Solana, an expert educational AI assistant.")
    instruction = example.get("instruction", "")
    output = example.get("output", "")

    text = (
        f"<|system|>\n{system}\n"
        f"<|user|>\n{instruction}\n"
        f"<|assistant|>\n{output}"
    )
    return {"text": text}


def train(args):
    print_banner()
    print(f"  Base model  : {args.base_model}")
    print(f"  Dataset dir : {args.dataset_dir}")
    print(f"  Output dir  : {args.output_dir}")
    print(f"  Epochs      : {args.epochs}")
    print(f"  QLoRA       : {args.use_qlora}")
    print(f"  LoRA rank   : {args.lora_r}")
    print()

    # ── Load dataset ──────────────────────────────────────────────────────────
    print("📂 Loading dataset...")
    dataset = load_datasets(args.dataset_dir)
    dataset = dataset.map(format_prompt, remove_columns=dataset.column_names)

    # ── Quantization config (QLoRA) ───────────────────────────────────────────
    bnb_config = None
    if args.use_qlora and torch.cuda.is_available():
        print("⚡ Using QLoRA (4-bit quantization)...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
    else:
        print("💻 Running on CPU / full precision...")

    # ── Load tokenizer ────────────────────────────────────────────────────────
    print(f"🔤 Loading tokenizer: {args.base_model}")
    tokenizer = AutoTokenizer.from_pretrained(
        args.base_model,
        trust_remote_code=True,
        token=os.getenv("HF_TOKEN"),
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # ── Load model ────────────────────────────────────────────────────────────
    print(f"🧠 Loading model: {args.base_model}")
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=bnb_config,
        device_map="auto" if torch.cuda.is_available() else "cpu",
        trust_remote_code=True,
        token=os.getenv("HF_TOKEN"),
    )
    model.config.use_cache = False

    # ── LoRA configuration ────────────────────────────────────────────────────
    print("🔧 Applying LoRA adapters...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ── Output path ───────────────────────────────────────────────────────────
    run_name    = f"solana-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    output_path = os.path.join(args.output_dir, run_name)
    os.makedirs(output_path, exist_ok=True)

    # ── Training arguments ────────────────────────────────────────────────────
    training_args = TrainingArguments(
        output_dir=output_path,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        fp16=torch.cuda.is_available(),
        bf16=False,
        optim="paged_adamw_8bit" if bnb_config else "adamw_torch",
        save_strategy="epoch",
        save_total_limit=3,
        logging_steps=10,
        warmup_ratio=0.05,
        lr_scheduler_type="cosine",
        dataloader_num_workers=2,
        report_to="none",
        run_name=run_name,
        load_best_model_at_end=False,
    )

    # ── Trainer ───────────────────────────────────────────────────────────────
    print("\n🚀 Starting training...\n")
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        tokenizer=tokenizer,
        packing=False,
    )

    if args.resume_from:
        print(f"  Resuming from checkpoint: {args.resume_from}")
        trainer.train(resume_from_checkpoint=args.resume_from)
    else:
        trainer.train()

    # ── Save ─────────────────────────────────────────────────────────────────
    print(f"\n💾 Saving model to: {output_path}")
    trainer.save_model(output_path)
    tokenizer.save_pretrained(output_path)

    # Save metadata
    meta = {
        "run_name": run_name,
        "base_model": args.base_model,
        "epochs": args.epochs,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "training_examples": len(dataset),
        "timestamp": datetime.now().isoformat(),
    }
    with open(os.path.join(output_path, "solana_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ Solana training complete!")
    print(f"   Model saved to: {output_path}")
    print(f"\n   To deploy: set OLLAMA_MODEL to point at this checkpoint")
    print(f"   or use: ollama create solana -f Modelfile\n")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Solana AI Training")
    parser.add_argument("--base-model",    default="meta-llama/Llama-3.2-3B-Instruct", help="HuggingFace base model")
    parser.add_argument("--dataset-dir",   default="/app/datasets",                     help="Directory containing JSONL datasets")
    parser.add_argument("--output-dir",    default="/app/trained-models",               help="Directory to save trained models")
    parser.add_argument("--epochs",        type=int,   default=3)
    parser.add_argument("--batch-size",    type=int,   default=2)
    parser.add_argument("--grad-accum",    type=int,   default=4)
    parser.add_argument("--lr",            type=float, default=2e-4)
    parser.add_argument("--lora-r",        type=int,   default=16)
    parser.add_argument("--lora-alpha",    type=int,   default=32)
    parser.add_argument("--lora-dropout",  type=float, default=0.05)
    parser.add_argument("--max-seq-length",type=int,   default=2048)
    parser.add_argument("--use-qlora",     action="store_true", default=True)
    parser.add_argument("--resume-from",   default=None, help="Resume from checkpoint path")
    args = parser.parse_args()
    train(args)
