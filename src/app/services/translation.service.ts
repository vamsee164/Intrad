import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface Translation {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguage.asObservable();

  private translations: { [lang: string]: Translation } = {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.wehire': 'We Hire',
      'nav.crops': 'Crops',
      'nav.vegetables': 'Vegetables',
      'nav.fruits': 'Fruits',
      'nav.about': 'About Us',
      'nav.book': 'Book',
      'nav.booksoil': 'Book A Soil Test',
      'nav.contact': 'Contact Us',
      'nav.profile': 'Profile',
      'nav.logout': 'Logout',
      
      // Homepage
      'home.title': 'INTRA-D',
      'home.subtitle': 'Agricultural & Processing',
      'home.welcome': 'Welcome to Agricultural Excellence',
      'home.description': 'Empowering farmers with modern agricultural solutions and processing techniques',
      
      // Login
      'login.title': 'Access Control System',
      'login.description': 'Secure login to your agricultural dashboard',
      'login.email': 'Email Address',
      'login.password': 'Password',
      'login.submit': 'Sign In',
      'login.signingin': 'Signing In...',
      'login.forgot': 'Forgot Password?',
      'login.signup': 'Create Account',
      'login.noaccount': "Don't have an account?",
      'login.forgotform': 'Forgot Password Form',
      'login.confirmpassword': 'Confirm Password',
      
      // Common
      'common.submit': 'Submit',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.continue': 'Continue',
      'common.gotit': 'Got it!',
      
      // Modals
      'modal.comingsoon': 'Coming Soon!',
      'modal.feature': 'Feature',
      'modal.development': 'This feature is currently under development. Stay tuned for updates!',
      'modal.confirm': 'Confirm Navigation',
      'modal.warning': 'Warning: Data will be erased',
      'modal.logout.message': 'Going to homepage will log you out and clear your session data. Do you want to continue?',
      'modal.stay': 'No, Stay Here',
      'modal.weather': 'Weather Information',
      'modal.farmers': 'Farmers Network',
      'modal.connected': 'Connected Farmers',
      'modal.humidity': 'Humidity',
      'modal.windspeed': 'Wind Speed',
      'modal.formsubmission': 'Form Submission',
      'modal.formsuccess': 'Form submitted successfully! Check the console for details.',
      
      // Footer
      'footer.description': 'An Agricultural Innovation Center dedicated to improving farmer income through modern farming techniques, smart practices, and agricultural product processing.',
      'footer.copyright': '© 2025 Intra-d. All rights reserved.',
      'footer.followus': 'FOLLOW US',
      'footer.visitus': 'VISIT US',
      'footer.directions': 'Map & Directions',
      'footer.virtualtour': 'Virtual Tour',
      'footer.workwithus': 'WORK WITH US',
      'footer.viewjobs': 'View Jobs',
      
      // Contact Form
      'contact.title': 'Get in touch',
      'contact.firstname': 'First name',
      'contact.lastname': 'Last name',
      'contact.email': 'Email',
      'contact.phone': 'Phone',
      'contact.message': 'Message',
      
      // Soil Test Form
      'soil.benefits': 'Benefits of Soil Testing',
      'soil.balanced': 'Balanced Nutrients',
      'soil.balanced.desc': 'Ensures correct NPK balance for crops.',
      'soil.saves': 'Saves Fertilizer Cost',
      'soil.saves.desc': 'Use only required fertilizers.',
      'soil.yield': 'Better Yield',
      'soil.yield.desc': 'Healthy soil improves crop production.',
      'soil.identify': 'Identify Soil Problems',
      'soil.identify.desc': 'Detect pH imbalance & deficiencies early.',
      'soil.health': 'Soil Health Improvement',
      'soil.health.desc': 'Maintains long-term soil fertility.',
      'soil.scientific': 'Scientific Farming',
      'soil.scientific.desc': 'Data-driven decisions for better farming.',
      'soil.request': 'Request Soil Test',
      'soil.name': 'Name',
      'soil.name.placeholder': 'Enter farmer name',
      'soil.mobile': 'Mobile Number',
      'soil.mobile.placeholder': 'Enter mobile number',
      'soil.village': 'Village / Area',
      'soil.village.placeholder': 'Enter village or area',
      'soil.landarea': 'Land Area (Acres)',
      'soil.landarea.placeholder': 'Eg: 2.5',
      'soil.irrigation': 'Irrigation Type',
      'soil.irrigation.select': 'Select Irrigation',
      'soil.irrigation.rainfed': 'Rainfed',
      'soil.irrigation.borewell': 'Borewell',
      'soil.irrigation.canal': 'Canal',
      'soil.irrigation.drip': 'Drip',
      'soil.currentcrop': 'Current Crop',
      'soil.currentcrop.select': 'Select Crop',
      'soil.crop.mango': 'Mango',
      'soil.crop.papaya': 'Papaya',
      'soil.crop.tomato': 'Tomato',
      'soil.crop.vegetables': 'Vegetables',
      'soil.previouscrop': 'Previous Crop',
      'soil.previouscrop.placeholder': 'Enter previous crop',
      'soil.sampledate': 'Soil Sample Date',
      'soil.sampledepth': 'Soil Sample Depth',
      'soil.fieldcondition': 'Field Condition',
      'soil.condition.dry': 'Dry',
      'soil.condition.moist': 'Moist',
      'soil.condition.wet': 'Wet',
      'soil.problem': 'Problem (Optional)',
      'soil.problem.placeholder': 'Describe soil issue...',
      'soil.submit': 'Submit Soil Test Request',
      
      // Farmers Modal
      'farmers.total': 'Total Farmers',
      'farmers.active': 'Active Farmers',
      'farmers.new': 'New This Month'
    },
    te: {
      // Navigation
      'nav.home': 'హోమ్',
      'nav.wehire': 'మేము నియమిస్తాము',
      'nav.crops': 'పంటలు',
      'nav.vegetables': 'కూరగాయలు',
      'nav.fruits': 'పండ్లు',
      'nav.about': 'మా గురించి',
      'nav.book': 'బుక్ చేయండి',
      'nav.booksoil': 'మట్టి పరీక్ష బుక్ చేయండి',
      'nav.contact': 'సంప్రదించండి',
      'nav.profile': 'ప్రొఫైల్',
      'nav.logout': 'లాగ్ అవుట్',
      
      // Homepage
      'home.title': 'ఇంట్రా-డి',
      'home.subtitle': 'వ్యవసాయ & ప్రాసెసింగ్',
      'home.welcome': 'వ్యవసాయ శ్రేష్ఠతకు స్వాగతం',
      'home.description': 'ఆధునిక వ్యవసాయ పరిష్కారాలు మరియు ప్రాసెసింగ్ టెక్నిక్‌లతో రైతులను శక్తివంతం చేయడం',
      
      // Login
      'login.title': 'లాగిన్',
      'login.email': 'ఇమెయిల్ చిరునామా',
      'login.password': 'పాస్‌వర్డ్',
      'login.submit': 'లాగిన్',
      'login.forgot': 'పాస్‌వర్డ్ మర్చిపోయారా?',
      'login.signup': 'సైన్ అప్',
      'login.description': 'మీ వ్యవసాయ డాష్బోర్డ్కు సురక్షిత లాగిన్',
      'login.signingin': 'సైన్ ఇన్ అవుతోంది...',
      'login.noaccount': 'ఖాతా లేదా?',
      
      // Common
      'common.submit': 'సమర్పించండి',
      'common.cancel': 'రద్దు చేయండి',
      'common.close': 'మూసివేయండి',
      'common.yes': 'అవును',
      'common.no': 'లేదు',
      'common.continue': 'కొనసాగించండి',
      'common.gotit': 'అర్థమైంది!',
      
      // Modals
      'modal.comingsoon': 'త్వరలో వస్తోంది!',
      'modal.feature': 'ఫీచర్',
      'modal.development': 'ఈ ఫీచర్ ప్రస్తుతం అభివృద్ధిలో ఉంది. అప్‌డేట్‌ల కోసం వేచి ఉండండి!',
      'modal.confirm': 'నావిగేషన్ నిర్ధారించండి',
      'modal.warning': 'హెచ్చరిక: డేటా తొలగించబడుతుంది',
      'modal.logout.message': 'హోమ్‌పేజీకి వెళ్లడం వల్ల మీరు లాగ్ అవుట్ అవుతారు మరియు మీ సెషన్ డేటా క్లియర్ అవుతుంది. మీరు కొనసాగించాలనుకుంటున్నారా?',
      'modal.stay': 'లేదు, ఇక్కడే ఉండండి',
      'modal.weather': 'వాతావరణ సమాచారం',
      'modal.farmers': 'రైతుల నెట్వర్క్',
      'modal.connected': 'కనెక్ట్ అయిన రైతులు',
      'modal.humidity': 'తేమ',
      'modal.windspeed': 'గాలి వేగం',
      'modal.formsubmission': 'ఫారం సమర్పణ',
      'modal.formsuccess': 'ఫారం విజయవంతంగా సమర్పించబడింది! వివరాల కోసం కన్సోల్ చూడండి.',
      'login.forgotform': 'పాస్వర్డ్ మర్చిపోయిన ఫారం',
      'login.confirmpassword': 'పాస్వర్డ్ నిర్ధారించండి',
      
      // Footer
      'footer.description': 'ఆధునిక వ్యవసాయ తంత్రాలు, స్మార్ట్ ప్రాక్టీసులు మరియు వ్యవసాయ ఉత్పాద ప్రాసెసింగ్ ద్వారా రైతుల ఆదాయాన్ని మెరుగుపరచడానికి సమర్పిత వ్యవసాయ ఇన్నోవేషన్ సెంటర్.',
      'footer.copyright': '© 2025 ఇంట్రా-డి. అన్ని హక్కులు రక్షితము.',
      'footer.followus': 'మమ్మల్ని అనుసరించండి',
      'footer.visitus': 'మమ్మల్ని సందర్శించండి',
      'footer.directions': 'మ్యాప్ & దిక్కులు',
      'footer.virtualtour': 'వర్చుఅల్ టూర్',
      'footer.workwithus': 'మమ్మల్తో పనిచేయండి',
      'footer.viewjobs': 'ఉద్యోగాలు చూడండి',
      
      // Contact Form
      'contact.title': 'సంపర్కం సాధించండి',
      'contact.firstname': 'ముందు పేరు',
      'contact.lastname': 'కుల పేరు',
      'contact.email': 'ఇమెయిల్',
      'contact.phone': 'ఫోన్',
      'contact.message': 'సందేశం',
      
      // Soil Test Form
      'soil.benefits': 'మట్టి పరీక్ష ప్రయోజనాలు',
      'soil.balanced': 'సంతులిత పోషకాలు',
      'soil.balanced.desc': 'పంటలకు సరైన NPK సంతులనం నిర్ధారిస్తుంది.',
      'soil.saves': 'గుబరెల ఖర్చు తగ్గించు',
      'soil.saves.desc': 'అవసరమైన గుబరెలనే ఉపయోగించండి.',
      'soil.yield': 'మెరుగు శాస్వతం',
      'soil.yield.desc': 'ఆరోగ్యకరమైన మట్టి పంట ఉత్పాదనను మెరుగుపరుస్తుంది.',
      'soil.identify': 'మట్టి సమస్యలను గుర్తించడం',
      'soil.identify.desc': 'pH అసంతులన & లోపాలను త్వరగా గుర్తించడం.',
      'soil.health': 'మట్టి ఆరోగ్య మెరుగుదల',
      'soil.health.desc': 'దీర్ఘకాలిక మట్టి సారవత్తను పరిరక్షిస్తుంది.',
      'soil.scientific': 'వైజ్ఞానిక వ్యవసాయం',
      'soil.scientific.desc': 'మెరుగు వ్యవసాయం కోసం డేటా ఆధారిత నిర్ణయాలు.',
      'soil.request': 'మట్టి పరీక్ష అభ్యర్థన',
      'soil.name': 'పేరు',
      'soil.name.placeholder': 'రైతు పేరు ప్రవేశపెట్టండి',
      'soil.mobile': 'మొబైల్ నంబర్',
      'soil.mobile.placeholder': 'మొబైల్ నంబర్ ప్రవేశపెట్టండి',
      'soil.village': 'గ్రామం / ప్రాంతం',
      'soil.village.placeholder': 'గ్రామం లేదా ప్రాంతం ప్రవేశపెట్టండి',
      'soil.landarea': 'భూమి విస్తీర్ణత (ఎకరాలు)',
      'soil.landarea.placeholder': 'ఉదా: 2.5',
      'soil.irrigation': 'సించన రీతి',
      'soil.irrigation.select': 'సించన ఎంచుకోండి',
      'soil.irrigation.rainfed': 'వర్షాధార',
      'soil.irrigation.borewell': 'బోర్వెల్',
      'soil.irrigation.canal': 'కాలువ',
      'soil.irrigation.drip': 'డ్రిప్',
      'soil.currentcrop': 'ప్రస్తుత పంట',
      'soil.currentcrop.select': 'పంట ఎంచుకోండి',
      'soil.crop.mango': 'మావిడి',
      'soil.crop.papaya': 'బోప్పాయి',
      'soil.crop.tomato': 'టమాటో',
      'soil.crop.vegetables': 'కూరగాయలు',
      'soil.previouscrop': 'ముందు పంట',
      'soil.previouscrop.placeholder': 'ముందు పంట ప్రవేశపెట్టండి',
      'soil.sampledate': 'మట్టి నమూనా దినాంకం',
      'soil.sampledepth': 'మట్టి నమూనా లోతు',
      'soil.fieldcondition': 'పంట భూమి స్థితి',
      'soil.condition.dry': 'ఎండుగా',
      'soil.condition.moist': 'తేమగా',
      'soil.condition.wet': 'తెమ్మగా',
      'soil.problem': 'సమస్య (ఐచ్ఛికం)',
      'soil.problem.placeholder': 'మట్టి సమస్యను వర్ణించండి...',
      'soil.submit': 'మట్టి పరీక్ష అభ్యర్థన సమర్పించండి',
      
      // Farmers Modal
      'farmers.total': 'మొత్తం రైతులు',
      'farmers.active': 'సక్రియ రైతులు',
      'farmers.new': 'ఈ నెలలో కొత్తవారు'
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    const savedLang = (isPlatformBrowser(this.platformId) ? localStorage.getItem('language') : null) || 'en';
    this.currentLanguage.next(savedLang);
  }

  setLanguage(lang: string): void {
    this.currentLanguage.next(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('language', lang);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  translate(key: string): string {
    const lang = this.getCurrentLanguage();
    return this.translations[lang]?.[key] || this.translations['en'][key] || key;
  }

  getAvailableLanguages(): { code: string; name: string; nativeName: string }[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
    ];
  }
}