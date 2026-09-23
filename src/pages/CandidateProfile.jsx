import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineCamera,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineIdentification,
  HiOutlineBriefcase,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineBuildingOffice2,
  HiOutlineSparkles,
  HiOutlineAcademicCap,
  HiOutlineLanguage,
  HiOutlineFolderOpen,
  HiOutlineLink,
  HiOutlineCheckCircle,
  HiOutlineListBullet,
  HiOutlineExclamationCircle,
  HiOutlineChevronUp,
} from "react-icons/hi2";
import CandidateLayout from "../layouts/CandidateLayout";
import { getMyProfile, updateMyProfile, uploadProfilePicture, uploadProfileDocument, deleteProfileDocument, uploadOtherDocument, deleteOtherDocument } from "../services/userService";
import { setCachedProfilePicture } from "../utils/profileCache";
import { useToast } from "../context/ToastContext";

const FILE_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");
const EDUCATION_LEVELS = ["School", "Intermediate", "Undergraduate", "Master", "PhD"];
const EXPERIENCE_OPTIONS = Array.from({ length: 21 }, (_, i) => i);
const PROFILE_READY_THRESHOLD = 75;
const PROFESSION_OPTIONS = [
  "Software Developer", "Web Developer", "Mobile App Developer", "Data Analyst", "Data Scientist",
  "Product Manager", "Project Manager", "UI/UX Designer", "Graphic Designer", "Accountant",
  "Digital Marketer", "Sales Executive", "Human Resources Specialist", "Business Analyst", "Teacher",
  "Content Writer", "Customer Support Specialist", "Civil Engineer", "Electrical Engineer", "Doctor",
  "Nurse", "Lawyer", "Architect", "Consultant", "Entrepreneur", "Other",
];
const EMPLOYMENT_STATUS_OPTIONS = ["Employed", "Self-employed", "Freelancer", "Student", "Unemployed", "Retired"];
const AVAILABILITY_OPTIONS = ["Available for work", "Busy", "Unavailable"];
const CURRENCY_BY_COUNTRY = {
  Pakistan: "PKR", India: "INR", Bangladesh: "BDT", "United States": "USD", Canada: "CAD", Australia: "AUD",
  "United Kingdom": "GBP", "United Arab Emirates": "AED", "Saudi Arabia": "SAR", Malaysia: "MYR", Qatar: "QAR",
  Germany: "EUR", France: "EUR", Italy: "EUR", Spain: "EUR", Netherlands: "EUR", Portugal: "EUR", Ireland: "EUR",
};
const CURRENCY_BY_NATIONALITY = { Pakistani: "PKR", Indian: "INR", Bangladeshi: "BDT", American: "USD", British: "GBP", Emirati: "AED", "Saudi Arabian": "SAR" };

function getSalaryCurrency(profile) {
  return CURRENCY_BY_COUNTRY[profile.country] || CURRENCY_BY_NATIONALITY[profile.nationality] || profile.salaryCurrency || "PKR";
}

const emptyExp = { title: "", company: "", startDate: "", endDate: "", description: "" };
const emptyEdu = { level: "Undergraduate", institution: "", degree: "", startDate: "", endDate: "" };

// Fields that count towards the "Profile completion" widget, grouped by
// section so each section header can show its own status pill and the
// completion card can build a flat "missing requirements" list.
function getCompletionSections(profile) {
  const bioLen = (profile.bio || "").trim().length;
  const hasEduLevel = (profile.education || []).some((e) => e.level);
  return [
    {
      key: "basicInfo", number: 1, title: "Basic information", sectionId: "section-basic-info", icon: HiOutlineIdentification,
      checks: [
        { label: "Add your full name.", done: !!profile.name },
        { label: "Add your mobile number.", done: !!profile.phone },
        { label: "Choose your gender.", done: !!profile.gender },
        { label: "Choose your nationality.", done: !!profile.nationality },
        { label: "Add your date of birth.", done: !!profile.dateOfBirth },
        { label: "Choose your country and city.", done: !!(profile.country && profile.city) },
      ],
    },
    {
      key: "professional", number: 2, title: "Professional information", sectionId: "section-professional", icon: HiOutlineBriefcase,
      checks: [
        { label: "Add your professional title.", done: !!profile.professionalTitle },
        { label: "Choose your primary profession.", done: !!profile.primaryProfession },
        { label: "Add your years of experience.", done: profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null && profile.yearsOfExperience !== "" },
        { label: "Choose your employment status.", done: !!profile.currentEmploymentStatus },
      ],
    },
    {
      key: "about", number: 3, title: "About you", sectionId: "section-about", icon: HiOutlineChatBubbleBottomCenterText,
      checks: [
        { label: `Write at least 100 characters (currently ${bioLen}).`, done: bioLen >= 100 },
      ],
    },
    {
      key: "experience", number: 4, title: "Work experience", sectionId: "section-experience", icon: HiOutlineBuildingOffice2,
      checks: [
        { label: "Add at least one work experience entry.", done: (profile.workExperience || []).length > 0 },
      ],
    },
    {
      key: "skills", number: 5, title: "Skills", sectionId: "section-skills", icon: HiOutlineSparkles,
      checks: [
        { label: "Add at least one skill.", done: (profile.skills || []).length > 0 },
      ],
    },
    {
      key: "education", number: 6, title: "Education", sectionId: "section-education", icon: HiOutlineAcademicCap,
      checks: [
        { label: "Add at least one education entry.", done: (profile.education || []).length > 0 },
        { label: "Choose your education level.", done: hasEduLevel },
      ],
    },
    {
      key: "documents", number: 7, title: "Documents", sectionId: "section-documents", icon: HiOutlineDocumentText,
      checks: [
        { label: "Upload your national ID or residency permit for verification.", done: !!profile.documents?.nationalId?.originalName },
      ],
    },
  ];
}

