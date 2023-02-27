const commonDefinitions = {
  university: {
    type: "string",
    enum: [
      "Georgia Institute of Technology",
      "Abraham Baldwin Agricultural College",
      "Albany Medical College",
      "Albany State University",
      "Amrita University",
      "Arizona State University",
      "Armstrong State University",
      "Atlanta Metropolitan State College",
      "Auburn University",
      "Augusta University",
      "Bainbridge State College",
      "Baylor College of Medicine",
      "Baylor University",
      "Binghamton University",
      "Boston College",
      "Boston University",
      "Bowling Green State University",
      "Brandeis University",
      "Brigham Young University",
      "Brown University",
      "California Institute of Technology",
      "California State University, East Bay",
      "Carnegie Mellon University",
      "Case Western Reserve University",
      "City College of New York",
      "Clark Atlanta University",
      "Clarkson University",
      "Clayton State University",
      "Clemson University",
      "College of Coastal Georgia",
      "College of William and Mary",
      "Colorado School of Mines",
      "Colorado State University",
      "Columbia University",
      "Columbus State University",
      "Cornell University",
      "Creighton University",
      "Dalton State College",
      "Dartmouth College",
      "Darton State College",
      "Drexel University",
      "Duke University",
      "East Carolina University",
      "East Georgia State College",
      "Emory University",
      "Florida Atlantic University",
      "Florida Institute of Technology",
      "Florida International University",
      "Florida State University",
      "Fort Valley State University",
      "George Mason University",
      "George Washington University",
      "Georgetown University",
      "Georgia College & State University",
      "Georgia Gwinnett College",
      "Georgia Highlands College",
      "Georgia Southern University",
      "Georgia Southwestern State University",
      "Georgia State University",
      "Gordon State College",
      "Harvard University",
      "Harvey Mudd College",
      "Howard University",
      "Hunter College",
      "Icahn School of Medicine at Mount Sinai",
      "Illinois Institute of Technology",
      "Indiana University - Bloomington",
      "Indiana University-Purdue University Indianapolis",
      "Iowa State University",
      "Johns Hopkins University",
      "Kansas State University",
      "Kennesaw State University",
      "Kent State University",
      "Knox College",
      "Lehigh University",
      "Loma Linda University",
      "Louisiana State University",
      "Louisiana Tech University",
      "Loyola University Chicago",
      "Marquette University",
      "Massachusetts Institute of Technology",
      "Medical College of Wisconsin",
      "Medical University of South Carolina",
      "Miami University",
      "Michigan State University",
      "Michigan Technological University",
      "Middle Georgia State University",
      "Mississippi State University",
      "Missouri University of Science and Technology",
      "Montana State University",
      "Morehouse College",
      "New Jersey Institute of Technology",
      "New Mexico State University",
      "New York Medical College",
      "New York University",
      "North Carolina State University",
      "North Dakota State University",
      "Northeastern University",
      "Northern Arizona University",
      "Northern Illinois University",
      "Northwestern University",
      "Oakland University",
      "Ohio State University",
      "Ohio University",
      "Oklahoma State University",
      "Old Dominion University",
      "Oregon Health & Science University",
      "Oregon State University",
      "Pennsylvania State University",
      "Portland State University",
      "Princeton University",
      "Purdue University",
      "Queens College, City University of New York",
      "Rensselaer Polytechnic Institute",
      "Rice University",
      "Rochester Institute of Technology",
      "Rockefeller University",
      "Rush University",
      "Rutgers University",
      "Saint Louis University",
      "San Diego State University",
      "San Francisco State University",
      "Savannah State University",
      "South Georgia State College",
      "Southern Illinois University Carbondale",
      "Southern Methodist University",
      "Spelman College",
      "Stanford University",
      "Stony Brook University",
      "Syracuse University",
      "Temple University",
      "Texas A&M University",
      "Texas Tech University",
      "The Catholic University of America",
      "Thomas Jefferson University",
      "Tufts University",
      "Tulane University",
      "Uniformed Services University of the Health Sciences",
      "University at Albany, SUNY",
      "University at Buffalo",
      "University of Akron",
      "University of Alabama - Tuscaloosa",
      "University of Alabama at Birmingham",
      "University of Alabama in Huntsville",
      "University of Alaska Fairbanks",
      "University of Arizona",
      "University of Arkansas - Fayetteville",
      "University of British Columbia",
      "University of California, Berkeley",
      "University of California, Davis",
      "University of California, Irvine",
      "University of California, Los Angeles",
      "University of California, Merced",
      "University of California, Riverside",
      "University of California, San Diego",
      "University of California, San Francisco",
      "University of California, Santa Barbara",
      "University of California, Santa Cruz",
      "University of Central Florida",
      "University of Chicago",
      "University of Cincinnati",
      "University of Colorado Boulder",
      "University of Connecticut",
      "University of Dayton",
      "University of Delaware",
      "University of Denver",
      "University of Florida",
      "University of Georgia",
      "University of Hawaii at Manoa",
      "University of Houston",
      "University of Idaho",
      "University of Illinois at Chicago",
      "University of Illinois at Urbana-Champaign",
      "University of Iowa",
      "University of Kansas",
      "University of Kentucky",
      "University of Louisville",
      "University of Maine",
      "University of Maryland, Baltimore",
      "University of Maryland, Baltimore County",
      "University of Maryland, College Park",
      "University of Massachusetts Amherst",
      "University of Massachusetts Boston",
      "University of Massachusetts Lowell",
      "University of Memphis",
      "University of Miami",
      "University of Michigan",
      "University of Minnesota",
      "University of Mississippi",
      "University of Missouri-Columbia",
      "University of Missouri-Kansas City",
      "University of Missouri-St. Louis",
      "University of Montana",
      "University of Nebraska-Lincoln",
      "University of Nevada, Las Vegas",
      "University of Nevada, Reno",
      "University of New Hampshire",
      "University of New Mexico",
      "University of New Orleans",
      "University of North Carolina at Chapel Hill",
      "University of North Carolina at Charlotte",
      "University of North Carolina at Greensboro",
      "University of North Dakota",
      "University of North Georgia",
      "University of North Texas",
      "University of Notre Dame",
      "University of Oklahoma",
      "University of Oregon",
      "University of Pennsylvania",
      "University of Pittsburgh",
      "University of Rhode Island",
      "University of Rochester",
      "University of South Alabama",
      "University of South Carolina",
      "University of South Florida",
      "University of Southern California",
      "University of Southern Mississippi",
      "University of Stuttgart",
      "University of Tennessee, Knoxville",
      "University of Texas MD Anderson Cancer Center",
      "University of Texas at Arlington",
      "University of Texas at Austin",
      "University of Texas at Dallas",
      "University of Texas at El Paso",
      "University of Texas at San Antonio",
      "University of Toledo",
      "University of Toronto",
      "University of Utah",
      "University of Vermont",
      "University of Virginia",
      "University of Washington",
      "University of Waterloo",
      "University of West Georgia",
      "University of Wisconsin-Madison",
      "University of Wisconsin-Milwaukee",
      "University of Wyoming",
      "Utah State University",
      "Valdosta State University",
      "Valencia College",
      "Vanderbilt University",
      "Virginia Commonwealth University",
      "Virginia Polytechnic Institute and State University",
      "Wake Forest University",
      "Washington State University",
      "Washington University in St. Louis",
      "Wayne State University",
      "Wesleyan University",
      "West Virginia University",
      "Western Illinois University",
      "Wright State University",
      "Yale University",
      "Yeshiva University",
      "Other [United States]",
      "Other [International]",
    ],
  },
  georgiaUniversity: {
    type: "string",
    enum: [
      "Georgia Institute of Technology",
      "Georgia State University",
      "University of Georgia",
      "Emory University",
      "Savannah College of Art and Design",
      "Georgia Southern University",
      "Berry College",
      "University of North Georgia",
      "Kennesaw State University",
      "Other",
    ],
  },
  levelOfStudy: {
    type: "string",
    enum: [
      "Less than Secondary / High School",
      "Secondary / High School",
      "Undergraduate University (2 year - community college or similar)",
      "Undergraduate University (3+ year)",
      "Graduate University (Masters, Professional, Doctoral, etc)",
      "Code School / Bootcamp",
      "Other Vocational / Trade Program or Apprenticeship",
      "Post Doctorate",
      "Other",
      "I'm not currently a student",
      "Prefer not to answer",
    ],
  },
  year: {
    type: "string",
    enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+", "Master's", "PhD"],
  },
  highSchoolYear: {
    type: "string",
    enum: ["Freshman", "Sophomore", "Junior", "Senior"],
  },
  major: {
    type: "string",
    enum: [
      "Aerospace Engineering",
      "Applied Language and Intercultural Studies",
      "Applied Physics",
      "Architecture",
      "Biochemistry",
      "Biology",
      "Biomedical Engineering",
      "Business Administration",
      "Chemical and Biomolecular Engineering",
      "Chemistry",
      "Civil Engineering",
      "Computer Engineering",
      "Computational Media",
      "Computer Science",
      "Data Science",
      "Earth and Atmospheric Sciences",
      "Economics",
      "Economics and International Affairs",
      "Electrical Engineering",
      "Environmental Engineering",
      "Global Economics and Modern Languages",
      "History, Technology, and Society",
      "Industrial Design",
      "Industrial Engineering",
      "International Affairs",
      "International Affairs and Modern Language",
      "Literature, Media, and Communication",
      "Literature, Media, and Communication & Digital Media",
      "Materials Science and Engineering",
      "Mathematics",
      "Mechanical Engineering",
      "Music Technology",
      "Neuroscience",
      "Nuclear and Radiological Engineering",
      "Physics",
      "Psychology",
      "Public Policy",
    ],
  },
  ethnicity: {
    type: "string",
    enum: [
      "Non-Hispanic Caucasian",
      "Black or African American",
      "Latinx or Hispanic American",
      "South Asian or South-Asian American",
      "South-East Asian or South-East Asian American",
      "East Asian or Asian American",
      "Middle Eastern or Arab American",
      "Native American or Alaskan Native",
      "Hawaiian or Pacific Islander",
      "Prefer not to answer",
    ],
  },
  age: {
    type: "string",
    enum: ["Yes", "No"],
  },
  gender: {
    type: "string",
    enum: ["Male", "Female", "Non-Binary", "Other", "Prefer not to answer"],
  },
  marketing: {
    type: "string",
    enum: [
      "MLH",
      "Facebook",
      "Instagram",
      "Social Media (Other)",
      "Google",
      "Friend",
      "Class/Professor/TA",
      "University Relations",
      "Corporate Sponsor",
    ],
  },
  shirtSize: {
    type: "string",
    enum: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  },
  dietaryRestrictions: {
    type: "string",
    enum: ["Vegetarian", "Vegan", "Gluten Free", "Dairy Free", "No Pork", "No Beef"],
  },
  computerOS: {
    type: "string",
    enum: ["Windows", "MacOS", "Linux", "ChromeOS", "I do not have a computer", "Other"],
  },
  skills: {
    type: "string",
    enum: [
      "Android",
      "Bash",
      "C",
      "C#",
      "C++",
      "Go",
      "Hardware",
      "HTML/CSS",
      "iOS",
      "Java",
      "JavaScript",
      "Kotlin",
      "Machine Learning",
      "Node",
      "Perl",
      "PHP",
      "Python",
      "R",
      "React",
      "Robotics",
      "Ruby",
      "Rust",
      "Scala",
      "SQL",
      "Swift",
      "TypeScript",
    ],
  },
  country: {
    type: "string",
    enum: [
      "United States of America",
      "Afghanistan",
      "Albania",
      "Algeria",
      "American Samoa",
      "Andorra",
      "Angola",
      "Anguilla",
      "Antarctica",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Aruba",
      "Australia",
      "Austria",
      "Azerbaijan",
      "Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bermuda",
      "Bhutan",
      "Bolivia (Plurinational State of)",
      "Bonaire, Sint Eustatius and Saba",
      "Bosnia and Herzegovina",
      "Botswana",
      "Bouvet Island",
      "Brazil",
      "British Indian Ocean Territory",
      "Brunei Darussalam",
      "Bulgaria",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cambodia",
      "Cameroon",
      "Canada",
      "Cayman Islands",
      "Central African Republic",
      "Chad",
      "Chile",
      "China",
      "Christmas Island",
      "Cocos (Keeling) Islands",
      "Colombia",
      "Comoros",
      "Congo (the Democratic Republic of the)",
      "Congo",
      "Cook Islands",
      "Costa Rica",
      "Croatia",
      "Cuba",
      "Curaçao",
      "Cyprus",
      "Czechia",
      "Côte d'Ivoire",
      "Denmark",
      "Djibouti",
      "Dominica",
      "Dominican Republic",
      "Ecuador",
      "Egypt",
      "El Salvador",
      "Equatorial Guinea",
      "Eritrea",
      "Estonia",
      "Eswatini",
      "Ethiopia",
      "Falkland Islands [Malvinas]",
      "Faroe Islands",
      "Fiji",
      "Finland",
      "France",
      "French Guiana",
      "French Polynesia",
      "French Southern Territories",
      "Gabon",
      "Gambia",
      "Georgia",
      "Germany",
      "Ghana",
      "Gibraltar",
      "Greece",
      "Greenland",
      "Grenada",
      "Guadeloupe",
      "Guam",
      "Guatemala",
      "Guernsey",
      "Guinea",
      "Guinea-Bissau",
      "Guyana",
      "Haiti",
      "Heard Island and McDonald Islands",
      "Holy See",
      "Honduras",
      "Hong Kong",
      "Hungary",
      "Iceland",
      "India",
      "Indonesia",
      "Iran (Islamic Republic of)",
      "Iraq",
      "Ireland",
      "Isle of Man",
      "Israel",
      "Italy",
      "Jamaica",
      "Japan",
      "Jersey",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kiribati",
      "Korea (the Democratic People's Republic of)",
      "Korea (the Republic of)",
      "Kuwait",
      "Kyrgyzstan",
      "Lao People's Democratic Republic",
      "Latvia",
      "Lebanon",
      "Lesotho",
      "Liberia",
      "Libya",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Macao",
      "Madagascar",
      "Malawi",
      "Malaysia",
      "Maldives",
      "Mali",
      "Malta",
      "Marshall Islands",
      "Martinique",
      "Mauritania",
      "Mauritius",
      "Mayotte",
      "Mexico",
      "Micronesia (Federated States of)",
      "Moldova (the Republic of)",
      "Monaco",
      "Mongolia",
      "Montenegro",
      "Montserrat",
      "Morocco",
      "Mozambique",
      "Myanmar",
      "Namibia",
      "Nauru",
      "Nepal",
      "Netherlands",
      "New Caledonia",
      "New Zealand",
      "Nicaragua",
      "Niger",
      "Nigeria",
      "Niue",
      "Norfolk Island",
      "Northern Mariana Islands",
      "Norway",
      "Oman",
      "Pakistan",
      "Palau",
      "Palestine, State of",
      "Panama",
      "Papua New Guinea",
      "Paraguay",
      "Peru",
      "Philippines",
      "Pitcairn",
      "Poland",
      "Portugal",
      "Puerto Rico",
      "Qatar",
      "Republic of North Macedonia",
      "Romania",
      "Russian Federation",
      "Rwanda",
      "Réunion",
      "Saint Barthélemy",
      "Saint Helena, Ascension and Tristan da Cunha",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Martin (French part)",
      "Saint Pierre and Miquelon",
      "Saint Vincent and the Grenadines",
      "Samoa",
      "San Marino",
      "Sao Tome and Principe",
      "Saudi Arabia",
      "Senegal",
      "Serbia",
      "Seychelles",
      "Sierra Leone",
      "Singapore",
      "Sint Maarten (Dutch part)",
      "Slovakia",
      "Slovenia",
      "Solomon Islands",
      "Somalia",
      "South Africa",
      "South Georgia and the South Sandwich Islands",
      "South Sudan",
      "Spain",
      "Sri Lanka",
      "Sudan",
      "Suriname",
      "Svalbard and Jan Mayen",
      "Sweden",
      "Switzerland",
      "Syrian Arab Republic",
      "Taiwan",
      "Tajikistan",
      "Tanzania, United Republic of",
      "Thailand",
      "Timor-Leste",
      "Togo",
      "Tokelau",
      "Tonga",
      "Trinidad and Tobago",
      "Tunisia",
      "Turkey",
      "Turkmenistan",
      "Turks and Caicos Islands",
      "Tuvalu",
      "Uganda",
      "Ukraine",
      "United Arab Emirates",
      "United Kingdom of Great Britain and Northern Ireland",
      "United States Minor Outlying Islands",
      "Uruguay",
      "Uzbekistan",
      "Vanuatu",
      "Venezuela (Bolivarian Republic of)",
      "Viet Nam",
      "Virgin Islands (British)",
      "Virgin Islands (U.S.)",
      "Wallis and Futuna",
      "Western Sahara",
      "Yemen",
      "Zambia",
      "Zimbabwe",
    ],
  },
};

export default commonDefinitions;
