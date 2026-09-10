#! /usr/bin/env nu

let ROOT = $env.PROCESS_PATH | path dirname 

def main [] {
}

def "main docker build" [] {
  ^$"($ROOT)/docker/build.sh"
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

# render .tex file with a resume and place the output file into output dir
def "main render" [
  ...files: glob             # Files to render
  --output-dir (-o): path    # Output directory
  --preprocess (-p): path    # Typescript file with a default function for pre-processing JSON Resume schema before building the assets
  --assets (-a): list<glob>  # Path to a file or folder to be included in the build of the output assets
  --json (-j): path          # Path to JSON file to attach data to rendering
  --json-resume (-r): path   # Path to JSON Resume file to attach data to rendering
  --markdown (-m): path      # Path to Markdown file to attach data to rendering
] {
  let file_paths: list<path> = $files | each { |it| glob $it } | flatten
  # let output_dir: string = $output_dir | default  $"($ROOT)/dist/"

  # # clean-output $output_dir

  # if not ($output_dir | path exists ) {
  #   mkdir $output_dir
  # }

  # for asset in $assets {
  #   cp -r $asset $output_dir
  # }

  # let render_params = [
  #   "-o", $output_dir,
  #   ...(
  #     if ($preprocess | is-not-empty) { 
  #       ["--preprocess", $preprocess] 
  #     } else { 
  #       [] 
  #     }
  #   ),
  #   ...(
  #     if ($json_resume | is-not-empty) { 
  #       ["--json-resume", $json_resume] 
  #     } else { 
  #       [] 
  #     }
  #   ),
  #   ...(
  #     if ($markdown | is-not-empty) { 
  #       ["--markdown", $markdown] 
  #     } else { 
  #       [] 
  #     }
  #   ),
  #   ...$file_paths
  # ]
  # ^$"($ROOT)/scripts/render.ts" ...$render_params

  print ...$file_paths

  # let target_files = glob $"($ROOT)/dist/*.tex" | each { path basename }
  # main docker run xelatex "--shell-escape" ...$target_files
}

# render .tex file with a resume and place the output file into output dir 
# with default parameters and options
def "main render resume" [] {
  (
    main render
    --output-dir $"($ROOT)/dist"
    --preprocess $"($ROOT)/assets/prepare-resume.ts"
    --json-resume $"($ROOT)/assets/resume.json"
    --assets [
      $"($ROOT)/assets/icons",
      $"($ROOT)/assets/resume.json",
    ]
    $"($ROOT)/assets/resume.ejs.tex"
  )
}

###############################################################################
# Helpers
###############################################################################

def clean-output [
  output_dir: path
] {
  if (
    ($output_dir | path exists) 
    and (ls $output_dir | is-not-empty)
  ) {
    rm -r ...(glob $"($output_dir)/*")
  }
}