// Sections that don't affect the completion percentage — still get the
// same icon/title header treatment, just tagged "Optional" instead of a
// section number and status pill (Languages, Other documents, Portfolio & Social).

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Next.js", "Node.js", "Express.js",
  "Python", "Java", "C++", "C#", "PHP", "Go", "Ruby", "SQL", "MongoDB", "PostgreSQL",
  "AWS", "Azure", "Docker", "Kubernetes", "Git", "REST APIs", "GraphQL", "HTML", "CSS",
  "Tailwind CSS", "Figma", "UI/UX Design", "Graphic Design", "Product Design", "Data Analysis",
  "Machine Learning", "Artificial Intelligence", "Cybersecurity", "Project Management", "Agile",
  "Digital Marketing", "SEO", "Content Writing", "Communication", "Leadership", "Problem Solving",
];

const LANGUAGE_OPTIONS = [
  "English", "Urdu", "Hindi", "Punjabi", "Arabic", "Bengali", "Pashto", "Sindhi", "Persian",
  "French", "German", "Spanish", "Italian", "Portuguese", "Turkish", "Chinese", "Japanese",
  "Korean", "Russian", "Malay", "Tamil", "Telugu", "Gujarati", "Marathi", "Nepali",
  "Dutch", "Greek", "Hebrew", "Swedish", "Norwegian", "Danish", "Polish", "Ukrainian",
  "Albanian", "Amharic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bosnian",
  "Bulgarian", "Burmese", "Catalan", "Cebuano", "Croatian", "Czech", "Estonian", "Filipino",
  "Finnish", "Galician", "Georgian", "Haitian Creole", "Hungarian", "Icelandic", "Indonesian",
  "Irish", "Kazakh", "Khmer", "Kurdish", "Kyrgyz", "Lao", "Latvian", "Lithuanian", "Luxembourgish",
  "Macedonian", "Malagasy", "Malayalam", "Maltese", "Mongolian", "Pashto", "Romanian", "Serbian",
  "Slovak", "Slovenian", "Somali", "Swahili", "Tajik", "Thai", "Turkmen", "Uzbek", "Vietnamese",
  "Welsh", "Yoruba", "Zulu",
];

const COUNTRY_OPTIONS = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const NATIONALITY_BY_COUNTRY = {
  Afghanistan: "Afghan", Albania: "Albanian", Algeria: "Algerian", Andorra: "Andorran", Angola: "Angolan", Argentina: "Argentinian", Armenia: "Armenian", Australia: "Australian", Austria: "Austrian", Azerbaijan: "Azerbaijani",
  Bahamas: "Bahamian", Bahrain: "Bahraini", Bangladesh: "Bangladeshi", Barbados: "Barbadian", Belarus: "Belarusian", Belgium: "Belgian", Belize: "Belizean", Bhutan: "Bhutanese", Bolivia: "Bolivian", Bosnia: "Bosnian", Botswana: "Motswana", Brazil: "Brazilian", Brunei: "Bruneian", Bulgaria: "Bulgarian", Burundi: "Burundian",
  Cambodia: "Cambodian", Cameroon: "Cameroonian", Canada: "Canadian", Chad: "Chadian", Chile: "Chilean", China: "Chinese", Colombia: "Colombian", Comoros: "Comorian", Croatia: "Croatian", Cuba: "Cuban", Cyprus: "Cypriot", Czechia: "Czech",
  Denmark: "Danish", Djibouti: "Djiboutian", Dominica: "Dominican", Ecuador: "Ecuadorian", Egypt: "Egyptian", Eritrea: "Eritrean", Estonia: "Estonian", Ethiopia: "Ethiopian", Fiji: "Fijian", Finland: "Finnish", France: "French", Georgia: "Georgian", Germany: "German", Ghana: "Ghanaian", Greece: "Greek", Guatemala: "Guatemalan", Guinea: "Guinean", Guyana: "Guyanese",
  Haiti: "Haitian", Honduras: "Honduran", Hungary: "Hungarian", Iceland: "Icelandic", India: "Indian", Indonesia: "Indonesian", Iran: "Iranian", Iraq: "Iraqi", Ireland: "Irish", Israel: "Israeli", Italy: "Italian", Jamaica: "Jamaican", Japan: "Japanese", Jordan: "Jordanian",
  Kazakhstan: "Kazakhstani", Kenya: "Kenyan", Kuwait: "Kuwaiti", Kyrgyzstan: "Kyrgyzstani", Laos: "Laotian", Latvia: "Latvian", Lebanon: "Lebanese", Libya: "Libyan", Lithuania: "Lithuanian", Luxembourg: "Luxembourgish", Madagascar: "Malagasy", Malawi: "Malawian", Malaysia: "Malaysian", Maldives: "Maldivian", Mali: "Malian", Malta: "Maltese", Mauritius: "Mauritian", Mexico: "Mexican", Moldova: "Moldovan", Monaco: "Monegasque", Mongolia: "Mongolian", Montenegro: "Montenegrin", Morocco: "Moroccan", Mozambique: "Mozambican", Myanmar: "Burmese",
  Namibia: "Namibian", Nepal: "Nepali", Netherlands: "Dutch", "New Zealand": "New Zealander", Nicaragua: "Nicaraguan", Niger: "Nigerien", Nigeria: "Nigerian", "North Korea": "North Korean", "North Macedonia": "Macedonian", Norway: "Norwegian", Oman: "Omani", Pakistan: "Pakistani", Palestine: "Palestinian", Panama: "Panamanian", "Papua New Guinea": "Papua New Guinean", Paraguay: "Paraguayan", Peru: "Peruvian", Philippines: "Filipino", Poland: "Polish", Portugal: "Portuguese", Qatar: "Qatari", Romania: "Romanian", Russia: "Russian", Rwanda: "Rwandan",
  "Saudi Arabia": "Saudi Arabian", Senegal: "Senegalese", Serbia: "Serbian", Singapore: "Singaporean", Slovakia: "Slovak", Slovenia: "Slovenian", Somalia: "Somali", "South Africa": "South African", "South Korea": "South Korean", Spain: "Spanish", "Sri Lanka": "Sri Lankan", Sudan: "Sudanese", Sweden: "Swedish", Switzerland: "Swiss", Syria: "Syrian", Taiwan: "Taiwanese", Tajikistan: "Tajikistani", Tanzania: "Tanzanian", Thailand: "Thai", Tunisia: "Tunisian", Turkey: "Turkish", Turkmenistan: "Turkmen", Uganda: "Ugandan", Ukraine: "Ukrainian", "United Arab Emirates": "Emirati", "United Kingdom": "British", "United States": "American", Uruguay: "Uruguayan", Uzbekistan: "Uzbek", Venezuela: "Venezuelan", Vietnam: "Vietnamese", Yemen: "Yemeni", Zambia: "Zambian", Zimbabwe: "Zimbabwean",
};

