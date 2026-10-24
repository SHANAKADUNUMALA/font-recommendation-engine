import yaml
import os

# Locate and load the YAML configuration file
current_dir = os.path.dirname(os.path.abspath(__file__))
yaml_path = os.path.join(current_dir, "design_rules.yaml")

# Read the file and create the DESIGN_RULES dictionary
with open(yaml_path, "r") as file:
    DESIGN_RULES = yaml.safe_load(file)

# (If you had any other existing code in config.py, leave it below this)