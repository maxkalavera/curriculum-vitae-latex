#! /usr/bin/env nu

let ROOT = $env.PROCESS_PATH | path dirname 

def main [] {
}

def "main docker build" [] {
  ^$"($ROOT)/docker/build.sh"
}

def "main docker into" [] {
  ^$"($ROOT)/docker/into.sh"
}

def "main docker run" [
  ...args: string
] {
  let build_flag = (
    docker images --format "{{.Repository}}"
    | lines
    | where { |it| $it == "tinytex" }
    | is-empty
  )

  if ($build_flag) {
    print "=> building docker image..."
    main docker build
  }
  print $"=> Running command: ($args)"
  ^$"($ROOT)/docker/run.sh" ...$args
}

def "main clean" [
  --output-dir (-o): path  # Output dir to remove (default: ./dir)
] {
  clean-output $output_dir
}

# render .tex file with a resume and place the output file into output dir
def "main render" [
  ...targets: glob           # Files to render
  --output-dir (-o): path    # Output directory
  --preprocess (-p): path    # Typescript file with a default function for pre-processing JSON Resume schema before building the assets
  --assets (-a): list<glob>  # Path to a file or folder to be included in the build of the output assets
  --json (-j): path          # Path to JSON file to attach data to rendering
  --json-resume (-r): path   # Path to JSON Resume file to attach data to rendering
  --markdown (-m): path      # Path to Markdown file to attach data to rendering
] {
  let files: list<path> = $targets | each { |it| glob $it } | flatten
  let output_dir: string = $output_dir | default  $"($ROOT)/dist/"

  if not ($output_dir | path exists ) {
    mkdir $output_dir
  }

  for asset in $assets {
    cp -r $asset $output_dir
  }

  let render_params = [
    "-o", $output_dir,
    ...(ternary  ($preprocess | is-not-empty) 
      ["--preprocess", $preprocess] 
      []
    ),
    ...(ternary  ($json_resume | is-not-empty) 
      ["--json-resume", $json_resume] 
      []
    ),
    ...(ternary  ($markdown | is-not-empty) 
      ["--markdown", $markdown] 
      []
    ),
    ...$files
  ]
  ^$"($ROOT)/scripts/render.ts" ...$render_params

  let files_output = (
    $files 
    | each { | file | path join ($output_dir) ($file | path basename)  }
  )

  let files_output = $files_output 
    | each { | file |
      let next_file = (remove-extension $file "ejs")
      mv $file $next_file
      $next_file
    }

  let for_compiling_targets = $files_output | each { path basename }
  # main docker run xelatex "--shell-escape" ...$for_compiling_targets
  main docker run "latexmk" "-xelatex" "--shell-escape" ...$for_compiling_targets
  clean-build $output_dir
}

# render .tex file with resume and place the output file into output dir 
def "main render resume" [] {
  (
    main render
    --output-dir $"($ROOT)/dist"
    --preprocess $"($ROOT)/assets/prepare-resume.ts"
    --assets [$"($ROOT)/assets/resume.json"]
    --json-resume $"($ROOT)/assets/resume.json"
    $"($ROOT)/assets/resume.ejs.tex"
  )
}

# render .tex file with cover letter and place the output file into output dir 
def "main render cover" [] {
  (
    main render
    --output-dir $"($ROOT)/dist"
    --preprocess $"($ROOT)/assets/prepare-cover.ts"
    --markdown $"($ROOT)/assets/cover.md"
    $"($ROOT)/assets/cover.ejs.tex"
  )
}

def "main render all" [] {
  main render resume
  main render cover
}

###############################################################################
# Helpers
###############################################################################

def ternary [
  predicate: bool
  truthy: any
  falsy: any
] {
  if ($predicate) { $truthy } else { $falsy }
}

def clean-build [
  target_dir: path
] {
  if ( not ($target_dir | path exists) ) {
    return
  }

  main docker run "latexmk" "-c"
  rm --recursive ...(glob $"($target_dir)/_markdown_*")
  rm ...(glob $"($target_dir)/*.luabridge.lua")
  rm ...(glob $"($target_dir)/*.markdown.in")
  print "🧹 cleaned all artifacts"

}

def remove-extension [
  target: path
  extension: string
] {
  $target 
  | path basename 
  | split row "." 
  | where { |it| $it != $extension }
  | str join "."
  | path join ($target | path dirname) $in
}