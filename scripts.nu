#! /usr/bin/env nu

let ROOT = $env._ | path dirname 

def main [] {
  
}

# render .tex.mustache file and place the output file into output dir
def "main render" [
  schema: path # JSON Resume shcema file path
  ...files: glob       # Files to render
  --output-dir (-o): path   # Output directory
  --preprocess (-p): path   # Typescript file with a default function for pre-processing JSON Resume schema before building the assets
  --asset (-a): glob        # Path to a file or folder to be included in the build of the output assets
] {
  # print $"Files: ($files)"
  # print $"output-dir: ($output_dir)"
  # print $"Schema: ($schema)"

  # "$ROOT"/scripts/render.ts
}

def "main render default" [] {

  # ./scripts/render.ts ./assets/resume.json ./assets/resume.tex.mustache
}