#my own
import re
from bs4 import BeautifulSoup

def extract_prerequisites(html_file_path):
    """
    Extract prerequisite information from HTML course file.
    Returns None if no prerequisites found, otherwise returns text after 'Prerequisite(s):'
    """
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find the coursedescadditional div
        desc_div = soup.find('div', class_='coursedescadditional')
        if not desc_div:
            return None
        
        # Get the HTML content as string
        html_string = str(desc_div)
        
        # Find everything from Prerequisite(s): to the next <br
        prerequisite_match = re.search(r'Prerequisite\(s\): (.*?)<br', html_string)
        
        if prerequisite_match:
            prerequisite_html = prerequisite_match.group(1).strip()
            # Parse the HTML to get clean text
            soup_prereq = BeautifulSoup(prerequisite_html, 'html.parser')
            prerequisite_text = soup_prereq.get_text().strip()
            # Replace non-breaking spaces with regular spaces
            prerequisite_text = prerequisite_text.replace('\xa0', ' ')
            return prerequisite_text if prerequisite_text else None
        
        return None
        
    
    except Exception as e:
        print(f"Error processing {html_file_path}: {e}")
        return None 

class Course:
    def __init__(self, name, code):
        self.name = name
        self.code = code

    @staticmethod
    def isCourseName(name):
        if name.lower() in ["acse", "aero", "arcc", "arch", "arcn", "biol", "biom", "ccdp", "cdns", "chem", "cive", "comp", "coop", "csec", "econ", "ecor", "elec", "enve", "erth", "esla", "geog", "geom", "maae", "math", "mech", "mect", "phys", "sree", "stat", "sysc"]:
            return True
        return False

    def __str__(self):
        return f"{self.name}{self.code}"

    def __repr__(self):
        return f"{self.name}{self.code}"


class Status:
    def __init__(self, year):
        if year == "1":
            self.year = "FIRST"
        if year == "2":
            self.year = "SECOND"
        if year == "3":
            self.year = "THIRD"
        if year == "4":
            self.year = "FOURTH"


    def __repr__(self) -> str:
        return f"{self.year}"

    def __str__(self) -> str:
        return f"{self.year}"


class Operator:
    operators = ["or", "and"] 

    def __init__(self, text):
        if text.lower() in Operator.operators:
            self.text = text.lower()
        else:
            raise Exception("Operator not defined")

    def __str__(self) -> str:
        return f"{self.text}"

    def __repr__(self) -> str:
        return f"{self.text}"

class Group:
    courses = []

    def __init__(self, _courses):
        self.courses = _courses

    def add_course (self, course):
        self.courses.append(course)
    

class Analyzer:
    tokens = ["(", ")", ",", ";", "."]

    def splitter(self, text):
        i=0
        ll = len(text)
        s = []
        word = ""
        for i in range(ll):
            if text[i]==" ":
                if len(word)>0:
                    s.append(word)
                    word = ""
            elif text[i] in Analyzer.tokens:
                if len(word)>0:
                    s.append(word)
                    word=""
                    s.append(text[i])
                else:
                    s.append(text[i])
            else:
                word+= text[i]
        if len(word)>0:
            s.append(word)
            word=""
        return s
            


mynal = Analyzer()
# print(Analyzer.splitter(extract_prerequisites("courses/sysc/sysc2100.html")))
mytext = extract_prerequisites("courses/sysc/sysc2100.html")
print(mynal.splitter(mytext))