const NATIONALITY_OPTIONS = COUNTRY_OPTIONS.map((country) => NATIONALITY_BY_COUNTRY[country] || country);

const CITY_OPTIONS_BY_COUNTRY = {
  Pakistan: ["Islamabad", "Karachi", "Lahore", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"],
  India: ["New Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
  Bangladesh: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Comilla"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Seattle"],
  Canada: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Quebec City"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Bristol", "Glasgow", "Edinburgh"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast", "Hobart"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain", "Ras Al Khaimah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif"],
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana"],
  Germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Dusseldorf"],
  France: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Bordeaux"],
  China: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hong Kong", "Nanjing"],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Sapporo", "Fukuoka"],
  Malaysia: ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Malacca", "Kota Kinabalu"],
  Singapore: ["Singapore"],
};

function TagAutocomplete({ value, onChange, selected = [], options, onAdd, placeholder, color = "blue" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    return options.filter((option) =>
      !selected.some((item) => item.toLowerCase() === option.toLowerCase()) &&
      (!query || option.toLowerCase().includes(query))
    );
  }, [options, selected, value]);

  useEffect(() => {
    function closeOnOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      onAdd();
    }
    if (event.key === "Escape") setOpen(false);
  }

  const focusColor = color === "teal" ? "focus:border-teal-600" : "focus:border-blue-600";
  const activeColor = color === "teal" ? "hover:bg-teal-50 hover:text-teal-700" : "hover:bg-blue-50 hover:text-blue-700";

  return (
    <div ref={wrapRef} className="relative flex flex-1 gap-2">
      <input
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none ${focusColor}`}
      />
      <button type="button" onClick={onAdd} className="transition-all duration-200 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">Add</button>

      {open && (value.trim() || suggestions.length > 0) && (
        <div className="absolute left-0 right-14 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onAdd(option); setOpen(false); }}
              className={`block w-full px-4 py-2 text-left text-sm text-gray-700 transition ${activeColor}`}
            >
              {option}
            </button>
          ))}
          {value.trim() && !options.some((option) => option.toLowerCase() === value.trim().toLowerCase()) && (
            <button type="button" onClick={() => { onAdd(); setOpen(false); }} className={`block w-full border-t px-4 py-2 text-left text-sm font-medium text-gray-600 transition ${activeColor}`}>
              Add "{value.trim()}"
            </button>
          )}
          {!suggestions.length && !value.trim() && <p className="px-4 py-2 text-sm text-gray-400">Start typing to search</p>}
        </div>
      )}
    </div>
  );
}

function SearchField({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    return options.filter((option) => !query || option.toLowerCase().includes(query)).slice(0, 50);
  }, [options, value]);

  useEffect(() => {
    function closeOnOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          {suggestions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CandidateProfile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [picUploading, setPicUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState({});
  const [otherDocumentDrafts, setOtherDocumentDrafts] = useState([{ id: 1, name: "" }]);
  const picRef = useRef();

  // Section-level edit state
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingPro, setEditingPro] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [basicDraft, setBasicDraft] = useState({});
  const [proDraft, setProDraft] = useState({});
  const [aboutDraft, setAboutDraft] = useState("");

  // Skills
  const [skillInput, setSkillInput] = useState("");

  // Languages
  const [langInput, setLangInput] = useState("");

  // Experience edit state
  const [editingExpIndex, setEditingExpIndex] = useState(null);
  const [expDraft, setExpDraft] = useState({});
  const [addingExp, setAddingExp] = useState(false);

  // Education edit state
  const [editingEduIndex, setEditingEduIndex] = useState(null);
  const [eduDraft, setEduDraft] = useState({});
  const [addingEdu, setAddingEdu] = useState(false);

  // Social edit
  const [editingSocial, setEditingSocial] = useState(false);
  const [socialDraft, setSocialDraft] = useState({});

  // Profile completion widget
  const [requirementsOpen, setRequirementsOpen] = useState(true);
  const [reviewSent, setReviewSent] = useState(false);
  // Tracks the completion % across saves so we can fire a one-time toast
  // exactly when the candidate crosses the "ready" threshold — null until
  // the profile has loaded once, so it never fires on first load.
  const prevCompletionRef = useRef(null);

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!profile) return;
    const sections = getCompletionSections(profile);
    const checks = sections.flatMap((s) => s.checks);
    const percent = checks.length ? Math.round((checks.filter((c) => c.done).length / checks.length) * 100) : 100;

    if (
      prevCompletionRef.current !== null &&
      prevCompletionRef.current < PROFILE_READY_THRESHOLD &&
      percent >= PROFILE_READY_THRESHOLD
    ) {
      showToast("Your profile is ready.");
    }
    prevCompletionRef.current = percent;
  }, [profile, showToast]);

  async function loadProfile() {
    const d = await getMyProfile();
    setProfile(d);
    setCachedProfilePicture(d?.profilePicture || "");
  }

  async function save(updates) {
    setSaving(true);
    try {
      const updated = await updateMyProfile(updates);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPicUploading(true);
    try {
      const updated = await uploadProfilePicture(file);
      setProfile(updated);
      setCachedProfilePicture(updated?.profilePicture || "");
    } catch (err) {
      alert(err.response?.data?.message || "Could not upload picture.");
    } finally {
      setPicUploading(false);
    }
  }

  async function handleDocumentUpload(type, file) {
    if (!file) return;
    setDocumentUploading((current) => ({ ...current, [type]: true }));
    try {
      const updated = await uploadProfileDocument(type, file);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not upload document.");
    } finally {
      setDocumentUploading((current) => ({ ...current, [type]: false }));
    }
  }

  async function handleDocumentRemove(type) {
    setDocumentUploading((current) => ({ ...current, [type]: true }));
    try {
      const updated = await deleteProfileDocument(type);
      setProfile(updated);
    } catch (err) {
      alert(err.response?.data?.message || "Could not remove document.");
    } finally {
      setDocumentUploading((current) => ({ ...current, [type]: false }));
    }
  }

  async function handleOtherDocumentUpload(draftId, name, file) {
    if (!file) return;
    if (!name.trim()) {
      alert("Enter a document name first.");
      return;
    }
    setDocumentUploading((current) => ({ ...current, [draftId]: true }));
    try {
      const updated = await uploadOtherDocument(name.trim(), file);
      setProfile(updated);
      setOtherDocumentDrafts((drafts) => drafts.filter((draft) => draft.id !== draftId));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not upload document.");
    } finally {
      setDocumentUploading((current) => ({ ...current, [draftId]: false }));
    }
  }

  async function removeOtherDocument(id) {
    try {
      const updated = await deleteOtherDocument(id);
      setProfile(updated);
    } catch (err) {
      alert(err.response?.data?.message || "Could not remove document.");
    }
  }

  // ── Skills ──
  async function addSkill(value = skillInput) {
    const s = value.trim();
    if (!s || profile.skills?.some((item) => item.toLowerCase() === s.toLowerCase())) return;
    await save({ skills: [...(profile.skills || []), s] });
    setSkillInput("");
  }
  async function removeSkill(s) {
    await save({ skills: profile.skills.filter((x) => x !== s) });
  }

  // ── Languages ──
  async function addLang(value = langInput) {
    const l = value.trim();
    if (!l || profile.languages?.some((item) => item.toLowerCase() === l.toLowerCase())) return;
    await save({ languages: [...(profile.languages || []), l] });
    setLangInput("");
  }
  async function removeLang(l) {
    await save({ languages: profile.languages.filter((x) => x !== l) });
  }

  // ── Experience ──
  async function saveExp() {
    const list = [...(profile.workExperience || [])];
    if (addingExp) list.push(expDraft);
    else list[editingExpIndex] = expDraft;
    await save({ workExperience: list });
    setEditingExpIndex(null);
    setAddingExp(false);
  }
  async function deleteExp(i) {
    await save({ workExperience: profile.workExperience.filter((_, j) => j !== i) });
  }

  // ── Education ──
  async function saveEdu() {
    const list = [...(profile.education || [])];
    if (addingEdu) list.push(eduDraft);
    else list[editingEduIndex] = eduDraft;
    await save({ education: list });
    setEditingEduIndex(null);
    setAddingEdu(false);
  }
  async function deleteEdu(i) {
    await save({ education: profile.education.filter((_, j) => j !== i) });
  }

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sendForReview() {
    setReviewSent(true);
    setTimeout(() => setReviewSent(false), 2500);
  }

  if (!profile) return (
    <CandidateLayout title="My Profile">
      <p className="text-gray-500">Loading...</p>
    </CandidateLayout>
  );

  const initials = (profile.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const completionSections = getCompletionSections(profile);
  const allChecks = completionSections.flatMap((s) => s.checks.map((c) => ({ ...c, sectionId: s.sectionId })));
  const completionPercent = allChecks.length ? Math.round((allChecks.filter((c) => c.done).length / allChecks.length) * 100) : 100;
  const visibilityPercent = Math.min(100, completionPercent + 6);
  const missingChecks = allChecks.filter((c) => !c.done);
  const sectionStatus = Object.fromEntries(
    completionSections.map((s) => [s.key, { number: s.number, missingCount: s.checks.filter((c) => !c.done).length }])
  );

  return (
    <CandidateLayout title="My Profile" subtitle="Keep your profile complete to stand out to employers." profilePicture={profile.profilePicture}>
      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 flex items-center gap-2">
          <HiOutlineCheck className="h-4 w-4" /> Saved successfully.
        </div>
      )}
      {reviewSent && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
          <HiOutlineCheck className="h-4 w-4" /> Profile sent for review.
        </div>
      )}

      <div className="space-y-5">

        {/* ── Profile Completion ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-gray-900">Profile completion</h2>
            <span className="text-2xl font-bold text-blue-600">{completionPercent}%</span>
          </div>

          <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100">
            <div className="h-2.5 rounded-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${completionPercent}%` }} />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Your profile appears in search results at {visibilityPercent}%.
          </p>

          {missingChecks.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <button
                type="button"
                onClick={() => setRequirementsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <HiOutlineListBullet className="h-4 w-4 text-gray-500" />
                  View missing requirements
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{missingChecks.length}</span>
                </span>
                <HiOutlineChevronUp className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ease-in-out ${requirementsOpen ? "" : "rotate-180"}`} />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${requirementsOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <ul className="divide-y overflow-hidden">
                  {missingChecks.map((check, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-3">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        {check.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => scrollToSection(check.sectionId)}
                        className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Go to section
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={completionPercent < 100}
            onClick={sendForReview}
            className={`mt-5 w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
              completionPercent >= 100
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            Send profile for review
          </button>
        </section>

        {/* ── Basic Info ── */}
        <section id="section-basic-info" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineIdentification} title="Basic information" number={sectionStatus.basicInfo.number} missingCount={sectionStatus.basicInfo.missingCount}>
            {!editingBasic && (
              <button onClick={() => { setBasicDraft({ name: profile.name, phone: profile.phone, gender: profile.gender, nationality: profile.nationality, dateOfBirth: profile.dateOfBirth, country: profile.country, city: profile.city, primaryLanguage: profile.primaryLanguage, streetAddress: profile.streetAddress }); setEditingBasic(true); }}
                className="transition-all duration-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </SectionHeader>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative shrink-0">
              {profile.profilePicture ? (
                <img src={`${FILE_BASE}${profile.profilePicture}`} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">{initials}</div>
              )}
              <button onClick={() => picRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow transition-all duration-200 hover:bg-blue-700">
                <HiOutlineCamera className="h-4 w-4" />
              </button>
              <input ref={picRef} type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
            </div>
            {picUploading && <p className="text-sm text-gray-400">Uploading...</p>}
          </div>

          {!editingBasic ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Full name" value={profile.name} />
              <Row label="Mobile number" value={profile.phone} />
              <Row label="Email address" value={profile.email} />
              <Row label="Gender" value={profile.gender} />
              <Row label="Nationality" value={profile.nationality} />
              <Row label="Date of birth" value={profile.dateOfBirth} />
              <Row label="Country" value={profile.country} />
              <Row label="City" value={profile.city} />
              <Row label="Primary language" value={profile.primaryLanguage} />
              <Row label="Street address" value={profile.streetAddress} />
            </dl>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={basicDraft.name || ""} onChange={(v) => setBasicDraft({ ...basicDraft, name: v })} />
              <Field label="Mobile number" value={basicDraft.phone || ""} onChange={(v) => setBasicDraft({ ...basicDraft, phone: v })} />
              <Field label="Email address" value={profile.email || ""} onChange={() => {}} type="email" disabled />
              <SearchField label="Gender" value={basicDraft.gender || ""} onChange={(v) => setBasicDraft({ ...basicDraft, gender: v })} options={["Male", "Female"]} placeholder="Type or select gender" />
              <SearchField label="Nationality" value={basicDraft.nationality || ""} onChange={(v) => setBasicDraft({ ...basicDraft, nationality: v })} options={NATIONALITY_OPTIONS} placeholder="Type or select a nationality" />
              <Field label="Date of birth" value={basicDraft.dateOfBirth || ""} onChange={(v) => setBasicDraft({ ...basicDraft, dateOfBirth: v })} type="date" />
              <SearchField label="Country" value={basicDraft.country || ""} onChange={(v) => setBasicDraft({ ...basicDraft, country: v })} options={COUNTRY_OPTIONS} placeholder="Type or select a country" />
              <SearchField label="City" value={basicDraft.city || ""} onChange={(v) => setBasicDraft({ ...basicDraft, city: v })} options={CITY_OPTIONS_BY_COUNTRY[basicDraft.country] || []} placeholder={basicDraft.country ? `Type or select a city in ${basicDraft.country}` : "Type your city"} />
              <SearchField label="Primary language" value={basicDraft.primaryLanguage || ""} onChange={(v) => setBasicDraft({ ...basicDraft, primaryLanguage: v })} options={LANGUAGE_OPTIONS} placeholder="Type or select a language" />
              <Field label="Street address" value={basicDraft.streetAddress || ""} onChange={(v) => setBasicDraft({ ...basicDraft, streetAddress: v })} />
              <div className="sm:col-span-2"><SaveCancel saving={saving} onSave={async () => { await save(basicDraft); setEditingBasic(false); }} onCancel={() => setEditingBasic(false)} /></div>
            </div>
          )}
        </section>

        {/* ── Professional Info ── */}
        <section id="section-professional" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineBriefcase} title="Professional information" number={sectionStatus.professional.number} missingCount={sectionStatus.professional.missingCount}>
            {!editingPro && (
              <button onClick={() => { setProDraft({ professionalTitle: profile.professionalTitle, primaryProfession: profile.primaryProfession, yearsOfExperience: profile.yearsOfExperience, currentPosition: profile.currentPosition, currentEmploymentStatus: profile.currentEmploymentStatus, availability: profile.availability, expectedSalary: profile.expectedSalary, salaryCurrency: getSalaryCurrency(profile) }); setEditingPro(true); }}
                className="transition-all duration-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </SectionHeader>


          {!editingPro ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Professional title" value={profile.professionalTitle} />
              <Row label="Primary profession" value={profile.primaryProfession} />
              <Row label="Current position" value={profile.currentPosition} />
              <Row label="Work experience" value={profile.yearsOfExperience !== undefined ? `${profile.yearsOfExperience} year(s)` : null} />
              <Row label="Employment status" value={profile.currentEmploymentStatus} />
              <Row label="Availability" value={profile.availability} />
              <Row label="Expected salary" value={profile.expectedSalary ? `${profile.expectedSalary} ${getSalaryCurrency(profile)}` : null} />
            </dl>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Professional title" value={proDraft.professionalTitle || ""} onChange={(v) => setProDraft({ ...proDraft, professionalTitle: v })} />
              <SearchField label="Primary profession" value={proDraft.primaryProfession || ""} onChange={(v) => setProDraft({ ...proDraft, primaryProfession: v })} options={PROFESSION_OPTIONS} placeholder="Type or select a profession" />
              <Field label="Current position" value={proDraft.currentPosition || ""} onChange={(v) => setProDraft({ ...proDraft, currentPosition: v })} />
              <Field label="Work experience" value={proDraft.yearsOfExperience ?? ""} onChange={(v) => setProDraft({ ...proDraft, yearsOfExperience: v })} type="number" min="0" placeholder="e.g. 3" />
              <SearchField label="Current employment status" value={proDraft.currentEmploymentStatus || ""} onChange={(v) => setProDraft({ ...proDraft, currentEmploymentStatus: v })} options={EMPLOYMENT_STATUS_OPTIONS} placeholder="Type or select status" />
              <SearchField label="Availability" value={proDraft.availability || ""} onChange={(v) => setProDraft({ ...proDraft, availability: v })} options={AVAILABILITY_OPTIONS} placeholder="Type or select availability" />
              <Field label="Expected salary" value={proDraft.expectedSalary || ""} onChange={(v) => setProDraft({ ...proDraft, expectedSalary: v })} placeholder="e.g. 80000" />
              <Field label="Currency" value={getSalaryCurrency(profile)} onChange={() => {}} disabled />
              <div className="sm:col-span-2"><SaveCancel saving={saving} onSave={async () => { await save(proDraft); setEditingPro(false); }} onCancel={() => setEditingPro(false)} /></div>
            </div>
          )}
        </section>

        {/* ── About You ── */}
        <section id="section-about" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineChatBubbleBottomCenterText} title="About you" number={sectionStatus.about.number} missingCount={sectionStatus.about.missingCount}>
            {!editingAbout && (
              <button onClick={() => { setAboutDraft(profile.bio || ""); setEditingAbout(true); }}
                className="transition-all duration-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </SectionHeader>

          {!editingAbout ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{profile.bio || "No introduction added yet."}</p>
          ) : (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Introduce yourself</label>
              <textarea
                rows={5}
                maxLength={500}
                value={aboutDraft}
                onChange={(event) => setAboutDraft(event.target.value)}
                placeholder="Tell employers a little about yourself..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
              <p className="mt-1 text-right text-xs text-gray-500">{aboutDraft.length}/500</p>
              <SaveCancel saving={saving} onSave={async () => { await save({ bio: aboutDraft }); setEditingAbout(false); }} onCancel={() => setEditingAbout(false)} />
            </div>
          )}
        </section>

        {/* ── Experience ── */}
        <section id="section-experience" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineBuildingOffice2} title="Work experience" number={sectionStatus.experience.number} missingCount={sectionStatus.experience.missingCount}>
            <button onClick={() => { setExpDraft({ ...emptyExp }); setAddingExp(true); setEditingExpIndex(null); }}
              className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
              <HiOutlinePlus className="h-5 w-5" />
            </button>
          </SectionHeader>

          <div className="mt-4 divide-y">
            {(profile.workExperience || []).map((exp, i) => (
              <div key={i} className="py-4">
                {editingExpIndex === i && !addingExp ? (
                  <ExpForm draft={expDraft} setDraft={setExpDraft} onSave={saveExp} onCancel={() => setEditingExpIndex(null)} saving={saving} />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{exp.title}</p>
                      <p className="text-sm font-semibold text-blue-600">{exp.company}</p>
                      <p className="text-sm font-medium text-gray-700">{exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : ""}{exp.location ? ` | ${exp.location}` : ""}</p>
                      {exp.description && <p className="mt-1 text-sm text-gray-600">{exp.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2 ml-4">
                      <button onClick={() => { setExpDraft({ ...exp }); setEditingExpIndex(i); setAddingExp(false); }}
                        className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteExp(i)}
                        className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingExp && (
              <div className="pt-4">
                <ExpForm draft={expDraft} setDraft={setExpDraft} onSave={saveExp} onCancel={() => setAddingExp(false)} saving={saving} />
              </div>
            )}

            {!profile.workExperience?.length && !addingExp && (
              <p className="py-4 text-sm text-gray-400">No experience added yet. Click + to add.</p>
            )}
          </div>
        </section>

        {/* ── Skills ── */}
        <section id="section-skills" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineSparkles} title="Skills" number={sectionStatus.skills.number} missingCount={sectionStatus.skills.missingCount} />
          {(!profile.skills?.length) && <p className="mt-3 text-sm text-gray-400">No skills have been added yet.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.skills || []).map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {s}
                <button onClick={() => removeSkill(s)} className="transition-all duration-200 text-blue-400 hover:text-blue-600"><HiOutlineXMark className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <TagAutocomplete
              value={skillInput}
              onChange={setSkillInput}
              selected={profile.skills || []}
              options={SKILL_OPTIONS}
              onAdd={addSkill}
              placeholder="Search or type a skill"
            />
          </div>
        </section>

        {/* ── Education ── */}
        <section id="section-education" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineAcademicCap} title="Education" number={sectionStatus.education.number} missingCount={sectionStatus.education.missingCount}>
            <button onClick={() => { setEduDraft({ ...emptyEdu }); setAddingEdu(true); setEditingEduIndex(null); }}
              className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
              <HiOutlinePlus className="h-5 w-5" />
            </button>
          </SectionHeader>

          <div className="mt-4 divide-y">
            {(profile.education || []).map((edu, i) => (
              <div key={i} className="py-4">
                {editingEduIndex === i && !addingEdu ? (
                  <EduForm draft={eduDraft} setDraft={setEduDraft} onSave={saveEdu} onCancel={() => setEditingEduIndex(null)} saving={saving} />
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{edu.institution}</p>
                      <p className="text-sm font-semibold text-gray-800">{edu.level}{edu.degree ? `/${edu.degree}` : ""}</p>
                      <p className="text-sm font-medium text-gray-700">{edu.degree}</p>
                      {edu.startDate && <p className="text-sm text-gray-500">{edu.startDate}{edu.endDate ? ` - ${edu.endDate}` : ""}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2 ml-4">
                      <button onClick={() => { setEduDraft({ ...edu }); setEditingEduIndex(i); setAddingEdu(false); }}
                        className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteEdu(i)}
                        className="transition-all duration-200 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100">
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingEdu && (
              <div className="pt-4">
                <EduForm draft={eduDraft} setDraft={setEduDraft} onSave={saveEdu} onCancel={() => setAddingEdu(false)} saving={saving} />
              </div>
            )}

            {!profile.education?.length && !addingEdu && (
              <p className="py-4 text-sm text-gray-400">No education added yet. Click + to add.</p>
            )}
          </div>
        </section>

        {/* ── Languages ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineLanguage} title="Languages" optional />
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.languages || []).map((l) => (
              <span key={l} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {l}
                <button onClick={() => removeLang(l)} className="transition-all duration-200 text-blue-400 hover:text-blue-600"><HiOutlineXMark className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <TagAutocomplete
              value={langInput}
              onChange={setLangInput}
              selected={profile.languages || []}
              options={LANGUAGE_OPTIONS}
              onAdd={addLang}
              placeholder="Search or type a language"
              color="blue"
            />
          </div>
        </section>

        {/* ── Documents ── */}
        <section id="section-documents" className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineDocumentText} title="Documents" number={sectionStatus.documents.number} missingCount={sectionStatus.documents.missingCount} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DocumentCard
              title="National ID or Iqama"
              description="Upload a clear PDF or image of your national ID, iqama or passport. Up to 5 MB."
              document={profile.documents?.nationalId}
              uploading={documentUploading.nationalId}
              onUpload={(file) => handleDocumentUpload("nationalId", file)}
              onRemove={() => handleDocumentRemove("nationalId")}
            />
            <DocumentCard
              title="Experience letter from a former employer"
              description="Upload a letter or certificate showing your work history. PDF or image, up to 5 MB."
              document={profile.documents?.experienceLetter}
              uploading={documentUploading.experienceLetter}
              onUpload={(file) => handleDocumentUpload("experienceLetter", file)}
              onRemove={() => handleDocumentRemove("experienceLetter")}
            />
            <DocumentCard
              title="Graduation certificate or highest qualification"
              description="Upload your graduation certificate or highest qualification. PDF or image, up to 5 MB."
              document={profile.documents?.graduationCertificate}
              uploading={documentUploading.graduationCertificate}
              onUpload={(file) => handleDocumentUpload("graduationCertificate", file)}
              onRemove={() => handleDocumentRemove("graduationCertificate")}
            />
          </div>
        </section>

        {/* ── Other Documents ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineFolderOpen} title="Other documents" optional />
          <p className="mt-1 text-sm text-gray-500">Extra experience or education certificates. Up to 8 files including those above.</p>

          <div className="mt-4 space-y-4">
            {(profile.otherDocuments || []).map((document) => (
              <div key={document._id} className="rounded-xl border border-dashed border-blue-200 p-4 text-gray-900">
                <p className="text-sm font-semibold text-gray-900">{document.name}</p>
                <p className="mt-1 truncate text-xs text-gray-700">{document.originalName}</p>
                <button type="button" onClick={() => removeOtherDocument(document._id)} className="mt-3 flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <HiOutlineTrash className="h-4 w-4" /> Remove
                </button>
              </div>
            ))}

            {(profile.otherDocuments || []).length < 5 && otherDocumentDrafts.map((draft) => (
              <OtherDocumentDraft
                key={draft.id}
                name={draft.name}
                uploading={documentUploading[draft.id]}
                onNameChange={(name) => setOtherDocumentDrafts((drafts) => drafts.map((item) => item.id === draft.id ? { ...item, name } : item))}
                onUpload={(file) => handleOtherDocumentUpload(draft.id, draft.name, file)}
              />
            ))}
          </div>

          {(profile.otherDocuments || []).length + otherDocumentDrafts.length < 5 && (
            <button type="button" onClick={() => setOtherDocumentDrafts((drafts) => [...drafts, { id: Date.now(), name: "" }])}
              className="mt-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <HiOutlinePlus className="h-4 w-4" /> Add another document
            </button>
          )}
          <p className="mt-3 text-xs text-gray-700">Choose a file for the document you added before adding another.</p>
        </section>

        {/* ── Portfolio & Social ── */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <SectionHeader icon={HiOutlineLink} title="Portfolio & Social Links" optional>
            {!editingSocial && (
              <button onClick={() => { setSocialDraft({ portfolioUrl: profile.portfolioUrl, linkedinUrl: profile.linkedinUrl, githubUrl: profile.githubUrl }); setEditingSocial(true); }}
                className="transition-all duration-200 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                <HiOutlinePencil className="h-4 w-4" /> Edit
              </button>
            )}
          </SectionHeader>

          {!editingSocial ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Portfolio" value={profile.portfolioUrl} link />
              <Row label="LinkedIn" value={profile.linkedinUrl} link />
              <Row label="GitHub" value={profile.githubUrl} link />
            </dl>
          ) : (
            <div className="mt-4 space-y-3">
              <Field label="Portfolio URL" value={socialDraft.portfolioUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, portfolioUrl: v })} placeholder="https://yoursite.com" />
              <Field label="LinkedIn" value={socialDraft.linkedinUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, linkedinUrl: v })} placeholder="https://linkedin.com/in/yourname" />
              <Field label="GitHub" value={socialDraft.githubUrl || ""} onChange={(v) => setSocialDraft({ ...socialDraft, githubUrl: v })} placeholder="https://github.com/yourname" />
              <SaveCancel saving={saving} onSave={async () => { await save(socialDraft); setEditingSocial(false); }} onCancel={() => setEditingSocial(false)} />
            </div>
          )}
        </section>
      </div>
    </CandidateLayout>
  );
}

// ── Reusable sub-components ────────────────────────────────────────────────────

function DocumentCard({ title, description, document, uploading, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const hasDocument = !!document?.originalName;

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  return (
    <div
      role={hasDocument ? undefined : "button"}
      tabIndex={hasDocument ? undefined : 0}
      onClick={hasDocument ? undefined : openPicker}
      onKeyDown={hasDocument ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
      className={`rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-5 text-center text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        hasDocument ? "" : "cursor-pointer hover:bg-blue-50"
      }`}
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
        <span className="text-xl">↑</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {!hasDocument && (
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-700">{description}</p>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(event) => { onUpload(event.target.files?.[0]); event.target.value = ""; }} />

      {uploading ? (
        <p className="mt-3 text-xs font-semibold text-blue-700">Uploading...</p>
      ) : hasDocument ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left">
          <HiOutlineDocumentText className="h-5 w-5 shrink-0 text-blue-600" />
          <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900">{document.originalName}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remove"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-all duration-200 hover:scale-110 hover:bg-red-50 hover:text-red-600"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function OtherDocumentDraft({ name, uploading, onNameChange, onUpload }) {
  const inputRef = useRef(null);

  return (
    <div className="rounded-xl border border-dashed border-blue-200 p-4 text-gray-900">
      <label className="text-sm font-semibold text-gray-900">Document name</label>
      <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Training certificate"
        className="mt-2 w-full rounded-xl border px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-600" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="mt-3 flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 px-4 py-5 text-center transition hover:bg-blue-50 disabled:opacity-60">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-700">↑</span>
        <span className="mt-2 text-sm font-semibold text-gray-900">{uploading ? "Uploading..." : "Choose a document"}</span>
        <span className="mt-1 text-xs text-gray-700">PDF or image</span>
      </button>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(event) => { onUpload(event.target.files?.[0]); event.target.value = ""; }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, number, optional = false, missingCount = 0, children }) {
  const complete = !optional && missingCount === 0;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-900">{title}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span>{optional ? "Optional" : `Section ${number} · Counts towards completion`}</span>
            {!optional && (
              complete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                  <HiOutlineCheckCircle className="h-3.5 w-3.5" /> Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
                  <HiOutlineListBullet className="h-3.5 w-3.5" /> {missingCount} field{missingCount === 1 ? "" : "s"} remaining
                </span>
              )
            )}
          </p>
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

function Row({ label, value, link }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 break-all">
        {link ? <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", disabled = false, min }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} min={min}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, showPlaceholder = true }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600">
        {showPlaceholder && <option value="">Select</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function SaveCancel({ onSave, onCancel, saving }) {
  return (
    <div className="flex gap-2">
      <button onClick={onCancel} className="transition-all duration-200 flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <HiOutlineXMark className="h-4 w-4" /> Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="transition-all duration-200 flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        <HiOutlineCheck className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function ExpForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title" value={draft.title || ""} onChange={(v) => setDraft({ ...draft, title: v })} />
        <Field label="Company" value={draft.company || ""} onChange={(v) => setDraft({ ...draft, company: v })} />
        <Field label="Start date" value={draft.startDate || ""} onChange={(v) => setDraft({ ...draft, startDate: v })} placeholder="e.g. Jan 2022" />
        <Field label="End date" value={draft.endDate || ""} onChange={(v) => setDraft({ ...draft, endDate: v })} placeholder="e.g. Dec 2023 or Present" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-600" />
      </div>
      <SaveCancel saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function EduForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
            <SelectField label="Level" value={draft.level || "Undergraduate"} onChange={(v) => setDraft({ ...draft, level: v })} options={["School", "Intermediate", "Undergraduate", "Master", "PhD"]} showPlaceholder={false} />
        </div>
        <Field label="Institution" value={draft.institution || ""} onChange={(v) => setDraft({ ...draft, institution: v })} />
        <Field label="Degree / Subject" value={draft.degree || ""} onChange={(v) => setDraft({ ...draft, degree: v })} />
        <Field label="Start year" value={draft.startDate || ""} onChange={(v) => setDraft({ ...draft, startDate: v })} placeholder="e.g. 2018" />
        <Field label="End year" value={draft.endDate || ""} onChange={(v) => setDraft({ ...draft, endDate: v })} placeholder="e.g. 2022 or Present" />
      </div>
      <SaveCancel saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
