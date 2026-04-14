// We removed MUNICIPALITIES_DATA because the app now dynamically fetches 
// locations directly from the Supabase 'populations' table!

export const DEFAULT_FACILITIES = [];
export const INITIAL_FACILITY_BARANGAYS = {};

// Updated V2 Data Structure for the new DOH format
export const INITIAL_ROW_STATE = {
  pop: 0, 
  male: '',
  female: '',
  ageUnder15: '',
  ageOver15: '',
  cat1: '',
  cat2EligPri: '',
  cat2EligBoost: '',
  cat2NonElig: '',
  cat3EligPri: '',
  cat3EligBoost: '',
  cat3NonElig: '',
  compCat2Pri: '',
  compCat2Boost: '',
  compCat3PriErig: '',
  compCat3PriHrig: '',
  compCat3Boost: '',
  typeDog: '',
  typeCat: '',
  typeOthers: '',
  statusPet: '',
  statusStray: '',
  statusUnk: '',
  rabiesCases: ''
};

// Cohort state was removed here since the feature was deleted.

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export const QUARTERS = [
  "1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"
];

export const PDF_STYLES = {
  container: { backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' },
  headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%', backgroundColor: '#ffffff' },
  logoBox: { width: '150px', display: 'flex', justifyContent: 'center' },
  centerText: { textAlign: 'center', flex: 1, color: '#000000' },
  header: { backgroundColor: '#f4f4f5', color: '#18181b', fontWeight: 'bold', borderBottom: '2px solid #d4d4d8' }, 
  subHeader: { backgroundColor: '#fafafa', color: '#52525b', fontWeight: 'bold' },
  cell: { border: '1px solid #e4e4e7', padding: '6px', textAlign: 'center', fontSize: '11px', color: '#000000', verticalAlign: 'middle' },
  rowEven: { backgroundColor: '#ffffff', color: '#000000' },
  rowOdd: { backgroundColor: '#ffffff', color: '#000000' },
  hostRow: { backgroundColor: '#f4f4f5', fontWeight: 'bold', color: '#000000' },
  border: { borderColor: '#e4e4e7', borderWidth: '1px', borderStyle: 'solid' },
  input: { width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px', color: '#000000' },
  inputText: { width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '11px', color: '#000000' },
  textDark: { color: '#000000' },
  textGray: { color: '#52525b' },
  textLightGray: { color: '#a1a1aa' },
  bgGray: { backgroundColor: '#f4f4f5' },
  bgDark: { backgroundColor: '#18181b', color: '#ffffff' }
};