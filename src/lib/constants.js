export const DEFAULT_FACILITIES = [
  "Bangued RHU", "Tayum RHU", "Dolores RHU", "Tubo RHU", "Luba RHU", 
  "Manabo RHU", "Lagangilang RHU", "La Paz RHU", "AMDC", "APH"
];

export const MUNICIPALITIES = [
  "Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", 
  "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", 
  "Licuan-Baay", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", 
  "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", 
  "Tineg", "Tubo", "Villaviciosa", "Non-Abra" 
];

export const INITIAL_FACILITY_BARANGAYS = {
  "Bangued RHU": ["Agtangao", "Angad", "Banacao", "Bangbangar", "Cabuloan", "Calaba", "Cosili East (Proper)", "Cosili West (Buaya)", "Dangdangla", "Lingtan", "Lipcan", "Lubong", "Macarcarmay", "Macray", "Malita", "Maoay", "Palao", "Patucannay", "Sagap", "San Antonio", "Santa Rosa", "Sao-atan", "Sappaac", "Tablac (Calot)", "Zone 1 Poblacion (Nalasin)", "Zone 2 Poblacion (Consiliman)", "Zone 3 Poblacion (Lalaud)", "Zone 4 Poblacion (Town Proper)", "Zone 5 Poblacion (Bo. Barikir)", "Zone 6 Poblacion (Sinapangan)", "Zone 7 Poblacion (Baliling)"],
  "Tayum RHU": ["Bagalay", "Basbasa", "Budac", "Bumagcat", "Cabaroan", "Deet", "Gaddani", "Patucannay", "Pias", "Poblacion", "Velasco"],
  "Manabo RHU": ["Ayyeng (Poblacion)", "Catacdegan Nuevo", "Catacdegan Viejo", "Luzong", "San Jose Norte", "San Jose Sur", "San Juan Norte", "San Juan Sur", "San Ramon East", "San Ramon West", "Santo Tomas"],
  "Luba RHU": ["Ampalioc", "Barit", "Gayaman", "Lul-luno", "Luzong", "Nagbukel", "Poblacion", "Sabnangan"],
  "Tubo RHU": ["Alangtin", "Amtuagan", "Dilong", "Kili", "Poblacion", "Mayabo", "Supo", "Tiempo", "Tubtuba", "Wayangan"],
  "Dolores RHU": ["Bayaan", "Cabaroan", "Calumbaya", "Cardona", "Isit", "Kimmalaba", "Libtec", "Lub-lubba", "Mudiit", "Namit-ingang", "Pacac", "Poblacion", "Salucag", "Talogtog", "Taping"],
  "Lagangilang RHU": ["Aguet", "Bacooc", "Balais", "Cayapa", "Dalaguisen", "Laang", "Lagben", "Laguiben", "Nagtupacan", "Paganao", "Pawa", "Poblacion", "Presentar", "San Isidro", "Tagodtod", "Taping", "Villacarta"],
  "La Paz RHU": ["Benben", "Bulbulala", "Buli", "Canan", "Liguis", "Malabbaga", "Mudeng", "Pidipid", "Poblacion", "San Gregorio", "Toon", "Udangan"]
};

export const INITIAL_ROW_STATE = { 
  male: '', female: '', ageLt15: '', ageGt15: '', 
  cat1: '', cat2: '', cat3: '', 
  totalPatients: '', abCount: '', hrCount: '', 
  pvrv: '', pcecv: '', hrig: '', erig: '', 
  dog: '', cat: '', othersCount: '', othersSpec: '', 
  washed: '', remarks: '' 
};

export const INITIAL_COHORT_ROW = {
  cat2_registered: '', cat2_rig: '', cat2_complete: '', cat2_incomplete: '', cat2_booster: '', cat2_none: '', cat2_died: '', cat2_remarks: '',
  cat3_registered: '', cat3_rig: '', cat3_complete: '', cat3_incomplete: '', cat3_booster: '', cat3_none: '', cat3_died: '', cat3_remarks: ''
};

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const QUARTERS = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

export const PDF_STYLES = {
  container: { backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%', backgroundColor: '#ffffff' },
  logoBox: { width: '150px', display: 'flex', justifyContent: 'center' },
  centerText: { textAlign: 'center', flex: 1, color: '#000000' },
  header: { backgroundColor: '#f4f4f5', color: '#18181b', fontWeight: 'bold', borderBottom: '2px solid #d4d4d8' }, 
  subHeader: { backgroundColor: '#fafafa', color: '#52525b', fontWeight: 'bold' },
  // UPDATED: Font size 11px
  cell: { border: '1px solid #e4e4e7', padding: '6px', textAlign: 'center', fontSize: '11px', color: '#000000', verticalAlign: 'middle' },
  rowEven: { backgroundColor: '#ffffff', color: '#000000' },
  rowOdd: { backgroundColor: '#ffffff', color: '#000000' },
  hostRow: { backgroundColor: '#f4f4f5', fontWeight: 'bold', color: '#000000' },
  border: { borderColor: '#e4e4e7', borderWidth: '1px', borderStyle: 'solid' },
  // UPDATED: Font size 11px
  input: { width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', color: '#000000' },
  // UPDATED: Font size 11px
  inputText: { width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '11px', color: '#000000' },
  textDark: { color: '#000000' },
  textGray: { color: '#52525b' },
  textLightGray: { color: '#a1a1aa' },
  bgGray: { backgroundColor: '#f4f4f5' },
  bgDark: { backgroundColor: '#18181b', color: '#ffffff' }
};