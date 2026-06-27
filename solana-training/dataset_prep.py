#!/usr/bin/env python3
"""
Solana Dataset Preparation Tool
Converts raw educational content into JSONL training format for Solana fine-tuning.

Usage:
  python dataset_prep.py --input /app/datasets/raw --output /app/datasets/train.jsonl
  python dataset_prep.py --generate-sample --output /app/datasets/sample.jsonl
"""

import json
import argparse
from pathlib import Path


SAMPLE_DATASET = [
    {
        "system": "You are Solana, an expert educational AI. Generate a quiz from the document excerpts.",
        "instruction": "Generate a 5-question multiple choice quiz about the Philippine Civil Service Exam based on this text: The Career Service examination has two categories: Professional and Sub-Professional levels. The Professional level covers positions requiring a college degree.",
        "output": json.dumps({
            "title": "Philippine Civil Service Exam Quiz",
            "questions": [
                {
                    "id": 1,
                    "question": "How many categories does the Career Service examination have?",
                    "options": ["A. One", "B. Two", "C. Three", "D. Four"],
                    "answer": "B",
                    "explanation": "The Career Service examination has two categories: Professional and Sub-Professional levels.",
                    "source": "Introduction section"
                }
            ]
        })
    },
    {
        "system": "You are Solana, an expert educational AI. Generate structured study notes.",
        "instruction": "Create study notes from this content: The writ of habeas corpus prevents persons from being arrested without warrants. The 1987 Philippine Constitution protects this right under Article III.",
        "output": json.dumps({
            "title": "Habeas Corpus — Study Notes",
            "summary": "The writ of habeas corpus is a constitutional protection against unlawful detention under the 1987 Philippine Constitution.",
            "sections": [
                {
                    "heading": "What is Habeas Corpus?",
                    "content": "A legal remedy requiring authorities to justify the detention of a person.",
                    "keyPoints": ["Prevents unlawful arrest", "Protected under Article III", "Can be suspended during invasion or rebellion"],
                    "source": "Article III, 1987 Constitution"
                }
            ],
            "keyTerms": [
                {"term": "Habeas Corpus", "definition": "A writ requiring a person under arrest to be brought before a judge."}
            ]
        })
    },
    {
        "system": "You are Solana, the AI tutor of StudyAI. Answer the student's question based on the document.",
        "instruction": "The document says: 'The president has 30 days to veto a bill.' Student asks: How long does the president have to veto a bill?",
        "output": "Based on the document, the President has **30 days** to communicate a veto after receiving the bill. If no veto is issued within that period, the bill automatically becomes law. This is found in Article VI, Section 27 of the Philippine Constitution."
    },
    {
        "system": "You are Solana, an expert educational AI. Generate flashcards.",
        "instruction": "Create 3 flashcards about: Naturalization is the legal process by which a foreign national acquires citizenship. Requirements include 10 years of residence and good moral character.",
        "output": json.dumps({
            "title": "Philippine Citizenship Flashcards",
            "cards": [
                {"id": 1, "front": "Naturalization", "back": "Legal process by which a foreigner acquires citizenship.", "source": "Citizenship section"},
                {"id": 2, "front": "Residence requirement for naturalization", "back": "10 years of continuous residence in the Philippines.", "source": "Citizenship section"},
                {"id": 3, "front": "Moral requirement for naturalization", "back": "Good moral character as assessed by the court.", "source": "Citizenship section"}
            ]
        })
    },
]


def convert_raw_to_jsonl(input_dir: str, output_file: str):
    """Convert raw text files into training JSONL format."""
    input_path = Path(input_dir)
    examples = []

    for f in input_path.glob("*.txt"):
        content = f.read_text(encoding="utf-8")[:3000]
        stem = f.stem.replace("_", " ").title()

        # Generate multiple training examples per document
        examples.append({
            "system": "You are Solana, an expert educational AI. Generate structured study notes.",
            "instruction": f"Generate study notes from this content about {stem}:\n{content}",
            "output": f"[Study notes for {stem} based on the provided content]"
        })

        examples.append({
            "system": "You are Solana, the AI tutor of StudyAI.",
            "instruction": f"The document is about {stem}. A student asks: Can you summarize the key points?",
            "output": f"Based on the document about {stem}, here are the key points: [summary of content]"
        })

    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as fp:
        for ex in examples:
            fp.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"✅ Created {len(examples)} training examples → {output_file}")


def generate_sample(output_file: str):
    """Write sample training data to a JSONL file."""
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as fp:
        for ex in SAMPLE_DATASET:
            fp.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"✅ Sample dataset written: {output_file} ({len(SAMPLE_DATASET)} examples)")
    print("\nDataset format (JSONL):")
    print('  {"system": "...", "instruction": "...", "output": "..."}')
    print("\nAdd more .jsonl files to /app/datasets/ and run training.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Solana Dataset Preparation")
    parser.add_argument("--input",           default=None, help="Raw text input directory")
    parser.add_argument("--output",          default="/app/datasets/training.jsonl")
    parser.add_argument("--generate-sample", action="store_true", help="Write sample dataset")
    args = parser.parse_args()

    if args.generate_sample:
        generate_sample(args.output)
    elif args.input:
        convert_raw_to_jsonl(args.input, args.output)
    else:
        print("Use --generate-sample or --input <dir>")
